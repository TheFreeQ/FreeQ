/**
 * Module dependencies.
 */
var mongodb		= require('mongodb');
var constants	= require('./constants.js');
var async		= require('async');

/**
 * Shared database connection
 */
var sharedDb;

/**
 * Returns the user Collection object for the queue.
 *
 * @param {Object} queue
 * @returns {Collection}
 */
function getUserCollection(queue) {
	var collectionName	= "usersForQueue" + queue._id.toHexString();
	return sharedDb.collection(collectionName);
}

/**
 * Ensures that the user Collection has the indexes we want. Should only be called when creating a new queue or changing the data model.
 * 
 * @param {Object} queue
 * @param {boolean} dropAllIndexes
 * @returns {undefined}
 */
function setUserCollectionIndexes(queue, dropAllIndexes, callback) {
	var userCollection = getUserCollection(queue);
	var tasks = [];
	// Add a document to the collection to make sure that the collection exists.
	tasks.push(function(callback) {
		userCollection.insert({ number: 0 }, { w: 1 }, callback);
    });
	// Drop all indexes first?
	if (dropAllIndexes) {
		tasks.push(function(callback) {
			userCollection.dropAllIndexes(callback);
		});
    }
	// Create the required indexes
	tasks.push(function(callback) {
		userCollection.ensureIndex({ number: 1 }, { w: 1, unique: false, dropDups: false }, function(err, indexName) {
			if (err)
				return callback(err);

			//console.log('Index has name ' + indexName);
			callback(null, indexName);
		});
    });
	// Remove the empty document from the collection again.
	tasks.push(function(callback) {
		userCollection.remove({ number: 0 }, { w: 1 }, callback);
    });
	// And finally perform the tasks in series.
	async.series(tasks, callback);
}

/**
 * A thin wrapper. Caches the donnection in sharedDb
 *
 * @param {type} dbUrl
 * @param {type} callback
 * @returns {undefined}
 */
exports.connect = function(dbUrl, callback) {
	mongodb.MongoClient.connect(dbUrl, function(err, db) {
		if (err)
			return callback(err);

		sharedDb = db;
		callback(null, db);
	});
};

// Find a queue by ID.
exports.findQueueById = function(qid, callback) {
    var query	= {	_id:	mongodb.ObjectID.createFromHexString(qid) };
	sharedDb.collection("queues").findOne(query, callback);
}

// Find a queue by ID.
exports.findUserById = function(queue, uid, callback) {
    var query			= {	_id:	mongodb.ObjectID.createFromHexString(uid) };
	getUserCollection(queue).findOne(query, callback);
}

// Inserts a new user in the queue
exports.addUserToQueue = function(queue, callback) {
	// Increment queue.latestNewUserNumber;
	// We use findAndModify() to find the new value
    var query	= {	_id:	queue._id };
    var sort	= {};
    var update	= { $inc:	{ latestNewUserNumber: +1 } };
	var options	= { w:		1,		// acknowledges the write
					new:	true,	// Return the modified object
				};
	sharedDb.collection("queues").findAndModify(query, sort, update, options, function(err, updatedQueue) {
		if (err)
			return callback(err);

		queue = updatedQueue; // Let us use the new data.
		// Prepare data for new user.
		var data = {	number:			queue.latestNewUserNumber,
						timeInsert:		new Date(new Date().toISOString()), // Magic conversions to make it ISODate friendly.
						status:			constants.STATUS_IN_QUEUE
					};
		var options	= {	w: 1 };	// acknowledges the write
		getUserCollection(queue).insert(data, options, function(err, users) {
			if (err)
				return callback(err);
			
			callback(null, users[0]);
		});
	});
}

/**
 * Inserts a new queue record in the database.
 * 
 * @param {string} name
 * @param {Date} timePreQueue
 * @param {Date} timeEventStart
 * @param {Date} timeEventStop
 * @param {Function} callback
 * @returns {undefined}
 */
exports.addQueue = function(name, timePreQueue, timeEventStart, timeEventStop, callback) {
	// Prepare data for new user.
	var data = {	name:					name,
					timePreQueue:			timePreQueue,	// Time where users can start entering the queue
					timeEventStart:			timeEventStart,	// Time where redirects to the target server starts
					timeEventStop:			timeEventStop,	// Time where redirects to the target server stops
					latestNewUserNumber:	0,	// Value of number for the last user that was added to the queue.
					nextRedirectUserNumber:	1,	// The highest user.number for which all lower values have been redirected or have left the queue
					countRedirectedUsers:	0,	// Number of unique users redirected to target server
					countRedirects:			0,	// Total number of redirects to target server
					countLeft:				0,	// Total number of users who have left the queue by clicking "leave queue"
					countAbandoned:			0	// Number of users who have left the queue by just closing their browser and not returning in time to be redirected.
				};
	var options	= {	w:	1 };	// acknowledges the write
	sharedDb.collection("queues").insert(data, options, function(err, queues) {
		if (err)
			return callback(err);

		var queue = queues[0];
		// Prepare indexes in user collection for the queue
		setUserCollectionIndexes(queue, false, function(err, indexName) {
			if (err)
				return callback(err);
			
			callback(null, queue);
		});
	});
}

