/**
 * Module dependencies.
 */
var mongo		= require('./mongo.js');
var server		= require("./server.js");

/**
 * Config
 */

// Url to MopngoDB. Format: mongodb://[username:password@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[database][?options]]
var dbUrl = 'mongodb://localhost:27017/freeq?maxPoolSize=10';

// Server port
var httpPort = 8888;


// Step one: Connect to database.
mongo.connect(dbUrl, function(err, db) {
	if (err) {
		console.error(err);
		process.exit(1);
	}

	// Step two: Start the HTTP server
	server.listen(httpPort);
});
