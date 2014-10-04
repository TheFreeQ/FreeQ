/**
 * Module dependencies.
 */
var express			= require('express');
var app				= express();
//var logger			= require('morgan');
//var cookieParser	= require('cookie-parser');
//var bodyParser		= require('body-parser');
//var methodOverride	= require('method-override');
var queue			= require("./queue.js");



// Config
app.disable('case sensitive routing');
app.enable('strict routing');
app.set('view engine',				'jade');
app.set('views',					__dirname + '/views');

//app.use(methodOverride('_method'));		// Muligvis nødvendig for DELETE support
//app.use(cookieParser());
//app.use(bodyParser.urlencoded({ extended: true }));
//app.use(express.static(__dirname + '/public'));

// Queue pages
app.get('/queue/test',			queue.test);	// XXX For diverse temporary code
app.get('/queue/:qid',			queue.enter);	// The user is placed in the queue, assigned a queue number.
app.get('/queue/:qid/:uid',		queue.status);	// AJAX-endpoint for status data (or a websocket)- Returns the users place in the queue (127 of 1233), expected time left, redirect URL including a hash
app.delete('/queue/:qid/:uid',	queue.leave);	// When a user chooses to leave the queue, releasing his place.

// Load data from the parameters before the pages are handled
app.param('qid',				queue.loadQueue);
app.param('uid',				queue.loadUser);

// Export the app
module.exports = app;
