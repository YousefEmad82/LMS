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
const sendEmail = require('../emails/account')
const InstructorAssignment = require('../database/models/instructor_assignment')

//the setup of the file upload of the lessons and assignments 
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
//======================================================================================================================================










//create a course
router.post('/admins/addCourse',auth,async(req,res)=>{
    try{
        if(req.user.role === 'admin'){
            const instructor = await User.findOne({code : req.body.instructor_code, role : 'instructor'})
            if(!instructor){
                 return res.status(404).json('please enter a correct instructor code!')
            }
            const instructor_id = instructor._id
           
            const course = new Course({
                ...req.body,
                instructor_id,
            })
            
            await course.save()
            res.status(201).json({
                course : course,
                instructor_name : instructor.name
            })

        }
        else{
            res.status(403).json('unauthorized')
        }

    }catch(e){
        res.status(500).json(e.message)

    }
})
//======================================================================================================================================
//enroll a student
router.post('/admins/enroll',auth,async(req,res)=>{
   
    try{
        if(req.user.role === 'admin'){
            
            const student = await User.findOne({code : req.body.student_code,role :'student'})
            if(!student){
                return res.status(404).json("please enter the student's code correctly!")
            }
            const course = await Course.findOne({code : req.body.course_code})
            if(!course){
                return res.status(404).json("please enter the course's code correctly!")
            }
            const searchEnroll = await Enroll.findOne({
                course_id : course._id,
                user_id : student._id,
            })
            if(!searchEnroll){
                
            
            const enroll = new Enroll({
                user_id : student._id,
                course_id : course._id
            })
            await enroll.save()
            await enroll.populate('user_id').populate('course_id').execPopulate()
            
            return res.status(201).json({
                student_name : enroll.user_id.name,
                course_name : enroll.course_id.name,
                status : 'sucessfully enrolled'})
            }
            res.status(400).json('the student is already enrolled')
        }
    else{
        res.status(403).json('unauthorized')
    }
    }catch(e){
        res.status(500).json(e.message)
    }
})
//======================================================================================================================================
//enroll students of a certain year in a course
router.post('/admins/enrollMultiple',auth,async(req,res)=>{
    try{
        if(req.user.role === 'admin'){
            const course = await Course.findOne({code : req.body.course_code})
            if(!course){
                return res.status(404).json("please enter the course's code correctly!")
            }
            const students = await User.find({
                role : 'student',
                year : req.body.year
            })
            if(students.length === 0){
                return res.status(404).json('there are no students in this year !')
            }
            let i
            for(i=0;i<students.length;i++){
                const enroll = new Enroll({
                    course_id : course._id,
                    user_id : students[i]._id
                })
                await enroll.save()

            }
            res.status(201).json({
                course_name : course.name,
                year : req.body.year,
                status : 'enrolled successfully'
            
            })
        }
        else{
            return res.status(403).json('unauthorized')
        }

    }catch(e){
        res.status(500).json(e.message)
    }
})
//======================================================================================================================================
//gets the courses of a student
router.get('/users/getEnrolledCourses/:code',auth,async(req,res)=>{
    try{
        let instructor
        if(req.user.role === 'admin' ){
            const student = await User.findOne({code : req.params.code,role : 'student'})
            if(!student){
                return res.status(404).json('please enter the correct code of the student!')
            }
            await student.populate('student_courses').execPopulate()
            let courses =[]
            let courseDetails = {}
            
                await Promise.all(student.student_courses.map(async(course)=>{

                    course = await Course.findById(course.course_id)
                    instructor = await User.findById(course.instructor_id)
                    courseDetails = {
                        course_name : course.name,
                        course_code : course.code,
                        instructor_name : instructor.name,
                        course_id : course._id
                    }
                    courses.push(courseDetails)
                }))
                if(courses.length ===0){
                    return res.status(404).json('this student is not enrolled in any courses yet!')
                }

                return res.status(200).json(courses)
        }
        else if(req.user.role === 'student' ){
            await req.user.populate('student_courses').execPopulate()
            let courses =[]
            let courseDetails = {}
            
                await Promise.all(req.user.student_courses.map(async(course)=>{

                    course = await Course.findById(course.course_id)
                    instructor = await User.findById(course.instructor_id)

                    courseDetails = {
                        course_name : course.name,
                        course_code : course.code,
                        instructor_name : instructor.name,
                        course_id : course._id

                    }
                    courses.push(courseDetails)
                }))
                if(courses.length ===0){
                    return res.status(404).json('you are not  not enrolled in any courses yet!')
                }

                return res.status(200).json(courses)
        }
        else{
            return res.status(403).json('unauthorized')
        }

    }catch(e){
        res.status(500).json(e.message)

    }
})

