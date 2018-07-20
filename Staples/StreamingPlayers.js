
//open the puppeteer library
const puppeteer = require('puppeteer');
var fs = require('fs');
var resultArray=[];

(async function main(){
 
 try{
  const browser = await puppeteer.launch({headless:true});
  const page = await browser.newPage();
  page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3495.0 Safari/537.36');

   await page.goto('https://www.staples.com/Streaming-Media-Players/cat_CG3572?icid=TVSTREAMINGSUPERCAT:LINKBOX2:TVSTREAMINGMEDIA2:STREAMINGMEDIA::::',{ waitUntil: 'networkidle2' });
     const hrefs = await page.evaluate(
    () => Array.from(document.body.querySelectorAll('div#secondaryTiles .product-details a.product-title[href]'), ({ href }) => href)
  );
  
  for(let i=0 ; i<hrefs.length ; i++){
      await page.goto(hrefs[i],{ waitUntil: 'networkidle2' });
      const productToSave = await page.evaluate(() => {
      const $ = window.$;
      var thebrand= $('div.info-container h1').text().trim();
      var themodel = $('div.item-model span#mmx-sku-manufacturerPartNumber').text().trim();
      var Items = {
       brand: thebrand,
       model: themodel,
       category: "Streaming Media Players",
       source: "Staples",
       sourceType: "retailer",
       sourceId: 6
      };
            return Items;
        });
    resultArray.push(productToSave);
    console.log(productToSave);
  }

var jsonContent = JSON.stringify(resultArray);
//console.log(jsonContent);

fs.writeFile("StreamingMediaPlayers.json", jsonContent, 'utf8', function(err) {
   if (err) {
      console.log("An error occured while writing JSON Object to File.");
      return console.log(err);
   }

   console.log("JSON file has been saved.");
});

 }
 catch(e){
   console.log('our error', e);
 }
 
})();