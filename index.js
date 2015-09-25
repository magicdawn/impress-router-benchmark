'use strict';

var app = require('koa')();
var router = require('impress-router')();
app.use(router);
var co = require('co');
var request = require('superagent');
var assert = require('assert');
global.Promise = require('bluebird');

/**
 * test fixtures copied from treckjs/router test/fixtures
 */
var apiGitHub = require('./fixtures/github-api');
var apiDiscourse = require('./fixtures/discourse-api');
var realPath = [];

/**
 * `ok` response
 */
var handler = function*() {
  this.body = 'ok';
};

apiGitHub.forEach(x => {
  var method = x[0].toLowerCase();
  var path = x[1];
  var real = x[2];
  router[method](path, handler);
});

apiDiscourse.forEach(x => {
  var path = x[0];
  var real = x[1];
  router.get(path, handler);
});

var server = app.listen(0);
var addr = '127.0.0.1:' + server.address().port;

co(function*() {
  console.time('impress-router');
  for (var i = 0, len = apiGitHub.length; i < len; i++) {
    var x = apiGitHub[i];

    var method = x[0].toLowerCase();
    var path = x[1];
    var real = x[2];

    yield new Promise((resolve, reject) => {
      console.log(addr + real);
      request(method, addr + real)
        .end(function(err, res) {
          assert.equal(err, null);
          assert.equal(res.status, 200);
          assert.equal(res.text, 'ok');
          resolve();
        });
    });
  }

  for (var i = 0, len = apiDiscourse.length; i < len; i++) {
    var x = apiDiscourse[i];
    var path = x[0];
    var real = x[1];

    yield new Promise((resolve, reject) => {
      console.log(addr + real);
      request.get(addr + real)
        .end(function(err, res) {
          assert.equal(err, null);
          assert.equal(res.status, 200);
          assert.equal(res.text, 'ok');
          resolve();
        });
    });
  }
  console.timeEnd('impress-router');
}).then(() => {
  server.unref();
}).catch(e => {
  server.unref();
  console.error(e.stack || e);
});