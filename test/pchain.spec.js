var sinon = require('sinon'),
  chai = require('chai'),
  expect = chai.expect,

  pchain = require(process.cwd() + '/pchain');

chai.use(require('sinon-chai'));

function wait(func) {
  return setTimeout(func, 0);
}

function promise() {
  var spy = sinon.spy(function () {
    return new Promise(function (resolve, reject) {
      spy.resolve = resolve;
      spy.reject = reject;
    });
  });
  return spy;
}

describe('pchain', function () {
  var success, fail;
  beforeEach(function () {
    success = sinon.spy();
    fail = sinon.spy();
  });
  describe('series', function () {
    it('calls promises in series', function (done) {
      var p1 = promise();
      var p2 = promise();

      var func = pchain.series(p1, p2);
      func().then(success).catch(fail);
      expect(p1).calledOnce.calledWith();
      expect(success).not.called;
      expect(fail).not.called;

      p1.resolve();
      wait(function () {
        expect(p2).calledOnce.calledWith();
        expect(success).not.called;
        expect(fail).not.called;

        p2.resolve();
        wait(function () {
          expect(fail).not.called;
          expect(success).calledOnce.calledWith();
          done();
        });
      });    
    });
    it('passes arguments correctly', function (done) {
      var p1 = promise();
      var p2 = promise();

      var func = pchain.series(p1, p2);
      func('foo', 'bar').then(success).catch(fail);
      expect(p1).calledOnce.calledWith('foo', 'bar');

      p1.resolve('baz');
      wait(function () {
        expect(p2).calledOnce.calledWith('baz');

        p2.resolve('herp');
        wait(function () {
          expect(fail).not.called;
          expect(success).calledOnce.calledWith('herp');
          done();
        });
      });
    });
    it('throws first error', function (done) {
      var p1 = promise();
      var p2 = promise();

      var func = pchain.series(p1, p2);
      func().then(success).catch(fail);
      expect(p1).calledOnce;

      p1.reject('error');

      wait(function () {
        expect(p2).not.called;
        expect(success).not.called;
        expect(fail).calledOnce.calledWith('error');

        done();
      });
    });
    it('throws second error', function (done) {
      var p1 = promise();
      var p2 = promise();

      var func = pchain.series(p1, p2);
      func().then(success).catch(fail);
      expect(p1).calledOnce;

      p1.resolve();
      wait(function () {
        expect(p2).calledOnce;

        p2.reject('error');
        wait(function () {
          expect(success).not.called;
          expect(fail).calledOnce.calledWith('error');
          done();
        });
      });
    });
  });
  describe('parallel', function () {
    it('calls promises in parallel', function (done) {
      var p1 = promise();
      var p2 = promise();

      var func = pchain.parallel(p1, p2);
      func().then(success).catch(fail);
      expect(p1).calledOnce.calledWith();
      expect(p2).calledOnce.calledWith();

      p1.resolve();
      wait(function () {
        expect(success).not.called;
        expect(fail).not.called;

        p2.resolve();
        wait(function () {
          expect(fail).not.called;
          expect(success).calledOnce.calledWith();
          done();
        });
      });
    });
    it('passes arguments correctly', function (done) {
      var p1 = promise();
      var p2 = promise();

      var func = pchain.parallel(p1, p2);
      func('foo', 'bar').then(success).catch(fail);
      expect(p1).calledOnce.calledWith('foo', 'bar');
      expect(p2).calledOnce.calledWith('foo', 'bar');

      p1.resolve('baz');
      p2.resolve('herp');

      wait(function () {
        expect(fail).not.called;
        expect(success).calledOnce.calledWith(['baz', 'herp']);
        done();
      });
    });
    it('throws first error', function (done) {
      var p1 = promise();
      var p2 = promise();

      var func = pchain.parallel(p1, p2);
      func().then(success).catch(fail);
      expect(p1).calledOnce;
      expect(p2).calledOnce;

      p1.reject('error');
      p2.resolve('result');

      wait(function () {
        expect(success).not.called;
        expect(fail).calledOnce.calledWith('error');
        done();
      });
    });
    it('throws second error', function (done) {
      var p1 = promise();
      var p2 = promise();

      var func = pchain.parallel(p1, p2);
      func().then(success).catch(fail);
      expect(p1).calledOnce;
      expect(p2).calledOnce;

      p1.resolve('result');
      p2.reject('error');

      wait(function () {
        expect(success).not.called;
        expect(fail).calledOnce.calledWith('error');
        done();
      });
    });
  });
  describe('combo', function () {
    it('can be combined', function (done) {
      var p1 = promise(),
        p2 = promise(),
        p3 = promise(),
        p4 = promise();

      var func = pchain
        .series(p1, pchain.parallel(p2, p3), p4);
      func('foo', 'bar')
        .then(success)
        .catch(fail);

      expect(p1).calledOnce.calledWith('foo', 'bar');
      expect(p2).not.called;
      expect(p3).not.called;
      expect(p4).not.called;
      expect(success).not.called;
      expect(fail).not.called;

      p1.resolve('herp');
      wait(function () {
        expect(p2).calledOnce.calledWith('herp');
        expect(p3).calledOnce.calledWith('herp');
        expect(p4).not.called;
        expect(success).not.called;
        expect(fail).not.called;

        p2.resolve('derp');
        wait(function () {
          expect(p4).not.called;
          expect(success).not.called;
          expect(fail).not.called;

          p3.resolve(true);
          wait(function () {
            expect(p4).calledOnce.calledWith(['derp', true]);
            expect(success).not.called;
            expect(fail).not.called;

            p4.resolve(false);
            wait(function () {
              expect(success).calledOnce.calledWith(false);
              expect(fail).not.called;
              done();
            });
          });
        });
      });
    });
    it('can be combined using functions and arrays', function (done) {
      var p1 = promise(),
        p2 = promise(),
        p3 = promise(),
        p4 = promise();

      var func = pchain
        .series(p1, pchain.parallel(p2, p3), p4);
      func('foo', 'bar')
        .then(success)
        .catch(fail);

      expect(p1).calledOnce.calledWith('foo', 'bar');
      expect(p2).not.called;
      expect(p3).not.called;
      expect(p4).not.called;
      expect(success).not.called;
      expect(fail).not.called;

      p1.resolve('herp');
      wait(function () {
        expect(p2).calledOnce.calledWith('herp');
        expect(p3).calledOnce.calledWith('herp');
        expect(p4).not.called;
        expect(success).not.called;
        expect(fail).not.called;

        p2.resolve('derp');
        wait(function () {
          expect(p4).not.called;
          expect(success).not.called;
          expect(fail).not.called;

          p3.resolve(true);
          wait(function () {
            expect(p4).calledOnce.calledWith(['derp', true]);
            expect(success).not.called;
            expect(fail).not.called;

            p4.resolve(false);
            wait(function () {
              expect(success).calledOnce.calledWith(false);
              expect(fail).not.called;
              done();
            });
          });
        });
      });
    });
  });
  describe('all', function () {
    describe('series', function () {
      it('works when both succeed', function (done) {
        var p1 = promise();
        var p2 = promise();
        var func = pchain.series.all(p1, p2);

        func('foo', 'bar').then(success).catch(fail);
        expect(p1).calledOnce.calledWith('foo', 'bar');
        expect(p2).not.called;
        expect(success).not.called;
        expect(fail).not.called;

        p1.resolve('result1');
        wait(function () {
          done();
          var result = p2.lastCall.args[0];
          console.log(result);
          expect(p2).calledOnce.calledWith('result1'); //{result: 'result1'});
          /*expect(success).not.called;
          expect(fail).not.called;

          p2.resolve('result2');
          wait(function () {
            expect(success).calledOnce.calledWith({result: 'result1'});
            expect(fail).not.called;
            done();
          });*/
        });
      });
      xit('works when first fails', function () {
        var p1 = sinon.promise();
        var p2 = sinon.promise();
        var func = pchain.series.all(p1, p2);

        func('foo', 'bar');
        expect(p1).calledOnce.calledWith('foo', 'bar');
        expect(p2).not.called;
        expect(success).not.called;
        expect(fail).not.called;

        p1.reject('error1');
        expect(p2).calledOnce.calledWith({error: 'error1'});
        expect(success).not.called;
        expect(fail).not.called;

        p2.resolve('result2');
        expect(success).calledOnce.calledWith({result: 'result1'});
        expect(fail).not.called;
      });
      xit('works when second fails', function () {
        var p1 = sinon.promise();
        var p2 = sinon.promise();
        var func = pchain.series.all(p1, p2);

        func('foo', 'bar');
        expect(p1).calledOnce.calledWith('foo', 'bar');
        expect(p2).not.called;
        expect(success).not.called;
        expect(fail).not.called;

        p1.resolve('result1');
        expect(p2).calledOnce.calledWith({result: 'result1'});
        expect(success).not.called;
        expect(fail).not.called;

        p2.reject('result2');
        expect(success).calledOnce.calledWith({error: 'result2'});
        expect(fail).not.called;
      });
    });
  });
});