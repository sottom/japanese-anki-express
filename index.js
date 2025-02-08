const express = require('express');
const axios = require('axios')
const cors = require('cors')
const app = express();
const port = 3000;

// Use CORS middleware
app.use(cors());

app.get('/anki', async (req, res) => {
  const queryParams = req.query;
  console.log('Query Parameters:', queryParams);

  let params;
  if (queryParams.q === "allStudied") {
    params = {
      "query": '"deck:Heisigs RTK 6th Edition [Stories, Stroke Diagrams, Readings]" (is:review OR is:suspended)'
    };

  } else if (queryParams.q === "allFlashcards") {
    params = {
      "query": '"deck:Heisigs RTK 6th Edition [Stories, Stroke Diagrams, Readings]"'
    };
  } else {
    params = {
      // today
      "query": '"deck:Heisigs RTK 6th Edition [Stories, Stroke Diagrams, Readings]" (is:review OR is:suspended) rated:1'
    };

  }

  /////////////////////////////////////////////
  // GET SEEN KANJI
  /////////////////////////////////////////////
  // // GET DECK NAMES
  let action = 'deckNames';
  let version = 6;
  let response;

  action = 'findNotes';
  // await sleep(300);
  response = await axios.post('http://127.0.0.1:8765', JSON.stringify({ action, version, params }));
  // console.log(res.data.result)

  action = 'notesInfo';
  params = {
    "notes": response.data.result
  };
  // await sleep(300);
  let res2 = await axios.post('http://127.0.0.1:8765', JSON.stringify({ action, version, params }));
  // console.log(res.data.result)
  let count = 0;
  let seenKanji = res2.data.result.map(note => {
    return note.fields.kanji.value
  })
  console.log(seenKanji)

  res.json(seenKanji);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
