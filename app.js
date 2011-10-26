
/**
 * Module dependencies.
 */

var express = require('express');
var expat = require('node-expat');
var $ = require('jquery'); 
var fs = require('fs');
//var form = require('connect-form');

var parser = new expat.Parser("UTF-8");
var app = express.createServer();

var dataObject = {};
var tempValue = {};

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.compiler({ src: __dirname + '/public', enable: ['sass'] }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
    res.render('index.jade', { title: 'My Site' });
});

app.post('/graph', function(req, res){
  // clear old data.
  dataObject = {};
  var body = '';
  var header = '';
  var content_type = req.headers['content-type'];
  var boundary = content_type.split('; ')[1].split('=')[1];
  var content_length = parseInt(req.headers['content-length']);
  var headerFlag = true;
  var filename = 'dummy.bin';
  var filenameRegexp = /filename="(.*)"/m;
  console.log('content-type: ' + content_type);
  console.log('boundary: ' + boundary);
  console.log('content-length: ' + content_length);

  req.on('data', function(raw) {
    console.log('received data length: ' + raw.length);
    var i = 0;
    while (i < raw.length)
      if (headerFlag) {
        var chars = raw.slice(i, i+4).toString();
        if (chars === '\r\n\r\n') {
          headerFlag = false;
          header = raw.slice(0, i+4).toString();
          console.log('header length: ' + header.length);
          console.log('header: ');
          console.log(header);
          i = i + 4;
          // get the filename
          var result = filenameRegexp.exec(header);
          if (result[1]) {
            filename = result[1];
          }
          console.log('filename: ' + filename);
          console.log('header done');
        }
        else {
          i += 1;
        }
      }
      else { 
        // parsing body including footer
        body += raw.toString('binary', i, raw.length);
        
        parser.parse(raw.toString('binary', i, raw.length));
        i = raw.length;
        console.log('actual file size: ' + body.length);
      }
  });

  req.on('end', function() {
    // removing footer '\r\n'--boundary--\r\n' = (boundary.length + 8)
    body = body.slice(0, body.length - (boundary.length + 8))
    console.log('final file size: ' + body.length);
    //parser.parse(body);
    //fs.writeFileSync(filename, body, 'binary');
    console.log('done');
    res.send(JSON.stringify(dataObject));
  })
});  

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

parser.addListener('startElement', function(name, attrs) {
  if (name==='httpSample') {
    //console.log(['startElement', name, attrs]);
    tempValue = {};
    tempValue.name = attrs.lb;
    tempValue.time = [attrs.ts, attrs.t];
  }
});
parser.addListener('endElement', function(name) {
  if (name==='httpSample') {
    if (tempValue.name) {
      if (!dataObject[tempValue.name]) {
        dataObject[tempValue.name] = {};
        if (!dataObject[tempValue.name].data) {
          dataObject[tempValue.name].data = [];
        }
      }
      dataObject[tempValue.name].data.push(tempValue.time);
    }
  } else if (name==='testResults') {
    console.log(JSON.stringify(dataObject));
  }
});

parser.addListener('text', function(s) {
  var trimmed = $.trim(s);
  if (trimmed.length > 0) {
    tempValue.url = trimmed;
  }
});