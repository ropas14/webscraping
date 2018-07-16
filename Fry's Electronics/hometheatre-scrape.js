var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
const start_url = "https://www.frys.com/category/Outpost/Audio/Home+Theater+Systems/&site=audio_nav:home%20theater%20systems";
let pagesVisited = {};
let promises = [];
let pagesUrls = [];
let numPagesVisited = 0;
let pagesToVisit = [];
let allinformation = [];
let orgUrl = new URL(start_url);
const baseUrl = orgUrl.protocol + "//" + orgUrl.hostname + "/";

let MongoClient = require('mongodb').MongoClient
const mongourl = "mongodb://localhost:27017/"
// connecting to mongo
var dbo="";
MongoClient.connect(mongourl, function(err, db){
  if (err) {throw err;
    return;}
   dbo = db.db("Fry's");
  });

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
         collectLinks($);
         searchForContents($, url)
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

function collectLinks($) {
    var pglinks = $('div.page_none_desk ul#pagenumber li a');
    console.log("{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{ liinks");
   if (pglinks) {
      console.log("00000000000000000000000----- collectLinks");
      pglinks.each(function() {
         let page_link = $(this).attr('href')
         if (page_link == null) {
            return;
         }  
         console.log("+++++++++++++++++++++++++tyt"); 
            var address = baseUrl + page_link;
            if (pagesToVisit.indexOf(address) > -1){}
            else {
               if (address in pagesVisited) {}
               else {
                  pagesToVisit.push(address);
               }
            }
         });
      }
}

function searchForContents($, url) {
 if(url.includes("search?")){

   let productModel = $('div#rightCol div#prodCol #prodDesc div.prodModel');
 
   productModel.each(function() {
      var thebrand=$(this).find('p:nth-child(2)') .clone() .children() .remove().end().text();
      var themodel=$(this).find('p:nth-child(4)') .clone() .children() .remove().end().text();
      var Items = {
         brand: thebrand,
         model: themodel,
         category: "Home Theater Systems",
         source: "Fry's Electronics",
         sourceType: "retailer",
         sourceId: 1
      };

     dbo.collection("hometheatersystems").insertOne(Items, function(err, res) {
       if (err) throw err;
       console.log("----------saving " + Items.brand);

     });
  
      allinformation.push(Items);
        
      });

       

   }

}

function displayInformation() {
   console.log("Total number of items = " +allinformation.length);

}