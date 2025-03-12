const Product = require('../Model/Product');
const { cloudinary } = require('../config/cloudinary');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const fs = require('fs');

// Add a new product
exports.addProduct = async (req, res) => {
    try {
        const { title, description, price, quantity, category, unit } = req.body;
        const farmer = req.user.id; // Getting farmer ID from authenticated user

        // Handle image uploads
        const imageUrls = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                // Upload file from local path to Cloudinary
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'agrolink_products'
                });
                
                imageUrls.push({
                    public_id: result.public_id,
                    url: result.secure_url
                });
                
                // Clean up local file after upload
                fs.unlinkSync(file.path);
            }
        }

        const product = await Product.create({
            title,
            description,
            price,
            quantity,
            category,
            unit,
            farmer,
            images: imageUrls
        });

        res.status(201).json({
            success: true,
            product
        });
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({
            success: false,
            message: "Error creating product",
            error: error.message
        });
    }
};

// Get all products by farmer
exports.getFarmerProducts = catchAsyncErrors(async (req, res, next) => {
    const products = await Product.find({ 
        farmer: req.user.id,
        status: { $ne: 'deleted' }
    });

    res.status(200).json({
        success: true,
        products
    });
});

// Update product
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
    let product = await Product.findById(req.params.id);
    
    if (!product) {
        return next(new ErrorHandler('Product not found', 404));
    }

    // Verify ownership
    if (product.farmer.toString() !== req.user.id.toString()) {
        return next(new ErrorHandler('Not authorized to update this product', 403));
    }

    // Handle image updates if any
    if (req.files && req.files.images) {
        const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
        
        // Delete old images from Cloudinary
        for (const image of product.images) {
            await cloudinary.uploader.destroy(image.public_id);
        }

        // Upload new images
        const imageUrls = [];
        for (const image of images) {
            try {
                const result = await cloudinary.uploader.upload(image.tempFilePath, {
                    folder: 'products',
                    crop: "scale"
                });
                
                imageUrls.push({
                    public_id: result.public_id,
                    url: result.secure_url
                });
                
                // Clean up temp file
                fs.unlink(image.tempFilePath, (err) => {
                    if (err) console.error('Error deleting temp file:', err);
                });
            } catch (error) {
                return next(new ErrorHandler('Error uploading images', 500));
            }
        }
        req.body.images = imageUrls;
    }

    // Update product
    product = await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        product
    });
});

// Delete product (soft delete)
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
        return next(new ErrorHandler('Product not found', 404));
    }

    // Verify ownership
    if (product.farmer.toString() !== req.user.id.toString()) {
        return next(new ErrorHandler('Not authorized to delete this product', 403));
    }

    // Soft delete by updating status
    product.status = 'deleted';
    await product.save();

    res.status(200).json({
        success: true,
        message: "Product deleted successfully"
    });
});

// Get all products with filters, search, and pagination
exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
    const { 
        category, 
        minPrice, 
        maxPrice, 
        sort, 
        search, 
        organic, 
        certification,
        page = 1, 
        limit = 10 
    } = req.query;

    const query = {};

    // Apply filters
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    if (category) query.category = category;
    if (organic) query.organic = organic === 'true';
    if (certification) query.certification = certification;
    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Only show active products
    query.status = 'active';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build query
    let productsQuery = Product.find(query)
        .populate('farmer', 'name email')
        .skip(skip)
        .limit(Number(limit));

    // Apply sorting
    if (sort) {
        const sortOptions = {
            'price_asc': { price: 1 },
            'price_desc': { price: -1 },
            'rating_desc': { averageRating: -1 },
            'newest': { createdAt: -1 }
        };
        productsQuery = productsQuery.sort(sortOptions[sort] || sortOptions['newest']);
    } else {
        productsQuery = productsQuery.sort({ createdAt: -1 });
    }

    // Execute query
    const [products, total] = await Promise.all([
        productsQuery.exec(),
        Product.countDocuments(query)
    ]);

    res.status(200).json({
        success: true,
        products,
        total,
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit)
    });
});

// Create a new product
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
    try {
        const { name, description, price, category, stock, unit, organic, certification, harvestDate, expiryDate } = req.body;
        
        // Validate required fields
        if (!name || !description || !price || !category || !stock || !unit) {
            return next(new ErrorHandler('Please fill all required fields', 400));
        }

        // Handle image uploads
        const imageUrls = [];
        if (req.files && req.files.images) {
            const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
            
            for (const image of images) {
                try {
                    const result = await cloudinary.uploader.upload(image.tempFilePath, {
                        folder: 'products',
                        crop: "scale"
                    });
                    
                    imageUrls.push({
                        public_id: result.public_id,
                        url: result.secure_url
                    });
                    
                    // Clean up temp file
                    fs.unlink(image.tempFilePath, (err) => {
                        if (err) console.error('Error deleting temp file:', err);
                    });
                } catch (error) {
                    console.error('Error uploading image:', error);
                    return next(new ErrorHandler('Error uploading images', 500));
                }
            }
        }

        const productData = {
            name,
            description,
            price,
            category,
            stock,
            unit,
            images: imageUrls,
            farmer: req.user.id,
            organic: organic === 'true' || organic === true,
            certification: certification || 'None'
        };

        if (harvestDate) productData.harvestDate = new Date(harvestDate);
        if (expiryDate) productData.expiryDate = new Date(expiryDate);

        console.log('Creating product with data:', productData);
        const product = await Product.create(productData);

        res.status(201).json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Error in createProduct:', error);
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get single product details
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id)
        .populate('farmer', 'name email')
        .populate('ratings.user', 'name');

    if (!product) {
        return next(new ErrorHandler('Product not found', 404));
    }

    res.status(200).json({
        success: true,
        product
    });
});

// Add/Update product review
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    if (!rating) {
        return next(new ErrorHandler('Please provide a rating', 400));
    }

    const product = await Product.findById(productId);
    
    if (!product) {
        return next(new ErrorHandler('Product not found', 404));
    }

    // Check if user has already reviewed
    const existingReviewIndex = product.ratings.findIndex(
        r => r.user.toString() === req.user.id.toString()
    );

    const review = {
        user: req.user.id,
        rating: Number(rating),
        comment
    };

    if (existingReviewIndex >= 0) {
        product.ratings[existingReviewIndex] = review;
    } else {
        product.ratings.push(review);
    }

    // Calculate average rating
    await product.calculateAverageRating();

    res.status(200).json({
        success: true,
        message: "Review added successfully"
    });
});

// Get product reviews
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id)
        .populate('ratings.user', 'name');

    if (!product) {
        return next(new ErrorHandler('Product not found', 404));
    }

    res.status(200).json({
        success: true,
        ratings: product.ratings
    });
});

// Get all products regardless of status (for debugging)
exports.getAllProductsDebug = catchAsyncErrors(async (req, res, next) => {
    console.log('Getting all products regardless of status');
    
    try {
        const products = await Product.find()
            .populate('farmer', 'name email');
        
        console.log(`Found ${products.length} products in total`);
        
        res.status(200).json({
            success: true,
            products,
            total: products.length
        });
    } catch (error) {
        console.error('Error in getAllProductsDebug:', error);
        return next(new ErrorHandler(error.message, 500));
    }
}); 