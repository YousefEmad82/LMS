const express = require('express')
 require('./database/mongoose')
const app = express()
const userRouter = require('./routes/user')
const courseRouter = require('./routes/course')








app.use(express.json())
app.use(userRouter)
app.use(courseRouter)



app.listen('3000',()=>{
    console.log('server is running on port 3000   ')
})