#!/usr/bin/env node

var opt = require('optimist')
  .usage('Start dashboard server\n$0 <config.json>')
  .demand(1)
  .options('h', {
    desc: 'Show help info',
    alias: 'help',
    type: 'boolean'
  })
  .options('p', {
    desc: 'Port to run server',
    alias: 'port',
    default: 8000
  })
  .options('H', {
    desc: 'Cube host (overrides config)',
    alias: 'host'
  });

var argv = opt.argv;

if (argv.help) {
  opt.showHelp();
}

var static = require('node-static');
var path = require('path');
var fs = require('fs');
var http = require('http');
var url = require('url');

var publicPath = path.join(__dirname, '../public');
var file = new(static.Server)(publicPath);

var configFile = argv._[0];

var startServer = function(err, configStr) {
  if (err) throw err;
  var config = JSON.parse(configStr);
  if (argv.host) {
    config.host = argv.host;
    configStr = JSON.stringify(config);
  }
  require('http').createServer(function (request, response) {
    if (request.url == '/config.json') {
      response.setHeader('Content-Type', 'application/json');
      response.end(configStr);
    } else if (config.icon && request.url == '/ui/images/icon.png') {
      fs.createReadStream(config.icon).pipe(response);
    } else {
      request.addListener('end', function () {
        file.serve(request, response);
      });
    }
  }).listen(argv.port);
  console.log('Server started on port ' + argv.port);
};


var readLocalOrRemoteFile = function(filename, callback){
  console.log("configFile: " + configFile);
  try{
    fs.lstatSync(filename);
    fs.readFile(filename, 'utf8', callback);
  }catch(e){
    http.get(options, function(res) {
      console.log("Got response: " + res.statusCode);
      
      res.on("data", function(chunk) {
        console.log("BODY: " + chunk);
        callback();
      });
    }).on('error', function(e) {
      throw(e);
    });
  }
};

readLocalOrRemoteFile(url.parse(configFile), startServer);
