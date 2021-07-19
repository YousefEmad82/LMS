const mongoose = require('mongoose')
 
const instructorAssignmentSchema = new mongoose.Schema({
    title  : {
        type : String,
        required : true,
        enum : ['1','2','3','4','5','6','7','8','9','10']
    },
    fileName : {
        type : String,
        required : true,
    },
    instructorCode: {
        type : String ,
        required : true,
    },
    instructorName: {
        type : String ,
        required : true,
    },
    courseCode : {
        type  : String,
        required : true,
    }

})
const InstructorAssignment = mongoose.model('InstructorAssignment',instructorAssignmentSchema)

module.exports = InstructorAssignment