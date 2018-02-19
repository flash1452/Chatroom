const express        	= require('express');
const promise		= require('promise')
const bodyParser     	= require('body-parser');
const cluster 	     	= require('cluster');
const assert 		= require('assert');
const numCPUs 	     	= require('os').cpus().length;
const app            	= express();
const threads		= require('threads');
const spawn 		= threads.spawn;
const Pool 		= threads.Pool;
const pool 		= new Pool();
const forEach 		= require('async-foreach').forEach;
const schedule 		= require('node-schedule');
const config  		= threads.config;
const port		= 8000
var start_timestamp;
var end_timestamp;
var current_timestamp;
var count = 0;

config.set({
  basepath : {
    node : __dirname,
  }
});
const write_thread = spawn('/writer_thread.js');


if (cluster.isMaster) {
	
    	for (var i = 0; i < numCPUs; i++) {
        	// Create a worker
        	cluster.fork();
    	}


}
else {
	
	var inmem_queue = {};
	var result_queue = {};
	var JsonDb = require('node-json-db');
	var db = new JsonDb("mydb", true, false);
	const fs = require('fs');
	var messages;

	app.listen(port, () => {
  	console.log('We are live on ' + port);
	});

	app.use(bodyParser.json()); // support json encoded bodies
	app.use(bodyParser.urlencoded({ extended: false})); // support encoded bodies	

	
	app.post('/add-entry', function(req, res) {
		var timestamp = req.body.timestamp;
		var message = req.body.message;
		current_timestamp = Math.floor(Date.now() / 1000);
		if (timestamp < current_timestamp) {
			res.StatusCode = 401;
			return res.json({errors:["InvalidTimestampError"]});
		}
		inmem_queue[timestamp] = inmem_queue[timestamp] || [];
    		inmem_queue[timestamp].push(message);
		db.push("/data/"+timestamp, inmem_queue[timestamp]);
		count+= 1;
		if (count >= 1000) {
			count = 0;
			console.log("Start writer job.");
			write_thread.send(inmem_queue).promise().then(function success(message) {
				console.log(message);
				inmem_queue = {};
				db.delete('/data/');
				
			}, function error(error) {
				console.log("Error while writing to database.");
				console.log(error);
			});

		}
		res.StatusCode = 201;
		res.json({"Status": 200, "Message":"Success"});
	});


	app.get('/chat', function(req, res){
		start_timestamp = Math.floor(Date.now() / 1000); 
		end_timestamp = start_timestamp + 10;
		var reader_scheduler = schedule.scheduleJob('*/5 * * * * *', function(){
			var reader_payload = {start: start_timestamp, end: end_timestamp}
  			pool.run('reader_job.js').send(reader_payload).promise().then(function allResolved(message) {
				start_timestamp = end_timestamp;
				end_timestamp = end_timestamp + 10;
				if (message.length > 0) {
					forEach(message, function(item, index, arr){
						var timestamp = String(item.timestamp);
						var msg = item.msg;
						fs.appendFileSync('read_success.txt', timestamp + " => " + msg + '\r\n');
						db.push("/display/"+timestamp, msg);

					});
				}				
			}, function error(error) {
				throw error;
			});	
		});

		var cleaner_scheduler = schedule.scheduleJob('*/60 * * * * *', function(){
			console.log("Inside Cleaner scheduler.");
			var cleaner_payload = {start: start_timestamp};
			pool.run('cleaner_job.js').send(cleaner_payload).promise().then(function allResolved(message) {
				console.log("Deletion Job Finished.");
				fs.appendFileSync('delete_success.txt', String(start_timestamp) + '\r\n');
			}, function error(error){
				throw error;
			});
		});


		var display_scheduler = schedule.scheduleJob('*/1 * * * * *', function(){
			console.log("Inside display scheduler");
			current_timestamp = String(Math.floor(Date.now() / 1000));
			try {
				messages = db.getData('/display/'+current_timestamp);
				fs.appendFileSync('display.txt',String(current_timestamp) + " => " +  messages + '\r\n');
				db.delete('/display/'+current_timestamp);
			} catch(error) {
			}
			try {
				messages = db.getData('/data/'+current_timestamp);
				fs.appendFileSync('display.txt',String(current_timestamp) + " => " +  messages + '\r\n');
				db.delete('/data/'+current_timestamp);
			} catch(error) {
			}
		});
		
	});	
}
