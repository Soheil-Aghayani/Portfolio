const playwright = require('playwright');

(async () => {
    const browser = await playwright.chromium.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:8080/index.html');

    // open games
    await page.evaluate(() => {
        window.OS.open('games');
    });

    await page.waitForTimeout(500);

    // Launch blackjack
    await page.evaluate(() => {
        const btn = document.querySelector('.game-icon[data-id="blackjack"]');
        btn.click();
    });

    await page.waitForTimeout(500);

    // Hit stand to end the game
    await page.evaluate(() => {
        document.querySelector('#bjStand').click();
    });

    await page.waitForTimeout(500);

    const activeElementAfterStand = await page.evaluate(() => {
        return document.activeElement.id || document.activeElement.tagName;
    });
    console.log("Active element after stand:", activeElementAfterStand);

    // Click restart
    await page.evaluate(() => {
        document.querySelector('#bjRestart').click();
    });

    await page.waitForTimeout(500);

    const activeElementAfterRestart = await page.evaluate(() => {
        return document.activeElement.id || document.activeElement.tagName;
    });
    console.log("Active element after restart:", activeElementAfterRestart);

    await browser.close();
})();
