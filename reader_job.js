const assert 		= require('assert');
const promise		= require('promise');
const MongoClient    = require('mongodb').MongoClient;
const promise_lib	= require('bluebird');

var url = 'mongodb://localhost:27017/chatroom';
var collection;
var mongodb;
var read_result;

module.exports = function(payload, done){
	MongoClient.connect(url, {poolSize: 2, promiseLibrary: promise_lib},function(err, db) {
    	assert.equal(null, err);
    	mongodb=db;
	//console.log(mongodb);
	collection = mongodb.collection('chatroom');
	console.log("Successfully connected to database.");
	start_timestamp = payload.start;
	end_timestamp = payload.end;
	collection.find({"timestamp":{$gte:String(start_timestamp), $lt:String(end_timestamp)}}).toArray(function(err, res) {
		if (err) throw err;
		done(res);	
	});		
	mongodb.close();
});
}


