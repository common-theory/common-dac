const CommonSyndicate = artifacts.require('CommonSyndicate');
const CommonHosting = artifacts.require('CommonHosting');
const CommonDecision = artifacts.require('CommonDecision');

module.exports = async function(deployer) {
  const decision = await deployer.deploy(CommonDecision, '0xAb027372B1c52e1615EDdeF59C3Ca4412bf63b9f', 30).await;
  const [ syndicate, hosting ] = Promise.all([
    deployer.deploy(CommonSyndicate, decision).await,
    deployer.deploy(CommonHosting, decision).await,
  ]);
};
