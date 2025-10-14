import mongoose from "mongoose";
import Exam from './examModel.js'
import express from 'express'
const examRoute = express.Router()

const fetchAllExam =async(req , res)=>{
    try {
    const exams = await Exam.find({})
    res.json(exams)
    } catch (error) {
        console.error('error fetching data' , error)
    }
}


const fetchSpecificExam = async(req ,res) => {
    const {examId} = req.params
    try {
    const specificExam = await Exam.findById(examId)
    res.json(specificExam)
    } catch (error) {
    console.error('error fetching data' , error)
        
    }
}


const fetchExamBySubject = async(req ,res)=> {
    try { 
        let {course} = req.params
        const exam = await Exam.find({subject : course})
        res.json(exam)
    } catch (error) {
        console.error(error)
    }
}




examRoute.route('/all').get(fetchAllExam)
examRoute.route('/:examId').get(fetchSpecificExam)
examRoute.route('/id/:course').get(fetchExamBySubject)



export default examRoute;