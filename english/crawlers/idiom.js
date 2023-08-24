const R = require("ramda");

const getInnerText = ($element, querySelector) => {
  if (!querySelector)
    return $element ? $element.innerText || $element.textContent : "";
  const element = $element.querySelector(querySelector);
  return element ? element.innerText || element.textContent : "";
};

const fromSense = ($senseElement) => {
  const definition = $senseElement.querySelector(".def");
  const examples = $senseElement.querySelectorAll("ul.examples li");
  const example = Array.from(examples)
    .map((x) => `• ${getInnerText(x)}`)
    .join(" ");
  return {
    id: $senseElement.id,
    definition: getInnerText(definition),
    example: example || "<NONE>",
  };
};

const fromElement = (word) => (ele) => {
  const idiomItem = ele.querySelector(".idm");
  const senses = Array.from(ele.querySelectorAll(".sense"));
  return R.map(
    (i) => ({
      word,
      text: getInnerText(idiomItem),
      id: idiomItem.id,
      ...fromSense(i),
    }),
    senses
  );
};
const fromWord = (document, wordId) => {
  const idiomsElement = document.querySelector(".idioms");
  if (!idiomsElement) return [];
  return R.flatten(
    Array.from(document.querySelectorAll(".idioms > .idm-g")).map(
      fromElement(wordId)
    )
  );
};

module.exports = fromWord;
