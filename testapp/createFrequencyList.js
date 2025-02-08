const fs = require('fs');
const path = require('path')
const kuromoji = require("kuromoji");
const nihongo = require('nihongo');
const wanakana = require('wanakana');

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function getTokenizer(dicPath = __dirname + '/node_modules/kuromoji/dict/') {
    return new Promise((res, rej) => {
        const analyzer = kuromoji.builder({ dicPath })
        analyzer.build((err, tokenizer) => {
            if (err) { rej(`Error creating tokenizer. ERROR: ${err}`) }
            res(tokenizer);
        })
    });
}

/**
* Splits an array into `num_chunks` equal-sized chunks.
*
* @param arr {Array} The input array to split.
* @param num_chunks {Integer} Number of equal-sized chunks to create.
* @returns {Array} A list of `num_chunks` subarrays.
*/
function chunkArray(arr, num_chunks) {
    const chunk_size = Math.ceil(arr.length / num_chunks);
    const chunks = [];

    for (let i = 0; i < num_chunks; i++) {
        const start_idx = i * chunk_size;
        const end_idx = start_idx + chunk_size;
        chunks.push(arr.slice(start_idx, end_idx));
    }

    return chunks;
}




(async () => {
    // const ldsText = JSON.parse(fs.readFileSync(path.join(__dirname, 'lds.org.all.text.json'), 'utf-8'))
    // const accepted_pos = ["名詞", "動詞", "副詞", "接頭詞", "形容詞", "連体詞", "接続詞", "感動詞"];
    // const basic_form_blacklist = [
    //     "れる", 'の'
    // ]
    const jmdict = JSON.parse(fs.readFileSync(path.join(__dirname, 'routes', 'data', 'new_dict.json'), 'utf-8'))
    const tokenizer = await getTokenizer();
    // const story_words = [];
    // const counts = [];
    // let counter = 0;
    // // let translatedSentences = JSON.parse(fs.readFileSync('tatoebaSentencesTranslatedWithId.json', { encoding: 'utf-8' }))
    // //     .filter(text => nihongo.hasKanji(text.jpn))

    // ///////////////////////////////
    // // TOKENIZE LDS TEXT
    // ///////////////////////////////
    // let ldsTextLength = ldsText.length
    // let tokensToSave = [];
    // let tokensSavedCount = 0;
    // for (var i = 0; i < ldsText.length; i++) {
    //     // if (i < 7001) continue;
    //     if (i % 25 === 0) console.log(i + '/' + ldsTextLength)

    //     let cleanText = ldsText[i].replace(/\n/g, '')

    //     let tokens = tokenizer.tokenize(cleanText).map(token => ({
    //         id: token.word_id, 
    //         type: token.word_type, 
    //         basic: token.basic_form, 
    //         surface: token.surface_form 
    //     }))
    //     tokensToSave.push(tokens)

    //     // Function to calculate the size of an array in bytes
    //     function getSizeInBytes(array) {
    //         return Buffer.byteLength(JSON.stringify(array));
    //     }

    //     // Function to write array to a file if it exceeds 50MB
    //     function writeFileIfExceedsSize(array, filePath, maxSizeMB = 20) {
    //         const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes
    //         const arraySize = getSizeInBytes(array);

    //         if (arraySize >= maxSizeBytes) {
    //             fs.writeFileSync(filePath, JSON.stringify(array, null, 2))
    //             console.log('Array size is ~20MB. File written.');
    //             return true
    //         } else {
    //             return false
    //         }
    //     }

    //     if(writeFileIfExceedsSize(tokensToSave, path.join(__dirname, `ldsOrgTokenized`, `japaneseLdsOrgTokenizedChunk${i}.json`))) {
    //         tokensToSave = []
    //     }
    // }

    // console.log()

    ////////////////////////////////////////////////////////////////
    // Everything before this creates tokenized files.
    // Everything after this reads the tokenized files and creates
    // a sorted list of the most common parts of speech.
    ////////////////////////////////////////////////////////////////

    // // Function to read JSON files from a directory
    // function readJsonFiles(dir) {
    //     const files = fs.readdirSync(dir);
    //     return files.map(file => {
    //         const filePath = path.join(dir, file);
    //         const content = fs.readFileSync(filePath, 'utf-8');
    //         return JSON.parse(content);
    //     });
    // }

    // // const allTokenizedSentences = readJsonFiles(path.join(__dirname, 'ldsOrgTokenized')).flat();
    // let files = fs.readdirSync(path.join(__dirname, 'ldsOrgTokenized'))

    // let mostCommonWords = {}
    // for (let fileName of files) {
    //     let tokens = JSON.parse(fs.readFileSync(path.join(__dirname, 'ldsOrgTokenized', fileName), { encoding: 'utf-8'}))
    //     for (tokenizedSentence of tokens) {
    //         for (let pos of tokenizedSentence) {
    //             if (pos.id in mostCommonWords) {
    //                 mostCommonWords[pos.id].count++
    //             } else {
    //                 mostCommonWords[pos.id] = { ...pos, count: 1 }
    //             }
    //         }
    //     }

    // }

    // let orderedMostCommonWords = Object.values(mostCommonWords).sort((a, b) => {
    //     return a.count > b.count ? -1
    //         : a.count < b.count ? 1
    //             : 0;
    // })
    // console.log()



    let orderedMostCommonWords = JSON.parse(fs.readFileSync('ldsOrgMostCommonPos.json', { encoding: 'utf-8'}))
    const ankiKanji = [ "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "口", "日", "月", "田", "目", "古", "吾", "冒", "朋", "明", "唱", "晶", "品", "呂", "昌", "早", "旭", "世", "胃", "旦", "胆", "亘", "凹", "凸", "旧", "自", "白", "百", "中", "千", "舌", "升", "昇", "丸", "寸", "専", "博", "占", "上", "下", "卓", "朝", "只", "貝", "貞", "員", "見", "児", "元", "頁", "頑", "凡", "負", "万", "句", "肌", "旬", "勺", "的", "首", "乙", "乱", "直", "具", "真", "工", "左", "右", "有", "賄", "貢", "項", "刀", "刃", "切", "召", "昭", "則", "副", "別", "丁", "町", "可", "頂", "子", "孔", "了", "女", "好", "如", "母", "貫", "兄", "克", "小", "少", "大", "多", "夕", "汐", "外", "名", "石", "肖", "硝", "砕", "砂", "削", "光", "太", "器", "臭", "妙", "省", "厚", "奇", "川", "州", "順", "水", "氷", "永", "泉", "原", "願", "泳", "沼", "沖", "江", "汁", "潮", "源", "活", "消", "況", "河", "泊", "湖", "測", "土", "吐", "圧", "埼", "垣", "圭", "封", "涯", "寺", "時", "均", "火", "炎", "煩", "淡", "灯", "畑", "災", "灰", "点", "照", "魚", "漁", "里", "黒", "墨", "鯉", "量", "厘", "埋", "同", "洞", "胴", "向", "尚", "字", "守", "完", "宣", "宵", "安", "宴", "寄", "富", "貯", "木", "林", "森", "桂", "柏", "枠", "梢", "棚", "杏", "桐", "植", "枯", "朴", "村", "相", "机", "本", "札", "暦", "案", "燥", "未", "末", "沫", "味", "妹", "朱", "株", "若", "草", "苦", "寛", "薄", "葉", "模", "漠", "墓", "暮", "膜", "苗", "兆", "桃", "眺", "犬", "状", "黙", "然", "荻", "狩", "猫", "牛", "特", "告", "先", "洗", "介", "界", "茶", "合", "塔", "王", "玉", "宝", "珠", "現", "狂", "皇", "呈", "全", "栓", "理", "主", "注", "柱", "金", "銑", "鉢", "銅", "釣", "針", "銘", "鎮", "道", "導", "辻", "迅", "造", "迫", "逃", "辺", "巡", "車", "連", "軌", "輸", "前", "各", "格", "略", "客", "額", "夏", "処", "条", "落", "冗", "軍", "輝", "運", "冠", "夢", "坑", "高", "享", "塾", "熟", "亭", "京", "涼", "景", "鯨", "舎", "周", "週", "士", "吉", "壮", "荘", "売", "学", "覚", "栄", "書", "津", "牧", "攻", "敗", "枚", "故", "敬", "言", "警", "計", "獄", "訂", "討", "訓", "詔", "詰", "話", "詠", "詩", "語", "読", "調", "談", "諾", "諭", "式", "試", "弐", "域", "賊", "栽", "載", "茂", "成", "城", "誠", "威", "滅", "減", "桟", "銭", "浅", "止", "歩", "渉", "頻", "肯", "企", "歴", "武", "賦", "正", "証", "政", "定", "錠", "走", "超", "赴", "越", "是", "題", "堤", "建", "延", "誕", "礎", "婿", "衣", "裁", "装", "裏", "壊", "哀", "遠", "猿", "初", "布", "帆", "幅", "帽", "幕", "幌", "錦", "市", "姉", "肺", "帯", "滞", "刺", "制", "製", "転", "芸", "雨", "雲", "曇", "雷", "霜", "冬", "天", "橋", "嬌", "立", "泣", "章", "競", "帝", "童", "瞳", "鐘", "商", "嫡", "適", "滴", "敵", "匕", "北", "背", "比", "昆", "皆", "混", "渇", "謁", "褐", "喝", "旨", "脂", "壱", "毎", "敏", "梅", "海", "脊", "妖", "沃", "巾", "匂", "嘲", "呪", "唄", "叱", "填", "妬", "沙", "汰", "汎", "苛", "蔑", "葛", "昧", "旺", "肘", "腺", "椅", "柿", "煎", "玩", "詣", "諦", "詮", "貼", "賂", "鍵", "頃", "冥", "戚", "嗅", "喩", "訃", "楷", "諧", ]
    let filteredPos = orderedMostCommonWords.filter(pos => {
        let kanjis = pos.basic
            .split('')
            .filter(char => nihongo.hasKanji(char))

        if(kanjis.length === 0) return false;

        return kanjis.every(character => ankiKanji.includes(character))
    })
    console.log();


})()

































































/////////////////////////////////////////
// This takes kanji I know from Anki and
// tells me which common words from common
// word lists I should know.
/////////////////////////////////////////

// const fs = require('fs')
// const path = require('path')

// function hasKanji(text) {
//     for (let i = 0; i < text.length; i++) {
//         const code = text[i].charCodeAt(0);
//         if ((code >= 0x4E00 && code <= 0x9FAF) || (code >= 0x3400 && code <= 0x4DBF)) {
//             return true;
//         }
//     }
//     return false;
// }

// const ankiKanji = [ "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "口", "日", "月", "田", "目", "古", "吾", "冒", "朋", "明", "唱", "晶", "品", "呂", "昌", "早", "旭", "世", "胃", "旦", "胆", "亘", "凹", "凸", "旧", "自", "白", "百", "中", "千", "舌", "升", "昇", "丸", "寸", "専", "博", "占", "上", "下", "卓", "朝", "只", "貝", "貞", "員", "見", "児", "元", "頁", "頑", "凡", "負", "万", "句", "肌", "旬", "勺", "的", "首", "乙", "乱", "直", "具", "真", "工", "左", "右", "有", "賄", "貢", "項", "刀", "刃", "切", "召", "昭", "則", "副", "別", "丁", "町", "可", "頂", "子", "孔", "了", "女", "好", "如", "母", "貫", "兄", "克", "小", "少", "大", "多", "夕", "汐", "外", "名", "石", "肖", "硝", "砕", "砂", "削", "光", "太", "器", "臭", "妙", "省", "厚", "奇", "川", "州", "順", "水", "氷", "永", "泉", "原", "願", "泳", "沼", "沖", "江", "汁", "潮", "源", "活", "消", "況", "河", "泊", "湖", "測", "土", "吐", "圧", "埼", "垣", "圭", "封", "涯", "寺", "時", "均", "火", "炎", "煩", "淡", "灯", "畑", "災", "灰", "点", "照", "魚", "漁", "里", "黒", "墨", "鯉", "量", "厘", "埋", "同", "洞", "胴", "向", "尚", "字", "守", "完", "宣", "宵", "安", "宴", "寄", "富", "貯", "木", "林", "森", "桂", "柏", "枠", "梢", "棚", "杏", "桐", "植", "枯", "朴", "村", "相", "机", "本", "札", "暦", "案", "燥", "未", "末", "沫", "味", "妹", "朱", "株", "若", "草", "苦", "寛", "薄", "葉", "模", "漠", "墓", "暮", "膜", "苗", "兆", "桃", "眺", "犬", "状", "黙", "然", "荻", "狩", "猫", "牛", "特", "告", "先", "洗", "介", "界", "茶", "合", "塔", "王", "玉", "宝", "珠", "現", "狂", "皇", "呈", "全", "栓", "理", "主", "注", "柱", "金", "銑", "鉢", "銅", "釣", "針", "銘", "鎮", "道", "導", "辻", "迅", "造", "迫", "逃", "辺", "巡", "車", "連", "軌", "輸", "前", "各", "格", "略", "客", "額", "夏", "処", "条", "落", "冗", "軍", "輝", "運", "冠", "夢", "坑", "高", "享", "塾", "熟", "亭", "京", "涼", "景", "鯨", "舎", "周", "週", "士", "吉", "壮", "荘", "売", "学", "覚", "栄", "書", "津", "牧", "攻", "敗", "枚", "故", "敬", "言", "警", "計", "獄", "訂", "討", "訓", "詔", "詰", "話", "詠", "詩", "語", "読", "調", "談", "諾", "諭", "式", "試", "弐", "域", "賊", "栽", "載", "茂", "成", "城", "誠", "威", "滅", "減", "桟", "銭", "浅", "止", "歩", "渉", "頻", "肯", "企", "歴", "武", "賦", "正", "証", "政", "定", "錠", "走", "超", "赴", "越", "是", "題", "堤", "建", "延", "誕", "礎", "婿", "衣", "裁", "装", "裏", "壊", "哀", "遠", "猿", "初", "布", "帆", "幅", "帽", "幕", "幌", "錦", "市", "姉", "肺", "帯", "滞", "刺", "制", "製", "転", "芸", "雨", "雲", "曇", "雷", "霜", "冬", "天", "橋", "嬌", "立", "泣", "章", "競", "帝", "童", "瞳", "鐘", "商", "嫡", "適", "滴", "敵", "匕", "北", "背", "比", "昆", "皆", "混", "渇", "謁", "褐", "喝", "旨", "脂", "壱", "毎", "敏", "梅", "海", "脊", "妖", "沃", "巾", "匂", "嘲", "呪", "唄", "叱", "填", "妬", "沙", "汰", "汎", "苛", "蔑", "葛", "昧", "旺", "肘", "腺", "椅", "柿", "煎", "玩", "詣", "諦", "詮", "貼", "賂", "鍵", "頃", "冥", "戚", "嗅", "喩", "訃", "楷", "諧", ]
// let tatoebaSentences = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tatoebaSentencesTranslatedWithId.json')))
// let frequencyList = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'BCCWJ_SUW_LUW_combined', 'term_meta_bank_1.json')))
// frequencyList = frequencyList
//     .filter(item => {
//         let kanjis = item[0].split('').filter(x => hasKanji(x))
//         if(kanjis.length === 0) return false;
//         return kanjis.every(character => ankiKanji.includes(character))
//     })
//     .map(item => [item[0], item[2].frequency, item[2].reading])
//     .filter(item => item[1] < 10000)

// // get matching sentences - need to tokenize
// // frequencyList.map(word => {
// //     let matchingSentences = tatoebaSentences.filter(sentenceObj => {
// //         let match = sentenceObj.jpn.match(word[0])
// //         if(match) return true;
// //         return false;
// //     })
// //     word.push(matchingSentences)
// //     return word
// // });

// // Add definitions
// console.log()
