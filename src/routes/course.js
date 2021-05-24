const express = require('express')
const router = express.Router()
const User = require('../database/models/user')
const Course = require('../database/models/course')
const auth = require('../middlwares/auth')
const Enroll = require('../database/models/enroll')
const { findOne } = require('../database/models/user')
const { isValidObjectId } = require('mongoose')
const lineReader = require('line-reader')
const multer = require('multer')
const csvtojson = require('csvtojson')
const fs = require('fs')
const Assignment = require('../database/models/assignment')
const zip = require('express-zip')
require('../database/mongoose')


//======================================================================================================================================
var storage = multer.diskStorage({  //uploads of lessons and assignments
    destination: function (req, file, cb) {
      cb(null, 'uploads')
    },
    filename:   function (req, file, cb) {
      cb(null,   req.user.name+ Date.now()+ '.pdf')
    }

  })
const upload = multer({ //uploads of lessons and assignments 
    storage : storage,
    limits : {
        fileSize : 50000000,
    },
    fileFilter(req,file,callback){
        if(!file.originalname.match(/\.(pdf)$/)){  //regular expression 
            return callback(new Error('please upload a pdf file'))
        }
        callback(undefined,true)
    }, 
})











//create a course
router.post('/admins/addCourse',auth,async(req,res)=>{
    try{
        if(req.user.role === 'admin'){
            const instructor = await User.findOne({code : req.body.instructor_code})
            if(!instructor){
                 return res.status(404).send('please enter a correct instructor code!')
            }
            const instructor_id = instructor._id
           
            const course = new Course({
                ...req.body,
                instructor_id,
            })
            
            await course.save()
            res.status(201).send(course)

        }
        else{
            res.status(403).send('unauthorized')
        }

    }catch(e){
        res.status(500).send(e.message)

    }
})
//======================================================================================================================================
//enroll a student
router.post('/admins/enroll',auth,async(req,res)=>{
   
    try{
        if(req.user.role === 'admin'){
            
            const student = await User.findOne({code : req.body.student_code,role :'student'})
            if(!student){
                return res.status(404).send("please enter the student's code correctly!")
            }
            const course = await Course.findOne({code : req.body.course_code})
            if(!course){
                return res.status(404).send("please enter the course's code correctly!")
            }
            const enroll = new Enroll({
                user_id : student._id,
                course_id : course._id
            })
            await enroll.save()
            await enroll.populate('user_id').populate('course_id').execPopulate()
            
            res.status(201).send({
                student_name : enroll.user_id.name,
                course_name : enroll.course_id.name,
                status : 'sucessfully enrolled'})
    }
    else{
        res.status(403).send('unauthorized')
    }
    }catch(e){
        res.status(500).send(e.message)
    }
})
//======================================================================================================================================
//enroll students of a certain year in a course
router.post('/admins/enrollMultiple',auth,async(req,res)=>{
    try{
        if(req.user.role === 'admin'){
            const course = await Course.findOne({code : req.body.course_code})
            if(!course){
                return res.status(404).send("please enter the course's code correctly!")
            }
            const students = await User.find({
                role : 'student',
                year : req.body.year
            })
            if(students.length === 0){
                return res.status(404).send('there are no students in this year !')
            }
            let i
            for(i=0;i<students.length;i++){
                const enroll = new Enroll({
                    course_id : course._id,
                    user_id : students[i]._id
                })
                await enroll.save()

            }
            res.status(201).send({
                course_name : course.name,
                year : req.body.year,
                status : 'enrolled successfully'
            
            })
        }
        else{
            return res.status(403).send('unauthorized')
        }

    }catch(e){
        res.status(500).send(e.message)
    }
})
//======================================================================================================================================
//get the courses of a student
router.get('/users/getEnrolledCourses',auth,async(req,res)=>{
    try{
        if(req.user.role === 'admin'){
            const student = await User.findOne({code : req.body.code,role : 'student'})
            if(!student){
                return res.status(404).send('please enter the correct code of the student!')
            }
            await student.populate('student_courses').execPopulate()
            let courses =[]
            let courseDetails = {}
            
                await Promise.all(student.student_courses.map(async(course)=>{

                    course = await Course.findById(course.course_id)
                    courseDetails = {
                        course_name : course.name,
                        course_code : course.code,
                    }
                    courses.push(courseDetails)
                }))
                if(courses.length ===0){
                    return res.send('this student is not enrolled in any courses yet!')
                }

                return res.send(courses)
        }
        else if(req.user.role === 'student'){
            await req.user.populate('student_courses').execPopulate()
            let courses =[]
            let courseDetails = {}
            
                await Promise.all(req.user.student_courses.map(async(course)=>{

                    course = await Course.findById(course.course_id)
                    courseDetails = {
                        course_name : course.name,
                        course_code : course.code,
                    }
                    courses.push(courseDetails)
                }))
                if(courses.length ===0){
                    return res.send('you are not  not enrolled in any courses yet!')
                }

                return res.send(courses)
        }
        else{
            return res.status(403).send('unauthorized')
        }

    }catch(e){
        res.status(500).send(e.message)

    }
})

