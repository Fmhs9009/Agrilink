import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaLeaf, 
  FaRupeeSign, 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaSeedling, 
  FaTag, 
  FaTint,
  FaCertificate,
  FaImage,
  FaUser
} from 'react-icons/fa';
import { userAPI } from '../../services/api';

// Define a placeholder image URL with better dimensions
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/800x600/e5e7eb/94a3b8?text=';

// Simple function to format relative time without date-fns
const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Recently';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  // Seconds to various time units
  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;
  
  // Format relative time
  if (diffInSeconds < minute) {
    return 'just now';
  } else if (diffInSeconds < hour) {
    const minutes = Math.floor(diffInSeconds / minute);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < day) {
    const hours = Math.floor(diffInSeconds / hour);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInSeconds < week) {
    const days = Math.floor(diffInSeconds / day);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else if (diffInSeconds < month) {
    const weeks = Math.floor(diffInSeconds / week);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffInSeconds < year) {
    const months = Math.floor(diffInSeconds / month);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    const years = Math.floor(diffInSeconds / year);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
};

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [farmerData, setFarmerData] = useState(null);
  const [farmerLoading, setFarmerLoading] = useState(false);

  // Fetch farmer data if we have a farmer ID
  useEffect(() => {
    // Skip if no product or farmer ID
    if (!product || !product.farmer) return;
    
    const fetchFarmerData = async () => {
      setFarmerLoading(true);
      try {
        // farmer field is an ObjectId reference to User model
        const farmerId = typeof product.farmer === 'string' ? product.farmer : product.farmer._id;
        
        // Use userAPI.getById instead of farmerAPI
        const response = await userAPI.getById(farmerId);
        
        if (response.success && response.user) {
          setFarmerData(response.user);
        }
      } catch (error) {
        console.error('Error fetching farmer details:', error);
      } finally {
        setFarmerLoading(false);
      }
    };

    // If farmer is just an ID and not already populated, fetch the data
    if (typeof product.farmer === 'string' || (product.farmer && !product.farmer.Name)) {
      fetchFarmerData();
    }
  }, [product]);

  // Early return if no product
  if (!product) return null;
  
  // Extract product properties
  const {
    _id,
    name = 'Unnamed Product',
    description = 'No description available',
    price = 0,
    images = [],
    category = 'Uncategorized',
    farmer = null,
    farmLocation = {},
    createdAt,
    organic = false,
    certification = 'None',
    currentGrowthStage = 'not_planted',
    estimatedHarvestDate,
    farmingPractices = [],
    pesticidesUsed,
    waterSource,
    availableQuantity = 0,
    unit = 'kg'
  } = product;

  // Determine farmer info based on what's available
  const getFarmerInfo = () => {
    // If farmer is populated as an object directly in the product
    if (farmer && typeof farmer === 'object' && farmer.Name) {
      return {
        name: farmer.Name,
        location: farmer.FarmLocation || 'Unknown Location',
        initial: farmer.Name.charAt(0) || 'F'
      };
    }
    
    // If we fetched farmer data separately
    if (farmerData) {
      return {
        name: farmerData.Name || 'Farmer',
        location: farmerData.FarmLocation || farmLocation?.district || farmLocation?.state || 'Unknown Location',
        initial: farmerData.Name?.charAt(0) || 'F'
      };
    }
    
    // Default fallback - use product's farmLocation if available
    return {
      name: 'Unknown Farmer',
      location: farmLocation?.district || farmLocation?.state || 'Unknown Location',
      initial: 'F'
    };
  };

  const { name: farmerName, location: farmerLocation, initial: farmerInitial } = getFarmerInfo();

  // Format price with commas for thousands
  const formattedPrice = price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Format created date - using our custom function instead of date-fns
  const createdDate = formatRelativeTime(createdAt);

  // Calculate days until harvest
  const daysUntilHarvest = estimatedHarvestDate 
    ? Math.ceil((new Date(estimatedHarvestDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  // Get growth stage display name
  const getGrowthStageDisplay = (stage) => {
    const stageMap = {
      'seed': 'Seed',
      'seedling': 'Seedling',
      'vegetative': 'Vegetative',
      'flowering': 'Flowering',
      'fruiting': 'Fruiting',
      'mature': 'Mature',
      'harvested': 'Harvested',
      'not_planted': 'Not Planted'
    };
    return stageMap[stage] || stage.replace('_', ' ');
  };

  // Get growth stage color
  const getGrowthStageColor = (stage) => {
    const colorMap = {
      'seed': 'bg-amber-100 text-amber-800',
      'seedling': 'bg-emerald-100 text-emerald-800',
      'vegetative': 'bg-green-100 text-green-800',
      'flowering': 'bg-purple-100 text-purple-800',
      'fruiting': 'bg-orange-100 text-orange-800',
      'mature': 'bg-yellow-100 text-yellow-800',
      'harvested': 'bg-gray-100 text-gray-800',
      'not_planted': 'bg-blue-100 text-blue-800'
    };
    return colorMap[stage] || 'bg-gray-100 text-gray-800';
  };

  // Get certification badge color
  const getCertificationColor = (cert) => {
    const colorMap = {
      'None': 'bg-gray-100 text-gray-800',
      'Organic': 'bg-green-100 text-green-800',
      'GAP': 'bg-blue-100 text-blue-800',
      'PGS': 'bg-purple-100 text-purple-800',
      'NPOP': 'bg-orange-100 text-orange-800',
      'Global GAP': 'bg-indigo-100 text-indigo-800',
      'Other': 'bg-teal-100 text-teal-800'
    };
    return colorMap[cert] || 'bg-gray-100 text-gray-800';
  };

  // Check if product has a valid image
  const hasValidImage = images && images.length > 0 && images[0].url && !imgError;

  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image with overlay information */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-200">
        {hasValidImage ? (
          <img
            src={images[0].url}
            alt={name}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isHovered ? 'scale-110' : 'scale-100'
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center p-4">
              <FaImage className="mx-auto text-gray-400 text-4xl mb-2" />
              <p className="text-gray-500 text-sm">No image available</p>
            </div>
          </div>
        )}
        
        {/* Overlay gradient only if there's an image */}
        {hasValidImage && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        )}

        {/* Price tag at bottom */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1.5 rounded-lg font-bold flex items-center">
          <FaRupeeSign className="text-gray-700 mr-0.5 text-sm" />
          {formattedPrice}
          <span className="text-xs font-normal ml-1 text-gray-600">/ {unit}</span>
        </div>

        {/* Available quantity */}
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1.5 rounded-lg font-medium text-sm">
          {availableQuantity} {unit} available
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 mb-2">{name}</h3>

        {/* Description */}
        <p className="text-gray-600 text-sm line-clamp-2 mb-3">{description}</p>
        
        {/* Category and Growth Stage badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {/* Category badge */}
          <span className="inline-flex items-center bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full">
            <FaTag className="mr-1 text-gray-600" /> {category}
          </span>

          {/* Growth stage badge */}
          <span className={`inline-flex items-center ${getGrowthStageColor(currentGrowthStage)} text-xs font-medium px-2.5 py-1 rounded-full`}>
            <FaSeedling className="mr-1" />
            {getGrowthStageDisplay(currentGrowthStage)}
          </span>
          
          {/* Harvest date badge */}
          {daysUntilHarvest !== null && (
            <span className={`inline-flex items-center ${
              daysUntilHarvest <= 0 ? 'bg-green-100 text-green-800' :
              daysUntilHarvest <= 30 ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            } text-xs font-medium px-2.5 py-1 rounded-full`}>
              <FaCalendarAlt className="mr-1" />
              {daysUntilHarvest <= 0 ? 'Ready to harvest' : 
               daysUntilHarvest === 1 ? '1 day to harvest' : 
               `${daysUntilHarvest} days to harvest`}
            </span>
          )}

          {/* Organic badge */}
          {organic && (
            <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
              <FaLeaf className="mr-1" /> Organic
            </span>
          )}
        </div>
        
        {/* Other badges section */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {/* Pesticides */}
          {pesticidesUsed !== undefined && (
            <span className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full ${
              pesticidesUsed === false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {pesticidesUsed === false ? 'No Pesticides' : 'Conventional'}
            </span>
          )}
          
          {/* Farming Practice */}
          {farmingPractices && farmingPractices.length > 0 && farmingPractices[0] !== 'Conventional' && (
            <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {farmingPractices[0]}
            </span>
          )}
          
          {/* Water Source */}
          {waterSource && waterSource !== 'Other' && (
            <span className="inline-flex items-center bg-cyan-100 text-cyan-800 text-xs font-medium px-2 py-1 rounded-full">
              <FaTint className="mr-1 text-xs" />
              {waterSource}
            </span>
          )}

          {/* Certification */}
          {certification && certification !== 'None' && (
            <span className={`inline-flex items-center ${getCertificationColor(certification)} text-xs font-medium px-2 py-1 rounded-full`}>
              <FaCertificate className="mr-1 text-xs" />
              {certification}
            </span>
          )}
        </div>

        {/* Farmer info */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 mr-2">
                {farmerLoading ? 
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div> : 
                  (farmerInitial || <FaUser className="text-sm" />)
                }
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 line-clamp-1">
                  {farmerLoading ? 'Loading...' : farmerName}
                </p>
                <p className="text-xs text-gray-500 flex items-center">
                  <FaMapMarkerAlt className="mr-1 text-gray-400" />
                  {farmerLoading ? '...' : farmerLocation}
                </p>
              </div>
            </div>
            <div className="text-xs text-gray-500 mb-6">{createdDate}</div>
          </div>
        </div>
        
        {/* View details button */}
        <Link 
          to={`/products/${_id}`}
          className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-300"
        >
          View Contract Details
        </Link>
      </div>
    </div>
  );
};

export default ProductCard; 