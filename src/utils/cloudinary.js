import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';


// Cloudinary Setup
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadOnCloudinary = async (localPath) => {
    try{
        if(!localPath) return null;
        
        // upload file on cloudinary

        const result = await cloudinary.uploader.upload(localPath,{
            folder:'YouTube',
            resource_type:'auto',
        });

        // console.log('File Upload Cloudinary -> ',result.url);
        fs.unlinkSync(localPath);
        return result;

    }catch(error){
        fs.unlinkSync(localPath); // remove file
        return null;
    }
}

export default uploadOnCloudinary;
