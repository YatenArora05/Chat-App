import express from "express"
import "dotenv/config"
import cors from "cors"
import http from "http"
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

const app=express();
const server=http.createServer(app);

// Initialize socket.io server

export const io = new Server(server,{
     cors :{origin :"*"}
})

// Store Online User

export  const userSocketMap = {}; // userId : socketId

// Socket.io Connection Handler  
io.on("connection",(socket)=>{
    const userId = socket.handshake.query.userId;
    console.log("User Connected",userId);

    if(userId) userSocketMap[userId]= socket.id;

    io.emit("getOnlineUsers",Object.keys(userSocketMap));

    socket.on("disconnected",()=>{
        console.log("User Disconnected ", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers",Object.keys(userSocketMap));
    });
})
// const PORT=3000;
// MiddleWare 
app.use(express.json({limit:"4mb"}));
app.use(cors());

app.use("/api/status",(req,resp)=>resp.send("Server is Live"));
app.use("/api/auth",userRouter)
app.use("/api/messages",messageRouter)

// Connect to MongoDB
await connectDB();
const PORT=process.env.PORT || 5000;
server.listen(PORT,()=>console.log("server is running on port :" +PORT));