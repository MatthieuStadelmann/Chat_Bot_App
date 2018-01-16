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
  //Welcome message
    io.emit('chat message', 'Welcome to Grover! Are you interested in computers, wearables, phones, smart homes, drones or gaming?');

  new Promise((resolve, reject) => {
//On connection get previous messages from Redis
    client.lrange('messagesList', 0, 99, function(err, data) {
      if (err) {
        reject();
      } else {
        console.log('The value of the "messagesList" ' + data);
        resolve(data)
      }
    })
  }).then((data) => {
//Send the previous messages
    data.forEach((message) => {
      io.emit('chat message', message.toString());
    });
  });

  socket.on('chat message', function(msg) {
//on chat messages, add message to Redis
    client.rpush("messagesList", msg, function(err, data) {
      if (err) {
        return console.log(err);
      }
      console.log('the message key was successfully set', msg);
    });

    io.emit('chat message', msg);
//send the message to the chatbot
    dialogFlow(msg).then((resp) => {
//add the chatbot response to redis
      client.rpush("messagesList", resp, function(err, data) {
        if (err) {
          return console.log(err);
        }
        console.log('the response key was successfully set', resp);
      });
//send the chatbot response to the client
      io.emit('chat message', resp);
    });

    socket.on('disconnect', function() {});
    console.log('user disconnected');
  });
});
server.listen(process.env.PORT || 3000, () => console.log('listening on port 3000!'))
