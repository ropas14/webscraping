var cheerio = require("cheerio");
var request = require("request");
	 var MongoClient = require('mongodb').MongoClient;
     var url = "mongodb://localhost:27017/StartUpSchool";

var _SOURCE = "STARTUP SCHOOL";
request('https://www.startupschool.org/presentations/vertical/agriculture-agtech?course=1',function (error, response, html) {
    var $ = cheerio.load(html);
    var items = [];
    var i = 0;
	var count= $('a.item.active').children('.circular.label').text().trim();
	
    $('.presentation-card').each(function(){
      
        var header = $(this).find('.header').text().trim();
        var description = $(this).find('.description').text().trim();
        // cmpLink is the address of the item 
        var cmpLink = $(this).find('a').attr('href');
        
        var link = 'https://www.startupschool.org/presentations/'+cmpLink;
        var slink = 'https://www.startupschool.org/presentations/'+cmpLink;

		var item = {    
             header:header,		
            links:[link,slink],
            source:_SOURCE,
            rank:i+1,
           description:description
       }

        items.push(item);

        i++;
		
        if(i < count){return true;}


		items.forEach(function(Item) {
    var item_title = Item.header;
	var address_link=Item.links[1];
	var source=Item.source;
	var rank=Item.rank;
	var description=Item.description;
	
MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("StartUpSchool");
  var myobject = {heading:item_title, address:address_link , websource:source , item_rank:rank ,item_description:description};
  dbo.collection("AgricultureCollection").insertOne(myobject, function(err, res) {
    if (err) throw err;
    console.log("successfully installed");
    db.close();
  });
});
    
});
      

    });
});
