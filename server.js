import express from 'express' 
import cors from 'cors'
import {connectToDatabase} from './ConnectedToDatabase/connectedToDatabase.js'
import userRoute from './authentication/userRoute/UserRoute.js'
import examRoute from './examinations/examRoute.js'

const app = express() 


app.use(cors())
app.use(express.json())

app.use('/user', userRoute)
app.use('/exam', examRoute)
connectToDatabase()


app.listen(8000 , console.log('the server is running'))