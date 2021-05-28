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
            required:true
        },
        answer:{
            type:String,
            required:true
        },
        choices:[{
            type:String,
            required:true
        }
        ]
    }
        
    ],
    id: {
        type:Number,
        unique:true,
        required:true
        
    },
    course_id : {
        type : String,
        required : true,
    },
    instructor_id : {
        type : String,
        required : true,

    },
   
})
module.exports = mongoose.model('Quiz', QuizSchema)