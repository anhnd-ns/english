const R = require("ramda");
const Table = require("cli-table3");
const colors = require("@colors/colors");
const Word = require("./Word");
const WordDetail = require("./WordDetail");

const getDateString = () => {
  const date = new Date();
  const day = `${date.getDate()}`.padStart(2, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const year = `${date.getUTCFullYear()}`.padStart(4, "0");
  return `${year}${month}${day}`;
};
const getWidth = () => process.stdout.columns;

colors.setTheme({
  silly: "rainbow",
  input: "grey",
  verbose: "cyan",
  prompt: "grey",
  info: "green",
  data: "grey",
  help: "cyan",
  warn: "yellow",
  debug: "blue",
  error: "red",
});

const colorArray = R.curry((color, array) =>
  R.map((item) => R.propOr(item, color, item), array)
);

const getCurrentMinutes = () => {
  const date = new Date();
  return date.getHours() * 24 + date.getMinutes();
};
const chunkString = R.curry((_width, text) => {
  const words = R.map(R.trim, R.split(" ", text));
  const width = _width - 3;
  return R.join(
    "\n",
    R.reduce(
      (acc, cur) => {
        if (!R.last(acc)) return R.append(cur, acc);
        const lastItem = R.last(acc);
        const nextItem = R.concat(R.concat(lastItem, " "), cur);
        if (R.length(nextItem) > width) return R.append(cur, acc);
        return R.append(nextItem, R.init(acc));
      },
      [],
      words
    )
  );
});

const splitBy = (divider, text) =>
  R.filter(
    Boolean,
    R.map(R.trim, R.split(divider, R.unless(R.is(String), R.always(""), text)))
  );

const Definition = (definition, example) => ({
  definition,
  example,
  toRow: (definitionLength, exampleLength) => {
    if (R.isEmpty(example)) return [];
    const _headRow = R.head(example);
    const headRow = [
      {
        rowSpan: R.length(example),
        content: chunkString(definitionLength, definition),
      },
      { content: chunkString(exampleLength, _headRow) },
    ];
    return [
      headRow,
      ...R.map(
        (x) => [{ content: chunkString(exampleLength, x) }],
        R.tail(example)
      ),
    ];
  },
});
Definition.from = (detail) => {
  const divider = "•";
  const examples = splitBy(divider, detail.example);
  return Definition(
    detail.definition,
    R.map(R.concat(R.concat(divider, " ")), examples)
  );
};

const flat = R.reduce(R.concat, []);
const WordRow = (text, detail) => ({
  text,
  detail,
  toRow: (withExample, definitionLength, exampleLength) => {
    if (!withExample) {
      const _rows = R.map(
        (x) => [{ content: chunkString(definitionLength, x.definition) }],
        detail
      );
      if (R.isEmpty(_rows)) {
        return [];
      }
      const _firstRow = R.head(_rows);
      return [
        [{ content: text, rowSpan: _rows.length }, ..._firstRow],
        ...R.tail(_rows),
      ];
    }
    const rows = R.map((x) => x.toRow(definitionLength, exampleLength), detail);
    if (R.isEmpty(rows)) return [];
    const firstRow = R.head(rows);
    const length = R.length(R.flatten(R.pluck("example", detail)));
    return flat([
      [
        [{ content: text, rowSpan: length }, ...R.head(firstRow)],
        ...R.tail(firstRow),
      ],
      ...R.tail(rows),
    ]);
  },
});

WordRow.from = (word) => {
  const pronunciation = R.path(["detail", 0, "pronunciation"], word);
  const text = `${word.text}\n(${word.position})\n${pronunciation}`;
  const defs = R.map(Definition.from, word.detail);
  return WordRow(text, defs);
};

const data2Rows = (data, width, withExample) => {
  const words = R.map(WordRow.from, data);
  const wordLength = R.compose(
    R.add(4),
    (arr) => Math.max(...arr),
    R.map(R.length),
    R.flatten,
    R.map(R.split("\n")),
    R.pluck("text")
  )(words);
  const exampleLength = Math.floor((width - wordLength) * 0.7);
  const definitionLength = width - exampleLength - wordLength - 6;
  const _data = flat(
    R.map(
      (x) =>
        x.toRow(
          withExample,
          withExample ? definitionLength : width - wordLength - 4,
          exampleLength
        ),
      words
    )
  );
  const __widths = withExample
    ? [wordLength, definitionLength, exampleLength]
    : [wordLength, width - wordLength - 4];
  const __data = R.isEmpty(_data)
    ? [Array.from({ length: __widths.length }, (_) => "-")]
    : _data;
  return [R.map(formatNumber(Math.floor(width / 3) - 2), __widths), __data];
};
const formatNumber = (defaultValue) =>
  R.when(
    (num) => !Number.isFinite(Number(num)) || Number.isNaN(num),
    R.always(defaultValue)
  );

async function tableRender(_data, withExample) {
  const width = getWidth();
  const props = withExample
    ? ["text", "definition", "example"]
    : ["text", "definition"];
  const [widths, data] = data2Rows(_data, width, withExample);
  const table = new Table({
    head: R.map((i) => i.cyan, props),
    colWidths: widths,
  });
  table.push(...data);
  return table.toString();
}

const takeUntil = (length, array = [], result = []) => {
  if (R.isEmpty(array)) return result;
  if (R.length(result) === length) return result;
  const [head, ...remain] = array;
  return takeUntil(
    length,
    remain,
    R.includes(head, result) ? result : R.append(head, result)
  );
};

const getIndexOf = (text, word, current = null, res = []) => {
  if (current === -1) return res;
  if (R.isEmpty(text) || R.isEmpty(word)) return res;
  const head = R.head(text);
  const relativeCurrent = R.isNil(current) ? 0 : current + 1;
  const checkingWord = R.slice(relativeCurrent, Infinity, word);
  const currentIndex = relativeCurrent + R.indexOf(head, checkingWord);
  if (!R.includes(head, checkingWord)) return res;
  return getIndexOf(
    R.tail(text),
    word,
    currentIndex,
    R.append(currentIndex, res)
  );
};
const isIncreaseArr = (arr) => {
  return (
    !R.includes(-1, arr) &&
    !R.equals(
      -1,
      R.reduce((acc, cur) => (cur > acc ? cur : -1), -1, arr)
    )
  );
};
const checkLike = R.curry((text, word) => {
  if (R.isEmpty(text) || R.isEmpty(word)) return "";
  const idxs = getIndexOf(text, word);
  if (R.length(idxs) !== R.length(text)) return "";
  if (!isIncreaseArr(idxs)) return "";
  return word;
});

const checkIncludesCharactor = R.curry(
  (text, data, length = 0, result = []) => {
    if (R.length(result) === length) return result;
    if (R.isEmpty(data)) return result;
    const isMatched = checkLike(text, R.head(data).text);
    if (isMatched)
      return checkIncludesCharactor(
        text,
        R.tail(data),
        length - 1,
        R.append(isMatched, result)
      );
    return checkIncludesCharactor(text, R.tail(data), length, result);
  }
);

const resultTemplate = (data) => {
  const title = `Found ${data.length} relative items`.blue;
  const rows = R.map(R.concat("- ".green), colorArray("yellow", data));
  return R.join("\n", R.prepend(title, rows));
};

const createDictionary = () => {
  const self = {
    data: [],
    db: null,
  };
  const search = async (text) => {
    const { isSuggest, data: result } = await Word.search(self.db, text);
    if (isSuggest && R.isEmpty(result)) return "No word founded".red;
    if (isSuggest) return resultTemplate(result);
    return tableRender(await WordDetail.collect(self.db, result), true);
  };

  const getToday = async (length) => {
    const words = await Word.random(self.db, getDateString(), length);
    const result = await WordDetail.collect(self.db, words);
    return result;
  };

  const learn = async (length) => {
    const words = await getToday(length);
    return tableRender(words);
  };

  const getOne = async (prop, length) => {
    const words = await getToday(length);
    const defs = R.flatten(
      R.map((x) => R.map(R.mergeLeft(x), x.detail), words)
    );
    const idx = getCurrentMinutes() % defs.length;
    const word = defs[idx];
    const text = `${word.text} ${word.pronunciation} (${word.position})`;
    const resObj = {
      word: text,
      definition: word.definition,
      example: word.example,
    };
    if (R.isEmpty(defs)) return "<NONE>";
    if (R.equals("all", prop))
      return R.join(
        " ",
        R.map(
          (x) =>
            R.concat(
              "|> ",
              R.when(R.either(R.isNil, R.isEmpty), R.always("<NONE>"), x)
            ).green,
          R.props(["word", "definition", "example"], resObj)
        )
      );
    return R.propOr("<NONE>", prop, resObj);
  };

  const setDB = async (db) => {
    self.db = db;
  };

  return {
    setDB,
    search,
    learn,
    getOne,
  };
};

module.exports = createDictionary();
