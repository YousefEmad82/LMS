const http = require('http')
const express = require('express')
const path = require('path')
// const socketio = require('socket.io')
const Filter =require('bad-words')
const moment = require('moment')
require('./db/mongoose')

const Message = require('./database/models/message')
const {generateMessage } = require('./utlis/messages')
const {addUser,removeUser,getUser,getUsersInRoom} = require('./utlis/users')

const app=express()
const port = process.env.PORT || 8000

// const server =http.createServer(app)
const io = require('socket.io')(port,{
    cors: {
        origin: 'http://localhost:3000',
    }
})
const cors = require('cors')
const sortById = (i,j)=>{
    if (i._id < j._id){
        return -1
    }
    else if (i._id > j._id){
        return 1
    }
    else {
        return 0
    }
}
app.use(cors({origin: 'http://localhost:3000'}))

//trying database
app.use(express.json())
// app.post('/messages',(req,res)=>{
//     const message = new Message(req.body)
//     message.save().then(()=>{
//         res.send(message)
//     }).catch(()=>{

//     })

// })
io.on('connection',(socket)=>{
    console.log('New websocket connection')

    socket.on('join',(options,callback)=>{
        
     const {error,user} = addUser({id:socket.id,...options})
   
     if(error){
         return callback(error)

     }

        socket.join(user.room)

       

        // socket.emit('messagewelcome',generateMessage('Admin','Welcome!'))
        
        
        // socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!`))

    
        callback()
         
    })

    socket.on('sendMessage',(message,callback)=>{
        const user = getUser(socket.id)
        const filter= new Filter()

        if(filter.isProfane(message)){
            return callback('Profenity is not allowed!')
        }
console.log(user.room)
       io.to(user.room).emit('message',generateMessage(user.username,message))
       const {createdAt} = generateMessage(user.username,message)
       const newMessage = new Message({
        sendername:user.username,
        roomname:user.room,
        messagetext:message,
        sendingtime : moment(createdAt).format(' DD:MMM:YYYY h:mm a')
    })
    newMessage.save()
       callback('Delivered!')
   })

   socket.on('disconnect',()=>{
       const user = removeUser(socket.id)
       if(user){
        io.to(user.room).emit('roomData',{
            room:user.room,
            users: getUsersInRoom(user.room)
        })

       }
       
   })

   socket.on('chatHistory',(history)=>{
    Message.find({'roomname':history},(error,docs)=>{
        if(error){
            return handleError(error)
        }
        // console.log(docs)
        docs.sort(sortById)
        socket.emit('returnChatHistory',docs)
       //  console.log(docs)
    }).sort({'sendingtime':-1})
})
socket.on('askroomData',(room)=>{
    socket.emit('roomData',{
        room: room,
        users: getUsersInRoom(room)
        
    })
})

})




// server.listen(8080, () => {
//     console.log('Server is up on port 8080s.')
// })

