import mongoose from "mongoose";


const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  questionChoice: [String], // raw choices
  topic: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  answers: [
    {
      option: String,
      isCorrect: Boolean,
      explanation: String
    }
  ],
  correctAnswer: Number, // index of correct answer
  explanation: String, // full explanation
  notes: String,
  tags: [String],
  year: Number,
  timeLimit: Number, // per question
  points: Number,
  imageUrl: String
});


const examSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  year: { type: Number, required: true },
  subject: { type: String, required: true },
  totalQuestions: Number,
  timeLimit: Number, // in seconds
  passingScore: Number,
  instructions: [String],
  questions: [questionSchema]
});


const Exam = mongoose.model('Exam' , examSchema)

export default Exam;