const axios = require("axios");
const fs = require('fs');
const { translate } = require('@vitalets/google-translate-api');
const { HttpProxyAgent } = require('http-proxy-agent');
const { getTranslationText } = require("lingva-scraper");
const { languageList } = require("lingva-scraper");


// console.log()





function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}


// TRANSLATE JAPANESE SENTENCES TO ENGLISH
(async () => {
    let tatoebaSentences = fs.readFileSync(__dirname+'/jpn_sentences.tsv', { encoding: 'utf-8'})
    tatoebaSentences = tatoebaSentences.split('\n')
    let translatedSentences = JSON.parse(fs.readFileSync('tatoebaSentencesTranslated.json'))
    let count = 0;
    // let agent = new HttpProxyAgent('http://103.135.139.121:80');
    for(let sentence of tatoebaSentences) {
        count++
        // if(sentence.split('\t')[2].includes('みんなはどう思う？')) {
        //     console.log()
        // }
        if(count > 240480) {
            let [a,b,s] = sentence.split('\t')
            let translation = await getTranslationText("auto", "en", s);
            // let data = await translate(s, { 
            //     to: 'en', 
            //     // fetchOptions: { agent } 
            // });
            
            await sleep(500) // 1000 ms stopped at 55 sentences with 429 error
            console.log(count + ' / ' + tatoebaSentences.length)
            translatedSentences.push({
                jpn: s,
                eng: translation
            })
            // if(count % 10 == 0) {
                fs.writeFileSync('tatoebaSentencesTranslated.json', JSON.stringify(translatedSentences))
            // }
        }
    }
    // console.log()






// // GET COMMON WORDS FOR KANJI FROM THE RIGHT DECK
//     let data = JSON.parse(fs.readFileSync(__dirname + '/kanjiCommonWords.json', { encoding: 'utf-8' }))

//     // // GET DECK NAMES
//     let action = 'deckNames';
//     let version = 6;
//     let params = {};
//     let res;
//     // await sleep(300);
//     // res = await axios.post('http://127.0.0.1:8765', JSON.stringify({ action, version, params }));
//     // console.log(res.data.result)




//     action = 'findNotes';
//     params = {
//         "query": "deck:current"
//     };
//     await sleep(300);
//     res = await axios.post('http://127.0.0.1:8765', JSON.stringify({ action, version, params }));
//     // console.log(res.data.result)


//     action = 'notesInfo';
//     params = {
//         "notes": res.data.result
//     };
//     await sleep(300);
//     let res2 = await axios.post('http://127.0.0.1:8765', JSON.stringify({ action, version, params }));
//     console.log(res.data.result)
//     let count = 0;
//     for (let note of res2.data.result) {
//         // add list of kanji and their most common words with good example sentences (I want to learn how to read these kanji after I learn what they mean and how to remember/write them.)
//         // find most common word for this kanji
//         // add new cards in a new deck for this kanji and its 
//         if (data[note.fields.kanji.value]) {
//             count++
//             console.log(count, note.fields.kanji.value)
//             data[note.fields.kanji.value].toString()
//         }
//     }
})()

