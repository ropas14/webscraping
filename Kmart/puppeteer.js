const fs = require('fs');
const puppeteer = require('puppeteer');


function extractItems() {
  const extractedElements = document.querySelectorAll('h3.card-title a');
  const items = [];
  for (let element of extractedElements) {
    items.push(element.innerText);
  }
  return items;
}

async function scrapeInfiniteScrollItems(
  page,
  extractItems,
  itemTargetCount,
  scrollDelay = 1000,
) {
  let items = [];
  try {
    let previousHeight;
    while (items.length < itemTargetCount) {
      items = await page.evaluate(extractItems);
      previousHeight = await page.evaluate('document.body.scrollHeight');
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
      await page.waitFor(scrollDelay);
    }
  } catch(e) { }
  return items;
}

(async () => {
  // Set up browser and page.
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 926 });

  // Navigate to the demo page.
  await page.goto('https://www.kmart.com/tvs-electronics-televisions/b-1231470597');

  // Scroll and extract items from the page.
  const items = await scrapeInfiniteScrollItems(page, extractItems, 50);

  // Save extracted items to a file.
  fs.writeFileSync('./items.txt', items.join('\n') + '\n');

  // Close the browser.
  await browser.close();
})();
  

 
