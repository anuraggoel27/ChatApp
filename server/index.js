const express=require('express');
const socketio=require('socket.io');
const cors= require('cors');
const http= require('http');
const router= require('./router');

const PORT=process.env.PORT || 5000;
const app=express();
const {addUser, removeUser,getUser, getUsersInRoom} = require('./users');

const server= http.createServer(app);
const io = require("socket.io")(server, {
    cors: {
      origin: `http://localhost:3000`,
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"],
      credentials: true
    }
  });

app.use(cors());
app.use(router);

io.on("connection",(socket)=>{
    socket.on("join",({name,room},callback)=>{
        const {error, user}=addUser({id:socket.id,name,room});
        if(error){
            return callback(error);
        }
        socket.join(user.room);
        socket.emit("message",{user:"admin", text:`${user.name}, Welcome to the room ${user.room}`});
        socket.broadcast.to(user.room).emit("message",{user:"admin",text:`${user.name} has joined the room`});
        io.to(user.room).emit("roomData",{room:user.room, users:getUsersInRoom(user.room)})
        callback();
    });
    socket.on("sendMessage",(message,callback)=>{
        const user=getUser(socket.id);
        io.to(user.room).emit("message",{user:user.name,text:message});
        io.to(user.room).emit("roomData",{room:user.room, text:message});
        callback();
    });
    socket.on("disconnect",()=>{
        const user=removeUser(socket.id);
        if(user){
            io.to(user.room).emit("message",{user:"admin", text: `${user.name} has left.`})

        }
    })
});



server.listen(PORT, ()=>{
    console.log(`Server has started on port ${PORT}`);
})