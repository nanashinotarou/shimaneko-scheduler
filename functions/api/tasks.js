// Cloudflare Pages Function: Notion API Proxy for General Tasks
const TASKS_DB_ID = '31da4923-ceb5-81e8-b69a-ff9986d31e80';

export async function onRequest(context) {
    if (context.request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
        });
    }

    try {
        if (context.request.method === 'GET') {
            // Fetch all tasks
            const notionRes = await fetch('https://api.notion.com/v1/databases/' + TASKS_DB_ID + '/query', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + context.env.NOTION_KEY,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sorts: [
                        { property: '着手予定日', direction: 'ascending' }
                    ]
                })
            });

            if (!notionRes.ok) {
                const err = await notionRes.text();
                throw new Error('Notion API Error: ' + err);
            }

            const data = await notionRes.json();
            const formattedTasks = data.results.map(page => {
                const props = page.properties;
                return {
                    id: page.id,
                    name: props['タスク名']?.title[0]?.plain_text || '無題のタスク',
                    assignee: props['担当者']?.select?.name || '未定',
                    status: props['ステータス']?.select?.name || '未着手',
                    date: props['着手予定日']?.date?.start || null,
                    clientStatus: props['クライアント調整']?.select?.name || 'なし',
                    type: props['タスク種別']?.select?.name || '事務・その他'
                };
            });

            return new Response(JSON.stringify(formattedTasks), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        else if (context.request.method === 'PATCH') {
            // Update a task (e.g. assigning or status change)
            const body = await context.request.json();
            const { id, updates } = body;

            if (!id || !updates) {
                throw new Error("Missing 'id' or 'updates' in payload");
            }

            // Build properties to update
            const properties = {};
            if (updates.assignee !== undefined) {
                properties['担当者'] = { select: { name: updates.assignee } };
            }
            if (updates.status !== undefined) {
                properties['ステータス'] = { select: { name: updates.status } };
            }
            if (updates.date !== undefined) {
                properties['着手予定日'] = updates.date ? { date: { start: updates.date } } : { date: null };
            }

            const notionRes = await fetch('https://api.notion.com/v1/pages/' + id, {
                method: 'PATCH',
                headers: {
                    'Authorization': 'Bearer ' + context.env.NOTION_KEY,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ properties })
            });

            if (!notionRes.ok) {
                const err = await notionRes.text();
                throw new Error('Notion Update Error: ' + err);
            }

            return new Response(JSON.stringify({ success: true }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        else {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
}
