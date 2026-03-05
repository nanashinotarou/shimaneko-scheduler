const SHEET_NAME = 'Shifts';

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // 最初の行にヘッダーを設定
    sheet.appendRow(['id', 'date', 'dateKey', 'member', 'content', 'type', 'memberColor', 'timestamp']);
    // デフォルトのシート1を削除
    const sheet1 = ss.getSheetByName('シート1') || ss.getSheetByName('Sheet1');
    if (sheet1) ss.deleteSheet(sheet1);
  }
  return sheet;
}

function doGet(e) {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      // ヘッダーのみ、またはデータなし
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const headers = data[0];
    const rows = data.slice(1);

    // JSONの配列に変換
    const result = rows.map(row => {
      let obj = {};
      headers.forEach((header, index) => {
        let val = row[index];
        // dateKeyが日付オブジェクトとして読み込まれた場合、フロントエンドが期待する YYYY/M/D 形式に戻す
        if (header === 'dateKey' && val instanceof Date) {
          val = `${val.getFullYear()}/${val.getMonth() + 1}/${val.getDate()}`;
        }
        // timestampが文字列等の場合は数値に変換（念のため）
        if (header === 'timestamp' && val) {
          val = Number(val);
        }
        obj[header] = val;
      });
      return obj;
    });

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const sheet = getSheet();

    // fetchからのPOST時のリクエストボディを解析
    // (CORSプリフライトを避けるため、フロントエンドからは Content-Type: text/plain で送信される想定)
    const postData = JSON.parse(e.postData.contents);

    // --- 削除アクションの処理 ---
    if (!Array.isArray(postData) && postData.action === 'delete') {
      const targetKey = postData.deleteKey;
      if (!targetKey) throw new Error("削除用の deleteKey が指定されていません");

      console.log("Delete Request Received. TargetKey:", targetKey);

      const data = sheet.getDataRange().getValues();
      if (data.length > 1) {
        const headers = data[0];
        const dkIdx = headers.indexOf('dateKey');
        const mbIdx = headers.indexOf('member');
        const ctIdx = headers.indexOf('content');
        const tpIdx = headers.indexOf('type');

        let foundMatch = false;

        // シートの下から上へ検索し、該当する行を削除 (行インデックスは1始まり)
        for (let i = data.length - 1; i > 0; i--) {
          let rawDk = data[i][dkIdx];
          let dk = "";

          if (rawDk instanceof Date) {
            dk = `${rawDk.getFullYear()}/${rawDk.getMonth() + 1}/${rawDk.getDate()}`;
          } else if (rawDk) {
            dk = rawDk.toString().replace(/\s+/g, '');
            // YYYY/0M/0D -> YYYY/M/D にゼロ埋めを削除して統一
            const parts = dk.split('/');
            if (parts.length === 3) {
              const m = parseInt(parts[1], 10);
              const d = parseInt(parts[2], 10);
              dk = `${parts[0]}/${m}/${d}`;
            }
          }
          const rowKey = `${dk}-${data[i][mbIdx]}-${data[i][ctIdx]}-${data[i][tpIdx]}`.replace(/\s+/g, '');

          // Detailed logging for the last 5 rows to see what's happening
          if (i > data.length - 6) {
            console.log(`Checking row ${i + 1}. DK: [${dk}], RowKey: [${rowKey}]`);
          }

          if (rowKey === targetKey) {
            console.log(`Match found at row ${i + 1}. Deleting.`);
            sheet.deleteRow(i + 1);
            foundMatch = true;
            return ContentService.createTextOutput(JSON.stringify({ success: true, deleted: 1 }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }

        if (!foundMatch) {
          console.log("No match found for targetKey:", targetKey);
          return ContentService.createTextOutput(JSON.stringify({ success: false, deleted: 0, message: "対象データが見つかりません。探したKey: " + targetKey }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: false, deleted: 0, message: "データが空です" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    // ----------------------------

    // --- 更新アクションの処理 ---
    if (!Array.isArray(postData) && postData.action === 'update') {
      const oldKey = postData.oldDeleteKey;
      const newData = postData.newData;
      if (!oldKey || !newData) throw new Error("更新用の oldDeleteKey / newData が指定されていません");

      console.log("Update Request Received. OldKey:", oldKey);

      // 1. 旧エントリの削除
      const data = sheet.getDataRange().getValues();
      if (data.length > 1) {
        const headers = data[0];
        const dkIdx = headers.indexOf('dateKey');
        const mbIdx = headers.indexOf('member');
        const ctIdx = headers.indexOf('content');
        const tpIdx = headers.indexOf('type');

        for (let i = data.length - 1; i > 0; i--) {
          let rawDk = data[i][dkIdx];
          let dk = "";
          if (rawDk instanceof Date) {
            dk = `${rawDk.getFullYear()}/${rawDk.getMonth() + 1}/${rawDk.getDate()}`;
          } else if (rawDk) {
            dk = rawDk.toString().replace(/\s+/g, '');
            const parts = dk.split('/');
            if (parts.length === 3) {
              const m = parseInt(parts[1], 10);
              const d = parseInt(parts[2], 10);
              dk = `${parts[0]}/${m}/${d}`;
            }
          }
          const rowKey = `${dk}-${data[i][mbIdx]}-${data[i][ctIdx]}-${data[i][tpIdx]}`.replace(/\s+/g, '');
          if (rowKey === oldKey) {
            console.log(`Update: Deleting old row ${i + 1}`);
            sheet.deleteRow(i + 1);
            break;
          }
        }
      }

      // 2. 新エントリの追加
      const newRow = [
        newData.id || Date.now() + Math.random(),
        newData.date || "",
        newData.dateKey || "",
        newData.member || "",
        newData.content || "",
        newData.type || "shift",
        newData.memberColor || "#eee",
        newData.timestamp || Date.now()
      ];
      sheet.appendRow(newRow);

      return ContentService.createTextOutput(JSON.stringify({ success: true, updated: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    // ----------------------------

    const shifts = Array.isArray(postData) ? postData : [postData];


    // 既存データの読み込み (重複排除のためキーをセット化)
    const existingData = sheet.getDataRange().getValues();
    let existingKeys = new Set();
    if (existingData.length > 1) {
      const headers = existingData[0];
      const dkIdx = headers.indexOf('dateKey');
      const mbIdx = headers.indexOf('member');
      const ctIdx = headers.indexOf('content');
      const tpIdx = headers.indexOf('type');

      existingData.slice(1).forEach(row => {
        let dk = row[dkIdx];
        if (dk instanceof Date) {
          dk = `${dk.getFullYear()}/${dk.getMonth() + 1}/${dk.getDate()}`;
        }
        const key = `${dk}-${row[mbIdx]}-${row[ctIdx]}-${row[tpIdx]}`;
        existingKeys.add(key);
      });
    }

    let addedCount = 0;
    shifts.forEach(shift => {
      const key = `${shift.dateKey}-${shift.member}-${shift.content}-${shift.type}`;

      // 同じ内容（日付、メンバー、シフト等）が存在しなければ追記
      if (!existingKeys.has(key)) {
        const newRow = [
          shift.id || Date.now() + Math.random(),
          shift.date || "",
          shift.dateKey || "",
          shift.member || "",
          shift.content || "",
          shift.type || "shift",
          shift.memberColor || "#eee",
          shift.timestamp || Date.now()
        ];
        sheet.appendRow(newRow);
        existingKeys.add(key);
        addedCount++;
      }
    });

    return ContentService.createTextOutput(JSON.stringify({ success: true, added: addedCount }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
