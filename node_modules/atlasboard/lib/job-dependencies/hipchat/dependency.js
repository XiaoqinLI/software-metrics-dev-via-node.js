module.exports = function (jobWorker, io, globalConfig){
  if (jobWorker.config.globalAuth.hipchat) { //TODO: hipchat initialization should happen just once
    return require('../../hipchat').create({api_key : jobWorker.config.globalAuth.hipchat.token });
  }
  else {
    return null;
  }
};