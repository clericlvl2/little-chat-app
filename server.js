const express = require('express');
const http = require('http');
const path = require('path');
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;
const { Server } = require('socket.io');
const io = new Server(server);
const activeUsers = [];

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

server.listen(port, () => {
    console.log('listening port 3000')
});

const addActiveUser = function(userInfo) {
    const isOnline = activeUsers.some(item => item.id === userInfo.id);
    if (!isOnline) {
        activeUsers.push({id: userInfo.id, name: userInfo.name});
    }
}

io.on('connection', (socket) => {
    socket.on('userConnected', newUser => {
        addActiveUser(newUser);
        io.emit('updateUsers', activeUsers);
    })
    socket.on('disconnect', () => {
        activeUsers.length = 0;
        io.emit('areYouAlive');
    });
    socket.on('iAmAlive', userInfo => {
        addActiveUser(userInfo);
        io.emit('updateUsers', activeUsers);
    })
    socket.on('chatMessage', msg => {
        socket.broadcast.emit('chatMessage', msg);
    });
    socket.on('someoneIsTyping', typingState => {
        socket.broadcast.emit('someoneIsTyping', typingState);
    });
    socket.on('userParametersChanged', updatedUser => {
        activeUsers
          .find(user => user.id === updatedUser.id)
          .name = updatedUser.name;
        io.emit('updateUsers', activeUsers);
        io.emit('updateMessages', updatedUser);
    });
});

