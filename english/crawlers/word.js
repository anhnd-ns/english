const jsdom = require("../cache");
const R = require("ramda");

const links = {
  ox5000:
    "https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000",
  opal: "https://www.oxfordlearnersdictionaries.com/wordlists/opal",
  phraseList:
    "https://www.oxfordlearnersdictionaries.com/wordlists/oxford-phrase-list",
};
const host = "https://www.oxfordlearnersdictionaries.com";
const trimText = R.compose(R.trim, R.unless(R.is(String), R.always("")));

const fromElement = ($element) => {
  const text = $element.dataset.hw;
  const ox3000 = $element.dataset.ox3000;
  const ox5000 = $element.dataset.ox5000;
  const CEFRLevel = ox3000 || ox5000;
  const link = $element.querySelector("a").href;
  const position = $element.querySelector("span.pos").textContent;
  const id = R.join("-", [text, position]);

  return {
    id,
    position: trimText(position),
    ox3000: Boolean(ox3000),
    ox5000: Boolean(ox5000),
    CEFRLevel,
    link: host + link,
    text: trimText(text),
  };
};

const crawl = async () => {
  const document = await jsdom(links.ox5000).then((dom) => dom.window.document);
  const elements = document.querySelectorAll("#wordlistsContentPanel > ul li");
  return R.map(fromElement, elements);
};

module.exports = crawl;
