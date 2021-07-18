const mongoose = require('mongoose')

    const  courseSchema = new mongoose.Schema({

     code : {
        type : String,
        trim : true,
        required : true,  
        unique : true 
    },

    name :{
        type : String,
        trim : true,
        required : true,

    },
     year : {
         type : String,
         trim : true,
         required : true,

     },


     score : {
         type : Number,
         max : 100,
         required : true,
     },
     instructor_id : {
         type : mongoose.Schema.Types.ObjectId, //refrencing instructor
         ref : 'User',
         required : true,
     },
     lessons : [
         {
            lesson_name_filesystem : {
                type : String,
            },
            lesson_title : {
                type : String,
            },
            instructor_id: {
                type : String,
            },
            video_id : {
                type : String,
                default : null
            }  
         }
     ]
          
    },{
    timestamps : true,
})




courseSchema.virtual('students',{
    ref : 'Enroll',
    localField : '_id',
    foreignField : 'course_id'
})

courseSchema.virtual('instructor',{
    ref : 'User',
    localField : 'instructor_id',
    foreignField : '_id'
})







    const Course = mongoose.model('Course',courseSchema)
    Course.init()

    module.exports = Course