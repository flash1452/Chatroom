const MongoClient    	= require('mongodb').MongoClient;
const assert 		= require('assert');
const promise		= require('promise');
const promise_lib 	= require('bluebird');
var url = 'mongodb://localhost:27017/chatroom';
var mongodb;

module.exports = function(payload, done) {
	console.log("Inside Cleaner Job");
	console.log(payload.start);
	MongoClient.connect(url, {poolSize: 2, promiseLibrary: promise_lib},function(err, db) {
		assert.equal(null, err);
		mongodb = db;
		collection = mongodb.collection('chatroom');
		console.log("Successfully connected to database");
		collection.remove({"timestamp":{$lt:String(payload.start)}}, function(err,res) {
			if (err) throw err;
			done({"message": "Deletion Successful."});
		});
		
		mongodb.close();
	});
};
