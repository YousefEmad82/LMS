const express = require('express')
const router = express.Router()
const Answer = require('../database/models/answer')
const Quiz =require('../database/models/quiz')
const Score=require('../database/models/score')
const auth = require('../middlwares/auth')
const Course = require('../database/models/course')
const Enroll = require('../database/models/enroll')
const mongoose = require('mongoose')


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
            return res.status(404).json('can not find the course')
        }
        const enroll = await Enroll.findOne({
            user_id  : req.user._id,
            course_id : course._id
        })
        
        if(!enroll){
            return res.status(403).json('unauthorized')
        }
        const {course_code} = req.body
        const { Answers } = req.body
        const { quizID } = req.body

  
        const answer = new  Answer({
            Answers,
            quizID,
            course_code,
            student_code : req.user.code
        })
        await answer.save()



        const quiz= await Quiz.findOne({_id:quizID})
        let sum=0
        const answersFromDb = await Answer.findOne({quizID,student_code : req.user.code})
        quiz.questions.forEach(element => {
            answersFromDb.Answers.forEach(ans=>{
                if(element.question===ans.question){
                    if(element.answer===ans.answer){
                        sum = sum + parseInt(element.grades)
                        ans.right_ans=true
                    }
                        
                    
                     
                }
                
            })

        })
        const answerModified = await Answer.findOneAndUpdate({quizID,student_code : req.user.code},answersFromDb,{new : true})
        // console.log(answerModified )

        const totalscore = new Score({
                    quiz_id:quizID,
                    score:sum,
                    course_code : req.body.course_code,
                    student_code : req.user.code
                })
                await totalscore.save()
        
        
     
       
        
        
         res.status(201).json({totalscore,answerModified})

    } catch (error) {
         res.status(500).json(error.message)
         
    }
})
//edit answers and json the total score
router.patch('/editAnswer/:course_code',auth,async (req,res)=>{
    
    const updates = Object.keys(req.body)
    const allowedUpdates = ["Answers","quizID"]
    const isValidOperation = updates.every((update)=> allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).json( 'Invalid updates')
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
            return res.status(404).json('can not find the course')
        }
        const enroll = await Enroll.findOne({
            user_id  : req.user._id,
            course_id : course._id
        })
        if(!enroll){
            return res.status(403).json('unauthorized')
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
        const totalscore = new Score({
                    quiz_id:quizID,
                    score:sum,
                    course_code : req.params.course_code,
                    student_code : req.user.code
                })
        await totalscore.save()
        
        
     

        if(!answer){
            return res.status(404).json('there is no answer submitted')
        }

        res.status(201).json(totalscore)


    }catch(e){
        res.status(500).json(e)

    }
})


router.get('/getAnswers/:quiz_id/:course_code/:student_code',auth,async(req,res)=>{
    const _id=req.params.quiz_id
    try{
        const course = await Course.findOne({code : req.params.course_code}   )
        if(!course){
            return res.status(404).json('can not find the course')
        }
        if(req.user.role === 'instructor'){
        if(course.instructor_id != req.user._id.toString()){
            return res.status(403).json('unauthorized')
        }
        }
        if(req.user.role === 'student'){
            const enroll = await Enroll.findOne({
                user_id  : req.user._id,
                course_id : course._id
            })
            if(!enroll){
                return res.status(403).json('unauthorized')
            }

        }

        const answer = await Answer.find({
            quizID:mongoose.Types.ObjectId(_id),
            student_code : req.params.student_code,
            course_code  : req.params.course_code
        })
        console.log(_id)
        const answersarray= []
        for(let i = 0 ; i<answer.length;i++){
            answersarray.push(answer[i].Answers)
        }
        if(answer.length===0){
            return res.status(404).json('can not find the answer')
        }
        console.log(answersarray);

        res.status(200).json(answersarray)
    }catch(e){
        console.log(e.message);
        res.status(500).json(e.message)
    }

})



module.exports = router