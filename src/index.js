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
const csvtojson = require('csvtojson')
const jsontocsv = require('json-2-csv')










app.use(express.json({extended: true}))
app.use(express.urlencoded({extended: true}))

app.use(userRouter)
app.use(courseRouter)
app.use(quizRouter)
app.use(answerRouter)



function isLetter(str) {
    if( str.length === 1 && str.match(/[a-z]/i)){
        return true
    }
    return false
  }
app.listen('3000',async()=>{

    console.log('server is running on port 3000   ')
    // const users = await csvtojson().fromFile("./uploads/password")
    // const usersFirst =[]
    // for(let i=0;i<users.length;i++){
    //     usersFirst.push({code : users[i].login.password})
    // } 
    // console.log(usersFirst)
    // const userSecond = []
    //      usersFirst.forEach((user)=>{
    //    if( user.code[0].length === 1 && user.code[0].match(/[a-z]/i)){
    //        userSecond.push(user)
    //    }
    // })
    // console.log(userSecond[1])
    // //fs.writeFileSync('uploads/codes_array',JSON.stringify(userSecond))
//     const emailBuffer = fs.readFileSync('uploads/emails_array')
//     const emailJason = emailBuffer.toString()
//     const emailJson = JSON.parse(emailJason)

//     const codeBuffer = fs.readFileSync('uploads/codes_array')
//     const codeJason = codeBuffer.toString()
//     const codeJson = JSON.parse(codeJason)  
    
//     const  nameBuffer = fs.readFileSync('uploads/names_array')
//     const nameJason = nameBuffer.toString()
//     const nameJson = JSON.parse(nameJason)
    
//     const final = []
//     for(let i=762;i<782;i++){
//         final.push({
//             name : nameJson[i].name,
//             email : emailJson[i].email,
//             code : codeJson[i].code,
//             role : 'instructor',
            
           

//         })
//     } 
//     fs.writeFileSync('uploads/instructors',JSON.stringify(final))
//    console.log(final.length)
 
// const emailBuffer = fs.readFileSync('uploads/instructors')
//     const emailJason = emailBuffer.toString()
//     const emailJson = JSON.parse(emailJason)


// const csv = jsontocsv.json2csv(emailJson,(err,csv)=>{
//     fs.writeFileSync('uploads/instructors.csv', csv);


// })
    
})

