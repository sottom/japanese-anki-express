const fs = require('fs');
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function getTokenizer(dicPath = './node_modules/kuromoji/dict/') {
    return new Promise((res, rej) => {
        const analyzer = kuromoji.builder({ dicPath })
        analyzer.build((err, tokenizer) => {
            if (err) { rej(`Error creating tokenizer. ERROR: ${err}`) }
            res(tokenizer);
        })
    });
}

const kuromoji = require("kuromoji");
const nihongo = require('nihongo');
const wanakana = require('wanakana')
(async () => {
    const tokenizer = await getTokenizer();
    const story_words = [];
    const counts = [];
    let counter = 0;
    let chunks = fs.readFileSync('', {encoding: 'utf-8'}).filter(text => nihongo.hasKanji(text))
    for (let chunk of chunks) {
        if (!chunk) continue;
        counter += 1
        console.log(counter)
        const tokenized_sentence = tokenizer.tokenize(chunk);

        for (let pos of tokenized_sentence) {
            if (!basic_form_blacklist.includes(pos.basic_form) && (nihongo.hasKanji(pos.surface_form) || accepted_pos.includes(pos.pos))) {
                let found_obj;
                if (pos.basic_form === '*') {
                    found_obj = story_words.find(w => w.word === pos.surface_form);
                } else {
                    found_obj = story_words.find(w => w.basic_form === pos.basic_form);
                }

                if (found_obj) {
                    found_obj.count += 1;
                } else {
                    let high_score = 0;
                    let definitions = fuse.search(pos.basic_form)
                    if (definitions && definitions.length) {
                        if (definitions[0].item.word !== pos.basic_form) definitions = '';
                        else {
                            definitions = definitions.filter(def => {
                                if (!high_score) {
                                    high_score = def.score
                                    return true;
                                } else if (def.score === high_score) {
                                    return true;
                                } else return false
                            });
                        }
                    } else {
                        definitions = '';
                    }
                    const sentencesWithWord = chunk.split('。').filter(s => s.includes(pos.surface_form)).map(s => s.trim());
                    const sentences = sentencesWithWord.map((sentence, i) => {
                        const len = pos.surface_form.length
                        const index = sentence.indexOf(pos.surface_form);
                        let new_sentence = '';
                        for (let i = 0; i < sentence.length; i++) {
                            if (i === index) {
                                new_sentence += `<span style="color: red;">${sentence[i]}`;
                                if (len === 1) new_sentence += `</span>`;
                            }
                            else if (i === index - 1 + len) new_sentence += `${sentence[i]}</span>`
                            else new_sentence += sentence[i]
                        }
                        return new_sentence;
                    });
                    story_words.push({
                        basic_form: pos.basic_form,
                        word: pos.surface_form,
                        reading: wanakana.toHiragana(pos.reading),
                        definitions: definitions && definitions.slice(0, 3).map(def => def.item.meanings).join('\n\n'),
                        count: 1,
                        sentences: sentences.map(s => s.trim()).join('<br><br>'),
                    });
                }

            }
        }
    };

    story_words.sort((a, b) => {
        return a.count < b.count ? 1
            : a.count > b.count ? -1
                : 0;
    });

})






// /////////////////////////////////////
// // TRANSLATE TATOEBA JAPANESE SENTENCES TO ENGLISH
// /////////////////////////////////////
// const { getTranslationText } = require("lingva-scraper");
// (async () => {
//     let tatoebaSentences = fs.readFileSync(__dirname+'/jpn_sentences.tsv', { encoding: 'utf-8'})
//     tatoebaSentences = tatoebaSentences.split('\n')
//     let translatedSentences = JSON.parse(fs.readFileSync('tatoebaSentencesTranslated.json'))
//     let count = 0;
//     for(let sentence of tatoebaSentences) {
//         count++
//         // if(sentence.split('\t')[2].includes('みんなはどう思う？')) {
//         //     console.log()
//         // }
//         if(count > 0) {
//             let [id,b,s] = sentence.split('\t')
//             let translation = await getTranslationText("auto", "en", s);
//             await sleep(500) // 1000 ms stopped at 55 sentences with 429 error
//             console.log(count + ' / ' + tatoebaSentences.length)
//             translatedSentences.push({
//                 jpn: s,
//                 eng: translation,
// id
//             })
//             // if(count % 10 == 0) {
//                 fs.writeFileSync('tatoebaSentencesTranslated.json', JSON.stringify(translatedSentences))
//             // }
//         }
//     }
//     // console.log()
// ////////////////////////////////////////////////////////






// // GET COMMON WORDS FOR KANJI FROM THE RIGHT DECK
// const axios = require("axios");
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
// })()

