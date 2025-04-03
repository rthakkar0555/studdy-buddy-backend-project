import { Server } from "socket.io"

let io; // Declare io variable at the top level

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN,
            credentials: true
        }
    })

    io.on("connection", (socket) => {
        console.log("New client connected:", socket.id)

        // Join a group chat room
        socket.on("join_group", (groupId) => {
            socket.join(groupId)
            console.log(`User ${socket.id} joined group ${groupId}`)
        })

        // Leave a group chat room
        socket.on("leave_group", (groupId) => {
            socket.leave(groupId)
            console.log(`User ${socket.id} left group ${groupId}`)
        })

        // Handle new messages
        socket.on("new_message", (message) => {
            // Broadcast the message to all users in the group
            io.to(message.group).emit("receive_message", message)
        })

        // Handle typing status
        socket.on("typing", ({ groupId, username }) => {
            socket.to(groupId).emit("user_typing", username)
        })

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id)
        })
    })

    return io
}

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!")
    }
    return io
}