const Express = require("express");
const router = Express.Router();
const db = require("./config/database");
const { cloudinaryconnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const userroutes = require("./Routes/User.js");
const productRoutes = require("./Routes/productRoutes");
const cookiesparser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const errorMiddleware = require("./middleware/errorMiddleware");
const contractRoutes = require('./Routes/contractRoutes');
const uploadRoutes = require('./Routes/uploadRoutes');

const app = Express();

require("dotenv").config();

const PORT = process.env.PORT || 4000;
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));

app.use(cookiesparser());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);

// Using fileUpload for routes that don't use multer
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// Connect to database
db.connect();

// Connect to cloudinary
cloudinaryconnect();

// Set up routes
app.use("/api/v1/auth", userroutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/contracts", contractRoutes);
app.use("/api/v1/upload", uploadRoutes);

// Serve temp files
app.use('/tmp', Express.static(path.join(__dirname, 'tmp')));

app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Your Server Running",
  });
});

// Error Handling Middleware
app.use(errorMiddleware);

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
