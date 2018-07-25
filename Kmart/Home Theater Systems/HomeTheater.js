const fs = require('fs');
const puppeteer = require('puppeteer');
var URL = require('url-parse');
var jsonfile = require('jsonfile');

var START_URL = "https://www.kmart.com/tvs-electronics-home-theater-audio-home-theater-systems/b-1231487296?Home%20Theater%20Includes=Soundbar&filterList=Home%20Theater%20Includes";
var MAX_PAGES_TO_VISIT = 1000;

var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = [];

var url = new URL(START_URL);
var baseUrl = url.protocol + "//" + url.hostname;
var count=0;

pagesToVisit.push(START_URL);

var file='HomeTheater.json';
var itemz =jsonfile.readFileSync(file);

function extractItems() {
 const extractedElements = document.querySelectorAll('h3.card-title a');
 const items = [];
 for (let element of extractedElements) {
   var lnk =element.getAttribute('href');
   items.push(lnk);
}
 return items;
}

async function scrapeInfiniteScrollItems(page,extractItems,itemTargetCount,scrollDelay = 1000,) {
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

async function crawl() {
  if(pagesToVisit.length<=0 ) {
      console.log("all pages visted "+count+" items ."+itemz.length+"  all now");
      if(itemz.length>=0){
          jsonfile.writeFile(file,itemz, {spaces: 2},function (err) {//
             console.error(err+' ==');
          });
      }
      return ;
  }
  var nextPage = pagesToVisit.shift();
   if (nextPage in pagesVisited) {
         // We've already visited this page, so repeat the crawl
         crawl();
      } else {

       // New page we haven't visited
  if(nextPage==null){
      crawl();
  }
 // Set up browser and page.
 const browser = await puppeteer.launch({
   headless: false,
   args: ['--no-sandbox', '--disable-setuid-sandbox'],
 });
 const page = await browser.newPage();
 page.setViewport({ width: 1280, height: 926 });

 // Navigate to the demo page.
 await page.goto(nextPage);
 pagesVisited[nextPage]=true;
 console.log("on-------"+nextPage);
 // Scroll and extract items from the page.
 const items = await scrapeInfiniteScrollItems(page, extractItems, 50);
 items.forEach(function(lnk) {
 if(lnk != null && lnk.startsWith('/')){
 lnk =baseUrl+lnk;
 if (!(pagesVisited[lnk] || lnk in pagesToVisit )) {
     pagesToVisit.push(lnk);
 }
 }
});

 var product=  await page.evaluate(() => {
    //var item={};
    var brand = document.querySelector('div.product-content h1');
    if(brand){
        brand = brand.textContent;
        brand = brand.split(" ");
        if(brand.length>=1){
          brand=brand[0];
        }else{
          brand="";
        }
    }
     var model = document.querySelector('h2 small span');
    if(model){
       model = model.textContent;
    }
    else{
        model="";
    }
    return {brand:brand,model:model};
  });

  if(product.model || product.brand){
     
      var brand = product.brand;
      var model=""
      if(product.model){
         model= product.model;
      }

      console.log(brand+" -------"+model);
      console.log(pagesToVisit.length+" ------->>");
            itemz.push({
              brand:brand,
              model:model,
              url :nextPage,
              category: "Home Theater Systems",
              source: "Kmart",
              sourceType: "retailer",
              sourceId: 5
         });

count++;
  }

   // Save extracted items to a file.
  fs.writeFileSync('./items.txt', items.join('\n') + '\n');
 console.log(items.length+"  ============== "+pagesToVisit.length);
 // Close the browser.
 await browser.close();
 crawl();
}
}

crawl();
