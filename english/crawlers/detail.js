const jsdom = require("../cache");
const R = require("ramda");
const idiomCrawler = require("./idiom");

const findDefNode = ($element) => {
  const isDefNode = (node) => R.includes("def", node.className || "");
  const isSenseTopDef = (node) => {
    const isSenseTop = R.includes("sensetop", node.className || "");
    const defNode = node.querySelector(".def");
    return Boolean(isSenseTop) && Boolean(defNode);
  };
  const childNodes = Array.from($element.childNodes);
  const childDef = R.find(isDefNode, childNodes);
  if (childDef) return childDef;
  const sensetopNode = R.find(isSenseTopDef, childNodes);
  if (sensetopNode) {
    return sensetopNode.querySelector(".def");
  }
};
const findexampleNode = ($element) => {
  return R.find(
    (node) => R.includes("examples", node.className || ""),
    Array.from($element.childNodes)
  );
};

const fromSense = ($senseElement) => {
  const definition = findDefNode($senseElement);
  const examplesNode = findexampleNode($senseElement);
  const examples = examplesNode ? examplesNode.querySelectorAll("li") : [];
  const example = Array.from(examples)
    .map((x) => `• ${getInnerText(x)}`)
    .join(" ");
  return {
    id: $senseElement.id,
    definition: getInnerText(definition),
    example: example || "<NONE>",
  };
};

const getSenses = ($element) => {
  const isSingleSense = $element.querySelector(".entry > .sense_single");
  const isMultiSense = $element.querySelector(".entry > .senses_multiple");
  if (isSingleSense)
    return Array.from(
      $element.querySelectorAll(".entry > .sense_single li.sense")
    );
  if (isMultiSense)
    return Array.from(
      $element.querySelectorAll(".entry > .senses_multiple li.sense")
    );
  return [];
};
const trimText = R.compose(R.trim, R.unless(R.is(String), R.always("")));
const getInnerText = ($element, querySelector) => {
  if (!$element) return "";
  if (!querySelector)
    return trimText($element ? $element.innerText || $element.textContent : "");
  const element = $element.querySelector(querySelector);
  return trimText(element ? element.innerText || element.textContent : "");
};

const getWordText = (word) => `${word.text} (${word.position})`;
const crawlWord = async (word) => {
  try {
    const document = await jsdom(word.link).then((dom) => dom.window.document);
    const pronunciation = getInnerText(
      document,
      ".top-container span.phonetics > div.phons_n_am"
    );
    const senses = getSenses(document).map(fromSense);
    const words = R.map(R.mergeLeft({ pronunciation, word: word.id }), senses);
    const idioms = idiomCrawler(document, word.id);
    if (R.isEmpty(idioms) && R.isEmpty(words))
      return {
        words: [
          {
            pronunciation,
            word: word.id,
            id: R.concat(word.text, "_1"),
            definition: "",
            example: "",
          },
        ],
        idioms: [],
      };
    return { words, idioms };
  } catch (e) {
    return { error: getWordText(word), words: [], idioms: [] };
  }
};

const crawler = async (_words) => {
  try {
    const result = await Promise.all(R.map(crawlWord, _words));
    const words = R.flatten(R.pluck("words", result));
    const idioms = R.flatten(R.pluck("idioms", result));
    return { details: words, idioms, error: R.filter(Boolean, R.flatten(R.pluck("error", result))) };
  } catch (e) {
    console.log(e);
  }
};

module.exports = crawler;
