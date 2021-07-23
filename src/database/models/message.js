const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    sendername : {
        type:String,
        trim:true

    },
    roomname : {
        type:String,
        trim:true
    },
    messagetext : {
        type:String
    },
    sendingtime: {
        type:String
    }
   
})
const Message =mongoose.model('Message',messageSchema)
module.exports=Message