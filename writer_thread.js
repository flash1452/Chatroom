const MongoClient    	= require('mongodb').MongoClient;
const assert 		= require('assert');
const promise		= require('promise');
const promise_lib	= require('bluebird');
const threads		= require('threads');
const Pool		= threads.Pool;
const pool		= new Pool();
var url = 'mongodb://localhost:27017/chatroom';
var collection;
var mongodb;

module.exports = function (msgs, done) {
	MongoClient.connect(url, {poolSize: 2, promiseLibrary: promise_lib},function(err, db) {
    		assert.equal(null, err);
    		mongodb=db;
		collection = mongodb.collection('chatroom');
		console.log("Successfully connected to database.");
		Object.keys(msgs).forEach(function(key) {
			collection.insertOne({timestamp:key, msg:msgs[key]}, function(err, res) {
				if (err) throw err;	
			});

		});
		mongodb.close();
		done('Data Successfully Inserted.');
    	});

};
