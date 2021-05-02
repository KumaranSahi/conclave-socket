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
    if(users.some(({_id})=>(_id.toString()==user.toObject()._id.toString()))){
        users=users.map(item=>(item._id.toString()==user.toObject()._id.toString())?({
            ...item,
            socketId:socketId
        }):item)
    }else{
        users.push({
            ...user.toObject(),
            conclaveId:conclaveId,
            socketId:socketId,
            email: undefined,
            password: undefined,
        })
    }
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

    socket.on("raise-hand",async ({userId,conclaveAdminId})=>{
        const user=users.filter(({_id})=>_id==userId)[0]
        const conclaveAdmin=users.filter(({_id})=>_id==conclaveAdminId)[0]
        if(conclaveAdmin){
            io.to(conclaveAdmin.socketId).emit("user-raised-hand",{
                ok:true,
                user:user,
                message:"The User has raised hand"
            })
        }else{
            io.to(user.socketId).emit("admin-unavailable",{
                ok:true,
                message:"Seems like the admin is unavailable"
            })
        }
    })

    socket.on("leave-conclave",async ({userId})=>{
        try{
            if(users.filter(({_id})=>_id==userId)[0]){
                const conclaveId=users.filter(({_id})=>_id==userId)[0].conclaveId
                socket.leave(conclaveId)
                removeUserFromUserList(userId)
                io.in(conclaveId).emit("user-left",{
                    ok:true,
                    users:[...users]
                })
            }
        }catch(error){
            console.log(error)
        }
    })

    socket.on("accept-raised-hand",async ({userId})=>{
        const user=users.filter(({_id})=>_id.toString()===userId.toString())[0]
        if(user){
            io.to(user.socketId).emit("raised-hand-accepted",{
                ok:true,
                message:"You can talk now"
            })
        }
    })

    socket.on("reject-raised-hand",async ({userId})=>{
        const user=users.filter(({_id})=>_id.toString()===userId.toString())[0]
        if(user){
            io.to(user.socketId).emit("raised-hand-rejected",{
                ok:true,
                message:"You can't talk now"
            })
        }
    })

    socket.on("close-conclave",async ({conclaveId})=>{
        try{
            console.log(conclaveId)
            await conclavesdb.findByIdAndUpdate(conclaveId,{active:false})
            const conclaves=await conclavesdb.find()
            io.in(conclaveId).emit("conclave-closed",{
                ok:true,
                conclaves:conclaves,
                message:"You can talk now"
            })
        }catch(error){
            console.log(error)
        }
    })
})