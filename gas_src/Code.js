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
    const shifts = Array.isArray(postData) ? postData : [postData];

    // 既存データの読み込み (重複排除のためキーをセット化)
    const existingData = sheet.getDataRange().getValues();
    let existingKeys = new Set();
    if (existingData.length > 1) {
      existingData.slice(1).forEach(row => {
        // [dateKey]-[member]-[content]-[type] などを一意キーとする
        const key = `${row[2]}-${row[3]}-${row[4]}-${row[5]}`;
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
