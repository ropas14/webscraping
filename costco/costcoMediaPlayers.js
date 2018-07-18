
'use strict';
const puppeteer = require('puppeteer');
var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var fs = require('fs');
const start_url = "https://www.costco.com/media-players.html?sortBy=PriceMin%7C0";
let pagesVisited = {};
let promises = [];
let pagesUrls = [];
let numPagesVisited = 0;
let pagesToVisit = [];
let allinformation = [];
let orgUrl = new URL(start_url);
const baseUrl = orgUrl.protocol + "//" + orgUrl.hostname;

pagesToVisit.push(start_url);
crawl();

function crawl() {
   if (pagesToVisit.length <= 0 ) {
      console.log("all pages have been visited");
      Promise.all(promises).then(function(values) {
            displayInformation();

         })
         .catch(error => {
            console.log(error, +'Promise error');
         });
      return;
   }
   let nextPage = pagesToVisit.pop();
   if (nextPage in pagesVisited) {
      // We've already visited this page, so repeat the crawl
      crawl();
   }
   else {
      // New page we haven't visited	
      visitPage(nextPage, crawl);
   }
}
async function visitPage(url, callback) {
   // Add page to our set
   pagesVisited[url] = true;
   numPagesVisited++;
   // Make the request
   console.log("Visiting page " + url);
   let pageReq = pageRequest(url, callback);
   promises.push(pageReq);
   await pageReq.then(function(body) {
         let $ = cheerio.load(body);
         collectLinks($,url);
         searchForContents($, url);
         callback();
      }, function(err) {
         console.log(err);
         callback();
      })
      .catch(error => {
         console.log(error, +'Promise error');
      });
}

function pageRequest(url, callback) {

  var agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36';
  var options = {
      url: url,
      headers: {
           'User-Agent': agent
        }
      };

   return new Promise(function(resolve, reject) {
      // Asynchronous request and callback
      request.get(options, function(err, response, body) {
         if (err) {
            reject(err);
            callback();
         }
         else {
            resolve(body);
         }
      }).on('error', function(e) {
         console.log(e);
      }).end();
   });
}

async function collectLinks($,url) {
  var links = $('div.product-list p.description a');
  var pagelinks = $('div.product-list div.paging li.page a');
     if (links) {
      links.each(function() {
         let tv_link = $(this).attr('href');
         if (tv_link == null) {
            return;
         }
         if (tv_link.startsWith("/")) {
            var link = baseUrl + tv_link
            if (link in pagesToVisit) {}
            else {
               if (link in pagesVisited) {}
               else {
                  pagesToVisit.push(link);
               }
            }
         }
         else {
            if (link in pagesToVisit) {}
            else {
               if (tv_link in pagesVisited) {}
               else {
                  pagesToVisit.push(tv_link);
               }
            }
         }
      });
    }     
    
   }


function searchForContents($, url) {

   let productModel = $('div#pdp-accordion-collapse-2 div.row ');
   if(url.includes('product.')){

    var thebrand='';
    var themodel='';
   productModel.each(function() {
    var specname =$(this).find('div.spec-name').text().trim();
    if(specname=='Brand'){
      thebrand = $(this).find('div:nth-child(2)').text().trim();
    } 
    else if(specname=='Model'){
      themodel = $(this).find('div:nth-child(2)').text().trim();
    }
    else{

    }
        
      });
     var Items = {
      brand: thebrand,
      model: themodel,
      category: "Streaming Media Players",
      source: "Costco",
      sourceType: "retailer",
      sourceId: 3
      };
 
     console.log(Items);
     allinformation.push(Items);
     

    }   

   }

function displayInformation() {
   console.log("Total number of items = " +allinformation.length);
   var jsonContent = JSON.stringify(allinformation);
//console.log(jsonContent);

fs.writeFile("costcoMediaPlayers.json", jsonContent, 'utf8', function(err) {
   if (err) {
      console.log("An error occured while writing JSON Object to File.");
      return console.log(err);
   }

   console.log("JSON file has been saved.");
});

}