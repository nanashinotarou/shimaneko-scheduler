const url = "https://script.google.com/macros/s/AKfycbx5nDhWUpDcEDvGeOBa2XJiLCUe7fdHjHqkSn7xaslggxPpZubD9V_Kuv-IbYpsq-PJ/exec";

async function testFetch() {
    console.log("Testing GET...");
    try {
        const getRes = await fetch(url);
        const getData = await getRes.json();
        console.log("GET Response length:", getData.length);
        if (getData.length > 0) {
            // Log the first and last to see formats
            console.log("First item:", getData[0]);
            console.log("Last item:", getData[getData.length - 1]);
        }
    } catch (e) {
        console.error(e);
    }
}

async function testPost() {
    console.log("Testing POST...");
    const testData = [{
        dateKey: "2026/3/2",
        member: "システムテスト",
        content: "疎通確認",
        type: "shift",
        timestamp: Date.now()
    }];
    try {
        const res = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(testData)
        });
        const data = await res.json();
        console.log("POST Response:", data);
    } catch (e) {
        console.error(e);
    }
}

async function runTests() {
    await testFetch();
    await testPost();
}

runTests();
