const express = require('express')
const http = require('http');
const app = express()
const server = http.createServer(app);
const io = require('socket.io').listen(server);
const ai = require('./api');
const dialogFlow = ai.dialogFlow;

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static('./public'));



io.on('connection', function(socket) {

  socket.on('chat message', function(msg) {
    io.emit('chat message', msg);
    dialogFlow(msg).then((resp) => {
      io.emit('chat message', resp);
    });
  });
  socket.on('disconnect', function() {
    console.log('user disconnected');
  });
});

server.listen(process.env.PORT || 3000, () => console.log('listening on port 3000!'))
