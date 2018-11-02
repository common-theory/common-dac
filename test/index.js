const CommonDAC = artifacts.require('CommonDAC');

contract('CommonDAC', accounts => {

  it('should initialize with a proposal', () => {
    return CommonDAC.deployed()
      .then(instance => instance.proposalCount.call())
      .then(proposalCount => {
        assert.equal(proposalCount, 1, 'Initial proposal not present.');
      });
  });

});
