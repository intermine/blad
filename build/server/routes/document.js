// Generated by CoffeeScript 1.6.3
(function() {
  var domain, mongodb, urlib, _;

  urlib = require('url');

  mongodb = require('mongodb');

  domain = require('domain');

  _ = require('underscore')._;

  module.exports = function(_arg) {
    var app, blad, editSave, log;
    app = _arg.app, log = _arg.log, blad = _arg.blad;
    editSave = function() {
      var cb, doc,
        _this = this;
      doc = this.req.body;
      if (doc._id != null) {
        log.info("Edit document " + doc._id);
        doc._id = mongodb.ObjectID.createFromHexString(doc._id);
        cb = function() {
          return _this.res.writeHead(200, {
            "content-type": "application/json"
          });
        };
      } else {
        log.info('Create new document');
        cb = function() {
          return _this.res.writeHead(201, {
            "content-type": "application/json"
          });
        };
      }
      return blad.save(doc, function(err, reply) {
        if (err) {
          log.error('I am different...');
          _this.res.writeHead(400, {
            "content-type": "application/json"
          });
          _this.res.write(JSON.stringify(reply));
          return _this.res.end();
        } else {
          if (doc["public"]) {
            log.info('Mapping url ' + reply.underline);
            app.router.path(reply, blad.get);
          }
          return app.db(function(collection) {
            return collection.findOne({
              'url': reply
            }, function(err, doc) {
              if (err) {
                throw err;
              }
              cb();
              _this.res.write(JSON.stringify(doc));
              return _this.res.end();
            });
          });
        }
      });
    };
    blad.save = function(doc, cb) {
      var e, m;
      if (doc.url[0] !== '/') {
        doc.url = '/' + doc.url;
      }
      if (doc.url.length > 1 && doc.url.slice(-1) === '/') {
        doc.url = doc.url.slice(0, -1);
      }
      if (doc.url.match(new RegExp("^/admin|^/api|^/auth|^/sitemap.xml", 'i')) != null) {
        return cb(true, {
          'url': 'Is in use by core application'
        });
      } else {
        try {
          decodeURIComponent(doc.url);
          m = doc.url.match(new RegExp(/^\/(\S*)$/));
        } catch (_error) {
          e = _error;
        }
        if (!m) {
          return cb(true, {
            'url': 'Does that look valid to you?'
          });
        } else {
          return app.db(function(collection) {
            var _this = this;
            if (doc["public"] != null) {
              switch (doc["public"]) {
                case 'true':
                  doc["public"] = true;
                  break;
                case 'false':
                  doc["public"] = false;
              }
            }
            doc.modified = (new Date()).toJSON();
            if (doc._id != null) {
              return collection.find({
                '$or': [
                  {
                    'url': doc.url
                  }, {
                    '_id': doc._id
                  }
                ]
              }).toArray(function(err, docs) {
                var old, _id;
                if (err) {
                  throw err;
                }
                if (docs.length !== 1) {
                  return cb(true, {
                    'url': 'Is in use already'
                  });
                } else {
                  old = docs.pop();
                  if (old["public"]) {
                    blad.unmap(old.url);
                  }
                  _id = doc._id;
                  delete doc._id;
                  return collection.update({
                    '_id': _id
                  }, {
                    '$set': doc
                  }, {
                    'safe': true
                  }, function(err) {
                    if (err) {
                      throw err;
                    }
                    return cb(false, doc.url);
                  });
                }
              });
            } else {
              return collection.find({
                'url': doc.url
              }).toArray(function(err, docs) {
                if (err) {
                  throw err;
                }
                if (docs.length !== 0) {
                  return cb(true, {
                    'url': 'Is in use already'
                  });
                } else {
                  return collection.insert(doc, {
                    'safe': true
                  }, function(err, records) {
                    if (err) {
                      throw err;
                    }
                    return cb(false, records[0].url);
                  });
                }
              });
            }
          });
        }
      }
    };
    blad.get = function() {
      return this.get(function() {
        var _this = this;
        return app.db(function(collection) {
          var url;
          url = urlib.parse(_this.req.url, true).pathname.toLowerCase();
          return collection.find({
            'url': new RegExp('^' + url)
          }, {
            'sort': 'url'
          }).toArray(function(err, docs) {
            var d, doom, record, t;
            if (err) {
              throw err;
            }
            if (!(record = docs[0])) {
              throw 'Bad request URL, need to get a pathname only';
            }
            if (docs.length > 1) {
              record._children = (function() {
                var _i, _len, _ref, _results;
                _ref = docs.slice(1, docs.length);
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  d = _ref[_i];
                  _results.push(d);
                }
                return _results;
              })();
            }
            log.debug('Render url ' + (record.url || record._id).underline);
            if (blad.types[record.type]) {
              doom = domain.create();
              doom.on('error', function(err) {
                var t;
                try {
                  log.error(t = "Error occurred, sorry: " + err);
                  _this.res.writeHead(500);
                  _this.res.end(t);
                  return _this.res.on('close', function() {
                    return doom.dispose();
                  });
                } catch (_error) {
                  err = _error;
                  return doom.dispose();
                }
              });
              return doom.run(function() {
                var presenter;
                presenter = new blad.types[record.type](record, app);
                return presenter.render(function(context, template) {
                  var accept, key, part, value, _i, _len, _ref, _ref1, _ref2;
                  if (template == null) {
                    template = true;
                  }
                  accept = (_ref = _this.req) != null ? (_ref1 = _ref.headers) != null ? _ref1.accept : void 0 : void 0;
                  if (accept) {
                    _ref2 = accept.split(';');
                    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
                      part = _ref2[_i];
                      if (part.indexOf('application/json') !== -1) {
                        template = false;
                      }
                    }
                  }
                  if (template) {
                    return app.eco("" + record.type + "/template", context, function(err, html) {
                      if (err) {
                        _this.res.writeHead(500);
                        _this.res.write(err.message);
                        return _this.res.end();
                      } else {
                        context = _.extend({
                          'page': html
                        }, context);
                        return app.eco('layout', context, function(err, layout) {
                          _this.res.writeHead(200, {
                            'content-type': 'text/html'
                          });
                          _this.res.write(err ? html : layout);
                          return _this.res.end();
                        });
                      }
                    });
                  } else {
                    for (key in context) {
                      value = context[key];
                      try {
                        JSON.stringify(value);
                      } catch (_error) {
                        err = _error;
                        delete context[key];
                      }
                    }
                    _this.res.writeHead(200, {
                      'content-type': 'application/json'
                    });
                    _this.res.write(JSON.stringify(context));
                    return _this.res.end();
                  }
                });
              });
            } else {
              log.warn(t = "Document type " + record.type + " not one of " + (Object.keys(blad.types).join(', ')));
              _this.res.writeHead(500);
              _this.res.write(t);
              return _this.res.end();
            }
          });
        });
      });
    };
    blad.unmap = function(url) {
      var i, parts, r, _i, _ref, _results;
      log.info('Delete url ' + url.underline);
      if (url === '/') {
        return delete app.router.routes.get;
      } else {
        r = app.router.routes;
        parts = url.split('/');
        _results = [];
        for (i = _i = 1, _ref = parts.length; 1 <= _ref ? _i < _ref : _i > _ref; i = 1 <= _ref ? ++_i : --_i) {
          if (i + 1 === parts.length) {
            _results.push(r[parts.pop()].get = void 0);
          } else {
            _results.push(r = r[parts[i]]);
          }
        }
        return _results;
      }
    };
    return {
      '/api/document': {
        get: function() {
          var e, params, query, value,
            _this = this;
          params = urlib.parse(this.req.url, true).query;
          if ((params._id == null) && (params.url == null)) {
            this.res.writeHead(404, {
              "content-type": "application/json"
            });
            this.res.write(JSON.stringify({
              'message': 'Use `_id` or `url` to fetch the document'
            }));
            return this.res.end();
          } else {
            if (params._id != null) {
              try {
                value = mongodb.ObjectID.createFromHexString(params._id);
              } catch (_error) {
                e = _error;
                this.res.writeHead(404, {
                  "content-type": "application/json"
                });
                this.res.write(JSON.stringify({
                  'message': 'The `_id` parameter is not a valid MongoDB id'
                }));
                this.res.end();
                return;
              }
              query = {
                '_id': value
              };
            } else {
              value = decodeURIComponent(params.url);
              query = {
                'url': value
              };
            }
            log.info("Get document " + value);
            return app.db(function(collection) {
              return collection.findOne(query, function(err, doc) {
                if (err) {
                  throw err;
                }
                _this.res.writeHead(200, {
                  "content-type": "application/json"
                });
                _this.res.write(JSON.stringify(doc));
                return _this.res.end();
              });
            });
          }
        },
        post: editSave,
        put: editSave,
        "delete": function() {
          var e, params, query, value,
            _this = this;
          params = urlib.parse(this.req.url, true).query;
          if ((params._id == null) && (params.url == null)) {
            this.res.writeHead(404, {
              "content-type": "application/json"
            });
            this.res.write(JSON.stringify({
              'message': 'Use `_id` or `url` to specify the document'
            }));
            return this.res.end();
          } else {
            if (params._id != null) {
              try {
                value = mongodb.ObjectID.createFromHexString(params._id);
              } catch (_error) {
                e = _error;
                this.res.writeHead(404, {
                  "content-type": "application/json"
                });
                this.res.write(JSON.stringify({
                  'message': 'The `_id` parameter is not a valid MongoDB id'
                }));
                this.res.end();
                return;
              }
              query = {
                '_id': value
              };
            } else {
              value = decodeURIComponent(params.url);
              query = {
                'url': value
              };
            }
            log.info("Delete document " + value);
            return app.db(function(collection) {
              return collection.findAndModify(query, [], {}, {
                'remove': true
              }, function(err, doc) {
                if (err) {
                  throw err;
                }
                if (doc) {
                  blad.unmap(doc.url);
                  _this.res.writeHead(200, {
                    "content-type": "application/json"
                  });
                  return _this.res.end();
                } else {
                  _this.res.writeHead(404, {
                    "content-type": "application/json"
                  });
                  return _this.res.end();
                }
              });
            });
          }
        }
      }
    };
  };

}).call(this);
