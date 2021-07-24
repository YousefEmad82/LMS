const express = require('express')
const router = express.Router()
const User = require('../database/models/user')
const Enroll = require('../database/models/enroll')
const auth = require('../middlwares/auth')
const multer = require('multer')
const csvtojson = require('csvtojson')
const Course = require('../database/models/course')
const Answer = require('../database/models/answer')
const Assignment = require('../database/models/assignment')
const fs = require('fs')
const bcrypt = require('bcryptjs')
const sendEmail = require('../emails/account')


//======================================================================================================================================
const userStorage = multer.diskStorage({  //csv files for creating users
    destination: function (req, file, cb) {
      cb(null, 'uploads')
    },
    filename:   function (req, file, cb) {
      cb(null,   'users' +Date.now()+'.txt')
    }

  })
const userUpload = multer({ //uploads csv files for creating users
    storage : userStorage,
    limits : {
        fileSize : 50000000,
    },
    fileFilter(req,file,callback){
        if(!file.originalname.match(/\.(txt)$/)){  //regular expression 
            return callback(new Error('please upload a text  file'))
        }
        callback(undefined,true)
    }, 
})




router.post('/createUser',async(req,res)=>{
    try{
    const user = new User(req.body)
    await user.save()
    res.status(201).json(user)
    }catch(e){
        res.status(500).json(e.message)
    }

})
 router.delete('/deleteAll',async(req,res)=>{
     try{
         const users = await User.deleteMany({role : 'student'})
         res.status(200).json(users)

     }catch(e){
         res.status(500).json(e.message)
     }
 })
//======================================================================================================================================
//add a user
router.post('/users',async(req,res)=>{
    try{
     
        
        if(req.body.role === 'student'){
            const {name,email,password,role,code,year}  = req.body
            const user =  new User({
            name ,
            email,
            password : code,
            role,
            code,
            year,
        })
        await user.save()
        const courses = await Course.find({
            year : user.year
        })
        if(courses){
            for(i=0;i<courses.length;i++){
                const enroll = new Enroll({
                    course_id : courses[i]._id,
                    user_id : user._id
                })
                await enroll.save()
            }
        }
        const coursesNames = []
        courses.forEach((course)=>{
            coursesNames.push(course.name)
        })
        const subject = "your LMS account"
        const text = "your email is :  " + user.email  + '\n' + "your password is  your university code "  + '\n' + "please change the password as soon as possible" + '\n' +  "you are enrolled in those courses : " + coursesNames
        console.log(user.email)
        sendEmail(user.email,subject,text)
        return res.status(201).json(user)

        }
        else if(req.body.role === 'instructor'){
            const {name,email,password,role,code}  = req.body
         const user =  new User({
            name ,
            email,
            password : code,
            role,
            code,
            
        })
        await user.save()
        // const token = await user.generateAuthToken()
        const subject = "your LMS account"
        const text = "your email is :  " + user.email  + '\n' + "your password is  your university code "  + '\n' + "please change the password as soon as possible" + '\n' 
        console.log(user.email)
        sendEmail(user.email,subject,text)
        return res.status(201).json(user)
        }
        else{
            const {name,email,password,role,code}  = req.body
         const user =  new User({
            name ,
            email,
            password : code,
            role,
            code,
        })
        await user.save()
        const subject = "your LMS account"
        const text = "your email is :  " + user.email  + '\n' + "your password is  your university code "  + '\n' + "please change the password as soon as possible" + '\n' 
        console.log(user.email)
        sendEmail(user.email,subject,text)
        return res.status(201).json(user)

        }


    }catch(e){
        res.status(400).json(e.message)

    }
})

//======================================================================================================================================
//user login
router.post('/users/login',async(req,res)=>{
    try{
    const user = await User.findByCredentials(req.body.email,req.body.password)
    const token = await user.generateAuthToken()
    res.status(200).json({user,token})
    }catch(e){
        res.status(400).json(e.message)
    }
})

//======================================================================================================================================
//view your own profile
router.get('/users/me',auth,async(req,res)=>{
    res.json(req.user)
})

//======================================================================================================================================
//user logout
router.post('/users/logout',auth,async(req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token != req.token
        })
        await req.user.save()
        res.status(200).json()

    }catch(e){
        res.status(500).json()

    }
})

//======================================================================================================================================
//userlogoutAll
router.post('/users/logoutAll',auth,async(req,res)=>{
    try{
        req.user.tokens = []
        await req.user.save()
        res.json()

    }catch(e){
        res.status(500).json()

    }
})

//======================================================================================================================================
//listing all students
router.get('/admins/getAllStudents',auth,async(req,res)=>{
    try{
        if(req.user.role === 'admin'){
            const students = await User.find({role : 'student'})
            if(students.length === 0){
                return res.status(404).json("can not find students ")
            }
            res.status(200).json(students)
        }
        else{
            res.status(403).json('unauthorized')
        }
    }catch(e){
        res.status(500).json(e)

    }
})

