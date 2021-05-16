const mongoose = require('mongoose')
 
const assignmentSchema = new mongoose.Schema({
    title  : {
        type : String,
        required : true,
        enum : ['1','2','3','4','5','6','7','8','9','10']
    },
    fileName : {
        type : String,
        required : true,
    },
    studentCode: {
        type : String ,
        required : true,
    },
    studentName: {
        type : String ,
        required : true,
    },
    courseCode : {
        type  : String,
        required : true,
    }

})
const Assignment = mongoose.model('Assignment',assignmentSchema)

module.exports = Assignment