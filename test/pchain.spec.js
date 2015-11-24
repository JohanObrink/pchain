var sinon = require('sinon'),
  chai = require('chai'),
  expect = chai.expect,
  sinonPromise = require('sinon-promise'),

  pchain = require(process.cwd() + '/pchain');

chai.use(require('sinon-chai'));
sinonPromise(sinon);
pchain.Promise = sinonPromise.Q;

describe('pchain', function () {
  var success, fail;
  beforeEach(function () {
    success = sinon.spy();
    fail = sinon.spy();
  });
  describe('series', function () {
    it('calls promises in series', function () {
      var p1 = sinon.promise();
      var p2 = sinon.promise();

      var func = pchain.series(p1, p2);
      func().then(success).catch(fail);
      expect(p1).calledOnce.calledWith();

      expect(success).not.called;
      expect(fail).not.called;

      p1.resolve();
      expect(p2).calledOnce.calledWith();

      expect(success).not.called;
      expect(fail).not.called;

      p2.resolve();
      expect(fail).not.called;
      expect(success).calledOnce.calledWith();
    });
    it('passes arguments correctly', function () {
      var p1 = sinon.promise();
      var p2 = sinon.promise();

      var func = pchain.series(p1, p2);
      func('foo', 'bar').then(success).catch(fail);
      expect(p1).calledOnce.calledWith('foo', 'bar');

      p1.resolve('baz');
      expect(p2).calledOnce.calledWith('baz');

      p2.resolve('herp');
      expect(fail).not.called;
      expect(success).calledOnce.calledWith('herp');
    });
    it('throws first error', function () {
      var p1 = sinon.promise();
      var p2 = sinon.promise();

      var func = pchain.series(p1, p2);
      func().then(success).catch(fail);
      expect(p1).calledOnce;

      p1.reject('error');
      expect(p2).not.called;

      expect(success).not.called;
      expect(fail).calledOnce.calledWith('error');
    });
    it('throws second error', function () {
      var p1 = sinon.promise();
      var p2 = sinon.promise();

      var func = pchain.series(p1, p2);
      func().then(success).catch(fail);
      expect(p1).calledOnce;

      p1.resolve();
      expect(p2).calledOnce;

      p2.reject('error');
      expect(success).not.called;
      expect(fail).calledOnce.calledWith('error');
    });
  });
  describe('parallel', function () {
    it('calls promises in parallel', function () {
      var p1 = sinon.promise();
      var p2 = sinon.promise();

      var func = pchain.parallel(p1, p2);
      func().then(success).catch(fail);
      expect(p1).calledOnce.calledWith();
      expect(p2).calledOnce.calledWith();

      p1.resolve();
      expect(success).not.called;
      expect(fail).not.called;

      p2.resolve();
      expect(fail).not.called;
      expect(success).calledOnce.calledWith();
    });
    it('passes arguments correctly', function () {
      var p1 = sinon.promise();
      var p2 = sinon.promise();

      var func = pchain.parallel(p1, p2);
      func('foo', 'bar').then(success).catch(fail);
      expect(p1).calledOnce.calledWith('foo', 'bar');
      expect(p2).calledOnce.calledWith('foo', 'bar');

      p1.resolve('baz');
      p2.resolve('herp');

      expect(fail).not.called;
      expect(success).calledOnce.calledWith(['baz', 'herp']);
    });
    it('throws first error', function () {
      var p1 = sinon.promise();
      var p2 = sinon.promise();

      var func = pchain.parallel(p1, p2);
      func().then(success).catch(fail);
      expect(p1).calledOnce;
      expect(p2).calledOnce;

      p1.reject('error');
      p2.resolve('result');

      expect(success).not.called;
      expect(fail).calledOnce.calledWith('error');
    });
    it('throws second error', function () {
      var p1 = sinon.promise();
      var p2 = sinon.promise();

      var func = pchain.parallel(p1, p2);
      func().then(success).catch(fail);
      expect(p1).calledOnce;
      expect(p2).calledOnce;

      p1.resolve('result');
      p2.reject('error');

      expect(success).not.called;
      expect(fail).calledOnce.calledWith('error');
    });
  });
  describe('combo', function () {
    it('can be combined', function () {
      var p1 = sinon.promise(),
        p2 = sinon.promise(),
        p3 = sinon.promise(),
        p4 = sinon.promise();

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
      expect(p2).calledOnce.calledWith('herp');
      expect(p3).calledOnce.calledWith('herp');
      expect(p4).not.called;
      expect(success).not.called;
      expect(fail).not.called;

      p2.resolve('derp');
      expect(p4).not.called;
      expect(success).not.called;
      expect(fail).not.called;

      p3.resolve(true);
      expect(p4).calledOnce.calledWith(['derp', true]);
      expect(success).not.called;
      expect(fail).not.called;

      p4.resolve(false);
      expect(success).calledOnce.calledWith(false);
      expect(fail).not.called;
    });
  });
  describe('simple call', function () {
    it('can be combined using functions and arrays', function () {
      var p1 = sinon.promise(),
        p2 = sinon.promise(),
        p3 = sinon.promise(),
        p4 = sinon.promise();

      var func = pchain(p1, [p2, p3], p4);
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
      expect(p2).calledOnce.calledWith('herp');
      expect(p3).calledOnce.calledWith('herp');
      expect(p4).not.called;
      expect(success).not.called;
      expect(fail).not.called;

      p2.resolve('derp');
      expect(p4).not.called;
      expect(success).not.called;
      expect(fail).not.called;

      p3.resolve(true);
      expect(p4).calledOnce.calledWith(['derp', true]);
      expect(success).not.called;
      expect(fail).not.called;

      p4.resolve(false);
      expect(success).calledOnce.calledWith(false);
      expect(fail).not.called;
    });
  });
});