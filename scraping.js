var cheerio = require("cheerio");
var request = require("request");
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/StartUpSchool";

var _SOURCE = "STARTUP SCHOOL";
request('https://www.startupschool.org/presentations/vertical/agriculture-agtech?course=1',function (error, response, html) {
    var $ = cheerio.load(html);
    var items = [];
    var i = 0;
	const count= $('a.item.active').children('.circular.label').text().trim();
	
    $('.presentation-card').each(function(){
      
        const header = $(this).find('.header').text().trim();
        const description = $(this).find('.description').text().trim();
        // cmpLink is the address of the item 
        const cmpLink = $(this).attr('href');
        
        const link = 'https://www.startupschool.org/'+cmpLink;
        const slink = 'https://www.startupschool.org/'+cmpLink;

		var item = {    
             header:header,		
            links:[link,slink],
            source:_SOURCE,
            rank:i+1,
           description:description,
       };

        items.push(item);

        i++;
		
        if(i < count)return true;


		items.forEach(function(Item) {
    const item_title = Item.header;
	const address_link=Item.links[1];
	const source=Item.source;
	const rank=Item.rank;
	const description=Item.description;
	
MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  const dbo = db.db("StartUpSchool");
  const myobject = {heading:item_title, address:address_link , websource:source , item_rank:rank ,item_description:description};
  dbo.collection("AgricultureCollection").insertOne(myobject, function(err, res) {
    if (err) throw err;
    console.log("successfully installed");
    db.close();
  });
});
    
});
      

    });
});

