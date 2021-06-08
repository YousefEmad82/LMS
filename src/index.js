const express = require('express')
 require('./database/mongoose')
const app = express()
const userRouter = require('./routes/user')
const courseRouter = require('./routes/course')
const quizRouter = require('./routes/quiz')
const fs = require('fs')







app.use(express.json({extended: true}))
app.use(express.urlencoded({extended: true}))
app.use(userRouter)
app.use(courseRouter)
app.use(quizRouter)


app.listen('3000',()=>{

    console.log('server is running on port 3000   ')

})