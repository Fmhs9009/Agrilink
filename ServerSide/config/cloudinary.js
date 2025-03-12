const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary connect function
const cloudinaryconnect = () => {
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUD_NAME,
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });
        console.log("Cloudinary connected successfully");
    } catch (error) {
        console.log("Cloudinary connection error:", error);
    }
};

// Setup local disk storage as fallback
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './tmp/uploads');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    }
});

// Create multer upload middleware
const upload = multer({ storage: storage });

module.exports = {
    cloudinary,
    upload,
    cloudinaryconnect
};

