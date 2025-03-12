const express = require('express');
const router = express.Router();
const {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductDetails,
    getFarmerProducts,
    createProductReview,
    getProductReviews,
    getAllProductsDebug
} = require('../Controller/productController');
const { verifyToken, isFarmer } = require('../Middleware/auth');

// Public routes
router.get('/', getAllProducts);
router.get('/all', getAllProductsDebug);
router.get('/product/:id', getProductDetails);
router.get('/reviews/:id', getProductReviews);

// Farmer routes
router.get('/farmer/products', verifyToken, isFarmer, getFarmerProducts);
router.post('/new', verifyToken, isFarmer, createProduct);
router.put('/product/:id', verifyToken, isFarmer, updateProduct);
router.delete('/product/:id', verifyToken, isFarmer, deleteProduct);

// Customer routes
router.post('/review/:id', verifyToken, createProductReview);

module.exports = router; 