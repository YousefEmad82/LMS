const express = require('express')
 require('./database/mongoose')
const app = express()
const userRouter = require('./routes/user')
const courseRouter = require('./routes/course')
const quizRouter = require('./routes/quiz')
const answerRouter = require('./routes/answer')
const fs = require('fs')
const cors = require('cors')
app.use(cors({origin: 'http://localhost:3000'}))









app.use(express.json({extended: true}))
app.use(express.urlencoded({extended: true}))

app.use(userRouter)
app.use(courseRouter)
app.use(quizRouter)
app.use(answerRouter)


app.listen('3000',()=>{

    console.log('server is running on port 3000   ')


    


})

