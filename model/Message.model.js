const mongoose=require('mongoose');

const MessageSchema=new mongoose.Schema({
    by:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    },content:{
        type:String,
        required:true
    },conclave:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'conclave'
    },responseOf:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'message'
    }
},{timestamps:true})

const message=mongoose.model("message",MessageSchema)
module.exports=message;