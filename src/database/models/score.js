const mongoose = require('mongoose')

const scoreSchema = new mongoose.Schema({
    quiz_id:{
        type:String,
    },
    
    score:{
        type:Number
    },
    student_code : {
        type : String,
        required : true,
    },
    course_code :{
        type : String,
        required : true,
    },

})
module.exports = mongoose.model('Score', scoreSchema)