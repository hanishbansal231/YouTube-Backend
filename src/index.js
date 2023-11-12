import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/index.js";
dotenv.config()

await connectDB();
























// Use IIFE Better Approch
/* 
import mongoose from "mongoose";
import { DB_NAME } from "./constanst.js";
;(async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);

        app.on('error',(error) => {
            console.log('Error:',error);
            throw error;
        });

        app.listen(process.env.PORT,() => {
            console.log(`App is listening on port ${process.env.PORT}`)
        })
    }catch(error){
        console.error('Error:',error);
        throw error;
    }
})();
*/