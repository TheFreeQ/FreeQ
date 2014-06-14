var http = require("http");

function start() {
  function onRequest(request, response) {
    console.log("Request received.");
    response.writeHead(200, {
		'Content-Type': 'text/plain; charset=UTF-8'
	});
    response.write("Hello World");
    response.end();
  }

  http.createServer(onRequest).listen(8888);
  console.log("Server has started.");
}

// Functions which will be available to external callers
exports.start = start;