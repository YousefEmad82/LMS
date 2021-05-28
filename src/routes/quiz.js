const express = require('express')
const router = express.Router()
const Quiz = require('../database/models/quiz')
const auth = require('../middlwares/auth')
const User = require('../database/models/user')
const Course = require('../database/models/course')
const Enroll = require('../database/models/enroll')


//create quiz
router.post('/create',auth, async (req, res) => {
    
    try {
        const course = await Course.findById({_id : req.body.course_id})
        if(!course){
            return res.status(404).send('can not find the course')
        }

        if(req.user._id.toString() == course.instructor_id){
    
        const { id }=req.body
        const { title } = req.body
        const { total_marks } = req.body
        const { time } = req.body
        const { questions } = req.body

        const quiz = await Quiz.create({
            id,
            title,
            time,
            total_marks,
            questions,
            course_id : course._id,
            instructor_id : req.user._id
        })

        return res.status(201).json(quiz)
        }
        else{
            res.status(403).send('unauthorized')
        }
    } catch (error) {
        return res.status(500).json({"error":error.message})
    }
})
 //edit quiz
 router.patch('/edit/:id',auth,async (req,res)=>{
    const course = await Course.findById({_id : req.body._id})
    if(!course){
        return res.status(404).send('can not find the course')
    }
    
    const updates = Object.keys(req.body)
    const allowedUpdates = ["title","time","total_marks","questions"]
    const isValidOperation = updates.every((update)=> allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send({error : 'Invalid updates'})
    }
    const id = req.params.id

    try{
        if(req.user._id.toString() == course.instructor_id){
        const quiz = await Quiz.findOne({id})
        
        updates.forEach((update) => quiz[update] = req.body[update])
        await quiz.save()

        if(!quiz){
            return res.status(404).send()
        }
        res.send(quiz)
    }else{
        res.status(403).send('unauthorized')
    }
    }catch(e){
        res.status(400).send(e.message)

    }
})
//delete quiz
router.delete('/delete/:id',auth,async (req,res)=>{
    const course = await Course.findById({_id : req.body._id})
    if(!course){
        return res.status(404).send('can not find the course')
    }
    const id = req.params.id
    try{
        if(req.user._id.toString() == course.instructor_id){
        const quiz = await Quiz.findOneAndDelete(id)
        if(!quiz){
            res.status(404).send()
        }
        res.send()
    }
        

    }catch(e){
        res.status(500).send(e)

    }
})
 












module.exports = router