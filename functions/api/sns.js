// Cloudflare Pages Function: Notion API Proxy for SNS Schedule
const SNS_DB_ID = '31ca4923-ceb5-8101-921e-f837ceb2bbb9';

export async function onRequest(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (context.request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const notionRes = await fetch('https://api.notion.com/v1/databases/' + SNS_DB_ID + '/query', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + context.env.NOTION_KEY,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sorts: [{ property: '投稿日', direction: 'ascending' }],
                page_size: 100
            })
        });

        const data = await notionRes.json();

        if (!data.results) {
            return new Response(JSON.stringify({ error: 'Notion API error', details: data }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        const entries = data.results.map(page => {
            const props = page.properties;
            return {
                id: page.id,
                content: props['投稿内容']?.title?.[0]?.plain_text || '',
                date: props['投稿日']?.date?.start || '',
                platform: props['プラットフォーム']?.select?.name || '',
                status: props['ステータス']?.select?.name || '',
                format: props['投稿形式']?.select?.name || '',
                assignee: props['担当']?.select?.name || ''
            };
        });

        return new Response(JSON.stringify(entries), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}
