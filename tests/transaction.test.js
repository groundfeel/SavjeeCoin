const assert = require('assert');
const { Transaction } = require('../src/blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

let txObject = null;
let signingKey = ec.keyFromPrivate('3d6f54430830d388052865b95c10b4aeb1bbe33c01334cf2cfa8b520062a0ce3');


beforeEach(function() {
    txObject = new Transaction('fromAddress', 'toAddress', 9999);
});

function createCorrectlySignedTransaction(){
	txObject = new Transaction(signingKey.getPublic('hex'), 'wallet2', 10);
    txObject.timestamp = 1;
    txObject.signTransaction(signingKey);

    return txObject;
}

describe('Transaction class', function() {
    describe('Constructor', function() {
        it('should automatically set the current date', function() {
            const actual = txObject.timestamp;
            const minTime = Date.now() - 1000;
            const maxTime = Date.now() + 1000;

            assert(actual > minTime && actual < maxTime, 'Tx does not have a good timestamp');
        });


        it('should correctly save from, to and amount', function() {
            txObject = new Transaction('a1', 'b1', 10);

            assert.equal(txObject.fromAddress, 'a1');
            assert.equal(txObject.toAddress, 'b1');
            assert.equal(txObject.amount, 10);
        });
    });

    describe('Calculate hash', function() {
        it('should correct calculate the SHA256', function() {
            txObject = new Transaction('a1', 'b1', 10);
            txObject.timestamp = 1;

            assert.equal(
                txObject.calculateHash(),

                // Output of SHA256(a1b1101)
                '21894bb7b0e56aab9eb48d4402d94628a9a179bc277542a5703f417900275153'
            );
        });

        it('should change when we tamper with the tx', function(){
        	txObject = new Transaction('a1', 'b1', 10);

        	const originalHash = txObject.calculateHash();
            txObject.amount = 100;

            assert.notEqual(
            	txObject.calculateHash(),
            	originalHash
            );
        });
    });

    describe('isValid', function() {
        it('should throw error without signature', function() {
            assert.throws(txObject.isValid, Error);
        });

        it('should correctly sign transactions', function(){
        	txObject = createCorrectlySignedTransaction();

        	assert.equal(
        		txObject.signature,
        		'3044022023fb1d818a0888f7563e1a3ccdd68b28e23070d6c0c1c5'+
        		'004721ee1013f1d769022037da026cda35f95ef1ee5ced5b9f7d70'+
        		'e102fcf841e6240950c61e8f9b6ef9f8'
        	);
        });

        it('should not sign transactions for other wallets', function(){
        	txObject = new Transaction('not a correct wallet key', 'wallet2', 10);
        	txObject.timestamp = 1;

        	assert.throws(() => {
        		txObject.signTransaction(signingKey);
        	}, Error);
        });

        it('should detect badly signed transactions', function(){
        	txObject = createCorrectlySignedTransaction();

        	// Tamper with it & it should be invalid!
        	txObject.amount = 100;
        	assert(!txObject.isValid());
        });

        it('should return true with correctly signed tx', function(){
        	txObject = createCorrectlySignedTransaction();
        	assert(txObject.isValid());
        })
    });

});