const db=require('./config/Mongoose')
const conclavesdb=require('./model/Conclave.model')
const usersdb=require('./model/User.model')
const messagesdb=require('./model/Message.model')

const io=require('socket.io')(8080,{
    cors:{
        origin:"http://localhost:3000"
    }
})

let users=[]

const addUserToUsersList=(user,conclaveId,socketId)=>{
    const newUser={
        ...user.toObject(),
        conclaveId:conclaveId,
        socketId:socketId,
        email: undefined,
        password: undefined,
    }
    users.push(newUser)
}

const removeUserFromUserList=(id)=>{
    users=users.filter(({_id})=>_id!=id)
}

io.on("connection",(socket)=>{
    
    socket.on("join-conclave",async ({conclaveId,userId})=>{
        const conclave=await conclavesdb.findById(conclaveId)
        const user=await usersdb.findById(userId)
        if(conclave&&user){
            socket.join(conclaveId)
            addUserToUsersList(user,conclaveId,socket.id)
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
            const newMessage=await conclave.execPopulate({path:'messages',populate:([{path:'by'},{path:"responseOf",populate:({path:'by'})}])})
            
            io.in(conclaveId).emit("room-joined",{
                ok:true,
                messages:[...newMessage.messages],
                users:[...users]
            })
        }else{
            io.emit("room-joined",{
                ok:false,
                message:"Room doesn't exist"
            })
        }
    })

    socket.on("send-message",async ({content,conclaveId,userId})=>{
        const conclave=await conclavesdb.findById(conclaveId)
        const user=await usersdb.findById(userId)
        if(conclave&&user){
            const message=await messagesdb.create({
                by:userId,
                content:content,
                conclave:conclaveId,
                responseOf:null
            })
            await conclave.messages.push(message._id)
            await conclave.save()
            await user.messages.push(message._id)
            await user.save()
            const newMessage=await conclave.execPopulate({path:'messages',populate:([{path:'by'},{path:"responseOf",populate:({path:'by'})}])})
            io.in(conclaveId).emit("room-joined",{
                ok:true,
                messages:[...newMessage.messages],
                users:[...users]
            })
        }else{
            io.emit("room-joined",{
                ok:false,
                message:"Room doesn't exist"
            })
        }
    })

    socket.on("send-reply",async ({content,conclaveId,replyId,userId})=>{
        const conclave=await conclavesdb.findById(conclaveId)
        const user=await usersdb.findById(userId)
        if(conclave&&user){
            const message=await messagesdb.create({
                by:userId,
                content:content,
                conclave:conclaveId,
                responseOf:replyId
            })
            await conclave.messages.push(message._id)
            await conclave.save()
            await user.messages.push(message._id)
            await user.save()
            const newMessage=await conclave.execPopulate({path:'messages',populate:([{path:'by'},{path:"responseOf",populate:({path:'by'})}])})
            io.in(conclaveId).emit("room-joined",{
                ok:true,
                messages:[...newMessage.messages],
                users:[...users]
            })
        }else{
            io.emit("room-joined",{
                ok:false,
                message:"Room doesn't exist"
            })
        }
    })

    socket.on("leave-conclave",async ({userId})=>{
        const conclaveId=users.filter(({_id})=>_id==userId)[0].conclaveId
        socket.leave(conclaveId)
        removeUserFromUserList(userId)
        io.in(conclaveId).emit("user-left",{
            ok:true,
            users:[...users]
        })
    })

})