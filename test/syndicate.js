const Syndicate = artifacts.require('Syndicate');
const assert = require('assert');
const BN = require('bn.js');

contract('Syndicate', accounts => {

  /**
   * Tests deposit() with a zero _time argument.
   *
   * - Send Ether to Syndicate via deposit()
   * - Verify same transaction payment settlement
   **/
  it('should instant deposit', async () => {
    const _contract = await Syndicate.deployed();
    // Get a reference to a normal web3.eth.Contract, not a TruffleContract
    const contract = new web3.eth.Contract(_contract.abi, _contract.address);
    const owner = accounts[0];
    const weiValue = 100;
    const time = 0;
    await contract.methods.deposit(owner, time).send({
      from: owner,
      value: weiValue,
      gas: 300000
    });
    const balance = await contract.methods.balances(owner).call();
    assert.equal(weiValue.toString(), balance.toString());
  });

  /**
   * Tests deposit() with non-zero _time argument.
   *
   * - Send Ether to Syndicate via deposit()
   * - Verify payment settlement every network block rate (or 1 second) until
   *   30 seconds after payment settlement.
   **/
  it('should deposit over time', async () => {
    const _contract = await Syndicate.deployed();
    const contract = new web3.eth.Contract(_contract.abi, _contract.address);
    const owner = accounts[0];
    const weiValue = 2491;
    // Do a check over a longer period of time in CI
    const time = process.env.CI ? 500 : 60;
    await contract.methods.deposit(owner, time).send({
      from: owner,
      value: weiValue,
      gas: 300000
    });
    const paymentIndex = await contract.methods.paymentCount().call() - 1;
    const payment = await contract.methods.payments(paymentIndex).call();

    // Check payment values over time
    while (true) {
      // Wait 1 second between loop iterations
      await new Promise(r => setTimeout(r, 1000));
      // Settle the Payment at the current point in time
      await contract.methods.paymentSettle(paymentIndex).send({
        from: owner,
        gas: 300000
      });
      const _payment = await contract.methods.payments(paymentIndex).call();
      const now = Math.floor(new Date() / 1000);
      const totalWeiOwed = +payment.weiValue * Math.min(now - +payment.timestamp, +payment.time) / +payment.time;
      // Ensure that weiPaid is less than the logically calculated owed wei at
      // the loop timestamp (which should always be >= block.timestamp)
      assert.ok(+_payment.weiPaid <= totalWeiOwed);

      if (now > +payment.timestamp + +payment.time + 60) break;
    }

    const balance = await contract.methods.balances(owner).call();
    // Ensure balance is equal to payment.weiValue
    assert.equal(balance, weiValue);
    // Verify that isPaymentSettled() is operating sanely
    assert.ok(await contract.methods.isPaymentSettled(paymentIndex));
  });

  /**
   * Tests deposit via fallback function, should function same as deposit() with
   * a zero _time value.
   *
   * - Send Ether to Syndicate contract
   * - Verify same transaction payment settlement
   **/
  it('should instant deposit via fallback', async () => {
    const _contract = await Syndicate.deployed();
    const contract = new web3.eth.Contract(_contract.abi, _contract.address);
    const owner = accounts[1];
    const weiValue = 100;
    await web3.eth.sendTransaction({
      from: owner,
      to: _contract.address,
      value: weiValue,
      gas: 300000
    });
    const balance = await contract.methods.balances(owner).call();
    assert.equal(weiValue.toString(), balance.toString());
  });

});
