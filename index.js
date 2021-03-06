const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

var cors = require('cors');
const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: [ "GET", "POST" ]
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  
  console.log(`(${socket.id}) Connected`);

  /*******************************
  * HOSTS
  ********************************/

  socket.on('new_room', (name) => {

    // Verifying if room already exists
    if(io.sockets.adapter.rooms.get(name) != null) {
      console.log(`(${socket.id}) Tried to create room '${name}' but the name has already been taken.`);
      socket.emit("status", {state:"error", msg:"Error: room name already taken. Choose another one."});
    } else {
      socket.join(name);
      console.log(`(${socket.id}) New room created with name '${name}'`);
      socket.emit("room_created");
    }
  });

  socket.on('join_room', (name) => {

    if(io.sockets.adapter.rooms.get(name) == null) {
      console.log(`(${socket.id}) Tried to join room '${name}' but the room does not exist.`);
      socket.emit("status", {state:"error", msg:"Error: room does not exist. Try again."});
    } else {
      socket.join(name);
      console.log(`(${socket.id}) Joined room '${name}'`);
      socket.emit("room_joined");
    }
  });
  
  socket.on('update_word', (payload) => {
    socket.to(payload.room).emit("word_updated", payload.word);
    console.log(`(${socket.id}) Update word on room ${payload.room}`);
  });

  socket.on('new_guess', (payload) => {
    socket.to(payload.room).emit('new_guess_to_host', payload.guess);
    console.log(`(${socket.id}) Sending the following gues to host: '${payload.guess.definition}' on room '${payload.room}'`);
  });

  socket.on("no_more_guesses", (payload) => {
    socket.to(payload.room).emit("guess_time_out");
  });

});

server.listen(process.env.PORT || 8080, () => {
  console.log(`listening on *:${process.env.PORT || 8080}`);
});

