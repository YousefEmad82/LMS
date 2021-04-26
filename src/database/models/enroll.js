const mongoose = require('mongoose');


const enrollSchema = new mongoose.Schema({
    user_id: { 
        type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
          required: true ,
        },
    course_id: {
         type: mongoose.Schema.Types.ObjectId, 
         ref: 'Course',
          required: true },
})



 const Enroll = mongoose.model('Enroll', enrollSchema);


 module.exports = Enroll