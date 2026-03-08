const SNS_DB_ID = '31ca4923-ceb5-8101-921e-f837ceb2bbb9';

const CHECKLIST = [
    { title: "丸亀製麺1杯無料CPストーリーズ", date: null, status: "投稿済み", platform: "Instagram", format: "ストーリーズ", assignee: "ササミ" },
    { title: "これからのしまねこデザインスケジュール", date: "2026-03-01", status: "投稿済み", platform: "Instagram", format: "フィード投稿", assignee: "ササミ" },
    { title: "雛祭り", date: "2026-03-03", status: "投稿済み", platform: "Instagram", format: "フィード投稿", assignee: "全体" },
    { title: "ササミの雛祭りストーリーズ", date: "2026-03-03", status: "投稿済み", platform: "Instagram", format: "ストーリーズ", assignee: "ササミ" },
    { title: "私たちのできることバレンタインポップ編！2月時点", date: "2026-03-04", status: "投稿済み", platform: "Instagram", format: "フィード投稿", assignee: "全体" },
    { title: "PlayStationミニチュアチャーム付きビスケットストーリーズ", date: "2026-03-05", status: "投稿済み", platform: "Instagram", format: "ストーリーズ", assignee: "ササミ" },
    { title: "デザインの勉強ってどうやってる？", date: null, status: "予定", platform: "Instagram", format: "リール動画", assignee: "ツナ" },
    { title: "デザインの勉強ってどうやってる？", date: null, status: "予定", platform: "Instagram", format: "リール動画", assignee: "ササミ" },
    { title: "よはくの本屋さんに行ってきました！", date: null, status: "予定", platform: "Instagram", format: "フィード投稿", assignee: "ササミ" },
    { title: "ツナのイラストの相棒、液タブやツール紹介", date: "2026-03-10", status: "予定", platform: "Instagram", format: "リール動画", assignee: "ツナ" },
    { title: "ササミのPC（Mac、iPad）の紹介", date: "2026-03-11", status: "予定", platform: "Instagram", format: "リール動画", assignee: "ササミ" },
    { title: "コンブのガジェット（キーボード、マウス）紹介", date: "2026-03-12", status: "予定", platform: "Instagram", format: "リール動画", assignee: "コンブ" },
    { title: "しまねこっぽいゲームあったからご紹介", date: null, status: "予定", platform: "Instagram", format: "ストーリーズ", assignee: "ササミ" },
    { title: "しまねこデザインでゲーム動画作ったよ", date: null, status: "予定", platform: "Instagram", format: "リール動画", assignee: "ツナ" },
    { title: "デザインの本の紹介ツナ", date: "2026-03-11", status: "予定", platform: "Instagram", format: "リール動画", assignee: "ツナ" },
    { title: "デザインの本の紹介ササミ", date: "2026-03-12", status: "予定", platform: "Instagram", format: "リール動画", assignee: "ササミ" },
    { title: "資格勉強したり（リール2本）", date: "2026-03-13", status: "予定", platform: "Instagram", format: "リール動画", assignee: "全体" },
    { title: "ホワイトデー", date: "2026-03-14", status: "投稿済み", platform: "Instagram", format: "フィード投稿", assignee: "ササミ" },
    { title: "ホワイトデーの後夜祭ストーリーズ～焼肉編", date: "2026-03-15", status: "予定", platform: "Instagram", format: "ストーリーズ", assignee: "ツナ" },
    { title: "新！そういうことじゃないんだよ展＋ありがたいことです展", date: null, status: "予定", platform: "Instagram", format: "ストーリーズ", assignee: "コンブ" },
    { title: "ツナのらくがきアトリール", date: "2026-03-17", status: "予定", platform: "Instagram", format: "リール動画", assignee: "ツナ" },
    { title: "新生活応援＋wellcome札幌", date: "2026-03-16", status: "投稿済み", platform: "Instagram", format: "フィード投稿", assignee: "ササミ" },
    { title: "ササミの個人垢開設紹介", date: null, status: "予定", platform: "Instagram", format: "リール動画", assignee: "ササミ" },
    { title: "春の足跡写真まとめ", date: null, status: "予定", platform: "Instagram", format: "ストーリーズ", assignee: "ツナ" },
    { title: "春分の日", date: "2026-03-20", status: "投稿済み", platform: "Instagram", format: "フィード投稿", assignee: "ツナ" },
    { title: "ワクワクする季節だけど北海道はまだ寒いストーリーズ", date: "2026-03-23", status: "予定", platform: "Instagram", format: "ストーリーズ", assignee: "ササミ" },
    { title: "デザイナーが使うツールって？", date: "2026-03-27", status: "予定", platform: "Instagram", format: "リール動画", assignee: "ササミ" },
    { title: "色彩検定って知ってる？４級と準３級を受けてみたよ！", date: null, status: "予定", platform: "Instagram", format: "フィード投稿", assignee: "全体" },
    { title: "勉強中デザイナーが好きなフォント5選", date: "2026-03-30", status: "予定", platform: "Instagram", format: "リール動画", assignee: "コンブ" },
    { title: "コメダ珈琲店で作戦会議", date: null, status: "予定", platform: "Instagram", format: "ストーリーズ", assignee: "ツナ" },
    { title: "ツナのイラストトレーニング3月総集編", date: null, status: "予定", platform: "Instagram", format: "リール動画", assignee: "ツナ" },
    { title: "私たちにできること！3月時点", date: "2026-03-31", status: "予定", platform: "Instagram", format: "フィード投稿", assignee: "ササミ" }
];

export async function onRequest(context) {
    const NOTION_KEY = context.env.NOTION_KEY;
    const headers = {
        'Authorization': 'Bearer ' + NOTION_KEY,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
    };

    try {
        // 1. Fetch current items to delete
        const queryRes = await fetch('https://api.notion.com/v1/databases/' + SNS_DB_ID + '/query', {
            method: 'POST',
            headers
        });
        const queryData = await queryRes.json();

        // Delete all
        const deletePromises = (queryData.results || []).map(page =>
            fetch('https://api.notion.com/v1/pages/' + page.id, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ archived: true })
            })
        );
        await Promise.all(deletePromises);

        // 2. Insert new exact checklist items
        let results = [];
        for (const item of CHECKLIST) {
            const props = {
                "投稿内容": { "title": [{ "text": { "content": item.title } }] },
                "ステータス": { "select": { "name": item.status } },
                "プラットフォーム": { "select": { "name": item.platform } },
                "投稿形式": { "select": { "name": item.format } },
                "担当": { "select": { "name": item.assignee } }
            };

            if (item.date) {
                props["投稿日"] = { "date": { "start": item.date } };
            }

            const res = await fetch('https://api.notion.com/v1/pages', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    parent: { database_id: SNS_DB_ID },
                    properties: props
                })
            });
            results.push(await res.json());
        }

        return new Response(JSON.stringify({ success: true, count: CHECKLIST.length, details: results }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
