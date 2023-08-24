const fs = require("fs");
const path = require("path");
const cwd = process.cwd();
const HOME = process.env.HOME;
const dirName = ".english";

const paths = {
  cwd,
  HOME,
  configDir: path.join(HOME, dirName),
  caches: path.join(HOME, dirName, "__caches__"),
  readDB: path.join(HOME, dirName, "dictionary.json"),
  rawDB: path.join(HOME, dirName, "english.json"),
  sqlDB: path.join(HOME, dirName, "sql-db"),
};

if (!fs.existsSync(paths.configDir)) fs.mkdirSync(paths.configDir);
if (!fs.existsSync(paths.caches)) fs.mkdirSync(paths.caches);
module.exports = paths;
