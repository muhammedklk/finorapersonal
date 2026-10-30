import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import planningRoutes from './routes/planning.js';
import auth from './middleware/auth.js';
const app=express();
app.disable('x-powered-by');
app.use(cors({origin:process.env.CLIENT_ORIGIN||'http://localhost:5173'}));
app.use(express.json({limit:'5mb'}));
app.use(morgan('dev'));
app.get('/api/health',(req,res)=>res.json({status:'ok'}));
app.use('/api/auth',rateLimit({windowMs:15*60*1000,limit:100,standardHeaders:true,legacyHeaders:false}),authRoutes);
app.use('/api/transactions',auth,transactionRoutes);
app.use('/api/planning',auth,planningRoutes);
app.use((err,req,res,next)=>{console.error(err);if(err.code===11000)return res.status(409).json({message:'That record already exists.'});if(err.name==='ValidationError'||err.name==='CastError')return res.status(400).json({message:'Please check the submitted values.'});res.status(500).json({message:process.env.NODE_ENV==='production'?'Something went wrong.':'Server error. Check the server terminal and environment settings.'});});
const port=process.env.PORT||5000;
if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32){console.error('JWT_SECRET must be set to a random string of at least 32 characters.');process.exit(1);}
try{await mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/finora');app.listen(port,()=>console.log(`Finora API listening on http://localhost:${port}`));}catch(e){console.error('MongoDB connection failed:',e.message);process.exit(1);}
