const io = require("socket.io")(8900, {
  cors: {
    origin: "http://localhost:3001",
  },
});

let users = [];

const botName = 'Osiz';

const moment = require('moment');

function formatMessage(username, text) {
  return {
    username,
    text,
    time: moment().format('h:mm a')
  };
}

const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
    console.log(users)
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  console.log("Get User " + userId)
  console.log(users)
  return users.find((user) => user.userId === userId);
};

var roomUsers = [];

// Join user to chat
function userJoin(id, username, room) {
  const user = { id, username, room };

  roomUsers.push(user);

  return user;
}

// Get current user
function getCurrentUser(id) {
  console.log("Chat " + roomUsers)
  return roomUsers.find(user => user.id === id);
}

// Get room users
function getRoomUsers(room) {
  return roomUsers.filter(user => user.room === room);
}

io.on("connection", (socket) => {
  //when ceonnect
  console.log("a user connected.");

  //take userId and socketId from user
  socket.on("addUser", (userId) => {
    console.log('UserId ' + userId + ' , SocketId ' + socket.id)
    addUser(userId, socket.id); 
    io.emit("getUsers", users);
  });

  //send and get message
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    console.log("SenderId " + receiverId)
    console.log("ReceiverID " + receiverId)
    const user = getUser(receiverId);
    io.to(user.socketId).emit("getMessage", {
      senderId,
      text,
    });
  });

  socket.on('joinRoom', ({ user, room }) => {
    console.log("Room Users " + user + room)
    const userr = userJoin(socket.id, user, room);

    console.log("Room Users " + roomUsers)

    socket.join(userr.room);

    // Welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome to Chat Rooms!'));

    // Broadcast when a user connects
    socket.broadcast
      .to(userr.room)
      .emit(
        'message',
        formatMessage(botName, `${userr.username} has joined the chat`)
      );

    // Send users and room info
    io.to(userr.room).emit('roomUsers', {
      room: userr.room,
      users: getRoomUsers(userr.room)
    });
  });

  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    console.log("Chat " + JSON.stringify(socket.id))
    const user = getCurrentUser(socket.id);
    console.log("Chat " + user)
     console.log(JSON.stringify(msg))
    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  //when disconnect
  socket.on("disconnect", () => {
    console.log("a user disconnected!");
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});
