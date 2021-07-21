const mongoose = require('mongoose')

const AnswerSchema = new mongoose.Schema({
    quizID:{
        type:String,
        required:true
    },
    Answers:[{
       
        question :{
            type:String,
            required:true,
            trim:true
        },
        answer:{
            type:String,
            required:true,
            trim:true
        },
        right_ans:{
            type:Boolean,
            default:false
        }
    }   
    ],
    course_code : {
        type : String,
        required : true,
    },
    student_code : {
        type : String,
        required : true,
    },
   
   
})


module.exports = mongoose.model('Answer', AnswerSchema)