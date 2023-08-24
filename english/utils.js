const R = require("ramda");

const chainPromise = (fn, list) => {
  const onItem = async (result, cur) => {
    const _result = await result;
    const itemResult = await fn(cur);
    return R.append(itemResult, _result);
  };
  return R.reduce(onItem, Promise.resolve([]), list);
};

module.exports = { chainPromise };
