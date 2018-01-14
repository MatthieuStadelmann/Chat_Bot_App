const express = require('express')
const http = require('http');
const app = express()
const server = http.createServer(app);
const io = require('socket.io').listen(server);
const ai = require('./api');
const dialogFlow = ai.dialogFlow;

const redis = require('redis');
const nconf = require('nconf');

nconf.argv().env().file('keys.json');

const client = redis.createClient(nconf.get('redisPort') || '6379', nconf.get('redisHost') || '127.0.0.1', {
  'auth_pass': nconf.get('redisKey'),
  'return_buffers': true
}).on('error', (err) => console.error('ERR:REDIS:', err));

app.use(express.static('./public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

//Socket.IO

io.on('connection', function(socket) {

  new Promise((resolve, reject) => {

    client.lrange('messagesList', 0, 10, function(err, data) {
      if (err) {
        reject();
      } else {
        console.log('The value of the "messagesList" ' + data);
        resolve(data)
      }
    })
  }).then((data) => {
    data.forEach((message) => {
      io.emit('chat message', message.toString());
    });
  });
  socket.on('chat message', function(msg) {

    client.rpush("messagesList", msg, function(err, data) {
      if (err) {
        return console.log(err);
      }
      console.log('the message key was successfully set', msg);
    });

    io.emit('chat message', msg);

    dialogFlow(msg).then((resp) => {

      client.rpush("messagesList", resp, function(err, data) {
        if (err) {
          return console.log(err);
        }
        console.log('the response key was successfully set', resp);
      });

      io.emit('chat message', resp);
    });

    //When client disconnect show the value of the conv:
    socket.on('disconnect', function() {});
    console.log('user disconnected');
  });
});
server.listen(process.env.PORT || 3000, () => console.log('listening on port 3000!'))
