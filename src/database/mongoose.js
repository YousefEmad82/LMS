const mongoose = require('mongoose')
mongoose.connect('mongodb+srv://LMSProject:a12b34c.@cluster0.73ugb.mongodb.net/LMSDataBase?retryWrites=true&w=majority',{
    useNewUrlParser : true,
    useCreateIndex : true,
    useFindAndModify : false,
})

//'mongodb+srv://LMSProject:a12b34c.@cluster0.73ugb.mongodb.net/LMSDataBase?retryWrites=true&w=majority'

//'mongodb://127.0.0.1:27017/LMS'