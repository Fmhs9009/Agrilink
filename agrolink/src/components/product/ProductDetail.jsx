import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { FaLeaf, FaCheck, FaSeedling, FaUser, FaWarehouse, FaCalendarAlt, FaHandshake, FaStar, FaMapMarkerAlt, FaTractor, FaArrowLeft, FaImages, FaShoppingCart, FaInfoCircle, FaChartLine, FaHistory, FaClipboardList, FaThumbsUp, FaAward, FaSun, FaMoon, FaWater, FaSeedling as FaSeed, FaRulerVertical, FaEnvelope, FaPhone, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { productAPI, userAPI, contractAPI } from '../../services/api';
import { ROLES } from '../../config/constants';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorBoundary from '../common/ErrorBoundary';
import authService from '../../services/authService';
import ContractRequest from '../contract/ContractRequest';
// import { useAuth } from '../../contexts/AuthContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.loginData);
  
  const [product, setProduct] = useState(null);
  const [farmer, setFarmer] = useState({});
  const [loading, setLoading] = useState(true);
  const [farmerLoading, setFarmerLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showContractForm, setShowContractForm] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [contractFormData, setContractFormData] = useState({
    contractQuantity: 1,
    contractDuration: 3,
    deliveryFrequency: 'monthly',
    paymentTerms: 'net30',
    contractNotes: ''
  });
  const [submittingContract, setSubmittingContract] = useState(false);
  const [contractSubmitted, setContractSubmitted] = useState(false);
  const [contractId, setContractId] = useState(null);
  const [contractError, setContractError] = useState(null);
  const [contractSuccess, setContractSuccess] = useState(null);
  const [contractStep, setContractStep] = useState(1);

  // Check authentication status when component mounts
  useEffect(() => {
    // If Redux state doesn't have user but authService does, refresh the page
    // This can happen if the Redux store was cleared but the token is still valid
    if (!user && authService.isAuthenticated()) {
      window.location.reload();
    }
  }, [user]);

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
        
        // console.log("Product data received:", response.product);
        setProduct(response.product);
        
        // Set initial quantity to minimumOrderQuantity if available
        if (response.product.minimumOrderQuantity) {
          setQuantity(response.product.minimumOrderQuantity);
        }
        
        // Fetch farmer details if farmer ID is available
        if (response.product.farmer) {
          if (typeof response.product.farmer === 'string') {
            // If only farmer ID is available, fetch farmer details
            fetchFarmerDetails(response.product.farmer);
          } else if (typeof response.product.farmer === 'object' && response.product.farmer !== null) {
            // If farmer object is already populated, use it directly
            setFarmer(response.product.farmer);
            
            // If farmer object doesn't have all details, fetch complete details
            if (!response.product.farmer.email || !response.product.farmer.phone) {
              fetchFarmerDetails(response.product.farmer._id);
            }
          }
        }
        
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
  // Fetch farmer details
  const fetchFarmerDetails = async (farmerId) => {
    if (!farmerId) return;
    
    try {
      setFarmerLoading(true);
      const response = await userAPI.getById(farmerId);
      
      if (response.success && response.user) {
        setFarmer(response.user);
      } else {
        console.error("Failed to fetch farmer details:", response);
      }
    } catch (err) {
      console.error('Error fetching farmer details:', err);
    } finally {
      setFarmerLoading(false);
    }
  };

  // Handle contract form submission
  const handleContractFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!contractFormData.contractQuantity || contractFormData.contractQuantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    
    if (product && contractFormData.contractQuantity > product.availableQuantity) {
      toast.error(`Quantity cannot exceed available quantity (${product.availableQuantity} ${product.unit})`);
      return;
    }
    
    if (!contractFormData.contractDuration || contractFormData.contractDuration <= 0) {
      toast.error("Please enter a valid contract duration");
      return;
    }
    
    // Check if user is logged in
    const currentUser = authService.getUser();
    if (!currentUser) {
      toast.error("Please login to submit a contract request");
      navigate('/login');
      return;
    }
    
    // Set loading state
    setSubmittingContract(true);
    setContractError(null);
    
    try {
      if (!product) {
        throw new Error("Product information is missing");
      }
      
      // Prepare contract data
      const contractData = {
        cropId: product._id,
        farmerId: product.farmer._id,
        quantity: contractFormData.contractQuantity,
        unit: product.unit,
        pricePerUnit: product.price,
        totalAmount: contractFormData.contractQuantity * product.price,
        expectedHarvestDate: product.harvestDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        deliveryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        deliveryFrequency: contractFormData.deliveryFrequency,
        paymentTerms: contractFormData.paymentTerms,
        qualityRequirements: product.qualityStandards || "",
        specialRequirements: contractFormData.contractNotes
      };
      
      // Submit contract request
      const response = await contractAPI.createContractRequest(contractData);
      
      // Handle success
      if (response.success) {
        setContractSuccess(response.contract);
        setContractSubmitted(true);
        setContractStep(2);
        toast.success("Contract request submitted successfully!");
      } else {
        throw new Error(response.message || "Failed to submit contract request");
      }
    } catch (error) {
      console.error("Error submitting contract request:", error);
      setContractError(error.message || "An error occurred while submitting your contract request");
      toast.error(error.message || "Failed to submit contract request. Please try again.");
    } finally {
      setSubmittingContract(false);
    }
  };

  // Handle contract request button click
  const handleContractRequest = () => {
    // Check if user is logged in using Redux state
    if (!user) {
      toast.error("Please login to request a contract");
      navigate('/login');
      return;
    }
    
    // Check if user is a customer (only customers can request contracts)
    if (user.accountType !== ROLES.BUYER) {
      toast.error("Only customers can request contracts.");
      return;
    }
    
    // Show contract form modal for customers
    setShowContractForm(true);
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
          {/* Back button and Breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center text-green-600 hover:text-green-800 mb-4 sm:mb-0"
            >
              <FaArrowLeft className="mr-2" />
              <span>Back to Products</span>
            </button>
            
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link to="/" className="text-gray-500 hover:text-gray-700">Home</Link>
              </li>
              <li className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                  <Link to="/shop" className="text-gray-500 hover:text-gray-700">Products</Link>
              </li>
              <li className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                  <span className="text-gray-900 font-medium truncate max-w-xs">{product.name}</span>
              </li>
            </ol>
          </nav>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Product Images */}
              <div className="bg-white p-6 flex flex-col justify-center">
                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-100 mb-4 border border-gray-200">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[activeImage].url || product.images[activeImage]}
                      alt={product.name}
                      className="h-96 w-full object-cover object-center"
                    />
                  ) : (
                    <div className="h-96 w-full flex items-center justify-center bg-gray-100">
                      <FaSeedling className="h-24 w-24 text-green-300" />
                    </div>
                  )}
                </div>
                
                {/* Thumbnail Images */}
                {product.images && product.images.length > 1 && (
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {product.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImage(index)}
                        className={`aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-md ${
                          activeImage === index ? 'ring-2 ring-green-500' : 'ring-1 ring-gray-200'
                        }`}
                      >
                        <img
                          src={image.url || image}
                          alt={`${product.name} - Image ${index + 1}`}
                          className="h-16 w-full object-cover object-center"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Product Info */}
              <div className="bg-white p-6 lg:border-l border-gray-100">
                {/* Product badges */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {product.isOrganic && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <FaLeaf className="mr-1" />
                      Organic
                    </span>
                  )}
                  {product.isFeatured && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <FaStar className="mr-1" />
                      Featured
                    </span>
                  )}
                  {product.farmingPractices && product.farmingPractices.includes('Sustainable') && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <FaWater className="mr-1" />
                      Sustainable
                    </span>
                  )}
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                
                <div className="flex items-center mb-4">
                  <span className="text-3xl font-bold text-green-600">₹{product.price}</span>
                  <span className="ml-2 text-gray-600">per {product.unit}</span>
                  </div>
                  
                <div className="border-t border-gray-100 py-4 mb-6">
                  <p className="text-gray-700 text-lg leading-relaxed">{product.description}</p>
                  </div>
                  
                {/* Farmer Info Card */}
                <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-100">
                  <h3 className="font-medium text-green-800 mb-2 flex items-center">
                    <FaUser className="mr-2" />
                    Farmer Information
                    {farmerLoading && <span className="ml-2 text-xs text-gray-500">(Loading details...)</span>}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center">
                      <span className="text-gray-600 mr-2">Name:</span>
                      <span className="font-medium">{farmer.Name}</span>
                    </div>
                    <br />
                    <div className="flex items-center">
                      <span className="text-gray-600 mr-2">Location:</span>
                      <span className="font-medium">{farmer.FarmLocation}</span>
                    </div>
                    <br />
                    {farmer.phone && (
                      <div className="flex items-center">
                        <span className="text-gray-600 mr-2">
                          <FaPhone className="inline mr-1" /> Phone:
                        </span>
                        <span className="font-medium">{farmer.phone}</span>
                      </div>
                    )}
                    {farmer.email && (
                      <div className="flex items-center">
                        <span className="text-gray-600 mr-2">
                          <FaEnvelope className="inline mr-1" /> Email:
                        </span>
                        <span className="font-medium">{farmer.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Availability and Quantity */}
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <FaWarehouse className="text-gray-500 mr-2" />
                    <span className="text-gray-700">Available Stock: </span>
                    <span className={`ml-2 font-medium ${product.availableQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.availableQuantity} {product.unit}
                    </span>
                  </div>
                  <div className="flex items-center mb-3">
                    <FaCalendarAlt className="text-gray-500 mr-2" />
                    <span className="text-gray-700">Seasonal Availability: </span>
                    <span className="ml-2 font-medium">{product.seasonalAvailability ? `${product.seasonalAvailability.startMonth} to ${product.seasonalAvailability.endMonth}` : 'Year-round availability'}</span>
                  </div>
                </div>
                
                {/* Quantity Input */}
                {product.availableQuantity > 0 ? (
                  <div className="mb-6">
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Quantity for Contract
                    </label>
                    <div className="flex items-center">
                      {/* <button 
                        onClick={() => quantity > (product.minimumOrderQuantity || 1) && setQuantity(quantity - 1)}
                        className="bg-gray-200 px-3 py-2 rounded-l-md hover:bg-gray-300"
                      >
                        -
                      </button> */}
                      <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        min={product.minimumOrderQuantity || 1}
                        max={product.availableQuantity}
                        value={quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value >= product.minimumOrderQuantity && value <= product.availableQuantity) {
                            setQuantity(value);
                          }
                        }}
                        readOnly={true}
                        className="w-20 border-y border-gray-300 py-2 px-3 text-center focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                      {/* <button 
                        onClick={() => quantity < product.availableQuantity && setQuantity(quantity + 1)}
                        className="bg-gray-200 px-3 py-2 rounded-r-md hover:bg-gray-300"
                      >
                        +
                      </button> */}
                      <span className="ml-3 text-gray-500">{product.unit}(s)</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Minimum order: {product.minimumOrderQuantity || 1} {product.unit}(s)
                    </p>
                  </div>
                ) : (
                  <div className="mb-6">
                    <p className="text-red-600 font-medium flex items-center">
                      <FaInfoCircle className="mr-2" />
                      Currently Out of Stock
                    </p>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  {(!user || user.accountType === ROLES.BUYER) && (
                  <button
                    onClick={handleContractRequest}
                    disabled={product.availableQuantity <= 0}
                    className="flex-1 flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <FaHandshake className="mr-2" />
                    Request Contract
                  </button>
                  )}
                  
                  <button
                    onClick={() => window.open(`mailto:${farmer.email}?subject=Inquiry about ${product.name}&body=Hello, I am interested in your product: ${product.name}.`)}
                    className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <FaUser className="mr-2" />
                    Contact Farmer
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Product Details Tabs */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-6 font-medium text-sm border-b-2 ${
                    activeTab === 'overview'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FaInfoCircle className="inline mr-2" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('specifications')}
                  className={`py-4 px-6 font-medium text-sm border-b-2 ${
                    activeTab === 'specifications'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FaClipboardList className="inline mr-2" />
                  Specifications
                </button>
                <button
                  onClick={() => setActiveTab('farming')}
                  className={`py-4 px-6 font-medium text-sm border-b-2 ${
                    activeTab === 'farming'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FaTractor className="inline mr-2" />
                  Farming Practices
                </button>
                <button
                  onClick={() => setActiveTab('contract')}
                  className={`py-4 px-6 font-medium text-sm border-b-2 ${
                    activeTab === 'contract'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FaHandshake className="inline mr-2" />
                  Contract Details
                </button>
              </nav>
            </div>
            
            <div className="p-6">
              {activeTab === 'overview' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-gray-700 mb-4">{product.description}</p>
                      
                      <h4 className="font-medium text-gray-900 mb-2">Key Benefits</h4>
                      <ul className="list-disc pl-5 text-gray-700 mb-4">
                        <li>High-quality {product.category.toLowerCase()} from {product.farmer?.location || 'local farms'}</li>
                        {product.isOrganic && <li>Organically grown without harmful pesticides</li>}
                        {product.farmingPractices?.includes('Sustainable') && <li>Sustainably farmed with eco-friendly practices</li>}
                        <li>Fresh harvest with optimal nutritional value</li>
                        <li>Direct from farmer ensuring fair trade practices</li>
                      </ul>
                      
                      <h4 className="font-medium text-gray-900 mb-2">Best Uses</h4>
                      <p className="text-gray-700">
                        {product.category === 'Grains' && 'Ideal for daily consumption, cooking, and food processing industries.'}
                        {product.category === 'Vegetables' && 'Perfect for fresh consumption, cooking, and food service businesses.'}
                        {product.category === 'Fruits' && 'Great for fresh consumption, juicing, and food processing.'}
                        {product.category === 'Dairy' && 'Excellent for direct consumption and food production.'}
                        {product.category === 'Spices' && 'Ideal for culinary uses, food processing, and export.'}
                        {!['Grains', 'Vegetables', 'Fruits', 'Dairy', 'Spices'].includes(product.category) && 
                          'Suitable for various agricultural and food production needs.'}
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-5 rounded-lg border border-green-100">
                      <h4 className="font-medium text-green-800 mb-3">Contract Farming Opportunity</h4>
                      <p className="text-gray-700 mb-4">
                        This product is available for contract farming arrangements, allowing buyers to secure a steady supply with agreed-upon terms.
                      </p>
                      
                      <h5 className="font-medium text-gray-700 mb-2">Benefits of Contract Farming:</h5>
                      <ul className="space-y-2 mb-4">
                        <li className="flex items-start">
                          <FaCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                          <span>Guaranteed supply at pre-determined prices</span>
                        </li>
                        <li className="flex items-start">
                          <FaCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                          <span>Quality assurance and consistent standards</span>
                        </li>
                        <li className="flex items-start">
                          <FaCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                          <span>Reduced market volatility and price fluctuations</span>
                        </li>
                        <li className="flex items-start">
                          <FaCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                          <span>Direct relationship with the producer</span>
                        </li>
                      </ul>
                  
                  {(!user || user.accountType === ROLES.BUYER) && (
                  <button
                    onClick={handleContractRequest}
                        disabled={product.availableQuantity <= 0}
                        className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                          product.availableQuantity <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <FaHandshake className="mr-2" />
                    Request Contract
                  </button>
                  )}
                </div>
              </div>
            </div>
              )}
              
              {activeTab === 'specifications' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Specifications</h3>
                  
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap bg-gray-50 text-sm font-medium text-gray-900 w-1/3">Product Name</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.name}</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap bg-gray-50 text-sm font-medium text-gray-900">Category</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.category}</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap bg-gray-50 text-sm font-medium text-gray-900">Price</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">₹{product.price}</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap bg-gray-50 text-sm font-medium text-gray-900">Available Quantity</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.availableQuantity} {product.unit}</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap bg-gray-50 text-sm font-medium text-gray-900">Organic</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.isOrganic ? 'Yes' : 'No'}</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap bg-gray-50 text-sm font-medium text-gray-900">Seasonal Availability</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.seasonalAvailability ? `${product.seasonalAvailability.startMonth} to ${product.seasonalAvailability.endMonth}` : 'Year-round availability'}</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap bg-gray-50 text-sm font-medium text-gray-900">Harvest Date</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {product.estimatedHarvestDate
   ? new Date(product.estimatedHarvestDate
    ).toLocaleDateString('en-IN') : 'Not specified'}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap bg-gray-50 text-sm font-medium text-gray-900">Storage Instructions</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {product.storageInstructions || 'Store in a cool, dry place away from direct sunlight.'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
          </div>
                </div>
              )}
              
              {activeTab === 'farming' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Farming Practices</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Cultivation Methods</h4>
                      
                      <div className="space-y-4 mb-6">
                        {product.isOrganic && (
                          <div className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <FaLeaf className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="ml-4">
                              <h5 className="text-sm font-medium text-gray-900">Organic Farming</h5>
                              <p className="text-sm text-gray-500">
                                Grown without synthetic pesticides or fertilizers, focusing on natural farming methods.
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {product.farmingPractices?.includes('Sustainable') && (
                          <div className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <FaWater className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <h5 className="text-sm font-medium text-gray-900">Sustainable Practices</h5>
                              <p className="text-sm text-gray-500">
                                Employs methods that protect the environment and ensure long-term ecological balance.
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {product.farmingPractices?.includes('Traditional') && (
                          <div className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                              <FaHistory className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                              <h5 className="text-sm font-medium text-gray-900">Traditional Farming</h5>
                              <p className="text-sm text-gray-500">
                                Uses time-tested traditional methods passed down through generations of farmers.
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {product.farmingPractices?.includes('Modern') && (
                          <div className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <FaTractor className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="ml-4">
                              <h5 className="text-sm font-medium text-gray-900">Modern Techniques</h5>
                              <p className="text-sm text-gray-500">
                                Incorporates modern agricultural technology and scientific methods for optimal yield.
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {(!product.farmingPractices || product.farmingPractices.length === 0) && (
                          <div className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <FaSeedling className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="ml-4">
                              <h5 className="text-sm font-medium text-gray-900">Standard Cultivation</h5>
                              <p className="text-sm text-gray-500">
                                Uses standard farming practices suitable for this type of crop.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <h4 className="font-medium text-gray-900 mb-3">Seasonal Information</h4>
                      <p className="text-gray-700 mb-4">
                        This product is primarily available during {product.seasonalAvailability ? `${product.seasonalAvailability.startMonth} to ${product.seasonalAvailability.endMonth}` : 'Year-round availability'}.
                        {product.seasonalAvailability?.notes && ` ${product.seasonalAvailability.notes}`}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-3">Quality Assurance</h4>
                      
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <FaCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                          <div>
                            <h5 className="text-sm font-medium text-gray-900">Quality Control</h5>
                            <p className="text-sm text-gray-500">
                              Each harvest undergoes rigorous quality checks to ensure only the best produce reaches you.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <FaCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                          <div>
                            <h5 className="text-sm font-medium text-gray-900">Traceability</h5>
                            <p className="text-sm text-gray-500">
                              Complete transparency in the supply chain from farm to consumer.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <FaCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                          <div>
                            <h5 className="text-sm font-medium text-gray-900">Freshness Guarantee</h5>
                            <p className="text-sm text-gray-500">
                              Products are harvested and delivered with minimal time in transit to ensure maximum freshness.
                            </p>
                          </div>
                        </div>
                        
                        {product.certifications && (
                          <div className="flex items-start">
                            <FaAward className="text-yellow-500 mt-1 mr-3 flex-shrink-0" />
                            <div>
                              <h5 className="text-sm font-medium text-gray-900">Certifications</h5>
                              <p className="text-sm text-gray-500">
                                {product.certifications}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'contract' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Farming Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Contract Terms</h4>
                      
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
                        <table className="min-w-full divide-y divide-gray-200">
                          <tbody className="divide-y divide-gray-200">
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap bg-gray-50 text-sm font-medium text-gray-900">Minimum Order Quantity</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {product.contractPreferences?.minQuantity || 100} {product.unit}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap bg-gray-50 text-sm font-medium text-gray-900">Contract Duration</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {product.contractPreferences?.minDuration || 3} - {product.contractPreferences?.maxDuration || 12} months
                              </td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap bg-gray-50 text-sm font-medium text-gray-900">Payment Terms</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {product.contractPreferences?.preferredPaymentTerms || 'Negotiable (typically 30-60 days)'}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap bg-gray-50 text-sm font-medium text-gray-900">Delivery Schedule</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {product.contractPreferences?.deliverySchedule || 'Flexible, based on harvest schedule and buyer needs'}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap bg-gray-50 text-sm font-medium text-gray-900">Quality Standards</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {product.contractPreferences?.qualityStandards || 'Industry standard with quality assurance checks'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <p className="text-sm text-gray-500 italic">
                        Note: All contract terms are negotiable and can be customized based on mutual agreement between the farmer and buyer.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Contract Process</h4>
                      
                      <ol className="relative border-l border-gray-200 ml-3 space-y-6">
                        <li className="mb-6 ml-6">
                          <span className="absolute flex items-center justify-center w-8 h-8 bg-green-100 rounded-full -left-4 ring-4 ring-white">
                            <span className="text-green-600 text-sm font-bold">1</span>
                          </span>
                          <h5 className="font-medium text-gray-900">Initial Inquiry</h5>
                          <p className="text-sm text-gray-500">
                            Submit your interest through the "Request Contract" button with your desired quantity and duration.
                          </p>
                        </li>
                        <li className="mb-6 ml-6">
                          <span className="absolute flex items-center justify-center w-8 h-8 bg-green-100 rounded-full -left-4 ring-4 ring-white">
                            <span className="text-green-600 text-sm font-bold">2</span>
                          </span>
                          <h5 className="font-medium text-gray-900">Discussion</h5>
                          <p className="text-sm text-gray-500">
                            The farmer will contact you to discuss specific requirements, terms, and conditions.
                          </p>
                        </li>
                        <li className="mb-6 ml-6">
                          <span className="absolute flex items-center justify-center w-8 h-8 bg-green-100 rounded-full -left-4 ring-4 ring-white">
                            <span className="text-green-600 text-sm font-bold">3</span>
                          </span>
                          <h5 className="font-medium text-gray-900">Contract Drafting</h5>
                          <p className="text-sm text-gray-500">
                            A formal contract will be drafted outlining all agreed terms, quantities, prices, and delivery schedules.
                          </p>
                        </li>
                        <li className="mb-6 ml-6">
                          <span className="absolute flex items-center justify-center w-8 h-8 bg-green-100 rounded-full -left-4 ring-4 ring-white">
                            <span className="text-green-600 text-sm font-bold">4</span>
                          </span>
                          <h5 className="font-medium text-gray-900">Execution</h5>
                          <p className="text-sm text-gray-500">
                            Both parties sign the contract, and the farming process begins according to the agreed schedule.
                          </p>
                        </li>
                      </ol>
                      
                      <div className="mt-8">
                        {(!user || user.accountType === ROLES.BUYER) && (
                        <button
                          type="submit"
                          onClick={handleContractRequest}
                          disabled={submittingContract}
                          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingContract ? (
                            <>
                              <FaSpinner className="animate-spin mr-2" />
                              Submitting Request...
                            </>
                          ) : (
                            <>
                              <FaHandshake className="mr-2" />
                              Submit Contract Request
                            </>
                          )}
                        </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Similar Products Section */}
          {similarProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Similar Products</h2>
            <p className="text-gray-600 text-sm">Other products you might be interested in</p>
          </div>
              
              {loadingSimilar ? (
            <div className="p-6">
                <LoadingSpinner message="Loading similar products..." />
            </div>
              ) : (
            <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {similarProducts.map((similarProduct) => (
                  <div key={similarProduct._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                      <Link to={`/products/${similarProduct._id}`}>
                        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden">
                          {similarProduct.images && similarProduct.images.length > 0 ? (
                            <img
                            src={similarProduct.images[0].url || similarProduct.images[0]}
                              alt={similarProduct.name}
                              className="h-48 w-full object-cover object-center"
                            />
                          ) : (
                          <div className="h-48 w-full flex items-center justify-center bg-gray-100">
                            <FaSeedling className="h-12 w-12 text-green-300" />
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">{similarProduct.name}</h3>
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{similarProduct.description}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-medium text-green-600">₹{product.price}</p>
                          <div className="flex space-x-1">
                            {similarProduct.isOrganic && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <FaLeaf className="mr-1" />
                                Organic
                              </span>
                            )}
                          </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
              </div>
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
              {contractSubmitted ? (
                // Success view after submission
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                      <FaCheck className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                      Contract Request Submitted!
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Your contract request has been sent to the farmer. They will review your request and contact you soon.
                    </p>
                    
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6 text-left">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Request Summary</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Product:</p>
                          <p className="font-medium">{product.name}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Quantity:</p>
                          <p className="font-medium">{contractSuccess?.quantity || contractFormData.contractQuantity} {product.unit}(s)</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Duration:</p>
                          <p className="font-medium">{contractSuccess?.contractDuration || contractFormData.contractDuration} months</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total Value:</p>
                          <p className="font-medium text-green-600">₹{contractSuccess?.totalAmount || (product.price * contractFormData.contractQuantity)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Delivery:</p>
                          <p className="font-medium">{
                            {
                              'weekly': 'Weekly',
                              'biweekly': 'Bi-Weekly',
                              'monthly': 'Monthly',
                              'quarterly': 'Quarterly',
                              'onetime': 'One-Time Delivery'
                            }[contractSuccess?.deliveryFrequency || contractFormData.deliveryFrequency] || (contractSuccess?.deliveryFrequency || contractFormData.deliveryFrequency)
                          }</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Payment Terms:</p>
                          <p className="font-medium">{
                            {
                              'standard': 'Standard (50% advance, 50% on delivery)',
                              'milestone': 'Milestone-based payments',
                              'delivery': 'Full payment on delivery',
                              'advance': 'Full payment in advance (10% discount)',
                              'net30': 'Net 30 days',
                              'net60': 'Net 60 days'
                            }[contractSuccess?.paymentTerms || contractFormData.paymentTerms] || (contractSuccess?.paymentTerms || contractFormData.paymentTerms)
                          }</p>
                        </div>
                        {contractSuccess && contractSuccess._id && (
                          <div className="col-span-2">
                            <p className="text-gray-500">Contract ID:</p>
                            <p className="font-medium">{contractSuccess._id}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowContractForm(false);
                          navigate('/contracts');
                        }}
                        className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <FaClipboardList className="mr-2" />
                        View My Contracts
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setShowContractForm(false)}
                        className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      >
                        Continue Shopping
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Contract form view
                <ContractRequest 
                  product={product} 
                  onClose={() => setShowContractForm(false)} 
                  onSubmitSuccess={(contractData) => {
                    setContractSuccess(contractData);
                    setContractSubmitted(true);
                    toast.success("Contract request submitted successfully!");
                  }}
                />
              )}
                </div>
              </div>
            </div>
          )}
    </ErrorBoundary>
  );
};

export default ProductDetail; 