//======================================================================================================================================
//instructor lists his own courses
router.get('/instructors/InstructorCourses',auth,async(req,res)=>{
    try{
        if(req.user.role === 'instructor'){
        const instructor = await req.user.populate('instructor_courses').execPopulate()
        if(!instructor){
            res.status(404).json("you don't have any courses yet")
        }
        
        res.status(200).json(instructor.instructor_courses)
        }
        else{
            res.status(403).json('unauthorized')
        }


    }catch(e){
        res.status(500).json(e.message)

    }
})
//======================================================================================================================================
//list students in a certain course that the instructor teach
router.get('/instructors/InstructorCourses/course/studentsList/:code',auth,async(req,res)=>{
    try{
        const course = await Course.findOne({code : req.params.code})
        if(!course){
            return res.status(404).json('please enter a correct code of your courses')
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
                    return res.status(404).json('there are no students enrolled')
                }
            res.status(200).json(students)
        }
        else{
            res.status(403).json('unauthorized')
        }
    }catch(e){
        res.status(500).json(e.message)
    }
})
//======================================================================================================================================
//the admin lists the students of a certain course
router.get('/admins/courses/course/students/:code',auth,async(req,res)=>{
    try{
        const course = await Course.findOne({code : req.params.code})
        if(!course){
            return res.status(404).json('please enter a correct course code!')
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
                        studentID: student._id,
                    }
                    students.push(studentDetails)
                }))
                if(students.length === 0){
                    return res.status(404).json('there are no students enrolled')
                }
            res.status(200).json(students)
        }
        else{
            res.status(403).json('unauthorized')
        }
    }catch(e){
        res.status(500).json(e.message)
    }
})


