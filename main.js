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

const {GoogleAuth} = require('google-auth-library');

// load the environment variable with our keys
const keysEnvVar = process.env['CREDS'];
if (!keysEnvVar) {
  throw new Error('The $CREDS environment variable was not found!');
}
const keys = JSON.parse(keysEnvVar);

async function main() {
  const auth = new GoogleAuth();
  // load the JWT or UserRefreshClient from the keys
  const client = auth.fromJSON(keys);
  client.scopes = ['https://www.googleapis.com/auth/cloud-platform'];
  await client.authorize();
  const url = `https://www.googleapis.com/dns/v1/projects/${keys.project_id}`;
  const res = await client.request({url});
  console.log(res.data);
}

main().catch(console.error);

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
