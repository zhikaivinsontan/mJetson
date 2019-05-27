'use strict';

const express = require("express");
const bodyParser =require('body-parser');
const config = require('./config');
const FBeamer = require('./fBeamer');

const server = express();

const tmdb = require('./tmdb');
const PORT = process.env.PORT || 3000;

console.log(config.fb);

const f = new FBeamer(config.fb);

server.get('/',(req,res) => {
    f.registerHook(req,res);
    // return next();
});

// Step 1: verification
server.post('/',bodyParser.json({
    verify: f.verifySignature.call(f)
}));

server.post('/',(req,res,next)=>{
    f.incoming(req,res, msg => {
        const {
            message,
            sender
        } = msg;
        // console.log(message.nlp.entities,sender);
        if (message.text && message.nlp.entities) {
            
            tmdb(message.nlp.entities)
                .then(response=>{
                    f.txt(sender, response.txt);
                    if (response.img) {
                        f.img(sender,response.img);
                    };
                })
                .catch(error => {
                    console.log(error);
                    f.txt(sender, `You just said ${message.text}`);
                });
        }
    });
    return next();
});

server.listen(PORT, ()=>console.log(`Running on port ${PORT}`));