// var server = require("./server");
// server.start();
// https://github.com/caolan/async
// http://www.joyent.com/developers/node/design/errors
// http://www.safeticket.dk/

// http://docs.mongodb.org/manual/core/data-model-operations/ warns "data models should avoid document growth when possible."
// Thus we do not use update/$push to add users to an array embedded in the queue object.

// Format: mongodb://[username:password@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[database][?options]]
var dbUrl = 'mongodb://localhost:27017/freeq?maxPoolSize=10';

var assert	= require("assert");
var util	= require('util');

var mongodb = require('mongodb');
mongodb.MongoClient.connect(dbUrl, function(err, db) {
	assert.ifError(err);
	assert.ok(db != null);
	console.log('Connected to MongoDB');

	

	// Find or create the queue record
    var query	= {	name:	'Min 2. testkø' };
    var sort	= {	_id:	1 };
    var update	= { $set:	query };
	var options	= { new:	true,
					// fields: { _id: 1, name: 1 }, // Var nødvendig da users var et embedded document
					upsert:	true };
	var queueCollection = db.collection("queues");
    queueCollection.findAndModify(query, sort, update, options, function(err, queue) {
		assert.ifError(err);
		console.log(queue);

		// Get specific collection for this queue
		var userCollection = db.collection("usersForQueue" + queue._id.toHexString());
		// This should be done when the queue is created, not when someone enters the queue.
		if (0) {
			userCollection.dropAllIndexes(function(err, result) {});
		}
		if (0) {
			userCollection.ensureIndex({ number: 1 }, { unique: false, dropDups: true }, function(err, indexName) {
				assert.ifError(err);
				console.log('Index has name ' + indexName);
			});
		}
			
		if (0) {
			// Increment number
			var tStart = new Date();
			userCollection.update({}, { $inc: { number: +1 } }, { multi: true }, function(err, result) {
				assert.ifError(err);
				var tDelta = new Date() - tStart;
				console.log('Increment took ' + util.format('%d', tDelta/1000) + 's.');
				console.log(result);
			});
		}
		
		if (0) {
			// Get number of users in queue
			// Beware of async execution.
			var tStart = new Date();
			userCollection.count(function(err, count) {
				assert.ifError(err);
				var tDelta = new Date() - tStart;
				console.log('Found all ' + count + ' users in ' + util.format('%d', tDelta/1000) + 's.');

				var tStart2 = new Date();
				var query	= {	number: { $lte: 272842 } };
				userCollection.count(query, function(err, count) {
					assert.ifError(err);
					var tDelta = new Date() - tStart2;
					console.log('Found ' + count + ' users in ' + util.format('%d', tDelta/1000) + 's.');
				});
			});
		}
			
		if (0) {
			var tStart = new Date();
			// Add users
			var target = 100000;
			var c = 0;
			console.log('Udfører ' + target + ' inserts...');
			for (var count = 0; count < target; count++) {
				var user = {
					number:		count+600000,
					longer:		'abcdefghijklmnasdfasdf'
				};
				userCollection.insert(user, function(err, result) {
					assert.ifError(err);

					if (++c === target) {
						var tDelta = new Date() - tStart;
						var rate = Math.round(target * 1000 / tDelta);
						console.log('Insert tog ' + util.format('%d', tDelta/1000) + 's, dvs ' + rate + ' inserts/s.');
						//db.close();
						//process.exit(code=0);
					}
				});
			}
		}
	});
	
	
//	console.log('Sletter alle dokumenter i collection...');
//	collection.remove({}, function(err, result) {
//		assert.ifError(err);
//		console.log(result); // Integer, antal slettede
//		var tDelta = new Date() - tStart;
//		console.log('Sletning tog ' + util.format('%d', tDelta/1000) + 's.');
//		db.close();
//		process.exit(code=0);
//	});
//	
});


// Eksempel på brug af $push med update.
//var user = {
//	number:		count,
//	longer:		'abcdefghijklmnasdfasdf'
//};
//var query	= {	_id:	queue._id };
//var update	= { $push:	{	users:	user} };
//collection.update(query, update, function(err, result) {
//	assert.ifError(err);
//	//console.log(result);
//}