//======================================================================================================================================
//instructor lists his own courses
router.get('/instructors/InstructorCourses',auth,async(req,res)=>{
    try{
        if(req.user.role === 'instructor'){
        const instructor = await req.user.populate('instructor_courses').execPopulate()
        
        res.send(instructor.instructor_courses)
        }
        else{
            res.status(403).send('unauthorized')
        }


    }catch(e){
        res.status(500).send(e.message)

    }
})
//======================================================================================================================================
//list students in a certain course that the instructor teach
router.get('/instructors/InstructorCourses/course/studentsList',auth,async(req,res)=>{
    try{
        const course = await Course.findOne({code : req.body.code})
        if(!course){
            return res.status(404).send('please enter a correct code of your courses')
        }  
        if(req.user.role === 'instructor' && JSON.stringify({_id : req.user._id}) === JSON.stringify({_id : course.instructor_id}) ){
            await course.populate('students').execPopulate()
            let students =[]
            let studentDetails = {}            
                await Promise.all(course.students.map(async(student)=>{
                    student = await User.findById(student.user_id)
                    studentDetails = {
                        student_name : student.name,
                        student_code : student.code,
                        year : student.year,
                    }
                    students.push(studentDetails)
                }))
                if(students.length === 0){
                    return res.status(404).send()
                }
            res.send(students)
        }
        else{
            res.status(403).send('unauthorized')
        }
    }catch(e){
        res.status(500).send(e.message)
    }
})
//======================================================================================================================================
//the admin lists the students of a certain course
router.get('/admins/courses/course/students',auth,async(req,res)=>{
    try{
        const course = await Course.findOne({code : req.body.code})
        if(!course){
            return res.status(404).send('please enter a correct course code!')
        }  
        if(req.user.role === 'admin' ){
            await course.populate('students').execPopulate()
            let students =[]
            let studentDetails = {}            
                await Promise.all(course.students.map(async(student)=>{

                    student = await User.findById(student.user_id)
                    studentDetails = {
                        studentName : student.name,
                        studentCode : student.code,
                        year : student.year,
                    }
                    students.push(studentDetails)
                }))
                if(students.length === 0){
                    return res.status(404).send()
                }
            res.send(students)
        }
        else{
            res.status(403).send('unauthorized')
        }
    }catch(e){
        res.status(500).send(e.message)
    }
})


//======================================================================================================================================
//admin lists the courses of an instructor
router.get('/admins/InstructorCourses',auth,async(req,res)=>{
    try{
        if(req.user.role === 'admin'){
            const instructor = await User.findOne({
                code : req.body.code,     
            })
            if(!instructor || instructor.role != 'instructor'){
                return res.status(404).send('please enter the correct code of the instructor!')
            }
            await instructor.populate('instructor_courses').execPopulate()
            if(instructor.instructor_courses.length ===0){
                return res.send('the instructor doest have any courses yet!')
            }
            res.send(instructor.instructor_courses)
            }
            else{
                res.status(403).send('unauthorized')
            }


    }catch(e){
        res.status(500).send(e.message)

    }
})

