const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
var Meta = require('html-metadata-parser');
const webIconScraper = require('web-icon-scraper');
const getMetaData = require('metadata-scraper')
const cors = require('cors');

const app = express()
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileUpload());
app.use(cors());

const port = 5000

app.post('/linkscrap',async function  (req, res) {

    let link = req.body.linkData;
    
    // validation
    if (!link)
        return res.status(400).send({ error:true, message: 'Please provide book country and capital' });

    // insert to db
    else{
    // var link = req.body.link;
    var result = await Meta.parser(link);
    let linkInfo = result
    let body
    if(linkInfo.og?.site_name == 'Twitter'){
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
    res.send(response) ;


    }
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })