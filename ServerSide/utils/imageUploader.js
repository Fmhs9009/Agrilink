const cloudinary = require('cloudinary').v2;

exports.uploadimage=async(thumbnail,folder)=>{
try {
    
    const options={folder};    
    options.resource_type ="auto";
   

    return  cloudinary.uploader.upload(thumbnail.tempFilePath,options);
    
} catch (error) {
    return res.json({
        message:"File upload error",
        status:false
    })
}
};