import mongoose from "mongoose"

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/taskmanager`)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`)
        
        // Debug: Log database name
        console.log("Connected to database:", connectionInstance.connection.name)
        
        // Test connection by counting users
        const userCount = await mongoose.connection.db.collection('users').countDocuments()
        console.log("Number of users in database:", userCount)
        
    } catch (error) {
        console.log("MONGODB connection FAILED ", error)
        process.exit(1)
    }
}

export default connectDB
