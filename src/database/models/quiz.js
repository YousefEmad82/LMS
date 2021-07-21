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
    startDate:{
        type:String,
        required:true
    },
    endDate:{
        type:String,
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
        grades:{
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

const Quiz = new mongoose.model('Quiz', QuizSchema)

module.exports = Quiz