//======================================================================================================================================
//update the course
router.patch('/admins/courses/update',auth,async(req,res)=>{
    try{
        const updates = Object.keys(req.body)
        const validUpdates = ['name','code','instructor_id','score','year','old_code']
        const isValidUpdate = updates.every((update)=>{
            return validUpdates.includes(update)
        })
        if(!isValidUpdate){
            return res.status(400).send({error : 'invalid updates'})
        }
        if(req.user.role === 'admin'){
          
            const course = await Course.findOneAndUpdate({code : req.body.old_code},req.body,{new : true})
            if(!course){
                return res.status(404).send('please enter the right code of the course!')
            }
            res.send(course)
        }
        else{
            res.status(403).send('unauthorized')
        }

    }catch(e){
        res.status(500).send(e.message)
    }
})
//======================================================================================================================================
//delete a course
router.delete('/admins/courses/delete',auth,async(req,res)=>{
    try{
        if(req.user.role === 'admin'){
            let course =  await Course.findOne({code : req.body.code})
            if(!course){
                return res.status(404).send('please enter the right code of the course!')
            }
            const enrolls = await Enroll.deleteMany({
                course_id : course._id
            })
            await Course.deleteOne({_id  : course._id})
            res.send({course,enrolls,status : 'the course is deleted '})
        }
        else{
            return res.status(403).send('unauthorized')
        }

    }catch(e){
        res.status(500).send(e.message)

    }
})
//======================================================================================================================================
//get a course by  its code *********************
router.get('/courses/course',auth,async(req,res)=>{
    try{
        if(req.user.role === 'student' || req.user.role ==='instructor'){
            const course = await Course.findOne({code : req.body.code})
            if(!course){
                return res.status(404).send("can't find the course!")
            }
            res.send(course )//course.overview
        }
        else{
            res.status(403).send('unauthorized')
        }

    }catch(e){
        res.status(500).send(e.message)
    }
})
//======================================================================================================================================
//instructor uploads lessons 
router.post('/courses/course/lessonsUpload',auth,upload.single('upload'),async (req,res)=>{
    try{
        const course = await Course.findById(req.body.course_id)
        if(req.user.role === 'instructor' && req.user._id.toString() == course.instructor_id){
            if(!course){
                return res.status(404).send('can not find the course')
            }
            course.lessons = course.lessons.concat({
                lesson_title : req.body.lesson_title,
                lesson_name_filesystem : req.file.filename,
                instructor_id : req.user._id,

            })
            await course.save()
            res.status(200).send('successfully uploaded ')

        }else{
            res.status(403).send('unauthorized')
        }

    }catch(e){
        res.status(500).send(e.message)
    }
})
//======================================================================================================================================
//download a lesson  
router.get('/courses/lessons/lesson',auth,async(req,res)=>{
    try{
        const course = await Course.findById({_id : req.body.id})
        if(!course){
            return res.status(404).send('can not find the course')
        }
        const enroll = await Enroll.findOne({
            course_id : course._id,
            user_id : req.user._id

        })
        console.log(enroll)
        if(enroll){
        const lesson = course.lessons.find((lesson)=>{
            return lesson.lesson_title === req.body.lesson_title
        })
        if(!lesson){
            return res.status(404).send('can not find the lesson ')
        }
        const path = 'uploads/' + lesson.lesson_name_filesystem
        res.download(path)
    }
    else{
        res.status(404).send('unauthorized')
    }
    }catch(e){
        res.status(500).send(e.message)

    }
})
//======================================================================================================================================
//get all the lessons titles
router.get('/courses/lessons',auth,async(req,res)=>{
    try{
        const course = await Course.findById({_id : req.body.course_id})
        if(!course){
            return res.status(404).send('can not find the course')
        }
        if(req.user.role === 'instructor' && req.user._id.toString() == course.instructor_id){
        const lessons  =  []
        if(!course.lessons){
            return res.status(404).send('can not find the lessons')
        }
        course.lessons.forEach((lesson)=>{
            lessons.push(lesson.lesson_title)
        })
        
        res.send(lessons)
    }
    else{
        res.status(403).send('unauthorized')
    }

    }catch(e){
        res.status(500).send(e.message)
    }
})
//======================================================================================================================================

//a student uploads an assignment 
router.post('/courses/course/assignmentUpload',auth,upload.single('upload'),async (req,res)=>{
    try{
        const course = await Course.findOne({
            code : req.body.course_code
        })
        const enroll = await Enroll.findOne({
            course_id : course._id,
            user_id : req.user._id

        })
        if(enroll){
           
            const assignment = new Assignment({
                title : req.body.title,
                fileName : req.file.filename,
                courseCode : req.body.course_code,
                studentCode : req.user.code,
                studentName : req.user.name
            })
            await assignment.save()
            res.status(200).send('successfully uploaded ')

        }else{
            res.status(403).send('unauthorized')
        }

    }catch(e){
        res.status(500).send(e.message)
    }
})
//======================================================================================================================================
//get an assignments  of a certain course
router.get('/courses/course/assignments/assignment',auth,async (req,res)=>{
    try{
        const course = await Course.findOne({
            code : req.body.course_code
        })
        if(req.user._id.toString() == course.instructor_id ){
            const assignments = await Assignment.find({title : req.body.title })
            if(assignments.length === 0 ){
                return res.status(404).send('can not find the assignment ')
            }
            // const path = "uploads/"+ assignment.fileName
            // res.download(path)
            const zipAssignments = []
            assignments.forEach((assignment)=>{
                zipAssignments.push({
                    path : 'uploads/' + assignment.fileName,
                    name : assignment.fileName
                })
            })
            res.zip(zipAssignments)
        }
        else{
            res.status(403).send('unauthorized')
        }

    }catch(e){
        res.status(500).send(e.message)

    }
})

//======================================================================================================================================
//get all the assignment titles
router.get('/courses/course/assignments',auth,async(req,res)=>{
    try{
        const course = await Course.findOne({
            code : req.body.course_code
        })
        if(req.user._id.toString() == course.instructor_id){
            const assignments = await Assignment.find({title : req.body.title})
            if(assignments.length === 0 ){
                return res.status(404).send('there are no assignments ')
            }
            res.send(assignments)
            
        }
        else{
            res.status(403).send('unauthorized')

        }

    }catch(e){
        res.status(500).send(e.message)
    }
})
//======================================================================================================================================

module.exports = router