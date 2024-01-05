import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/index.js";
dotenv.config({
    path: './.env'
})

const PORT = process.env.PORT || 8080;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`⚙️  Server is running at port : ${PORT}`);
        })
    })
    .catch((error) => {
        console.log('MONGODB CONNECTION FAILED !!!', error);
    })



















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