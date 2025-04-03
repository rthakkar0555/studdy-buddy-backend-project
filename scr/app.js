import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { createServer } from "http";
import { initSocket } from "./services/socket.service.js"
import userRouter from "./routes/user.routes.js"
import groupRouter from "./routes/group.routes.js"
import taskRouter from "./routes/task.routes.js"
import chatRouter from "./routes/chat.routes.js"

const app = express()
const httpServer = createServer(app);

// Middlewares
const corsOptions = {
    origin: "http://localhost:5175", // Explicitly allow your React app's origin
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  };
  
  app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))
app.use(cookieParser())

// Initialize Socket.IO
const io = initSocket(httpServer);

// Test route
app.get("/", (req, res) => {
    res.send("Server is running!")
})

// Debug route to check if user routes are mounted
app.get("/api/v1/test", (req, res) => {
    res.json({ message: "API routes are working" })
})

// API routes
app.use("/api/v1/users", userRouter)
app.use("/api/v1/groups", groupRouter)
app.use("/api/v1/tasks", taskRouter)
app.use("/api/v1/chat", chatRouter)

// 404 handler
app.use((req, res) => {
    console.log(`404 - Not Found: ${req.method} ${req.url}`);
    res.status(404).json({
        success: false,
        message: "API endpoint not found"
    })
})

// Error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500
    const message = err.message || "Something went wrong!"
    
    console.error("Error:", {
        path: req.path,
        statusCode,
        message,
        stack: err.stack
    })

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        data: null,
        errors: err.errors || []
    })
})

export { app, httpServer }