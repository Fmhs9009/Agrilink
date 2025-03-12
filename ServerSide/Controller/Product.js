const product = require("../Model/Product")
const Tagdata = require("../Model/Tags")
const uploadimage = require("../utils/imageUploader")
exports.CreateProduct= async (req, res) => {
    console.log("Inside create course");
    try {
      const { title, ProductDescription,  price, Tag } =
        req.body;
      if (
        !title ||
        !ProductDescription ||
        !price ||
        !Tag
      ) {
        return res.status(400).json({
          message: "Please fill all fields",
          status: false,
        });
      }
  
      const thumbnail = req.files.thumbnailImage;
      const userId = req.user.id;
      console.log("userid",userId);
      const farmerDetail = await User.findById(userId);
  
      if (!farmerDetail) {
        return res.status(404).json({
          message: "farmer not found",
          status: false,
        });
      }
  
      const TagDetails = await Tagdata.findOne({ name: Tag });
  
      if (!TagDetails) {
        return res.status(404).json({
          message: "Tag not found",
          status: false,
        });
      }
  
      const thumbnailImage = await uploadimage(thumbnail, "Adnan photo");
  
      const NewProduct = await product.create({
        title: title,
        desc: ProductDescription,
        farmer: farmerDetail._id,
        price: price,
        tag: TagDetails._id,
        thumbnail: thumbnailImage,
      });
  
      await User.findByIdAndUpdate(
        { _id: farmerDetail._id },
        { $push: { Products: NewProduct._id } },
        { new: true }
      );
  
      return res.status(200).json({
        message: "Product created successfully",
        status: true,
        data: NewProduct
      });
    } catch (error) {
      console.error("Error creating Product:", error);
      return res.status(500).json({
        message: "Failed to create Product",
        status: false,
        error: error.message,
      });
    }
  };

  exports.getproductAlldetails = async (req, res) => {
    try {
      const allproductdetail = await 
      product.find(
          {},
          {
            title: true,
            price: true,
            thumbnail: true,
            farmer: true,
            ratingAndReview: true,
          }
        )
        .populate("farmer")
        .exec();
      
    } catch (error) {
      return res.json({
        message: "can't fetch Product Data",
        status: false,
      });
    }
  };

  exports.getProductDetail = async (req, res) => {
    try {
      const { ProductId } = req.body;
  
      const ProductExist = await course
        .find({ _id: courseId })
        .populate({
          path: "farmer".populate({
            path: "additionalDetail",
          }),
        })
        .populate({
          path: "ratingAndReview",
        })
        .populate({
          path: "tag",
        })
        .exec();
  
      if (!ProductExist) {
        return res.status.json({
          status: false,
          Message: "Product  Not found",
        });
      }
  
      return res.status.json({
        status: true,
        message: "Product Detail Succesfully fetched",
      });
    } catch (error) {
      return res.status.json({
        status: false,
        Message: "Something Went Wrong",
      });
    }
  };