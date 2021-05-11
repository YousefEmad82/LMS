const express = require('express')
 require('./database/mongoose')
const app = express()
const userRouter = require('./routes/user')
const courseRouter = require('./routes/course')
const fs= require('fs')







app.use(express.json())
app.use(userRouter)
app.use(courseRouter)

//  fs.readFile('C:/Users/youse/Desktop/lms/uploads/a7911ae669c86ddefd5691eb61c05289',{encoding : 'utf8'},(err,data)=>{
//      if(err) throw err
//      console.log(data)

//  })
app.listen('3000',()=>{
    console.log('server is running on port 3000   ')

})