const express = require('express')
const router = express.Router()
const User = require('../database/models/user')
const Enroll = require('../database/models/enroll')
const auth = require('../middlwares/auth')
const multer = require('multer')
const csvtojson = require('csvtojson')
const Course = require('../database/models/course')



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
            return callback(new Error('please upload a pdf file'))
        }
        callback(undefined,true)
    }, 
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
            password,
            role,
            code,
            year,
        })
        await user.save()
        // const token = await user.generateAuthToken()
        return res.status(201).send(user)

        }
        else if(req.body.role === 'instructor'){
            const {name,email,password,role,code}  = req.body
         const user =  new User({
            name ,
            email,
            password,
            role,
            code,
            
        })
        await user.save()
        // const token = await user.generateAuthToken()
        return res.status(201).send(user)
        }
        else{
            const {name,email,password,role,code}  = req.body
         const user =  new User({
            name ,
            email,
            password,
            role,
            code,
        })
        await user.save()
        return res.status(201).send(user)

        }


    }catch(e){
        res.status(400).send(e.message)

    }
})

//======================================================================================================================================
//user login
router.post('/users/login',async(req,res)=>{
    try{
    const user = await User.findByCredentials(req.body.email,req.body.password)
    const token = await user.generateAuthToken()
    res.status(200).send({user,token})
    }catch(e){
        res.status(400).send(e.message)
    }
})

//======================================================================================================================================
//view your own profile
router.get('/users/me',auth,async(req,res)=>{
    res.send(req.user)
})

//======================================================================================================================================
//user logout
router.post('/users/logout',auth,async(req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token != req.token
        })
        await req.user.save()
        res.send()

    }catch(e){
        res.status(500).send()

    }
})

//======================================================================================================================================
//userlogoutAll
router.post('/users/logoutAll',auth,async(req,res)=>{
    try{
        req.user.tokens = []
        await req.user.save()
        res.send()

    }catch(e){
        res.status(500).send()

    }
})

//======================================================================================================================================
//listing all students
router.get('/admins/getAllStudents',auth,async(req,res)=>{
    try{
        if(req.user.role === 'admin'){
            const students = await User.find({role : 'student'})
            if(students.length === 0){
                return res.status(404).send()
            }
            res.send(students)

        }
        else{
            res.status(403).send('unauthorized')
        }

    }catch(e){
        res.status(500).send(e)

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
                return res.status(404).send('can not find the students')
            }
            res.status(200).send(students)

        }
        else{
            res.status(403).send('unauthorized')
        }

    }catch(e){
        res.status(500).send()

    }
})

//======================================================================================================================================
//listing all instructors
router.get('/admins/getAllInstructors',auth,async(req,res)=>{
    try{
        if(req.user.role === 'admin'){
            const instructors = await User.find({role : 'instructor'})
            if(instructors.length === 0){
                return res.status(404).send()
            }
            res.status(200).send(instructors)

        }
        else{
            res.status(403).send('unauthorized')
        }

    }catch(e){
        res.status(500).send(e)

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
        return res.status(400).send({error : 'invalid updates'})
    }
    try{
        if(req.user.role === 'admin'){
            if(updates.includes('password')){
                if(req.body.password === req.body.confirmPassword){ //checking whether the password is typed twice correctly 
                    delete req.body.confirmPassword //removing the second  password (confirmPassword property) from the request body
                }
                else{
                    return res.send(' the two passwords dont match')
                }
            }
            const user =  await User.findOne({code : req.body.old_code})
            if(!user){
                return res.status(404).send('please enter the right code of the user!')
            }
            updates.forEach((update)=>{
                user[update] = req.body[update]
                user.markModified(update)  //to allow me save the changes in the database,so i can use the hashing algorithm
            })
            await user.save()
            res.status(200).send(user)        
        }     
        else{
            return res.status(403).send('unauthorized')
        }
    }catch(e){
        res.status(500).send(e.message)
    }
})

