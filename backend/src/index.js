import express from 'express' //const express = require('express')
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import path from 'path'

import { connectDB } from './lib/db.js'
import authRoutes from './routes/auth.route.js'
import messageRoutes from './routes/message.route.js'

import { app, server } from './lib/socket.js'

dotenv.config()
//const app = express();

const __dirname = path.resolve();

app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: 'http://localhost:5173', // allow only the frontend url
  credentials: true, // allow cookies, authentication
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
}));

app.use('/api/auth', authRoutes)
app.use('/api/messages', messageRoutes)

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

server.listen(process.env.PORT, () => { // this is the socket.io server that we've created
    console.log(`Server is running on port ${process.env.PORT}`)
    connectDB();
})