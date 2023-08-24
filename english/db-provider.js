const { AsyncDatabase } = require("promised-sqlite3");
const paths = require("./paths");

const createTable = async (_db) => {
  const createSQLs = [
    'CREATE TABLE IF NOT EXISTS "detail" ( "id"  TEXT NOT NULL UNIQUE, "definition"  TEXT, "example"  TEXT, "pronunciation"  TEXT, "word"  TEXT, PRIMARY KEY("id"))',
    'CREATE TABLE IF NOT EXISTS "idiom" ( "id" TEXT NOT NULL UNIQUE, "example" TEXT, "word" TEXT, "text" TEXT, "definition" TEXT, PRIMARY KEY("id") )',
    'CREATE TABLE IF NOT EXISTS "word" ( "id" TEXT NOT NULL UNIQUE, "text" TEXT NOT NULL, "link" TEXT, "CEFRLevel" TEXT, "position" TEXT, "ox3000" INTEGER, "ox5000" INTEGER, "suggest" TEXT, PRIMARY KEY("id") )',
  ];
  for (var i = 0; i < createSQLs.length; i++) {
    await _db.run(createSQLs[i]);
  }
};

async function getProvider() {
  const db = await AsyncDatabase.open(paths.sqlDB);
  await createTable(db);
  return db;
}

module.exports = getProvider;
