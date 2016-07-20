var storage = require("./evercookie");
var noop = function() {};

var config = {
  page: null,
  key: null,
  cache: null
};

var get = function(c) {
  if (!config.page || !config.key) throw "Memory is not configured.";
  if (!config.cache) {
    var pull = storage.access(config.page + config.key);
    config.cache = pull.then(value => {
      return Promise.resolve(value || {});
    });
  }
  config.cache.then(c);
};

var set = function(value, c) {
  storage.access(config.page + config.key, value).then(c || noop);
};

module.exports = {
  configure(page, key) {
    config.page = page;
    config.key = key;
  },
  flag(item) {
    get(data => {
      if (!data) data = {};
      data[item] = true;
      set(data);
    });
  },
  remember: get
};

window.forget = () => storage.wipe(config.page + config.key);