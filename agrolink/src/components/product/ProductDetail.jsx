import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { FaLeaf, FaCheck, FaSeedling, FaUser,FaWarehouse, FaCalendarAlt, FaHandshake, FaStar, FaMapMarkerAlt, FaTractor, FaArrowLeft, FaImages, FaShoppingCart } from 'react-icons/fa';
import { productAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorBoundary from '../common/ErrorBoundary';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.loginData);
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showContractForm, setShowContractForm] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // Fetch product details
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await productAPI.getById(id);
        
       
        if (!response.success) {
          setError('Product not found');
          return;
        }
        setProduct(response.product);
        
        // Fetch similar products
        if (response.product.category) {
          setLoadingSimilar(true);
          const similarResponse = await productAPI.getByCategory(response.product.category);
          
          // Filter out current product and limit to 4 products
          const filteredProducts = Array.isArray(similarResponse.product) 
            ? similarResponse.product.filter(p => p._id !== id).slice(0, 4)
            : [];
            
          setSimilarProducts(filteredProducts);
          setLoadingSimilar(false);
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError('Failed to load product details');
        toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductDetails();
  }, [id]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN').format(amount);
  };

  // Handle quantity change
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= (product?.stock || 0)) {
      setQuantity(value);
    }
  };

  // Handle contract request
  const handleContractRequest = () => {
    if (!user) {
      toast.error('Please login to request a contract');
      navigate('/login');
      return;
    }
    
    setShowContractForm(true);
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add to cart');
      navigate('/login');
      return;
    }
    
    // Add to cart logic here
    toast.success(`Added ${quantity} ${product.unit}(s) of ${product.name} to cart`);
  };

  if (loading) {
    return <LoadingSpinner message="Loading product details..." />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
        <p className="font-medium">Error</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700">
        <p className="font-medium">Product not found</p>
        <p className="text-sm">The product you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link to="/" className="text-gray-500 hover:text-gray-700">Home</Link>
              </li>
              <li className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <Link to="/shop" className="text-gray-500 hover:text-gray-700">Shop</Link>
              </li>
              <li className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <Link to={`/shop?category=${product.category}`} className="text-gray-500 hover:text-gray-700">
                  {product.category}
                </Link>
              </li>
              <li className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-gray-900 font-medium">{product.name}</span>
              </li>
            </ol>
          </nav>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
              {/* Product Images */}
              <div>
                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 mb-4">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[activeImage].url}
                      alt={product.name}
                      className="h-full w-full object-cover object-center"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-200">
                      <FaSeedling className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Thumbnail Images */}
                {product.images && product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImage(index)}
                        className={`aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-md ${
                          activeImage === index ? 'ring-2 ring-green-500' : 'ring-1 ring-gray-200'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${product.name} - Image ${index + 1}`}
                          className="h-full w-full object-cover object-center"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Product Info */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
                
                <div className="flex items-center mb-4">
                  <span className="text-2xl font-bold text-gray-900">₹{formatCurrency(product.price)}</span>
                  <span className="ml-2 text-gray-500">per {product.unit}</span>
                  
                  {product.isOrganic && (
                    <span className="ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <FaLeaf className="mr-1" />
                      Organic
                    </span>
                  )}
                </div>
                
                <div className="border-t border-b border-gray-200 py-4 mb-4">
                  <p className="text-gray-700">{product.description}</p>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <FaUser className="text-gray-500 mr-2" />
                    <span className="text-gray-700">Farmer: </span>
                    <span className="ml-2 font-medium">{product.farmer?.name || 'Unknown'}</span>
                  </div>
                  
                  <div className="flex items-center mb-2">
                    <FaMapMarkerAlt className="text-gray-500 mr-2" />
                    <span className="text-gray-700">Location: </span>
                    <span className="ml-2">{product.farmer?.location || 'Not specified'}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <FaWarehouse className="text-gray-500 mr-2" />
                    <span className="text-gray-700">Available Stock: </span>
                    <span className={`ml-2 ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.stock} {product.unit}
                    </span>
                  </div>
                </div>
                
                {/* Quantity and Add to Cart */}
                {product.stock > 0 ? (
                  <div className="mb-6">
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        min="1"
                        max={product.stock}
                        value={quantity}
                        onChange={handleQuantityChange}
                        className="w-20 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                      <span className="ml-2 flex items-center text-gray-500">{product.unit}(s)</span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <p className="text-red-600 font-medium">Out of Stock</p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                    className={`flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                      product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <FaShoppingCart className="mr-2" />
                    Add to Cart
                  </button>
                  
                  <button
                    onClick={handleContractRequest}
                    disabled={product.stock <= 0}
                    className={`flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <FaHandshake className="mr-2" />
                    Request Contract
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Similar Products */}
          {similarProducts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Similar Products</h2>
              
              {loadingSimilar ? (
                <LoadingSpinner message="Loading similar products..." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {similarProducts.map((similarProduct) => (
                    <div key={similarProduct._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      <Link to={`/products/${similarProduct._id}`}>
                        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden">
                          {similarProduct.images && similarProduct.images.length > 0 ? (
                            <img
                              src={similarProduct.images[0]}
                              alt={similarProduct.name}
                              className="h-48 w-full object-cover object-center"
                            />
                          ) : (
                            <div className="h-48 w-full flex items-center justify-center bg-gray-200">
                              <FaSeedling className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <h3 className="text-lg font-medium text-gray-900">{similarProduct.name}</h3>
                          <p className="mt-1 text-gray-500 truncate">{similarProduct.description}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <p className="text-lg font-medium text-gray-900">₹{formatCurrency(similarProduct.price)}</p>
                            {similarProduct.isOrganic && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <FaLeaf className="mr-1" />
                                Organic
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Contract Form Modal */}
          {showContractForm && (
            <div className="fixed z-10 inset-0 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                        <FaHandshake className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Request Contract for {product.name}
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Fill out the details below to request a contract with the farmer.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Contract Form */}
                    <div className="mt-4">
                      <form>
                        <div className="mb-4">
                          <label htmlFor="contractQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity (in {product.unit})
                          </label>
                          <input
                            type="number"
                            id="contractQuantity"
                            name="contractQuantity"
                            min="1"
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label htmlFor="contractDuration" className="block text-sm font-medium text-gray-700 mb-1">
                            Contract Duration (in months)
                          </label>
                          <input
                            type="number"
                            id="contractDuration"
                            name="contractDuration"
                            min="1"
                            max="24"
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label htmlFor="contractTerms" className="block text-sm font-medium text-gray-700 mb-1">
                            Additional Terms (optional)
                          </label>
                          <textarea
                            id="contractTerms"
                            name="contractTerms"
                            rows="3"
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          ></textarea>
                        </div>
                      </form>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Submit Request
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowContractForm(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ProductDetail; 