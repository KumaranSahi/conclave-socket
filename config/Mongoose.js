const mongoose=require('mongoose');

mongoose.connect("mongodb+srv://Kumaran:9NrkYovgsOGbrHFL@conclave.fellc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true});
const db=mongoose.connection;

db.on('error', console.error.bind("Something went wrong with the Mongodb Server"));

db.once("open",()=>console.log("Connection extablished with database"))

module.exports=db;