#!/usr/bin/env node
require("./paths");
const WordDetail = require("./WordDetail");
const Idiom = require("./Idiom");
const Word = require("./Word");
const __db = require("./db-provider");
const _db = require("./db");
const crawler = require("./main");
const R = require("ramda");
const Dictionary = require("./dictionary");
const renderer = require("./renderer");
const migrate = require("./migrate");

const WORD_COUNT = 50;
const tryLoad = async (_db) => {
  try {
    const data2 = await Word.load(_db);
    const data = await WordDetail.load(_db);
    const data1 = await Idiom.load(_db);
    console.log("Length word: ", data2.length);
    console.log("Length word detail: ", R.uniqBy(R.prop("word"), data).length);
    console.log("Length idiom: ", R.uniqBy(R.prop("word"), data1).length);
  } catch (e) {
    return tryLoad(_db);
  }
};

const main = (cmdName, text) => {
  const props = ["word", "definition", "example"];
  if (R.includes(cmdName, props))
    return __db()
      .then(Dictionary.setDB)
      .then(() => Dictionary.getOne(cmdName, WORD_COUNT))
      .then((_text) => renderer(_text, text))
      .then(console.log);

  if (R.equals("test", cmdName)) {
    return __db().then(tryLoad);
  }
  if (R.equals("migrate", cmdName)) {
    return __db().then(migrate);
  }
  if (R.equals("search", cmdName)) {
    return __db()
      .then(Dictionary.setDB)
      .then(() => Dictionary.search(text))
      .then(console.log);
  }
  if (R.equals("learn", cmdName)) {
    return __db()
      .then(Dictionary.setDB)
      .then(() => Dictionary.learn(WORD_COUNT))
      .then(console.log);
  }
  if (R.equals("fix", cmdName)) {
    return __db()
      .then((___db) => crawler(___db, text, true))
      .then(() => console.log("DONE"));
  }
  return __db()
    .then(crawler)
    .then(() => console.log("DONE"));
};
main(process.argv[2], process.argv[3], process.argv[4]);
