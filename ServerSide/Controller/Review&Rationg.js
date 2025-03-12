const Rating = require("../Model/RatingAndReview");
const Product = require("../Model/Product");
const mongoose = require("mongoose");

// Create Review
exports.createReview = async (req, res) => {
  try {
    const { ProductId, rating, review } = req.body; // Destructure req.body
    const userId = req.user.id;

    // Find the product by ID
    const productDetail = await Product.findById(ProductId);
    if (!productDetail) {
      return res.status(404).json({
        message: "Product not found",
        status: false,
      });
    }

    // Check if the user has already reviewed this product
    const alreadyReview = await Rating.findOne({
      user: userId,
      Product: ProductId,
    });

    if (alreadyReview) {
      return res.status(400).json({
        message: "User has already reviewed this product",
        status: false,
      });
    }

    // Create the review
    const createReviewRating = await Rating.create({
      user: userId,
      rating: rating,
      review: review,
      Product: ProductId,
    });

    // Update the product with the new review
    const updateProduct = await Product.findByIdAndUpdate(
      ProductId,
      {
        $push: {
          ratingAndReview: createReviewRating._id,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Review created successfully",
      status: true,
      review: createReviewRating,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return res.status(500).json({
      message: "Something went wrong",
      status: false,
    });
  }
};

// Calculate Average Reviews
exports.GetAvgReviews = async (req, res) => {
  try {
    const { ProductId } = req.body;

    const calculateAvgReview = await Rating.aggregate([
      {
        $match: {
          Product: new mongoose.Types.ObjectId(ProductId),
        },
      },
      {
        $group: {
          _id: null,
          AverageRating: { $avg: "$rating" },
        },
      },
    ]);

    if (calculateAvgReview.length > 0) {
      return res.status(200).json({
        message: "Average rating calculated",
        status: true,
        AvgRating: calculateAvgReview[0].AverageRating,
      });
    } else {
      return res.status(200).json({
        message: "No reviews found for this product",
        status: true,
        AvgRating: 0,
      });
    }
  } catch (error) {
    console.error("Error calculating average review:", error);
    return res.status(500).json({
      message: "Something went wrong",
      status: false,
    });
  }
};

// Get All Reviews
exports.getAllReview = async (req, res) => {
  try {
    const reviews = await Rating.find({})
      .populate({
        path: "user",
        select: "firstName lastName email image",
      })
      .populate({
        path: "Product",
        select: "title",
      })
      .exec();

    return res.status(200).json({
      message: "All reviews fetched",
      status: true,
      reviews: reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({
      message: "Something went wrong",
      status: false,
    });
  }
};
