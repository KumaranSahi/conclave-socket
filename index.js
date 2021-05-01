const io=require('socket.io')(8080,{
    cors:{
        origin:"http://localhost:3000"
    }
})

io.on("connection",(socket)=>{
    console.log("a user connected")
    io.emit("welcome","This is kumaran")
    socket.on("adduser",req=>console.log(req))
})