//======================================================================================================================================
//the year is from the query year = ay haga
//list students of certain year
router.get('/admins/getStudentsOfCertainYear/:year',auth,async(req,res)=>{
    try{
        if(req.user.role === 'admin' ){
            const students = await User.find({
                role : 'student',
                year : req.params.year
            })
            if(students.length === 0){
                return res.status(404).json('can not find the students')
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
//listing all instructors
router.get('/admins/getAllInstructors',auth,async(req,res)=>{
    try{
        if(req.user.role === 'admin'){
            const instructors = await User.find({role : 'instructor'})
            if(instructors.length === 0){
                return res.status(404).json()
            }
            res.status(200).json(instructors)

        }
        else{
            res.status(403).json('unauthorized')
        }

    }catch(e){
        res.status(500).json(e.message)

    }
})

//======================================================================================================================================
//admin updates the data of any  user
router.patch('/admins/users/update',auth,async(req,res)=>{
    const updates = Object.keys(req.body)
    const validUpdates = ['password','name','email','code','year','role','confirmPassword','old_code']  //confirmPassword is typed correctly twice 
    const isValidUpdate = updates.every((update)=>{
        return validUpdates.includes(update)
    })

    if(!isValidUpdate){
        return res.status(400).json('invalid updates')
    }
    try{
        if(req.user.role === 'admin'){
            if(updates.includes('password')){
                if(req.body.password === req.body.confirmPassword){ //checking whether the password is typed twice correctly 
                    delete req.body.confirmPassword //removing the second  password (confirmPassword property) from the request body
                }
                else{
                    return res.status(400).json(' the two passwords dont match')
                }
            }
            const user =  await User.findOne({code : req.body.old_code})
            if(!user){
                return res.status(404).json('please enter the right code of the user!')
            }
            if(req.body.year){
            const enrolls = await Enroll.deleteMany({
                user_id : user._id
            })
            const courses = await Course.find({year : req.body.year})
            if(courses){
                for(let i = 0;i<courses.length;i++){
                    const newEnroll = new Enroll({
                        user_id : user._id,
                        course_id : courses[i]._id
                    })
                    await newEnroll.save()
                }

            }
            }
          
            updates.forEach((update)=>{
                user[update] = req.body[update]
                user.markModified(update)  //to allow me save the changes in the database,so i can use the hashing algorithm
            })
            await user.save()
            res.status(200).json(user)        
        }     
        else{
            return res.status(403).json('unauthorized')
        }
    }catch(e){
        res.status(400).json(e.message)
    }
})

//======================================================================================================================================
//user updates his own information 
router.patch('/users/me',auth,async(req,res)=>{
    const updates = Object.keys(req.body)
   //console.log(req.body)

    const validUpdates = ['password','confirmPassword','oldPassword'] 
    const isValidUpdate = updates.every((update)=>{
        return validUpdates.includes(update)
    })

    if(!isValidUpdate){
        return res.status(400).json('invalid updates')
    }
    try{
        const userFromDb = await User.findOne({_id : req.user._id})
        const isMatch = await bcrypt.compare(req.body.oldPassword,userFromDb.password)
        if(isMatch){
        if(req.body.password === req.body.confirmPassword){
            req.user.password = req.body.password
            await req.user.save()
            res.status(200).json(req.user)
    }
    else{
        res.status(400).json("the two passwords don't match ")
    }
    }else{
        res.status(400).json('the old password is incorrect')
    }
    

    }catch(e){
        res.status(500).json(e.message)

    }
})


//======================================================================================================================================
//admin delete a user
router.delete('/admins/deleteUser',auth,async(req,res)=>{
    try{
        if(req.user.role === 'admin'){
            const user = await User.findOne({
                code : req.body.code
            })
            if(!user){
                return res.status(404).json('please enter the right code of the user')
            }
            if(user.role === 'student'){
            const enrolls  = await Enroll.deleteMany({
                    user_id : user._id
                })
            const answers = await Answer.deleteMany({student_code : req.body.code})
            const assignments = await Assignment.find({studentCode : req.body.code})
            const assignmentsDeleted = await Assignment.deleteMany({studentCode : req.body.code})
            for(let i=0;i<assignments.length;i++){
                fs.unlinkSync("uploads/"+ assignments[i].fileName)
            }
                await User.findByIdAndDelete(user._id)
                return res.status(200).json({user,enrolls,assignmentsDeleted})
            }
            else if(user.role === 'admin'){
                res.status(400).json('can not delete an admin!!!')

                
            }
            else{
                await User.findByIdAndDelete(user._id)
                res.status(200).json(user)
            }
        } 
        else{
            return res.status(403).json('unauthorized')

        }

    }catch(e){
        res.status(500).json(e.message)

    }
})
//======================================================================================================================================
//admin get a student by its code  *********************
router.get('/students/student/:code',auth,async(req,res)=>{
    try{
        if(req.user.role != 'students'){
            const student = await User.findOne({code : req.params.code})
            if(!student){
                return res.status(404).json('can not find the student!')
            }
            res.status(200).json(student)
        }
        else{
            res.status(403).json('unauthorized')
        }

    }catch(e){
        res.status(500).json(e.message)

    }
})
//======================================================================================================================================
// //create users from file
// router.post('/usersAuto',auth,userUpload.single('upload'), async (req,res)=>{
//     const indicesOfFailedSaving = []
//     try{
//         if(req.user.role === 'admin'){
//                     const users = await csvtojson().fromFile("./uploads/"+req.file.filename)
                    
                   
//                     const savingStatus =  await  Promise.allSettled(users.map(async(row)=>{
//                     if(row.role === 'student'){
//                         const user = new User({
//                             name : row.name,
//                             email : row.email,
//                             password : row.password,
//                             role : row.role,
//                             code : row.code,  
//                             year : row.year,     
//                         })
//                         await  user.save()
                      
//                     }
//                      else{
//                         const user = new User({
//                             name : row.name,
//                             email : row.email,
//                             password : row.password,
//                             role : row.role,
//                             code : row.code,   
//                         }) 

//                         await  user.save()

//                      }
//                 }))
                
//                 savingStatus.forEach((save,index)=>{
//                     if(save.status != 'fulfilled'){
//                         indicesOfFailedSaving.push(index+1)
//                     }
//                 })
//                 if(indicesOfFailedSaving.length === 0){
//                    return res.status(201).json('successfully created all the users') 
//                 }
//                 throw new Error('there was an error while creating the users in lines : ' + indicesOfFailedSaving)

//         }
//         else{
//             res.status(403).json('unauthorized')
//         } 
//     }catch(e){
//         res.status(500).json({

//             error : e.message, 
          
//         })
//     }
// })
//======================================================================================================================================
//admin lists admins
router.get('/admins/getAdmins',auth,async(req,res)=>{
    try{
        if(req.user.role === 'admin'){
            const admins = await User.find({role : 'admin'})
            res.status(200).json(admins)

        }else{
            res.status(403).json('unauthorized')
        }

    }catch(e){
        res.status(500).json(e.message)

    }
})
//======================================================================================================================================
//create users from file
router.post('/usersAuto/:role',auth,userUpload.single('upload'), async (req,res)=>{
    const indicesOfFailedSaving = []
    const savingStatus =[]
    const numberOfSavedSuccessfuly  = []
    try{
        if(req.user.role === 'admin'){
                    const users = await csvtojson().fromFile("./uploads/"+req.file.filename)
                   for(let i=0;i<users.length;i++){
                    if(users[i].role === req.params.role){
                        if(req.params.role === 'student'){
                        const user = new User({
                            name : users[i].name,
                            email : users[i].email,
                            password : users[i].code,
                            role : users[i].role,
                            code : users[i].code,  
                            year : users[i].year,     
                        })
                        try{
                        await  user.save()
                        savingStatus.push("created")
                         const courses = await Course.find({
                            year : user.year
                        })
                        if(courses){
                            for(let j=0;j<courses.length;j++){
                                const enroll = new Enroll({
                                    course_id : courses[j]._id,
                                    user_id : user._id
                                })
                                console.log(enroll)
                                await enroll.save()
                         } }
                        }catch(err){
                            savingStatus.push(err.message)
                        }
                    }
                        else{
                            const user = new User({
                                name : users[i].name,
                                email : users[i].email,
                                password : users[i].code,
                                role : users[i].role,
                                code : users[i].code,   
                            }) 
                            try{
                                await  user.save()            
                                savingStatus.push("created")
                                }catch(err){
                                    savingStatus.push(err.message)
                                }
                        }
                    }
                     else{
                         savingStatus.push('invalid role')
                     }
                    }
                savingStatus.forEach((save,index)=>{
                    if(save != 'created'){
                        indicesOfFailedSaving.push({
                            "index_of_line" : index+1,
                            "status" : save
                        })
                    }
                })
                if(indicesOfFailedSaving.length === 0){
                   return res.status(201).json('successfully created all the users') 
                }
                let counter =0
                savingStatus.forEach((line)=>{
                    if(line === 'created'){
                        counter = counter+1
                    }
                })
                numberOfSavedSuccessfuly.push({'number_of_saved_lines' : counter,'number_of_failed_lines' : savingStatus.length - counter })
                res.status(400).json({indicesOfFailedSaving,numberOfSavedSuccessfuly})
        }
        else{
            res.status(403).json('unauthorized')
        } 
    }catch(e){
        res.status(400).json(e.message)
    }
})
//======================================================================================================================================
//delete enrollment of a student
router.delete('/admins/students/deleteEnroll',auth, async(req,res)=>{
    try{
        if(req.user.role === 'admin'){
            const enroll = await  Enroll.deleteOne({
                user_id : req.body.user_id ,
                course_id : req.body.course_id               
            })
            if(enroll.deletedCount === 0){
                return res.status(404).json("couldnt find the enroll")
            }
            res.status(200).json(enroll)

        }else{
            res.status(403).json('unauthorized')
        }

    }catch(e){
        console.log(e.message)
        res.status(500).json(e.message)
    }
})

module.exports = router