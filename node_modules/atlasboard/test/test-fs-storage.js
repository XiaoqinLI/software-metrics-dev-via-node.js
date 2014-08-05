var assert = require ('assert'),
    path = require ('path'),
    rm = require ('rimraf'),
    fs = require ('fs');

describe ('fs-storage', function(){
  var temp_folder = path.join(process.cwd(), "test/tmp");
  var storagePath = path.join(temp_folder, "tmp-storage.json");

  var fsStorageClass = require ('../lib/job-dependencies/storage/implementations/fs-storage');
  //make sure temp folder is deleted even if tests fail (before and after)
  beforeEach(function(done){
    rm(temp_folder, done);
  });

  afterEach(function(done){
    rm(temp_folder, done);
  });

  it('should set value to storage', function(done){
    var fsStorage = new fsStorageClass('jobkey1', {storagePath : storagePath});
    fs.mkdir(temp_folder, function (err, data){
      fsStorage.set('key1', { foo: 'bar'}, function(error, data){
        assert.ifError(error);
        fsStorage.get('key1', function(err, data){
          assert.ifError(error);
          assert.equal(data.foo, 'bar');
          done();
        });
      });
    });
  });

  it('should not interfere with other jobs (isolated storage)', function(done){
    var fsStorage1 = new fsStorageClass('jobkey1', {storagePath : storagePath});
    var fsStorage2 = new fsStorageClass('jobkey2', {storagePath : storagePath});

    fs.mkdir(temp_folder, function (err, data){
      // write values
      fsStorage1.set('key1', { foo: 'bar'}, function(error, data){
        assert.ifError(error);
        fsStorage2.set('key1', { foo: 'foo'}, function(error, data){
          // retrieve values and make sure there are different
          fsStorage1.get('key1', function(err, data){
            assert.ifError(error);
            assert.equal(data.foo, 'bar');
            fsStorage2.get('key1', function(err, data){
              assert.equal(data.foo, 'foo');
              done();
            });
          });
        });
      });
    });
  });

  it('should be able to select custom storage path', function(done){
    var newStoragePath = path.join(temp_folder, "tmp-storage2.json");
    var fsStorage = new fsStorageClass('jobkey1', {storagePath : newStoragePath});
    fs.mkdir(temp_folder, function (err, data){
      fsStorage.set('key1', { foo: 'bar'}, function(error, data){
        assert.ifError(error);
        assert.ok(fs.existsSync(newStoragePath));
        done();
      });
    });
  });

  it('should be able to handle reading from corrupted JSON files', function(done){
    var corruptedStoragePath = path.join(temp_folder, "tmp-storage2.json");
    fs.mkdir(temp_folder, function (err, data){
      fs.writeFile(corruptedStoragePath, "bad json", function(err, data){
        var fsStorage = new fsStorageClass('jobkey1', {storagePath : corruptedStoragePath});
        fsStorage.get('key1', function(error, data){
          assert.ok(error);
          assert.equal(null, data);
          done();
        });
      });
    });
  });

  it('should be able to handle reading from valid JSON files with wrong structure', function(done){
    var invalidStorageFilePath = path.join(temp_folder, "tmp-storage.json");
    var jobkey = 'jobkey1';
    fs.mkdir(temp_folder, function (err, data){
      var fileData = "{\"" + jobkey + "\": { \"daaata\" : \"hello\"}}";
      fs.writeFile(invalidStorageFilePath, fileData, function(err, data){
        var fsStorage = new fsStorageClass(jobkey, {storagePath : invalidStorageFilePath});
        fsStorage.get('key1', function(error, data){
          assert.ok(error);
          assert.equal(null, data);
          done();
        });
      });
    });
  });

  it('should be able to handle writing to corrupted JSON files', function(done){
    var corruptedStoragePath = path.join(temp_folder, "tmp-storage2.json");
    fs.mkdir(temp_folder, function (err, data){
      fs.writeFile(corruptedStoragePath, "bad json", function(err, data){
        var fsStorage = new fsStorageClass('jobkey1', {storagePath : corruptedStoragePath});
        fsStorage.set('key1', 'test', function(error, data){
          assert.ifError(error);
          fsStorage.get('key1', function(error, data){
            assert.equal('test', data);
            done();
          });
        });
      });
    });
  });

  it('should be able to handle writing to valid JSON files with wrong structure', function(done){
    var invalidStorageFilePath = path.join(temp_folder, "tmp-storage.json");
    var jobkey = 'jobkey1';
    fs.mkdir(temp_folder, function (err, data){
      var fileData = "{\"" + jobkey + "\": { \"key1\" : { \"daaata\" : \"hello\"}}}";
      fs.writeFile(invalidStorageFilePath, fileData, function(err, data){
        var fsStorage = new fsStorageClass(jobkey, {storagePath : invalidStorageFilePath});
        fsStorage.set('key1', 'test', function(error, data){
          assert.equal(data.jobkey1.key1.data, 'test');
          assert.ifError(error);
          fsStorage.get('key1', function(error, data){
            assert.equal('test', data);
            done();
          });
        });
      });
    });
  });

});