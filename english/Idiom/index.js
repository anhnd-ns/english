const R = require("ramda");

const Idiom = (id, text, example, definition, word) => ({
  id,
  text,
  example,
  definition,
  word,
});

Idiom.keys = ["id", "text", "example", "definition", "word"];
Idiom.insert = async (db, words) => {
  const sql = `INSERT OR IGNORE INTO idiom ( id, text, example, definition, word) VALUES (?, ?, ?, ?, ?)`;
  const stmt = await db.prepare(sql);
  for (var i = 0; i < words.length; i++) {
    await stmt.run(...R.props(Idiom.keys, R.pick(Idiom.keys, words[i])));
  }
  await stmt.finalize();
};
Idiom.of = (obj) =>
  Idiom(
    R.propOr("", "id", obj),
    R.propOr("", "text", obj),
    R.propOr("", "example", obj),
    R.propOr("", "definition", obj),
    R.propOr("", "word", obj)
  );

Idiom.load = (db) => {
  return db.all("select * from idiom");
};
module.exports = Idiom;