//======================================================================================================================================
//user updates his own information 
router.patch('/users/me',auth,async(req,res)=>{
    const updates = Object.keys(req.body)
    console.log(req.body)

    const validUpdates = ['password','confirmPassword'] 
    const isValidUpdate = updates.every((update)=>{
        return validUpdates.includes(update)
    })

    if(!isValidUpdate){
        return res.status(400).send({error : 'invalid updates'})
    }
    try{
        if(req.body.password === req.body.confirmPassword){
            req.user.password = req.body.password
            await req.user.save()
            res.send(req.user)
    }
    else{
        res.status(400).send("the two passwords don't match ")
    }

    }catch(e){
        res.status(500).send()

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
                return res.status(404).send('please enter the right code of the user')
            }
            if(user.role === 'student'){
            const enrolls  = await Enroll.deleteMany({
                    user_id : user._id
                })
                await User.findByIdAndDelete(user._id)
                return res.send({user,enrolls})
            }
            else if(user.role === 'admin'){
                res.send('can not delete an admin!!!')

                
            }
            else{
                await User.findByIdAndDelete(user._id)
                res.send(user)
            }
        } 
        else{
            return res.status(403).send('unauthorized')

        }

    }catch(e){
        res.status(500).send(e.message)

    }
})
//======================================================================================================================================
//admin get a student by its code  *********************
router.get('/students/student/:code',auth,async(req,res)=>{
    try{
        if(req.user.role != 'students'){
            const student = await User.findOne({code : req.params.code})
            if(!student){
                return res.status(404).send('can not find the student!')
            }
            res.send(student)
        }
        else{
            res.status(403).send('unauthorized')
        }

    }catch(e){
        res.status(500).send(e.message)

    }
})
//======================================================================================================================================
//create users from file
router.post('/usersAuto',auth,userUpload.single('upload'), async (req,res)=>{
    const indicesOfFailedSaving = []
    try{
        if(req.user.role === 'admin'){
                    const users = await csvtojson().fromFile("./uploads/"+req.file.filename)
                    if(users[0].role === 'student'){
                        const courses = await Course.find({
                            year : users[0].year
                        })
                        console.log(courses)
                    }
                    const savingStatus =  await  Promise.allSettled(users.map(async(row)=>{
                    if(row.role === 'student'){
                        const user = new User({
                            name : row.name,
                            email : row.email,
                            password : row.password,
                            role : row.role,
                            code : row.code,  
                            year : row.year,     
                        })
                        await  user.save()

                        if(courses.length != 0){
                            console.log('1')
                            for( i =0;i<courses.length ;i++){
                                const enroll = new Enroll({
                                    course_id : courses[i]._id,
                                    user_id : user._id
                                })
                                console.log(enroll)
                                await enroll.save()
                            }
                        }
                      

                    }
                     else{
                        const user = new User({
                            name : row.name,
                            email : row.email,
                            password : row.password,
                            role : row.role,
                            code : row.code,   
                        }) 

                        await  user.save()

                     }
                }))
                
                savingStatus.forEach((save,index)=>{
                    if(save.status != 'fulfilled'){
                        indicesOfFailedSaving.push(index+1)
                    }
                })
                if(indicesOfFailedSaving.length === 0){
                   return res.status(201).send('successfully created all the users') 
                }
                throw new Error('there was an error while creating the users in lines : ' + indicesOfFailedSaving)

        }
        else{
            res.status(403).send('unauthorized')
        } 
    }catch(e){
        res.status(500).send({

            error : e.message, 
          
        })
    }
})
//======================================================================================================================================
//admin lists admins
router.get('/admins/getAdmins',auth,async(req,res)=>{
    try{
        if(req.user.role === 'admin'){
            const admins = await User.find({role : 'admin'})
            res.status(200).send(admins)

        }else{
            res.status(403).send('unauthorized')
        }

    }catch(e){
        res.status(500).send(e.message)

    }
})
//======================================================================================================================================
module.exports = router