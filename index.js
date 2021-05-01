const db=require('./config/Mongoose')
const conclavesdb=require('./model/Conclave.model')
const usersdb=require('./model/User.model')
const messagesdb=require('./model/Message.model')

const io=require('socket.io')(8080,{
    cors:{
        origin:"http://localhost:3000"
    }
})

io.on("connection",(socket)=>{
    
    socket.on("join-conclave",async ({conclaveId,userId})=>{
        const conclave=await conclavesdb.findById(conclaveId)
        const user=await usersdb.findById(userId)
        if(conclave&&user){
            socket.join(conclaveId)
            const message=await messagesdb.create({
                by:userId,
                content:`${user.name} has joined the conclave`,
                conclave:conclaveId,
                responseOf:null
            })
            await conclave.messages.push(message._id)
            await conclave.save()
            await user.messages.push(message._id)
            await user.save()
            socket.broadcast.to(conclaveId).emit("user-joined-to-conclave",{
                id:userId,
                name:user.name
            })
            const newMessage=await conclave.execPopulate({path:'messages',populate:({path:'by'})})
            io.emit("room-joined",{
                ok:true,
                messages:[...newMessage.messages],
            })
        }else{
            io.emit("room-joined",{
                ok:false,
                message:"Room doesn't exist"
            })
        }
    })

})