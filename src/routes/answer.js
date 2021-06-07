const express = require('express')
const router = express.Router()
const Answer = require('../database/models/answer')
const Quiz =require('../database/models/quiz')
const Score=require('../database/models/score')
const auth = require('../middlwares/auth')
const Course = require('../database/models/course')
const Enroll = require('../database/models/enroll')


// save answers 
// in this router we will get in req.body  
// {
//     "quizID":"60bd11d476baba02f43615f7",
//     "Answers":[
//         {
//             "question":"how are you",
//             "answer":"fine"
//         },{
//             "question":"how old are you",
//             "answer":"23"
//         }
//     ]
    
    
// }
// and the answers and score will save in the database ,then i return the total score
router.post('/submit',auth,async (req, res) =>{
    
    try {
        const course = await Course.findOne({code : req.body.course_code}   )
        if(!course){
            return res.status(404).send('can not find the course')
        }
        const enroll = await Enroll.findOne({
            user_id  : req.user._id,
            course_id : course._id
        })
        
        if(!enroll){
            return res.status(403).send('unauthorized')
        }
        const {course_code} = req.body
        const { Answers } = req.body
        const { quizID } = req.body

  
        const answer = await Answer.create({
            Answers,
            quizID,
            course_code,
            student_code : req.user.code
        })



        const quiz= await Quiz.findOne({_id:quizID})
        var sum=0
        quiz.questions.forEach(element => {
            
            Answers.forEach(ans=>{
                
                if(element.question===ans.question){

                    if(element.answer===ans.answer){
                        sum+=1

                    }
                     
                }
                
            })

        })
        const totalscore =await  Score.create({
                    quiz_id:quizID,
                    score:sum,
                    course_code : req.body.course_code,
                    student_code : req.user.code
                })
        
        
     
       
        
        
         res.status(201).send(totalscore)

    } catch (error) {
         res.status(500).send(error.message)
         
    }
})
//edit answers and send the total score
router.patch('/editAnswer/:course_code',auth,async (req,res)=>{
    
    const updates = Object.keys(req.body)
    const allowedUpdates = ["Answers","quizID"]
    const isValidOperation = updates.every((update)=> allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send({error : 'Invalid updates'})
    }
    const {quizID }= req.body
    const{ Answers }=req.body
    const score = await Score.deleteOne({
    quiz_id:quizID,
    student_code : req.user.code,
    course_code : req.params.course_code

})


    try{
        const course = await Course.findOne({code : req.params.course_code}   )
        if(!course){
            return res.status(404).send('can not find the course')
        }
        const enroll = await Enroll.findOne({
            user_id  : req.user._id,
            course_id : course._id
        })
        if(!enroll){
            return res.status(403).send('unauthorized')
        }
        const answer = await Answer.findOne({quizID})
        
        updates.forEach((update) => answer[update] = req.body[update])
        await answer.save()

        const quiz= await Quiz.findOne({_id:quizID})
        var sum=0
        quiz.questions.forEach(element => {
            
            Answers.forEach(ans=>{
                
                if(element.question===ans.question){

                    if(element.answer===ans.answer){
                        sum+=1

                    }
                     
                }
                
            })

        })
        const totalscore =await  Score.create({
                    quiz_id:quizID,
                    score:sum,
                    course_code : req.params.course_code,
                    student_code : req.user.code
                })
        
        
     

        if(!answer){
            return res.status(404).send()
        }

        res.status(201).send(totalscore)


    }catch(e){
        res.status(400).send(e)

    }
})




module.exports = router