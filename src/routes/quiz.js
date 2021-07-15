const express = require('express')
const router = express.Router()
const Quiz = require('../database/models/quiz')
const Course = require('../database/models/course')
const auth = require('../middlwares/auth')
const Enroll = require('../database/models/enroll')
const Score = require('../database/models/score')
const mongoose = require('mongoose')

//create quiz
router.post('/create', auth,async (req, res) => {
 
    try {
        const course = await Course.findOne({code : req.body.course_code}   )
        if(!course){
            return res.status(404).json('can not find the course')
        }
        if(course.instructor_id != req.user._id.toString()){
            return res.status(403).json('unauthorized')
        }
        
    
        const { title } = req.body
        const { total_marks } = req.body
        const { time } = req.body
        const { questions } = req.body
        const{course_code} = req.body
        const {instructor_code}  = req.body
        

        const quiz = new Quiz({
            
            title,
            time,
            total_marks,
            questions,
            course_code,
            instructor_code,
            
        })
        await quiz.save()

        return res.status(201).json(quiz)
    } catch (error) {
        return res.status(500).json({"error":error.message})
    }
})

 //edit quiz
 router.patch('/edit/:id/:course_code',auth,async (req,res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ["title","time","total_marks","questions","id"]
    const isValidOperation = updates.every((update)=> allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).json({error : 'Invalid updates'})
    }
    const _id = req.params.id

    try{
        const course = await Course.findOne({code : req.params.course_code}   )
        if(!course){
            return res.status(404).json('can not find the course')
        }
        if(course.instructor_id != req.user._id.toString()){
            return res.status(403).json('unauthorized')
        }
        const quiz = await Quiz.findOne({_id})
        
        updates.forEach((update) => quiz[update] = req.body[update])
        await quiz.save()

        if(!quiz){
            return res.status(404).json()
        }
        res.json(quiz)


    }catch(e){
        res.status(400).json(e.message)

    }
})
//delete quiz
router.delete('/delete/:id/:course_code',async (req,res)=>{
    const _id = req.params.id
    try{
        const course = await Course.findOne({code : req.params.course_code}   )
        if(!course){
            return res.status(404).json('can not find the course')
        }
        if(course.instructor_id != req.user._id.toString()){
            return res.status(403).json('unauthorized')
        }
        const quiz = await Quiz.findOneAndDelete(_id)
        if(!quiz){
            res.status(404).json()
        }
        res.json()
        

    }catch(e){
        res.status(500).json(e)

    }
})


//get list of quizzes in a course
router.get('/quizes/getQuizTitles/:course_code',auth,async(req,res)=>{
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
        const quizzes = await Quiz.find({
            course_code : req.params.course_code
        })
        if(quizzes.length === 0){
            return res.status(404).json('there are no quizzes')
        }
        res.status(200).json(quizzes)
    }catch(e){
        res.status(500).json(e.message)
    }

})


//get quiz by title
router.get('/quizes/getQuiz/:title/:course_code',auth,async(req,res)=>{
    try{
        const course = await Course.findOne({code : req.params.course_code}   )
        if(!course){
            return res.status(404).json('can not find the course')
        }
        if(req.user.role === 'student'){
        const enroll = await Enroll.findOne({
            user_id  : req.user._id,
            course_id : course._id
        })
        
        if(!enroll){
            return res.status(403).json('unauthorized')
        }
    }else{
        if(req.user._id != course.instructor_id.toString()){
            return res.status(403).json('unauthorized')

        }
    }
        const quiz = await Quiz.findOne({
            title : req.params.title,
            course_code  : req.params.course_code
        })
        if(!quiz){
            return res.status(404).json('can not find the quiz')
        }
        res.status(200).json(quiz)

       

    }catch(e){
        res.status(500).json(e.message)
    }
})


router.get('/quizes/getGrades/:course_code/:student_code',auth,async(req,res)=>{
    const student_code=req.params.student_code
    let quizzes = []
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
        const quizzes_scores = await Score.find({
            student_code ,
            course_code  : req.params.course_code
        })
        

        if(!quizzes_scores){
            return res.status(404).json('can not find the quiz')
        }

        for(let i=0;i<quizzes_scores.length;i++){
            const quiz = await Quiz.findOne({
                _id :mongoose.Types.ObjectId(quizzes_scores[i].quiz_id)
            })
            if(quiz){
            quizzes.push({
                "quiz_id" : quizzes_scores[i].quiz_id,
                "score" : quizzes_scores[i].score,
                "student_code" : quizzes_scores[i].student_code,
                "course_code" : quizzes_scores[i].course_code,
                "title" : quiz.title

            })
            }
        }

        res.status(200).json(quizzes)
    }catch(e){
        
        res.status(500).json(e.message)
    }

})

 












module.exports = router