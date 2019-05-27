'use strict';
const request = require('request');
const TMDB = require('../config').TMDB;
const createResponse = require('./createResponse');
const MAX_CONFIDENCE = 0.5;


const extractEntity = (nlp, entity) => {

    let obj = nlp[entity]&& nlp[entity][0];
    // let obj = nlp[entity][0];

    if(obj && obj.confidence > MAX_CONFIDENCE) {
        
        return obj['value'];
    } else {
        return null;
    }
}

const getMovieData = (movie, releaseYear = null) => {
    let qs = {
        api_key: TMDB,
        query: movie
    }

    if (releaseYear) {
        qs.year = Number(releaseYear);
    }

    return new Promise((resolve, reject) => {
        request({
            uri: 'https://api.themoviedb.org/3/search/movie',
            qs
        }, (error, response, body) => {
            if(!error && response.statusCode === 200) {
                let data = JSON.parse(body);
                resolve(data.results[0]);
            } else {
                reject(error);
            }
        });
    });
}

const getDirector = movie_id => {

    let qs = {
        api_key: TMDB
    };

    return new Promise((resolve,reject)=>{

        request({
            uri: `https://api.themoviedb.org/3/movie/${movie_id}/credits`,
            qs
        }, (error,response,body) =>{
            if (!error && response.statusCode === 200) {
                let result = JSON.parse(body).crew;
                let director = result.filter(item=>item.job ==='Director').map(item=>item.name).join(', ');
                resolve(director);
            } else {
                reject(error);
            }
        });
    });
}

module.exports = nlpData => {
    return new Promise( async (resolve,reject)=>{
        // console.log("!!",nlpData);
        let intent = extractEntity(nlpData,'intent');
        // console.log(">>",intent);
        if (intent) {
            console.log("B4!",nlpData);
            let releaseYear = extractEntity(nlpData,'releaseYear');
            let movie = extractEntity(nlpData,'movie');
            
            try {
                let movieData = await getMovieData(movie);
                let director = await getDirector(movieData.id);
                let response = createResponse(intent,movieData,director);

                resolve(response);
            } catch(error) {
                reject(error);
            }

        }

    });
}