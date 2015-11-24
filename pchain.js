(function (module, global) {

  function series() {
    var args = Array.prototype.slice.call(arguments);
    var first = args.shift();
    var hasOptions = args.length && 'object' === typeof(args[args.length -1]);
    var options = hasOptions ? args.pop() : {};
    return function () {
      return args.reduce(function (promise, nextCall) {
        if(nextCall instanceof Array) {
          nextCall = parallel.apply(null, nextCall);
        }
        if(options.all) {
          var _nextCall = nextCall;
          nextCall = function () {
            return _nextCall.apply(null, arguments)
              .then(function (result) { return {result: result}; })
              .catch(function (error) { return {error: error}; });
          };
        }
        return promise.then(nextCall);
      }, first.apply(null, arguments));
    };
  }

  series.all = function () {
    var args = Array.prototype.slice.call(arguments)
      .concat([{all: true}]);
    return series.apply(null, args);
  };

  function parallel() {
    var promises = Array.prototype.slice.call(arguments);
    return function () {
      var args = Array.prototype.slice.call(arguments);
      return pchain.Promise.all(promises.map(function (promise) {
        return promise.apply(null, args);
      }));
    };
  }

  function pchain() {
    var args = Array.prototype.slice.call(arguments);
    return series.apply(null, args);
  }

  pchain.Promise = global.promise;
	pchain.series = series;
  pchain.parallel = parallel;

  module.exports = pchain;

})(module || {exports: window}, global || window);