const mongoose = require('mongoose')

const QuizSchema = new mongoose.Schema({
    
    title:{
        type:String,
        required:true
        
    },
    total_marks:{
        type:Number,
        required:true
        
    },
    time:{
        type:Number,
        required:true
        
    },
    questions:[{
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
        choices:[{
            type:String,
            required:true,
            trim:true
        }
        ]
    }
        
    ],
    course_code : {
        type : String,
        required : true,
    },
    instructor_code : {
        type : String,
        required : true,
    }
  
   
})


module.exports = mongoose.model('Quiz', QuizSchema)