var assert = require ('assert'),
    sinon = require ('sinon');

describe ('scheduler', function(){
  var scheduler = require('../lib/scheduler')();
  var widgets = {sendData: function(){}};

  var stub;
  var clock;
  var mockJobWorker;

  beforeEach(function(done){
    clock = sinon.useFakeTimers();
    mockJobWorker = {
      config:{interval: 3000},
      task : function(){},
      dependencies : {
        logger : {
          warn: function (){},
          error: function (){}
        }
      }
    };

    stub = sinon.stub(mockJobWorker, "task");
    done();
  });

  afterEach(function(done){
    stub.restore();
    clock.restore();
    done();
  });

  it('should execute the job then it is run', function(done){
    this.timeout(50);
    mockJobWorker.task = function (config, dependencies, cb){
      done();
    }
    scheduler.schedule(mockJobWorker, widgets);
  });

  it('should schedule a job to be executed in the future in intervals of time', function(done){
    scheduler.schedule(mockJobWorker, widgets);
    clock.tick(3000);
    clock.tick(3000);
    assert.ok(stub.calledThrice);
    done();
  });

  it('should set 1 sec as the minimum interval period', function(done){
    mockJobWorker.config.interval = 10; //really low interval
    scheduler.schedule(mockJobWorker, widgets);
    clock.tick(1000);
    clock.tick(1000);
    assert.ok(stub.calledThrice);
    done();
  });

  it('should allow job workers to maintain state across calls', function(done){
    mockJobWorker.task = function (config, dependencies, cb){
      this.counter = (this.counter || 0) + 1;
    }
    scheduler.schedule(mockJobWorker, widgets);
    clock.tick(3000);
    clock.tick(3000);
    assert.equal(3, mockJobWorker.counter);
    done();
  });

  it('should allow a grace period to raise errors if retryOnErrorTimes is defined', function(done){
    mockJobWorker.config.retryOnErrorTimes = 3;
    var numberCalls = 0;
    mockJobWorker.task = function (config, dependencies, cb){
      numberCalls++;
      cb('err');
    }
    scheduler.schedule(mockJobWorker, widgets);
    clock.tick(3000/3);
    clock.tick(3000/3);
    assert.equal(3, numberCalls);
    done();
  });

  it('should handle synchronous errors in job execution', function(done){
    mockJobWorker.task = function (config, dependencies, cb){
      throw 'err'
    }
    scheduler.schedule(mockJobWorker, widgets);
    done();
  });

});