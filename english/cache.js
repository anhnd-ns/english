const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");
const R = require("ramda");
const paths = require("./paths");

const cacheDir = paths.caches;

function guid() {
  let d = new Date().getTime();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const CacheKey = (key, value) => ({
  key,
  value,
  toString: () => `${key}|${value}`,
});
CacheKey.fromString = (str) => {
  const [key, value] = R.split("|", str);
  return CacheKey(key, value);
};
CacheKey.create = (key) => {
  return CacheKey(key, guid());
};
const CacheDetail = (id, url, html) => ({
  id,
  url,
  html,
  write: () => {
    const filePath = path.join(cacheDir, `${id}`);
    const content = `${url}\n${html}`;
    fs.writeFileSync(filePath, content);
  },
  toString: () => `${url}\n${html}`,
  load: () => {
    const filePath = path.join(cacheDir, `${id}`);
    if (!fs.existsSync(filePath)) return CacheDetail(id, url, null);
    const content = fs.readFileSync(filePath).toString();
    return _fromString(id, content);
  },
});
CacheDetail.from = (id, url, html) => {
  return CacheDetail(id, url, html);
};
const _fromString = (id, str) => {
  const idx = str.indexOf("\n");
  const url = str.slice(0, idx);
  const html = str.slice(idx + 1, str.length);
  return CacheDetail(id, url, html);
};
const KeyMap = (data) => ({
  data,
  get: (key) => R.find(R.whereEq({ key }), data) || null,
  set: (cacheKey) =>
    KeyMap(
      R.append(cacheKey, R.reject(R.whereEq({ key: cacheKey.key }), data))
    ),
  write: () => {
    writeKeyMap(data);
    return KeyMap(data);
  },
  toString: () =>
    R.join(
      "\n",
      R.map((item) => item.toString(), data)
    ),
});
KeyMap.from = (data) => KeyMap(data);
const writeKeyMap = (data) => {
  const keymap = KeyMap.from(data);
  const keymapPath = getCacheKeyMapPath();
  fs.writeFileSync(keymapPath, keymap);
};
KeyMap.load = () => {
  const keymapPath = getCacheKeyMapPath();
  const currentKeyMap = fs.readFileSync(keymapPath).toString();
  return KeyMap(
    R.compose(
      R.map(CacheKey.fromString),
      R.reject(R.isEmpty),
      R.map(R.ifElse(R.is(String), R.trim, R.always(""))),
      R.split("\n")
    )(currentKeyMap)
  );
};

const getCacheKeyMapPath = () => {
  const keymapPath = path.join(cacheDir, "keymap");
  if (!fs.existsSync(keymapPath)) fs.writeFileSync(keymapPath, "");
  return keymapPath;
};
const createCache = (url, detail) => {
  const keymap = KeyMap.load();
  const cacheKey = CacheKey.create(url);
  keymap.set(cacheKey).write();
  CacheDetail.from(cacheKey.value, url, detail).write();
};
const getCache = (url) => {
  const keymap = KeyMap.load();
  const detail = keymap.get(url);
  if (!detail) return null;
  return CacheDetail(detail.value, detail.key).load();
};
const jsdom = async (url) => {
  const content = getCache(url);
  if (content) return new JSDOM(content.html);
  const dom = await JSDOM.fromURL(url);
  const domContent = dom.serialize();
  createCache(url, domContent);
  return dom;
};

module.exports = jsdom;
