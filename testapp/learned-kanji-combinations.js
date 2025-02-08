const fs = require('fs');
const path = require('path')
const kuromoji = require("kuromoji");
const axios = require("axios");
const nihongo = require('nihongo');
const { get } = require('express/lib/response');


///////////////////////////////////////////////
// GET COMMON WORDS FOR KANJI FROM THE RIGHT DECK
///////////////////////////////////////////////
(async () => {
    let data = JSON.parse(fs.readFileSync('kanjiCommonWordsWithSentences.json', { encoding: 'utf-8' }))
    let allKanji = Object.keys(data);
    let words = new Set();
    for(let k of allKanji) {
        for(let word of data[k]) {
            words.add(word.word + '-' + word.count)
        }
    }
    let orderedWords = Array.from(words).map(x => x.split('-')).sort((a,b) => parseInt(a[1]) > parseInt(b[1]) ? -1 : parseInt(a[1]) < parseInt(b[1]) ? 1 : 0)

    const jmdict = JSON.parse(fs.readFileSync(path.join(__dirname, 'routes', 'data', 'new_dict.json'), 'utf-8'))

    /////////////////////////////////////////////
    // GET SEEN KANJI
    /////////////////////////////////////////////
    // // GET DECK NAMES
    let action = 'deckNames';
    let version = 6;
    let params = {};
    let res;
    // await sleep(300);
    // res = await axios.post('http://127.0.0.1:8765', JSON.stringify({ action, version, params }));
    // console.log(res.data.result)

    // let todaydata = await getReviewsToday()

    action = 'findNotes';
    params = {
        // "query": '"deck:Heisigs RTK 6th Edition [Stories, Stroke Diagrams, Readings]" (is:review OR is:suspended) rated:1'
        // this one is all cards (above one is studied today)
        "query": '"deck:Heisigs RTK 6th Edition [Stories, Stroke Diagrams, Readings]" (is:review OR is:suspended)'
        //  below this is all kanji in the deck
        // "query": '"deck:Heisigs RTK 6th Edition [Stories, Stroke Diagrams, Readings]"'
    };
    // await sleep(300);
    res = await axios.post('http://127.0.0.1:8765', JSON.stringify({ action, version, params }));
    // console.log(res.data.result)


    action = 'notesInfo';
    params = {
        "notes": res.data.result
    };
    // await sleep(300);
    let res2 = await axios.post('http://127.0.0.1:8765', JSON.stringify({ action, version, params }));
    // console.log(res.data.result)
    let count = 0;
    let seenKanji = res2.data.result.map(note => {
        return note.fields.kanji.value
    })
    fs.writeFileSync('/Users/mitchellsotto/code/ankiKnownKanji.json', JSON.stringify(seenKanji))

    let constituents = res2.data.result.map(note => {
        return [note.fields.kanji.value, note.fields.constituent.value.split(',').map(x => x.trim())]
    })

    let allConstituents = {}
    for(let [kanji, makeup] of constituents) {
        for(let word of makeup) {
            if(word in allConstituents) {
                allConstituents[word].push(kanji)
            } else {
                allConstituents[word] = [kanji]
            }
        }
    }

    let kunYomi = res2.data.result.map(note => {
        return [note.fields.kanji.value, note.fields.kunYomi.value.split('、').map(x => x.trim())]
    })

    let allKunYomi = {}
    for(let [kanji, makeup] of kunYomi) {
        for(let word of makeup) {
            if(word in allKunYomi) {
                allKunYomi[word].push(kanji)
            } else {
                allKunYomi[word] = [kanji]
            }
        }
    }

    let onYomi = res2.data.result.map(note => {
        return [note.fields.kanji.value, note.fields.onYomi.value.split('、').map(x => x.trim())]
    })

    let allOnYomi = {}
    for(let [kanji, makeup] of onYomi) {
        for(let word of makeup) {
            if(word in allOnYomi) {
                allOnYomi[word].push(kanji)
            } else {
                allOnYomi[word] = [kanji]
            }
        }
    }

    let typerCards = res2.data.result.map(note => {
        return {
            keyword: note.fields.keyword.value,
            kanji: note.fields.kanji.value,
            heisigStory: note.fields.heisigStory.value,
            heisigComment: note.fields.heisigComment.value,
            kanji: note.fields.kanji.value,
        }
    })

    ////////////////////////////////////
    // GET WORDS I CAN MAKE WITH SEEN KANJI
    ////////////////////////////////////
    let seenWords = []
    for(let word of orderedWords) {
        let kanjiArr = word[0].split('')
        // remove non-kanji characters
        let onlyKanjis = kanjiArr.filter(kanji => nihongo.hasKanji(kanji))
        let notSeen = 0;
        for(let kanji of onlyKanjis) {
            if(!seenKanji.includes(kanji)) {
                notSeen++
            }
        }
        if(!notSeen) {
            let found = jmdict.find(x => x.word == word[0])
            if(found) {
                word.push(found.readings)
                word.push(found.meanings)
            }
            seenWords.push(word)
        }
    }
    console.log()

})()