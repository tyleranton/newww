var _ = require('lodash');
var DOWNLOADS_API = process.env.DOWNLOADS_API || "https://downloads-api-example.com";
var fmt = require('util').format;
var P = require('bluebird');
var cache = P.promisifyAll(require('../lib/cache'));

var Download = module.exports = function(opts) {
  if (!(this instanceof Download)) {
    return new Download(opts);
  }

  _.extend(this, {
    timeout: 2000,
    bearer: opts && opts.loggedInUser && opts.loggedInUser.name
  }, opts);

  return this;
};

Download.prototype.getDaily = function(packageName) {
  return this.getSome("day", packageName);
};

Download.prototype.getWeekly = function(packageName) {
  return this.getSome("week", packageName);
};

Download.prototype.getMonthly = function(packageName) {
  return this.getSome("month", packageName);
};

Download.prototype.getAll = function(packageName) {
  return P.all([
    this.getDaily(packageName),
    this.getWeekly(packageName),
    this.getMonthly(packageName),
  ]).then(function(result) {
    return {
      day: result[0],
      week: result[1],
      month: result[2]
    };
  });
};

Download.prototype.getSome = function(period, packageName) {

  var url = fmt("%s/point/last-%s", DOWNLOADS_API, period);
  if (packageName) {
    url += "/" + packageName;
  }

  var opts = {
    method: "GET",
    url: url,
    json: true,
    timeout: this.timeout,
  };

  if (this.bearer) {
    opts.headers = {
      bearer: this.bearer
    };
  }

  return cache.getAsync(opts).catch(function() {
    return null;
  });
};
