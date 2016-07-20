var Promise = require("es6-promise").Promise;

/*
window.name will prevent clearing the data as long as the tab remains open, even in Chrome.
*/
var tabStorage = window.name;
try {
  tabStorage = JSON.parse(tabStorage);
} catch (_) {
  tabStorage = {};
}
var tab = function(key, value) {
  if (value) {
    tabStorage[key] = value;
    window.name = JSON.stringify(tabStorage);
    return Promise.resolve();
  } else {
    return Promise.resolve(tabStorage[key]);
  }
};
tab.clear = () => window.name = "";

var cookies = {};
var pairs = document.cookie.split(";");
pairs.forEach(function(pair) {
  var split = pair.split("=");
  var value = decodeURI(split[1]);
  try {
    value = JSON.parse(value);
  } catch(_) { }
  cookies[split[0].trim()] = value;
});

var cookie = function(key, value) {
  if (value) {
    value = encodeURI(JSON.stringify(value));
    document.cookie = `${key}=${value}; path=/; expires=Fri, 31 Dec 9999 23:59:59 GMT`;
    cookies[key] = value;
    return Promise.resolve();
  } else {
    return Promise.resolve(cookies[key]);
  }
};
cookie.clear = (key) => document.cookie = `${key}=;path=/;expires=Thu, 1 Jan 1970 00:00:00 GMT`;

var Database = require("./idb");
var db = new Database("evercookie", 1, function() {
  db.createStore("cookies", {
    key: "key",
    autoincrement: false
  });
});

var idb = function(key, value) {
  if (value) {
    return db.put("cookies", { key: key, value: value});
  } else {
    return db.get("cookies", key).then(result => result ? result.value : null);
  }
};
idb.clear = () => db.clear("cookies");

var localS = function(key, value) {
  if (value) {
    window.localStorage.setItem(key, encodeURI(JSON.stringify(value)));
    return Promise.resolve();
  } else {
    var result = decodeURI(window.localStorage.getItem(key));
    try {
      result = JSON.parse(result);
    } catch(_) {}
    return Promise.resolve(result);
  }
};
localS.clear = () => window.localStorage.clear();

var methods = [tab, cookie, idb, localS];

var facade = {
  access: function(key, value) {
    if (value) {
      methods.forEach(m => m(key, value));
      return Promise.resolve();
    }
    return new Promise(function(ok, fail) {
      var promises = methods.map(m => m(key));
      //don't use Promise.all(), because IDB may crash
      var i = 0;
      var found = function(value, at) {
        //persist elsewhere once you find it in one place
        methods.forEach(function(m, i) {
          if (i != at) m(key, value);
        });
        //return back out through the main promise
        ok(value);
      };
      var skip = function() {
        if (!promises[++i]) return ok(null);
        promises[i].then(check, skip);
      };
      var check = function(value) {
        if (value) return found(value, i);
        skip();
      };
      promises[0].then(check, skip);
    });
  },
  wipe: function(key) {
    methods.forEach(m => m.clear(key));
  }
};

module.exports = facade;