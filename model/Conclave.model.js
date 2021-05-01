const mongoose=require('mongoose');

const ConclaveSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },description:{
        type:String
    },messages:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'message'
    }],active:{
        type:Boolean
    },admin:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    },visibility:{
        type:String
    }

},{timestamps:true})

const conclave=mongoose.model('conclave',ConclaveSchema);
module.exports=conclave;