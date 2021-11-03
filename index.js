const fs = require("fs")
const json2csv = require("json2csv").Parser;
var Meta = require('html-metadata-parser');
const webIconScraper = require('web-icon-scraper');
const getMetaData = require('metadata-scraper')


    var link = "https://www.youtube.com/watch?v=QxsYyMiZWaA";

    (async () => {
        let imdbData = []
        var result = await Meta.parser("https://www.youtube.com/watch?v=QxsYyMiZWaA");
        // var result = await Meta.parser(SCAPER_URL);
    
        let linkInfo = result
        let body
        // console.log('result',result)
        ;
        if(linkInfo.og.site_name == 'Twitter'){
            let output = await webIconScraper({
                url: link,
                sort: 'des',
              })
              if(output) {
                console.log(output);
                body ={
                    title: linkInfo.og.title,
                    description: linkInfo.og.description,
                    images: output.icons[0].link,
                    url: linkInfo.og.url,
                }
              };
        }else{                
                let insta = await getMetaData(link)
                if(insta){
                    body ={
                        title: insta.title,
                        description: insta.description,
                        images: insta.image,
                        url: insta.url,
                
                    }
                }
        }

        const response = {
            statusCode: 200,
            body: JSON.stringify(body),
        };
        
       
        console.log("Scrap image result: ",body);
        console.log("Scrap image result: ",body.title);
        // return response;
    imdbData.push( {title: body.title, description: body.description, images: body.images, url:body.url})

    const j2cp = new json2csv
    const csv = j2cp.parse(imdbData)
    fs.writeFileSync("./imdb.csv", csv,"utf-8")
})();