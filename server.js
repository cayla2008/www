const express = require('express')
const http = require('http')
const socket = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = socket(server)

app.use(express.static(__dirname + '/public'));   
const usernames = new Map()

io.on('connection',(socket) => {
    console.log('connected');

    socket.on('user login', (username) => {
        if (usernames.has(username)) {
            socket.emit('username-taken') // send event
        } else {
            if (username.length >= 30 || typeof username != 'string') {
                socket.emit('warning')
            } else {
                socket.username = username
                usernames.set(username, socket.id)
                socket.emit('login-succes', socket.id)
            }
        }
    })

    socket.on('join room', (roomId) => {
        socket.join(roomId) 

        io.to(roomId).emit('code-room', {
            code : roomId
        })

        io.to(roomId).emit('room-message', {
            username : socket.username,
            message : 'has join the chat'
        })
    })

    socket.on('chat message', (data) => {
        io.to(data.roomId).emit('room-message', {
            username: socket.username,
            message : data.message
        })
    })

    socket.on('disconnect', () => {
        if (socket.username) {
            console.log(`${socket.username} disconnected`);
            usernames.clear() 
            io.emit('room-message',  {
                username : socket.username,
                message :   `${socket.username} has let the chat.`
            })
        }   
    })
})

const port = 3000 
server.listen(port, (err) => {
    if (err) { console.error(err) }
    console.log(`Server running on port : ${port}`);
})