var Promise = require("es6-promise").Promise;

var Database = function(name, version, upgrade) {
  var self = this;
  this.ready_ = new Promise(function(ok, fail) {
   var req = window.indexedDB.open(name, version);
   req.onupgradeneeded = function(db) {
     self.db_ = req.result;
     if (upgrade) upgrade();
   };
   req.onsuccess = function(db) {
     self.db_ = req.result;
     ok();
   };
   req.onerror = fail;
  });
};
Database.prototype = {
  ready_: null,
  db_: null,
  createStore: function(name, schema) {
    var self = this;
    schema = schema || {};
    return new Promise(function(ok) {
      var store = self.db_.createObjectStore(name, { keyPath: schema.key, autoIncrement: schema.autoIncrement });
      if (schema.index) {
        for (var key in schema.index) {
          var options = schema.index[key] || {};
          store.createIndex(key, key, options);
        }
      }
    });
  },
  transaction_: function(stores, write) {
    if (write) {
      return this.db_.transaction(stores, "readwrite");
    }
    return this.db_.transaction(stores);
  },
  put: function(store, value) {
    var self = this;
    return new Promise(function(ok, fail) {
      self.ready_.then(function() {
        var request = self.transaction_(store, true);
        request.objectStore(store).put(value);
        request.oncomplete = ok
        request.onerror = fail
      });
    });
  },
  get: function(table, index, key) {
   if (!key) {
     key = index;
     index = null;
   }
   var self = this;
   return new Promise(function(ok, fail) {
    self.ready_.then(function() {
      var transaction = self.transaction_(table);
      var store = transaction.objectStore(table);
      var request;
      if (index) {
        request = store.index(index).get(key);
      } else {
        request = store.get(key);
      }
      transaction.oncomplete = function() {
        ok(request.result);
      };
      request.onerror = fail;
    });
   });
  },
  getAll: function(table, bounds) {
   var self = this;
   return new Promise(function(ok, fail) {
    self.ready_.then(function() {
      var transaction = self.transaction_(table);
      var store = transaction.objectStore(table);
      var items = {};
      var req = store.openCursor();
      req.onsuccess = function() {
        var cursor = req.result;
        if (cursor) {
          var item = cursor.value;
          var key = cursor.key;
          items[key] = item;
          cursor.continue();
        } else {
          ok(items);
        }
      };
    });
   });
  },
  clear: function(table) {
    this.transaction_(table, true).objectStore(table).clear();
  }
};

module.exports = Database;