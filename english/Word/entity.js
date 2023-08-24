const R = require("ramda");
const crawler = require("../crawlers");

const Word = (
  id,
  text,
  link,
  ox3000,
  ox5000,
  CEFRLevel,
  position,
  suggest
) => ({
  id,
  text,
  link,
  ox3000,
  ox5000,
  CEFRLevel,
  position,
  suggest,
});

const _of = (obj) =>
  Word(
    R.propOr("", "id", obj),
    R.propOr("", "text", obj),
    R.propOr("", "link", obj),
    R.propOr("", "ox3000", obj),
    R.propOr("", "ox5000", obj),
    R.propOr("", "CEFRLevel", obj),
    R.propOr("", "position", obj),
    R.propOr(null, "suggest", obj)
  );
Word.of = _of;

Word.crawl = async (db) => {
  const _words = await crawler.word();
  const words = R.map(Word.of, _words);
  await Word.insert(db, words);
};
Word.keys = [
  "id",
  "text",
  "link",
  "ox3000",
  "ox5000",
  "CEFRLevel",
  "position",
  "suggest",
];

Word.load = async (db) => {
  const sql = `SELECT * from word`;
  const rows = await db.all(sql, []);
  return R.map(Word.of, rows);
};

Word.create = async (db, obj) => {
  const sql = `
  INSERT OR IGNORE INTO word (
    id,
    text,
    link,
    ox3000,
    ox5000,
    CEFRLevel,
    position,
    suggest
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  await db.run(sql, R.props(Word.keys, R.pick(Word.keys, obj)));
};
Word.insert = async (db, objs) => {
  const sql = `
    INSERT OR IGNORE INTO word (
      id,
      text,
      link,
      ox3000,
      ox5000,
      CEFRLevel,
      position,
      suggest
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const stmt = await db.prepare(sql);
  for (var i = 0; i < objs.length; i++) {
    await stmt.run(...R.props(Word.keys, R.pick(Word.keys, objs[i])));
  }
  await stmt.finalize();
};

Word.random = async (db, timestamp, length) => {
  const sql = `select * from word where suggest=?`;
  const todayWords = await db.all(sql, [timestamp]);
  if (!R.isEmpty(todayWords)) return todayWords;
  const words = await db.all(
    "select * from word where suggest IS NULL order by RANDOM() limit ?",
    [length]
  );
  const statement = await db.prepare("UPDATE word SET suggest=? WHERE id = ?");
  for (var i = 0; i < words.length; i++) {
    await statement.run(timestamp, words[i].id);
  }
  await statement.finalize();
  return words;
};
Word.search = async (db, text) => {
  const words = await db.all("select * from word where text=?", [text]);
  if (!R.isEmpty(words)) return { isSuggest: false, data: words };
  const _words = await db.all("select * from word where text like ? limit 10", [
    `%${text}%`,
  ]);
  return { isSuggest: true, data: R.pluck("text", _words) };
};

module.exports = Word;
