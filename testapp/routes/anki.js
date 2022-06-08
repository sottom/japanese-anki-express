var express = require('express');
var router = express.Router();

const fs = require('fs');
const kuromoji = require("kuromoji");
const nihongo = require('nihongo');
const wanakana = require('wanakana')
const Fuse = require('fuse.js');
const axios = require('axios');
const readline = require('readline');

// Fuse.js fuzzy search
const jmdict = JSON.parse(fs.readFileSync('./data/new_dict.json', 'utf-8'))
const options = { includeScore: true, keys: ['word'], }
const fuse = new Fuse(jmdict, options)

/* GET home page. */
router.post('/anki', function (req, res, next) {
    makeCards(res);
});

module.exports = router;


const accepted_pos = ["名詞", "動詞", "副詞", "接頭詞", "形容詞", "連体詞", "接続詞", "感動詞"];
const basic_form_blacklist = [
    "れる", 'の'
]

async function makeCards(text, res) {
    const tokenizer = await getTokenizer();
    const story_words = [];
    const counts = [];
    let counter = 0;
    let chunks = text.split('\n').filter(text => nihongo.hasKanji(text))
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

    const deck = 'Essential Conversations April 2021 Conference'
    for (let story of story_words) {
        const tags = [
            'Essential Conversations',
            'https://www.churchofjesuschrist.org/study/general-conference/2021/04/13jones?lang=jpn',
            'Joy D. Jones',
            'April 2021 Conference',
        ];
        await addToAnkiAsCards(deck, story, tags);
    }
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function addToAnkiAsCards(deck, { word, basic_form, count, sentences, reading, definitions }, tags) {
    const action = 'addNote';
    const version = 6;
    const params = {
        "note": {
            "deckName": deck,
            "modelName": "New",
            "fields": {
                word, basic_form,
                count: count.toString(),
                sentences, reading, definitions
            },
            "options": {
                "allowDuplicate": false,
                "duplicateScope": "deck",
                "duplicateScopeOptions": {
                    "deckName": deck,
                    "checkChildren": false
                }
            },
            "tags": tags,
            // "audio": [{ "url": "https://assets.languagepod101.com/dictionary/japanese/audiomp3.php?kanji=猫&kana=ねこ", "filename": "yomichan_ねこ_猫.mp3", "skipHash": "7e2c2f954ef6051373ba916f000168dc", "fields": [ "Front" ] }],
            // "video": [{ "url": "https://cdn.videvo.net/videvo_files/video/free/2015-06/small_watermarked/Contador_Glam_preview.mp4", "filename": "countdown.mp4", "skipHash": "4117e8aab0d37534d9c8eac362388bbe", "fields": [ "Back" ] }],
            // "picture": [{ "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/A_black_cat_named_Tilly.jpg/220px-A_black_cat_named_Tilly.jpg", "filename": "black_cat.jpg", "skipHash": "8d6e4646dfae812bf39651b59d7429ce", "fields": [ "Back" ] }]
        }
    };
    await sleep(300);
    const res = await axios.post('http://127.0.0.1:8765', JSON.stringify({ action, version, params }));
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