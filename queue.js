/**
 * Module dependencies.
 */
var mongo		= require('./mongo.js');

// Handle the :qid parameter
exports.loadQueue = function(req, res, next, qid) {
	mongo.findQueueById(qid, function(err, queue) {
		if (err) {
			next(err);
		}
		else if (queue) {
			req.queue = queue;
			next();
		}
		else {
			next(new Error('Unknown Queue-ID.'));
		}
	});
};

// Handle the :uid parameter
exports.loadUser = function(req, res, next, uid) {
	if ( ! req.queue) {
		next(new Error('Cannot load user without a queue.'));
	}
	mongo.findUserById(req.queue, uid, function(err, user) {
		if (err) {
			next(err);
		}
		else if (user) {
			req.user = user;
			next();
		}
		else {
			next(new Error('Unknown User-ID.'));
		}
	});
};

// The user is placed in the queue, assigned a queue number.
// Detects if the user is already in the queue.
exports.enter = function(req, res, next) {
	// Detect XXX

	// Add new user
	mongo.addUserToQueue(req.queue, function(err, user) {
		if (err)
			next(err);

		console.log('Ny bruger:');
		console.log(user);
		res.send('XXX new user ' + user.number + '\n');
	});
};

// AJAX-endpoint for status data (or a websocket)- Returns the users place in the queue (127 of 1233), expected time left, redirect URL including a hash
exports.status = function(req, res) {
	res.send('XXX: status for user number ' + req.user.number + '\n');
};

// When a user chooses to leave the queue, releasing his place.
exports.leave = function(req, res) {
	res.send('XXX Elvis has left the building!');
};

// XXX Debug code
exports.test = function(req, res, next) {
	mongo.addQueue('Smuk Fest 2015', new Date('2014-10-01'), new Date('2014-11-01'), new Date('2015-01-01'), function(err, queue) {
		if (err)
			next(err);

		console.log(queue);
		res.send('XXX Testing, one, two!\n' + queue.toString());
	});
};
