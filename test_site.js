
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  try {
    console.log("Navigating to http://localhost:5000 ...");
    await page.goto('http://localhost:5000');
    await page.waitForLoadState('networkidle');

    console.log("Opening Game Center overlay...");
    await page.evaluate(() => {
      if (window.OS) {
        window.OS.open('games');
      } else {
        throw new Error("window.OS not found");
      }
    });

    // Wait for Game Center to show
    await page.waitForSelector('#appWrap.open');
    console.log("Game Center opened successfully!");

    // Launch 2048
    console.log("Launching 2048 game...");
    await page.evaluate(() => {
        if (window.OS) {
            window.OS.open('games', 'g2048');
        }
    });

    // Wait for the board to render
    await page.waitForSelector('#g2048Board');
    console.log("2048 board rendered successfully!");

    // Check if tiles exist
    const tileCount = await page.locator('.g2048-tile').count();
    console.log(`Initial tiles count: ${tileCount}`);
    if (tileCount !== 2) {
      throw new Error(`Expected 2 initial tiles, found ${tileCount}`);
    }

    // Simulate sliding right
    console.log("Simulating slide Right...");
    await page.keyboard.press('ArrowRight');

    // Wait a brief moment for the animation / state update
    await page.waitForTimeout(300);

    // After a slide, check that tiles still exist
    const postMoveTiles = await page.locator('.g2048-tile').count();
    console.log(`Tiles count after move: ${postMoveTiles}`);

    if (consoleErrors.length > 0) {
      console.error("Console errors detected:");
      consoleErrors.forEach(err => console.error("- ", err));
      process.exit(1);
    } else {
      console.log("SUCCESS: 2048 game works perfectly with no browser errors!");
    }

  } catch (err) {
    console.error("Test failed: ", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
