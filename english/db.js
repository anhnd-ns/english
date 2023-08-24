const { JsonDB, Config } = require("node-json-db");
const paths = require("./paths");

const db = new JsonDB(new Config(paths.rawDB, true, false, "/"));

module.exports = db;
