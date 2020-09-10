let cheerio = require("cheerio");
let request = require("request");
let async = require("async");
let MongoClient = require('mongodb').MongoClient;
const mongourl = "mongodb://localhost:27017/StartUpSchool";
let Urls = [];
const SOURCE = "STARTUP SCHOOL";

 async.series([

        function(callback) {
			// fetching the webpage using request
           request('https://www.startupschool.org/presentations/vertical/agriculture-agtech?course=1',function (error, response, html) {
                if (error) return callback(error); 
                let $ = cheerio.load(html);
				
                // calculations where I get NewUrl variable...
				 $('.presentation-card').each(function() {
		           const cmpLink = $(this).attr('href');      
                   const link = 'https://www.startupschool.org/'+cmpLink;
				   Urls.push(link);					   			   
	           });
			   
                callback();
            });
			
        },
		     function(callback) {	 
			// iterating the urls in array Urls
                    for (let i = 0; i <= Urls.length-1; i++) {
				
                   let url = Urls[i];
                   const items = {
			     Source: SOURCE, 
			     Presenter: "",
			     Topic: "",
		             Email: "",
		             website: "",
		             Description: "",
		             Videosrc: "",
		             Team: "",
			     Positions: "",
                };	
				
                request(url,function (error, response, html) {      
			    let $ = cheerio.load(html);
                $('div.ui.basic.wide.segment').each(function() {
			     items.Presenter = $(this).find('h1.ui.header.center.aligned')
				 .clone().children()
				 .remove().end().text();
			     items.Topic = $(this).find('h1>div.sub.header')
				 .clone().children()
				 .remove().end().text();
			     items.Email = $(this).find('h1>div>a:nth-child(2)')
				 .text().trim();
			     items.website = $(this).find('h1 a').first().attr('href');
			     items.Description=$(this).find('.ui.basic.segment>p')
				 .text().trim();
			
			      // FIXME: how do i get the youtube link? faced challenges here?its not returning anything	
			      items.Videosrc = $(this).find('div.ui.embed.active>iframe').attr('src');
			      let Membership = [];
			      $('div.column.center.aligned.company-founder-bio').each(function() { 
				
				            // getting the members of the Company and their positions			
		                    const people = {
							 Member: $(this).find('h4.ui.header').clone().children().remove().end().text(),
			                 Title: $(this).find('h4>div.sub.header').text().trim(),
		                      };
		                     Membership.push(people);
		           });
			
	       Membership.forEach(function(ItemArray) {
	       items.Team = ItemArray.Member;
	       items.Positions = ItemArray.Title;});									 		
	  });
			
          const item_source = items.Source;
	      const item_presenter = items.Presenter;
	      const item_topic = items.Topic;
	      const item_email = items.Email;
	      const item_website = items.website;
	      const item_description = items.Description;
	      const item_video = items.Videosrc;
	      const item_team = items.Team;
	      const item_titles = items.Positions;
	
        // connecting and saving to mongodb 
     MongoClient.connect(mongourl, function(err, db) {
     if (err) throw err;
     const dbo = db.db("StartUpSchool");
     const myobject = { websource:item_source, presenter:item_presenter, topic:item_topic, emailaddress:item_email, website:item_website, 
	                description:item_description, video:item_video, itemMembers:item_team , memberspositions:item_titles};
     dbo.collection("AgricultureCollection").insertOne(myobject, function(err, res) {
     if (err) throw err;
     console.log("successfully installed");
     db.close();
                    });
              });
         });				
      }  
    }
 ], function (err) {
    if (!err) callback();       
		});
