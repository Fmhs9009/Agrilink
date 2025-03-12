const Tag = require("../Model/Tag");
const Product = require("../Model/Product");

// Create Tag
exports.CreateTag = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        message: "All fields are required",
        status: false,
      });
    }

    const TagDetails = await Tag.create({
      name: name,
      description: description,
    });

    console.log(TagDetails);
    return res.status(201).json({
      message: "Tag created successfully",
      status: true,
      data: TagDetails,
    });
  } catch (error) {
    console.error("Error creating tag:", error);
    return res.status(500).json({
      message: error.message,
      status: false,
    });
  }
};

// Get All Tags
exports.getAlldetail = async (req, res) => {
  try {
    const alldetail = await Tag.find({}, { name: 1, description: 1 });
    console.log(alldetail);
    return res.status(200).json({
      data: alldetail,
      status: true,
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return res.status(500).json({
      message: "Couldn't fetch tags",
      status: false,
    });
  }
};

// Get All Tags with Specific Products
exports.getAlltag = async (req, res) => {
  try {
    // Fetch Tag ID from request body
    const { TagId } = req.body;

    // Find the specific tag and populate its products
    const tagspecificProduct = await Tag.findById(TagId).populate({
      path: "Product", // Ensure this matches your schema field name
    }).exec();

    if (!tagspecificProduct) {
      return res.status(404).json({
        message: "Tag not found",
        status: false,
      });
    }

    // Find different products that don't belong to this tag
    const DifferentProducts = await Tag.find({
      _id: { $ne: TagId },
    }).populate({
      path: "products", // Ensure this matches your schema field name
    }).exec();

    return res.status(200).json({
      message: "Tags and products fetched successfully",
      status: true,
      tagspecificProduct,
      DifferentProducts,
    });
  } catch (error) {
    console.error("Error fetching tags and products:", error);
    return res.status(500).json({
      message: "Something went wrong",
      status: false,
    });
  }
};
