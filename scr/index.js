import dotenv from "dotenv"
import connectDB from "./db/index.js"
import { app } from "./app.js"
import { createServer } from "http"
import { initSocket } from "./services/socket.service.js"

dotenv.config({
    path: "./.env"
})

const httpServer = createServer(app)
const io = initSocket(httpServer)

const PORT = process.env.PORT || 8008

// Connect to database and start server
connectDB()
.then(() => {
    // Log available routes
    console.log("\nRegistered Routes:")
    app._router.stack.forEach((r) => {
        if (r.route && r.route.path) {
            console.log(`${Object.keys(r.route.methods)} ${r.route.path}`)
        }
    })

    httpServer.listen(PORT, () => {
        console.log(`\n⚙️ Server is running at port: ${PORT}`)
        console.log(`Visit: http://localhost:${PORT}`)
    })
})
.catch((err) => {
    console.error("MONGO db connection failed !!!", err)
})