//======================================================================================================================================
//admin lists the courses of an instructor
router.get('/admins/InstructorCourses/:code',auth,async(req,res)=>{
    try{
        if(req.user.role === 'admin'){
            const instructor = await User.findOne({
                code : req.params.code,     
            })
            if(!instructor || instructor.role != 'instructor'){
                return res.status(404).json('please enter the correct code of the instructor!')
            }
            await instructor.populate('instructor_courses').execPopulate()
            if(instructor.instructor_courses.length ===0){
                return res.status(404).json('the instructor does not have any courses yet!')
            }
            res.status(200).json(instructor.instructor_courses)
            }
            else{
                res.status(403).json('unauthorized')
            }


    }catch(e){
        res.status(500).json(e.message)

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
            return res.status(400).json( 'invalid updates')
        }
        if(req.user.role === 'admin'){

            let course = await Course.findOne({code : req.body.old_code})
            if(!course){
                return res.status(404).json('please enter the right code of the course!')
            }
            if(req.body.year){
            const enrolls = await Enroll.deleteMany({
                course_id : course._id
            })
            const students = await User.find({
                role : 'student',
                year : req.body.year
            })
            if(students.length != 0){
                let i
            for(i=0;i<students.length;i++){
                const enroll = new Enroll({
                    course_id : course._id,
                    user_id : students[i]._id
                })
                await enroll.save()

            
            }
            }
            }

          
             course = await Course.findOneAndUpdate({code : req.body.old_code},req.body,{new : true})

           
            
            res.status(200).json(course)
        }
        else{
            res.status(403).json('unauthorized')
        }

    }catch(e){
        res.status(500).json(e.message)
    }
})
//======================================================================================================================================
//delete a course
router.delete('/admins/courses/delete',auth,async(req,res)=>{
    try{
        if(req.user.role === 'admin'){
            let course =  await Course.findOne({code : req.body.code})
            if(!course){
                return res.status(404).json('please enter the right code of the course!')
            }
            const enrolls = await Enroll.deleteMany({
                course_id : course._id
            })
            await Course.deleteOne({_id  : course._id})
            res.status(200).json({course,enrolls,status : 'the course is deleted '})
        }
        else{
            return res.status(403).json('unauthorized')
        }

    }catch(e){
        res.status(500).json(e.message)

    }
})
//======================================================================================================================================
//get a course by  its code *********************
router.get('/courses/course/:code',auth,async(req,res)=>{
    try{
        if(req.user.role === 'student' || req.user.role ==='instructor'){
            const course = await Course.findOne({code : req.params.code})
            if(!course){
                return res.status(404).json("can't find the course!")
            }
            await course.populate('instructor').execPopulate()
            res.status(200).json({
                course : course,
                instructor_name : course.instructor[0].name
            })//course.overview
        }
        else{
            res.status(403).json('unauthorized')
        }

    }catch(e){
        res.status(500).json(e.message)
    }
})
//======================================================================================================================================
//instructor uploads lessons 
router.post('/courses/course/lessonsUpload',auth,upload.single('upload'),async (req,res)=>{
    try{
        let video_id
        const course = await Course.findById(req.body.course_id)
        if(req.user.role === 'instructor' && req.user._id.toString() == course.instructor_id){
            if(!course){
                return res.status(404).json('can not find the course')
            }
            if(req.body.video_url){
                for(let i = 0;i<req.body.video_url.length;i++){
                    if(req.body.video_url[i]+req.body.video_url[i+1] === 'v='){
                          video_id = req.body.video_url.slice(i+2)

                    }
                }
                    for(let j = 0;j<video_id.length;j++){
                         if(video_id[j] === '&'){
                         video_id = video_id.slice(0,j)

                         }
                    }
               
            }
            console.log(video_id)
            course.lessons = course.lessons.concat({
                lesson_title : req.body.lesson_title,
                lesson_name_filesystem : req.file.filename,
                instructor_id : req.user._id,
                video_id : video_id

            })
            await course.save()
            const students = await User.find({year : course.year})
            // console.log(students)
            if(students){
                const subject = "new lesson uploaded"
                const text = "the instructor : " + req.user.name + " uploaded lesson " + req.body.lesson_title + " in course " + course.name
                students.forEach((user)=>{
                  // sendEmail(user.email,subject,text)
                })
            }

            res.status(200).json('successfully uploaded')

        }else{
            res.status(403).json('unauthorized')
        }

    }catch(e){
        res.status(500).json(e.message)
    }
})
//======================================================================================================================================
//student download a lesson  
router.get('/courses/lessons/lesson/:course_id/:lesson_title',auth,async(req,res)=>{
    try{
        const course = await Course.findById({_id : req.params.course_id})
        if(!course){
            return res.status(404).json('can not find the course')
        }
        const enroll = await Enroll.findOne({
            course_id : course._id,
            user_id : req.user._id

        })
        if(enroll || req.user.role === 'instructor'){
        const lesson = course.lessons.find((lesson)=>{
            return lesson.lesson_title === req.params.lesson_title
        })
        if(!lesson){
            return res.status(404).json('can not find the lesson ')
        }
        const path = 'uploads/' + lesson.lesson_name_filesystem
        res.download(path)
    }
    else{
        res.status(403).json('unauthorized')
    }
    }catch(e){
        res.status(500).json(e.message)

    }
})
//======================================================================================================================================
//get all the lessons titles
router.get('/courses/lessons/:course_id',auth,async(req,res)=>{
    try{
        let isEnrolled = false
        const course = await Course.findById({_id : req.params.course_id})
        if(!course){
            return res.status(404).json('can not find the course')
        }
        if(req.user.role === 'student'){
            const enroll = await Enroll.findOne({
                user_id : req.user._id,
                course_id : course._id
            })
            if(!enroll){
                return res.status(403).json('unauthorized')
            }
            isEnrolled = true
        }
        if( req.user._id.toString() == course.instructor_id || isEnrolled  ){
        const lessons  =  []
        if(!course.lessons){
            return res.status(404).json('there is no lessons yet ')
        }
        course.lessons.forEach((lesson)=>{
            lessons.push(lesson.lesson_title)
        })
        
        res.status(200).json(course.lessons)
    }
    else{
        res.status(403).json('unauthorized')
    }

    }catch(e){
        res.status(500).json(e.message)
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
            res.status(200).json('successfully uploaded ')

        }else{
            res.status(403).json('unauthorized')
        }

    }catch(e){
        res.status(500).json(e.message)
    }
})
//======================================================================================================================================
//get  assignments  of a certain course
router.get('/courses/course/assignments/assignment/:course_code/:title',auth,async (req,res)=>{
    try{
        const course = await Course.findOne({
            code : req.params.course_code
        })
        if(req.user._id.toString() == course.instructor_id ){
            const assignments = await Assignment.find({title : req.params.title })
            if(assignments.length === 0 ){
                return res.status(404).json('can not find the assignment ')
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
            res.status(403).json('unauthorized')
        }

    }catch(e){
        res.status(500).json(e.message)

    }
})


//======================================================================================================================================
//get all the assignment titles of a course of all students
router.get('/courses/course/assignments/:course_code/:title',auth,async(req,res)=>{
    try{
        const course = await Course.findOne({
            code : req.params.course_code
        })
        if(req.user._id.toString() == course.instructor_id){
            const assignments = await Assignment.find({title : req.params.title})
            if(assignments.length === 0 ){
                return res.status(404).json('there are no assignments ')
            }
            res.status(200).json(assignments)
            
        }
        else{
            res.status(403).json('unauthorized')

        }

    }catch(e){
        res.status(500).json(e.message)
    }
})
//======================================================================================================================================
//get all the assignment titles of a course
router.get('/courses/assignments/get_titles/:course_code',auth,async(req,res)=>{
    try{
        const course = await Course.findOne({
            code : req.params.course_code
        })
        if(req.user._id.toString() == course.instructor_id){
            const assignments = await Assignment.find({courseCode : req.params.course_code}).distinct('title')        
            if(assignments.length === 0 ){
                return res.status(404).json('there are no assignments ')
            }
            res.status(200).json(assignments)
            
        }
        else{
            res.status(403).json('unauthorized')
        }
    }catch(e){
        res.status(500).json(e.message)
    }
})
//======================================================================================================================================

//student get his assignments of a certain course
router.get('/courses/course/assignments/:course_id',auth,async(req,res)=>{
    try{
        const course = await Course.findById(req.params.course_id)
        if(!course){
            return res.status(404).json('the course is not available')
        }
        const enroll = await Enroll.findOne({
            course_id : req.params.course_id,
            user_id : req.user._id
        })
        if(!enroll){
            return res.status(403).json('unauthorized')
        }
        const assignments = await Assignment.find({
            courseCode : course.code,
            studentCode : req.user.code
        })
        
        if(assignments.length == 0){
            return res.status(404).json('you do not have any assignments uploaded')
        }
        res.status(200).json(assignments)

    }catch(e){
        res.status(500).json(e.message)
    }
})
//======================================================================================================================================
//student download an assignment
router.get('/courses/course/assignments/myAssignment/:course_id/:title',auth,async(req,res)=>{
    try{ 
            const course = await Course.findById(req.params.course_id)
            if(!course){
                return res.status(404).json('the course is not available')
            }
            const enroll = await Enroll.findOne({
                course_id : req.params.course_id,
                user_id : req.user._id
            })
            if(enroll){
                return res.status(403).json('unauthorized')
            }
            const assignment = await Assignment.findOne({
                courseCode : course.code,
                studentCode : req.user.code,
                title : req.params.title
            })
            if(!assignment){
                return res.status(404).json('couldnt find the assignment ')
            }
            const path = 'uploads/'+ assignment.fileName
            console.log(path)
            res.download(path)
    }catch(e){
        res.status(500).json(e.message)
    }
})
//======================================================================================================================================
//admin get courses by year
router.get('/admins/courses/year/:year',auth,async (req,res)=>{
    try{
        if(req.user.role === 'admin'){
        const courses = await Course.find({
            year : req.params.year
        })
        if(courses.length === 0 ){
            return res.status(404).json('ther are no courses')
        }
        res.status(200).json(courses)
        }
        else{
            res.status(403).json('unauthorized')
        }
    }catch(e){
        res.status(500).json(e.message)
    }
})
//======================================================================================================================================
//admin get courses 
router.get('/admins/courses',auth,async (req,res)=>{
    try{
        if(req.user.role === 'admin'){
        const courses = await Course.find()
        if(courses.length === 0 ){
            return res.status(404).json('ther are no courses')
        }
        res.status(200).json(courses)
        }
        else{
            res.status(403).json('unauthorized')
        }
    }catch(e){
        res.status(500).json(e.message)
    }
})
//======================================================================================================================================

//instructor uploads assignment 
router.post('/courses/course/instructorUploadAssignment',auth,upload.single('upload'),async(req,res)=>{
    try{
        const course = await Course.findOne({code : req.body.course_code})
        if(req.user.role === 'instructor' && req.user._id.toString() == course.instructor_id){
            if(!course){
                return res.status(404).json('can not find the course')
            }
            const assignment = new InstructorAssignment({
                title : req.body.title,
                fileName : req.file.filename,
                courseCode : req.body.course_code,
                instructorCode : req.user.code,
                instructorName : req.user.name
            })
            await assignment.save()
            const students = await User.find({year : course.year})
            // console.log(students)
            if(students){
                const subject = "new assignment uploaded"
                const text = "the instructor : " + req.user.name + " uploaded assignment " + req.body.title + " in course " + course.name
                students.forEach((user)=>{
                  // sendEmail(user.email,subject,text)
                })
            }
            res.status(200).json('successfully uploaded ')
        }else{
            res.status(403).json('unauthorized')
        }

    }catch(e){
        res.status(500).json(e.message)

    }

})
//======================================================================================================================================
//get assignments descriptions titles
router.get('/courses/course/getAssignments/:course_id',auth,async(req,res)=>{
    try{
        const course = await Course.findById({_id : req.params.course_id})
        const instructor = await User.findById(course.instructor_id)
        if(req.user.role ==='student'){
            const enroll = await Enroll.findOne({
                course_id : req.params.course_id,
                user_id : req.user._id
            })
            if(!enroll){
                return res.status(403).json('unauthorized')
            }
            const assignments = await InstructorAssignment.find({
                courseCode : course.code,
                instructorCode : instructor.code
            })
            
            if(assignments.length == 0){
                return res.status(404).json('there are assignments uploaded')
            }
            res.status(200).json(assignments)
        }else if(req.user.role === 'instructor' ){
            const assignments = await InstructorAssignment.find({
                courseCode : course.code,
                instructorCode : req.user.code
            })
            res.status(200).json(assignments)   
        }else{
            res.status(403).json('unauthorized')
        }
    }catch(e){
        res.status(500).json(e.message)
        
    }
})
//======================================================================================================================================
//download assignment description 
router.get('/courses/course/downloadAssignments/:course_id/:title',auth,async(req,res)=>{
    try{
        
        const course = await Course.findById({_id : req.params.course_id})
        const instructor = await User.findById(course.instructor_id)
        if(req.user.role ==='student'){
            const enroll = await Enroll.findOne({
                course_id : req.params.course_id,
                user_id : req.user._id
            })
            if(!enroll){
                return res.status(403).json('unauthorized')
            }
            const assignments = await InstructorAssignment.find({
                courseCode : course.code,
                instructorCode : instructor.code,
                title : req.params.title
            })
            
            if(assignments.length == 0){
                return res.status(404).json('ther are no  assignments uploaded')
            }
            const path = 'uploads/'+assignments[0].fileName 
            res.status(200).download(path)
        }else if(req.user.role === 'instructor' ){
            const assignments = await InstructorAssignment.find({
                courseCode : course.code,
                instructorCode : req.user.code,
                title : req.params.title

            })
            const path = 'uploads/'+assignments[0].fileName 
            res.status(200).download(path) 
        }else{
            res.status(403).json('unauthorized')
        }
    }catch(e){
        res.status(500).json(e.message)
        
    }
})



module.exports = router