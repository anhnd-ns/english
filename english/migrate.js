const R = require("ramda");
const Word = require("./Word");
const WordDetail = require("./WordDetail");
const Idiom = require("./Idiom");
const db = require("./db");

async function run(curDb) {
  try {
    const words = R.map(Word.of, await db.getObjectDefault('/word', []))
    const detail = R.map(WordDetail.of, await db.getObjectDefault('/detail', []))
    const idioms = R.map(Idiom.of, await db.getObjectDefault('/idiom', []))
    await Word.insert(curDb, words)
    await WordDetail.insert(curDb, detail)
    await Idiom.insert(curDb, idioms)
  } catch (e) {
    console.log(e);
  }
}
module.exports = run
