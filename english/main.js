const Word = require("./Word");
const Idiom = require("./Idiom");
const WordDetail = require("./WordDetail");
const R = require("ramda");
const { chainPromise } = require("./utils");

const crawlChunk = async (db, words) => {
  console.log(
    `Start crawl: ${R.path([0, "text"], words)} + (${words.length} items)`
  );
  const errors = await WordDetail.crawl(db, words);
  console.log(
    R.join(
      "\n",
      R.map((e) => e.red, errors)
    )
  );
  console.log(
    `Done crawl: ${R.path([0, "text"], words)} + (${words.length} items)`
  );
};

const continuousChunkCrawl = async (db) => {
  const words = await Word.load(db);
  const details = await WordDetail.load(db);
  const idioms = await Idiom.load(db);
  const ids = R.uniq(R.pluck("word", R.concat(details, idioms)));
  const nonFetch = R.differenceWith(
    (word, id) => R.propEq(id, "id", word),
    words,
    ids
  );

  console.log(`Total: (${nonFetch.length} items)`);
  await chainPromise(
    (word) => crawlChunk(db, word),
    R.splitEvery(15, nonFetch)
  );
};

const crawlByText = async (db, texts) => {
  const words = await Word.load(db);
  const nonFetch = R.filter((word) => R.includes(word.text, texts), words);
  await chainPromise(
    (word) => crawlChunk(db, word),
    R.splitEvery(15, nonFetch)
  );
};
const checkEmpty = async (db) => {
  const words = await Word.load(db);
  const details = await WordDetail.load(db);
  const idioms = await Idiom.load(db);
  const emptyDetails = R.uniq(
    R.pluck(
      "word",
      R.filter(R.where({ definition: R.either(R.isNil, R.isEmpty) }), details)
    )
  );
  const nonFetch = R.innerJoin(
    (word, id) => R.whereEq({ id }, word),
    words,
    emptyDetails
  );
  const ids = R.uniq(R.pluck("word", R.concat(details, idioms)));
  const nonFetch1 = R.differenceWith(
    (word, id) => R.propEq(id, "id", word),
    words,
    ids
  );
  const nonFetch2 = R.uniqBy(R.prop("id"), R.concat(nonFetch, nonFetch1));
  console.log(`Total: (${nonFetch2.length} items)`);
  await chainPromise(
    (word) => crawlChunk(db, word),
    R.splitEvery(15, nonFetch2)
  );
};
const intoArray = (value) => [value];
const run = async (_db, text, needFix) => {
  await Word.crawl(_db);
  if (needFix && !text) await checkEmpty(_db);
  else if (needFix && text)
    await crawlByText(
      _db,
      R.ifElse(
        R.includes(","),
        R.compose(R.filter(Boolean, R.split(","))),
        intoArray
      )(text)
    );
  else await continuousChunkCrawl(_db);
};

module.exports = run;
