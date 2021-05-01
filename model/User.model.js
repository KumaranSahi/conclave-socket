const mongoose=require('mongoose')

const UserSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },email:{
        type:String,
        required:true,
        unique:true
    },password:{
        type:String,
        required:true
    },createdConclaves:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'conclave'
    }],bookmarkedConclaves:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'conclave'
    }],messages:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'message'
    }]
})

const user=mongoose.model('user',UserSchema);
module.exports=user;