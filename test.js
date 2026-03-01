
        // Global Error Handler
        window.onerror = function (msg, url, line) {
            alert("エラーが発生しました: " + msg + "\\n行: " + line);
            return false;
        };

        // Config & Data
        const DEFAULT_MEMBERS = [
            { id: "sasami", name: "ササミ", color: "#F48FB1", keywords: "ササミ,佐々木,Sasaki" },
            { id: "kombu", name: "コンブ", color: "#A5D6A7", keywords: "コンブ,昆布,ボブ,田中" },
            { id: "tsuna", name: "ツナ", color: "#90CAF9", keywords: "ツナ,綱,Tsuna,佐藤" }
        ];

        const STORAGE_KEY_DATA = "shimaneko_scheduler_data_v3";
        const STORAGE_KEY_CONFIG = "shimaneko_scheduler_config_v1";
        const STORAGE_KEY_API = "shimaneko_scheduler_gemini_key";

        let memberConfig = [];
        let geminiApiKey = "";
        let appData = { shifts: [] };
        let tempParsedData = [];

        // Valid DOM Elements check
        const elHomeSection = document.getElementById('home-section');
        const elSettingsSection = document.getElementById('settings-section');
        const elImportSection = document.getElementById('import-section');
        const elPreviewSection = document.getElementById('preview-section');

        // View DOMs
        const elCalendarView = document.getElementById('calendar-view');
        const elMatchingView = document.getElementById('matching-view');
        const elCalendarContainer = document.getElementById('calendar-container');
        const elMatchingList = document.getElementById('matching-list');

        const elInput = document.getElementById('raw-text-input');
        const elPreviewList = document.getElementById('preview-list');

        const elLoading = document.getElementById('loading-overlay');
        const elLoadingText = document.getElementById('loading-text');
        const elDropZone = document.getElementById('drop-zone');
        const elFileInput = document.getElementById('file-input');

        // Init
        loadConfig();
        loadData();
        renderCalendar();
        renderMatching();

        // Events
        document.getElementById('btn-analyze').addEventListener('click', analyzeText);

        elDropZone.addEventListener('click', () => elFileInput.click());

        elDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            elDropZone.classList.add('dragover');
        });

        elDropZone.addEventListener('dragleave', () => {
            elDropZone.classList.remove('dragover');
        });

        elDropZone.addEventListener('drop', handleImageDrop);
        elFileInput.addEventListener('change', (e) => handleImageFile(e.target.files[0]));

        // Navigation & Tabs
        function toggleSection(mode) {
            elHomeSection.classList.add('hidden');
            elSettingsSection.classList.add('hidden');
            elImportSection.classList.add('hidden');
            elPreviewSection.classList.add('hidden');
            elLoading.classList.add('hidden');

            if (mode === 'home') {
                elHomeSection.classList.remove('hidden');
                renderCalendar();
                renderMatching();
            } else if (mode === 'settings') {
                renderSettings();
                elSettingsSection.classList.remove('hidden');
            } else if (mode === 'import') {
                elImportSection.classList.remove('hidden');
            } else if (mode === 'preview') {
                elPreviewSection.classList.remove('hidden');
            }
        }

        window.switchTab = (tab) => {
            document.getElementById('tab-calendar').classList.remove('active');
            document.getElementById('tab-matching').classList.remove('active');

            elCalendarView.classList.add('hidden');
            elMatchingView.classList.add('hidden');

            if (tab === 'calendar') {
                document.getElementById('tab-calendar').classList.id = 'active'; // Class handling fix
                document.getElementById('tab-calendar').classList.add('active');
                elCalendarView.classList.remove('hidden');
            } else {
                document.getElementById('tab-matching').classList.add('active');
                elMatchingView.classList.remove('hidden');
                renderMatching();
            }
        };

        window.toggleSection = toggleSection;
        window.showHome = () => toggleSection('home');
        window.clearData = clearData;
        window.saveSettings = saveSettings;
        window.saveData = saveData;

        // --- Settings Logic ---
        function loadConfig() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
                if (raw) {
                    memberConfig = JSON.parse(raw);
                    // Remove mito from existing local storage config
                    memberConfig = memberConfig.filter(m => m.id !== "mito");
                } else {
                    memberConfig = JSON.parse(JSON.stringify(DEFAULT_MEMBERS));
                }

                geminiApiKey = localStorage.getItem(STORAGE_KEY_API) || "";
            } catch (e) {
                console.error("Config load error", e);
                memberConfig = JSON.parse(JSON.stringify(DEFAULT_MEMBERS));
            }
        }

        function renderSettings() {
            const list = document.getElementById('settings-list');
            list.innerHTML = '';

            document.getElementById('setting-gemini-key').value = geminiApiKey;

            memberConfig.forEach((m, idx) => {
                const div = document.createElement('div');
                div.className = 'member-setting-item';
                div.innerHTML = `
                <div class="member-header">
                    <span class="color-dot" style="background:${m.color}"></span>
                    <span>${m.name}</span>
                </div>
                <label style="font-size:0.8rem;">検索キーワード (カンマ区切り)</label>
                <input type="text" id="setting-keywords-${idx}" value="${m.keywords}">
            `;
                list.appendChild(div);
            });
        }

        function saveSettings() {
            memberConfig.forEach((m, idx) => {
                const el = document.getElementById(`setting-keywords-${idx}`);
                if (el) m.keywords = el.value;
            });
            localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(memberConfig));

            geminiApiKey = document.getElementById('setting-gemini-key').value.trim();
            localStorage.setItem(STORAGE_KEY_API, geminiApiKey);

            alert("設定を保存しました。");
            toggleSection('home');
        }

        // --- Image to Base64 ---
        function fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data URL prefix
                reader.onerror = error => reject(error);
            });
        }

        // --- OCR Logic ---
        async function handleImageDrop(e) {
            e.preventDefault();
            elDropZone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleImageFile(e.dataTransfer.files[0]);
            }
        }

        async function handleImageFile(file) {
            if (!file) return;

            if (!geminiApiKey) {
                alert("設定画面からGemini APIキーを設定してください。画像解析には本物のAIを利用します。");
                toggleSection('settings');
                return;
            }

            elLoading.classList.remove('hidden');
            elLoadingText.innerText = "Gemini AIが画像を解析中...\\n(これには数秒かかります)";

            try {
                const base64Image = await fileToBase64(file);

                // Construct prompt dynamically with member configurations
                const memberNamesStr = memberConfig.map(m => `「${m.name}」（キーワード: ${m.keywords}）`).join("、");

                const promptText = `
以下の画像はスタッフのシフト表です。
この中から、${memberNamesStr} のシフト情報のみを抽出して、以下のJSON配列の形式で出力してください。
マークダウンのコードブロック (\`\`\`json) は含めちゃだめです。直接JSONテキストだけを返してください。

                    注意点:
- 日付は "M/D" の形式で抽出すること（例: "2/2", "2/20"）。
                - 時間は "10-19", "4.5", "11→" など、画像に書かれている通りに抽出してください。
                - "休", "off", "OFF", または○印や空白で無表記の場合は "休み" として扱ってください。
                - 対象外の人の情報は一切含めないでください。
                - どうしても読み取れない箇所は "要確認" などとしてください。

                [
                    { "date": "2/2", "member": "ササミ", "content": "休み" },
                    { "date": "2/2", "member": "ツナ", "content": "10-19" },
                    { "date": "2/3", "member": "ササミ", "content": "4.5" }
                ]
`;

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: promptText },
                                {
                                    inlineData: {
                                        mimeType: file.type || 'image/jpeg',
                                        data: base64Image
                                    }
                                }
                            ]
                        }]
                    })
                });

                if (!response.ok) {
                    throw new Error(`API HTTP Error: ${response.status}`);
                }

                const data = await response.json();
                let resultText = data.candidates[0].content.parts[0].text;

                // Clean up any potential markdown formatting from Gemini
                resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

                try {
                    const parsedJson = JSON.parse(resultText);

                    // Add mapping data for colors
                    tempParsedData = parsedJson.map(item => {
                        const mconf = memberConfig.find(m => m.name === item.member);
                        return {
                            id: Date.now() + Math.random(),
                            date: item.date,
                            member: item.member,
                            memberColor: mconf ? mconf.color : '#CCC',
                            type: 'shift',
                            content: item.content
                        };
                    });

                    // Show in textarea as fallback text, although we skip analyzeText
                    elInput.value = JSON.stringify(tempParsedData, null, 2);

                    elLoading.classList.add('hidden');
                    renderPreview();
                    toggleSection('preview');

                } catch (jsonErr) {
                    console.error("JSON Parsing Error from Gemini output:", resultText);
                    alert("Geminiからの応答形式が不正でした。もう一度お試しください。");
                    elLoading.classList.add('hidden');
                }

            } catch (err) {
                console.error(err);
                alert("Gemini画像解析に失敗しました: " + err);
                elLoading.classList.add('hidden');
            }
        }

        // --- Parsing Logic (Shift + Task) ---
        function analyzeText() {
            const text = elInput.value.trim();
            if (!text) {
                alert("テキストを入力してください");
                return;
            }

            const lines = text.split(/\r?\n/);
            tempParsedData = [];
            let currentDate = null;

            const dateRegex = /(\d{1,2})\s*[\/\月]\s*(\d{1,2})/;

            // 【機能追加】テキストの上部からヘッダー（列の並び順）を特定する
            let detectedHeaders = [];
            for (let i = 0; i < Math.min(lines.length, 10); i++) {
                let foundMembers = [];
                memberConfig.forEach(memberData => {
                    const keywords = memberData.keywords.split(',').map(k => k.trim()).filter(k => k);
                    const matchedKeyword = keywords.find(k => lines[i].includes(k));
                    if (matchedKeyword) {
                        foundMembers.push({ member: memberData, pos: lines[i].indexOf(matchedKeyword) });
                    }
                });
                if (foundMembers.length > 0) {
                    foundMembers.sort((a, b) => a.pos - b.pos);
                    detectedHeaders = foundMembers.map(f => f.member);
                    break;
                }
            }

            // 【機能追加】ノイズ除去用フィルター（シフト時間に頻出するパターンのみ抽出）
            const shiftPattern = /(休|off|OFF|\d{1,2}[:.～〜\-]?\d{1,2}|\d+h?)/g;

            lines.forEach(line => {
                const trimmed = line.trim();
                if (!trimmed) return;

                // Date Detection
                const dateMatch = trimmed.match(dateRegex);
                let lineDate = null;
                if (dateMatch) {
                    lineDate = `${dateMatch[1]} / ${dateMatch[2]}`;
                    currentDate = lineDate;
                }

                // A) リスト形式チェック (名前が直接含まれているか)
                let isShift = false;
                memberConfig.forEach(memberData => {
                    const keywords = memberData.keywords.split(',').map(k => k.trim()).filter(k => k);
                    const matchedKeyword = keywords.find(k => trimmed.includes(k));

                    if (matchedKeyword) {
                        isShift = true;
                        let content = trimmed
                            .replace(matchedKeyword, "")
                            .replace(dateRegex, "")
                            .trim();
                        content = content.replace(/^[:：,、\s]+|[:：,、\s]+$/g, '');

                        if (content.match(/休|OFF|off/)) content = "休み";

                        tempParsedData.push({
                            id: Date.now() + Math.random(),
                            date: currentDate || "2/1", // fallback
                            member: memberData.name,
                            memberColor: memberData.color,
                            type: 'shift',
                            content: content || "要確認"
                        });
                    }
                });

                // B) 表形式データの推測 (名前がないが日付があり、ヘッダーが特定できている場合)
                if (!isShift && lineDate && detectedHeaders.length > 0) {
                    let restText = trimmed.replace(dateRegex, "").trim();
                    let tokens = restText.match(shiftPattern);

                    if (tokens && tokens.length > 0) {
                        isShift = true; // トークンが見つかればシフト行と判定
                        tokens.forEach((token, idx) => {
                            if (idx < detectedHeaders.length) {
                                let content = token;
                                if (content.match(/休|OFF|off/)) content = "休み";

                                tempParsedData.push({
                                    id: Date.now() + Math.random(),
                                    date: lineDate,
                                    member: detectedHeaders[idx].name,
                                    memberColor: detectedHeaders[idx].color,
                                    type: 'shift',
                                    content: content
                                });
                            }
                        });
                    }
                }

                // C) タスク判定 (シフトではなく日付があるテキスト)
                if (!isShift && lineDate) {
                    let taskName = trimmed.replace(dateRegex, "").trim();
                    taskName = taskName.replace(/^[:：,、\s]+|[:：,、\s]+$/g, '');
                    // ゴミ文字だけの行は除外
                    if (taskName && taskName.replace(/[^\w\sぁ-んァ-ヶ亜-熙]/g, '').length > 0) {
                        tempParsedData.push({
                            id: Date.now() + Math.random(),
                            date: lineDate,
                            member: "全員/〆",
                            memberColor: "#FF7043", // Task color
                            type: 'task',
                            content: "〆 " + taskName
                        });
                    }
                }
            });

            if (tempParsedData.length === 0) {
                // Fallback for user entering manual row
                tempParsedData.push({
                    id: Date.now(),
                    date: "2/1",
                    member: "ササミ",
                    memberColor: "#F48FB1",
                    type: 'shift',
                    content: ""
                });
                alert("データを認識できませんでした。手入力用の行を追加しました。");
            }

            renderPreview();
            toggleSection('preview');
        }

        function renderPreview() {
            elPreviewList.innerHTML = '';
            tempParsedData.forEach((item, index) => {
                // Convert M/D to YYYY-MM-DD for input[type=date]
                const ymd = parseDateToInputFormat(item.date);

                const div = document.createElement('div');
                div.className = 'preview-item';
                div.innerHTML = `
                    < div class= "preview-meta" >
                    <input type="date" style="padding:4px;" value="${ymd}" onchange="window.updateTempDate(${index}, this.value)">
                    <span class="preview-member" style="background:${item.memberColor};">${item.member}</span>
                </div>
                <input type="text" value="${item.content}" onchange="window.updateTempContent(${index}, this.value)">
                <button class="preview-delete" onclick="window.removeItem(${index})">×</button>
            `;
                elPreviewList.appendChild(div);
            });
        }

        window.updateTempDate = (index, ymd) => {
            // ymd is 2026-02-20
            if (ymd) {
                const parts = ymd.split('-');
                tempParsedData[index].date = `${parseInt(parts[1])}/${parseInt(parts[2])}`;
            }
        };
        window.updateTempContent = (index, val) => { tempParsedData[index].content = val; };
        window.removeItem = (index) => { tempParsedData.splice(index, 1); renderPreview(); };

        // --- Data Management ---
        function saveData() {
            const newShifts = tempParsedData.map(t => ({
                ...t,
                timestamp: parseDateString(t.date)
            }));

            appData.shifts = [...appData.shifts, ...newShifts];
            appData.shifts.sort((a, b) => a.timestamp - b.timestamp);

            localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(appData));

            elInput.value = "";
            toggleSection('home');
        }

        function loadData() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY_DATA);
                if (raw) {
                    appData = JSON.parse(raw);
                }
            } catch (e) {
                console.error("Data load error", e);
                appData = { shifts: [] };
            }
        }

        function clearData() {
            if (confirm("全てのデータを削除しますか？")) {
                localStorage.removeItem(STORAGE_KEY_DATA);
                appData = { shifts: [] };
                renderCalendar();
                renderMatching();
            }
        }

        // Helper: "2/20" -> "2026-02-20"
        function parseDateToInputFormat(str) {
            if (!str) return "2026-02-01";
            const parts = str.split(/[\/\月]/);
            if (parts.length < 2) return "2026-02-01";
            const m = parts[0].padStart(2, '0');
            const d = parts[1].padStart(2, '0');
            return `2026-${m}-${d}`;
        }

        function parseDateString(str) {
            if (!str) return Date.now();
            const parts = str.split(/[\/\月]/);
            if (parts.length < 2) return Date.now();
            const m = parseInt(parts[0]);
            const d = parseInt(parts[1]);
            return new Date(2026, m - 1, d).getTime();
        }

        // --- Calendar Rendering ---
        function renderCalendar() {
            elCalendarContainer.innerHTML = '';

            if (!appData.shifts || appData.shifts.length === 0) {
                elCalendarContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: #aaa;">予定がありません。<br>「+ インポート」から追加してください。</div>`;
                return;
            }

            const grouped = {};
            appData.shifts.forEach(s => {
                if (!grouped[s.date]) grouped[s.date] = [];
                grouped[s.date].push(s);
            });

            let html = "";
            Object.keys(grouped).forEach(dateStr => {
                const shifts = grouped[dateStr];
                const dateParts = dateStr.split(/[\/\月]/);

                let barsHtml = "";
                shifts.forEach(s => {
                    if (s.type === 'task') {
                        barsHtml += `
                        <div class="shift-bar task-bar">
                            <span class="shift-name">${s.content}</span>
                        </div>
                    `;
                    } else {
                        const mConf = memberConfig.find(m => m.name === s.member);
                        const color = mConf ? mConf.color : "#eee";
                        barsHtml += `
                        <div class="shift-bar" style="background-color: ${color};">
                            <span class="shift-name">${s.member}</span>
                            <span class="shift-time">${s.content}</span>
                        </div>
                    `;
                    }
                });

                html += `
                <div class="date-row">
                    <div class="date-header">
                        <div class="date-num">${dateParts[1] || dateParts[0]}</div>
                        <div class="date-day">/ ${dateParts[0]}</div> 
                    </div>
                    <div class="shift-bars">
                        ${barsHtml}
                    </div>
                </div>
            `;
            });

            elCalendarContainer.innerHTML = html;
        }

        // --- Matching Logic ---
        function renderMatching() {
            elMatchingList.innerHTML = '';
            if (!appData.shifts || appData.shifts.length === 0) {
                elMatchingList.innerHTML = `<p style="text-align:center; color:#aaa;">データがありません</p>`;
                return;
            }

            const grouped = {};
            appData.shifts.forEach(s => {
                if (s.type === 'shift' && !s.content.includes('休')) {
                    if (!grouped[s.date]) grouped[s.date] = new Set();
                    grouped[s.date].add(s.member);
                }
            });

            // Current required members count = 4 (assuming all must work?)
            // Let's filter days where ALL 4 members are working
            const targetCount = memberConfig.length;

            let found = false;
            Object.keys(grouped).forEach(dateStr => {
                const workingMembers = grouped[dateStr];
                if (workingMembers.size >= targetCount) {
                    // Assuming overlap: 13:00-16:00 (Placeholder logic)
                    const div = document.createElement('div');
                    div.className = 'matching-item';
                    div.innerHTML = `
                    <span>${dateStr}</span>
                    <span>🕒 ミーティングOK</span>
                `;
                    elMatchingList.appendChild(div);
                    found = true;
                }
            });

            if (!found) {
                elMatchingList.innerHTML = `<p style="text-align:center; color:#aaa;">全員が揃う日は今のところありません...</p>`;
            }
        }

    
