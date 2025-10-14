import mongoose from 'mongoose' 



const subjectSchema =  new mongoose.Schema({})




const Subject = mongoose.model('subject' , subjectSchema)

export default Subject;