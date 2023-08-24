const R = require("ramda");
const Idiom = require("../Idiom");
const crawler = require("../crawlers");

const WordDetail = (id, word, pronunciation, example, definition) => ({
  id,
  word,
  pronunciation,
  example,
  definition,
});

WordDetail.of = (obj) =>
  WordDetail(
    R.propOr("", "id", obj),
    R.propOr("", "word", obj),
    R.propOr("", "pronunciation", obj),
    R.propOr("", "example", obj),
    R.propOr("", "definition", obj)
  );

WordDetail.load = (db) => {
  return db.all("select * from detail");
};
WordDetail.keys = ["id", "word", "pronunciation", "example", "definition"];
WordDetail.insert = async (db, words) => {
  const sql = `INSERT OR IGNORE INTO detail ( id, word, pronunciation, example, definition) VALUES (?, ?, ?, ?, ?)`;
  const stmt = await db.prepare(sql);
  for (var i = 0; i < words.length; i++) {
    await stmt.run(
      ...R.props(WordDetail.keys, R.pick(WordDetail.keys, words[i]))
    );
  }
  await stmt.finalize();
};
WordDetail.collect = async (db, words) => {
  if (R.isEmpty(words)) return [];
  const conditions = R.join(
    " OR ",
    Array.from({ length: words.length }, R.always("word=? "))
  );
  const result = await db.all(
    `select * from detail where ${conditions}`,
    R.pluck("id", words)
  );

  return R.map(
    (word) =>
      R.mergeLeft(
        {
          detail: R.map(
            WordDetail.of,
            R.filter(R.whereEq({ word: word.id }), result)
          ),
        },
        word
      ),
    words
  );
};

WordDetail.crawl = async (db, words) => {
  const { details, idioms, error } = await crawler.detail(words);
  const _words = R.map(WordDetail.of, details);
  const _idioms = R.map(Idiom.of, idioms);
  await WordDetail.insert(db, _words);
  await Idiom.insert(db, _idioms);
  return error;
};
module.exports = WordDetail;
