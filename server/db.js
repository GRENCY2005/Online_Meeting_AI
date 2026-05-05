const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.warn('MONGODB_URI not found in .env');
            return;
        }
        
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB:`, error);
        // Do not crash server on DB logic error, keep socket active
    }
};

module.exports = connectDB;
