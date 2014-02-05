#!/usr/bin/env node

var opt = require('optimist')
  .usage('Start dashboard server\n$0 [config.json]\n\nconfig.json can be passed in as local or remote file.\n\nConfig file can also be set by environment variable CUBE_REMOTE_FILE.\nAlternatively, the JSON configuration can be set in an environment variable, DASHBOARD_CONFIG.')
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

var fs = require('fs');
var express = require('express');
var crypto = require('crypto');

var checkSignature = function(signature, key, payload) {
  var signer = crypto.createHmac('sha256', key);
  var hmac = signer.update(payload).digest('base64');
  return signature == hmac;
}

var getSignedRequest = function(request) {
  var signedRequest = request.body.signed_request;
  if (! signedRequest) {
    signedRequest = request.cookies.signed_request;
  }
  return signedRequest;
};

var parseSignedRequest = function(signedRequest) {
    if (!signedRequest) {
      throw "No signed request found";
    }
    var array = signedRequest.split('.');
    if (array.length != 2) {
      throw "Incorrectly formatted signed request";
    }
    var sr = {
      signature: array[0],
      payload: array[1]
    };
    return sr;
}

var deserializePayload = function(payload) {
  var jsonString = (new Buffer(payload, 'base64')).toString();
  var object = JSON.parse(jsonString);
  return object;
};

var checkSignedRequest = function(request, response, next) {
  try {
    var signedRequest = getSignedRequest(request);

    var consumerSecret = process.env.CANVAS_CONSUMER_SECRET;
    var validEmailDomain = process.env.VALID_EMAIL_DOMAIN;

    var sr = parseSignedRequest(signedRequest);
    var signature = sr.signature;
    var payload = sr.payload;

    if (!checkSignature(signature, consumerSecret, payload)) {
      throw "Invalid Signature";
    }

    if (validEmailDomain) {
      var emailRegex = new RegExp('@' + validEmailDomain + '$');
      payload = deserializePayload(payload);
      if (! emailRegex.test(payload.context.user.email)) {
        throw "Invalid User";
      }
    }

    var sslEnabled = request.headers['x-forwarded-for'] === 'https';
    response.cookie('signed_request', signedRequest, { secure: sslEnabled });
    next();
  } catch(e) {
    response.locals.layout = false;
    response.render('unauthorized', { error: e });
  }
}

var html = function(request, response, file) {
  try {
    var signedRequest = getSignedRequest(request);
    var sr = parseSignedRequest(signedRequest);
    var payload = sr.payload;
    var jsonString = (new Buffer(payload, 'base64')).toString();
    response.locals.layout = false;
    response.render(file, {
      signed_request: signedRequest,
      json_string: jsonString
    });
  } catch (e) {
    response.send(500, { error: 'unexpected error' });
  }
};

var startServer = function(err, configStr) {
  if (err) throw err;
  var config = JSON.parse(configStr);
  if (argv.host) {
    config.host = argv.host;
  }
  var app = express();

  app.set('views', __dirname + '/../public');
  app.set('view cache', false);
  app.set('view engine', 'html')
  app.engine('html', require('uinexpress').__express)

  app.use(express.bodyParser());
  app.use(express.cookieParser());

  app.all('*', checkSignedRequest);

  app.get('/config.json', function(request, response) {
     response.json(config);
  });
  if (config.json) {
    app.get('/ui/images/icon.png', function(request, response) {
      fs.createReadStream(config.icon).pipe(response);
    });
  }
  app.all('/', function(request, response) { html(request, response, 'index') });
  app.all('/index.html', function(request, response) { html(request, response, 'index') });
  app.all('/events.html', function(request, response) { html(request, response, 'events') });

  app.use(express.static(__dirname + '/../public'));
  app.listen(argv.port);

  console.log('Server started on port ' + argv.port);
};

var configFile = argv._[0];
if (typeof(configFile) == 'undefined' && typeof(process.env.CUBE_REMOTE_FILE) != 'undefined') {
  configFile = process.env.CUBE_REMOTE_FILE;
}

if (configFile) {
  fs.readFile(configFile, 'utf8', startServer);
} else if (typeof(process.env.DASHBOARD_CONFIG) != 'undefined') {
  startServer(null, process.env.DASHBOARD_CONFIG);
} else {
  opt.showHelp();
  process.exit();
}
