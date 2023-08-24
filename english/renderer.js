function floating(txt, length) {
  const timestamp = Math.floor(Date.now() / 1000);
  if (txt.length <= length) {
    return txt.padEnd(length, " ");
  }
  const position = timestamp % txt.length;
  const prefix = txt.slice(position);
  const dbText = prefix + " -> " + txt;
  return dbText.slice(0, length);
}
function main(txt, length) {
  if (length) return floating(txt, length);
  return txt;
}
module.exports = main;
