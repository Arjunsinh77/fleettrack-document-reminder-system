const mongoose=require('mongoose');

mongoose.connect(`mongodb://127.0.0.1:27017/TruckLogin`);

const userSchema=mongoose.Schema({
    username:String,
    email:String,
    password:String,

    profilepic:{
        type:String,
        default:"def.png"
    }
    
})

module.exports=mongoose.model("User",userSchema);