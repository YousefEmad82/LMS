const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const validator = require('validator')

const userSchema = new  mongoose.Schema({
    code : {
        type : String,
        required : true,
        unique : true,
    },

    name : {
        type : String,
        required : true,
        trim : true,
        lowercase : true,
    },
 
    email: {
        type: String,
        unique : true,
        required: true,
        trim: true, 
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    }, 
    password : {
        type : String,
        required : true,
        trim : true,
        minLength : 7,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('the password can not contain the word "password"')
            }
        }
    },
    tokens : [{
        token : {
            type : String,
            required : true,
        }

    }], 
    role : {
        type : String,
        required : true,
        enum : ['student','admin','instructor'],
    },
    year : {
        type : String,
            
    },

},{
    timestamps : true,
})





userSchema.virtual('student_courses',{
    ref : 'Enroll',
    localField : '_id',
    foreignField : 'user_id'
})

userSchema.virtual('instructor_courses',{
    ref : 'Course',
    localField : '_id',
    foreignField : 'instructor_id'
    
    
})



//hashing the plain text password before saving 
userSchema.pre('save',async function(next){ //it must be a regular function to be able to use 'this'
    const account = this
    // console.log('just before saving')
    if(account.isModified('password')){
    account.password  = await bcrypt.hash(account.password,8)
    }
    next()  
})


userSchema.methods.generateAuthToken = async function(){  //it must be a normal function ,the schema.method is used to make a function to access the instance of a User (user)
    const account = this
    const token = jwt.sign({
        _id : account._id.toString(),
        name : account.name.toString(),
        email : account.email.toString(),
        role : account.role.toString()
    },'thisismynewcourse')
    account.tokens = account.tokens.concat({token : token})
    await account.save()
    return token

}


userSchema.statics.findByCredentials = async (email,password)=>{ //schema.statics is used to make a function only acesses User not the instances
    const user = await User.findOne({email})
    if(!user){
        throw new Error('unable to login')
    }
    const isMatch = await bcrypt.compare(password,user.password)
    if(!isMatch){
        throw new Error('unable to login') 
    }
    return user
}



userSchema.methods.toJSON =  function(){
    const user = this
    const userObject = user.toObject()
    delete userObject.password
    delete userObject.tokens
    
   
    return userObject

}






const User = mongoose.model('User',userSchema)
User.init()

module.exports = User