import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName :{type :String , require: true},
    lastName :{type :String , require: true},
    userName : {type : String , require : true , unique : true},
    image :{type :String},
    email :{type :String , require: true , unique : true},
   password :{type :String , require: true },

} , {timestamps : true})

export const User = mongoose.model("User" , userSchema)