import React from 'react';
import { Link } from 'react-router-dom';
import { FaLeaf, FaCheck, FaSeedling, FaUser, FaCalendarAlt, FaHandshake, FaStar } from 'react-icons/fa';

const ProductCard = ({ product }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={product.images && product.images.length > 0 ? product.images[0].url : 'https://via.placeholder.com/400x300?text=No+Image'} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        {/* Status Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {product.organic && (
            <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
              <FaLeaf className="mr-1" /> Organic
            </div>
          )}
          {product.certification && product.certification !== 'None' && (
            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
              <FaCheck className="mr-1" /> {product.certification}
            </div>
          )}
        </div>
        {/* Growth Stage Badge */}
        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
          <FaSeedling className="mr-1" /> {product.currentGrowthStage}
        </div>
        {/* Contract Status */}
        {product.openToCustomGrowing && (
          <div className="absolute bottom-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
            Custom Growing Available
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Title and Rating */}
        <div className="flex justify-between items-start mb-2">
          <Link to={`/product/${product._id}`}>
            <h3 className="text-lg font-semibold text-gray-800 hover:text-green-600 transition-colors">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center">
            <div className="flex text-yellow-400">
              <FaStar />
              <span className="ml-1 text-gray-700">{product.averageRating?.toFixed(1) || '0'}</span>
            </div>
          </div>
        </div>

        {/* Farmer Info */}
        <div className="flex items-center mb-3 text-sm text-gray-600">
          <FaUser className="mr-1" />
          <span>{product.farmer?.name || 'Local Farmer'}</span>
          {product.farmLocation?.district && (
            <span className="ml-2">• {product.farmLocation.district}</span>
          )}
        </div>

        {/* Contract Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <FaCalendarAlt className="mr-2 text-green-600" />
            <span>Expected Harvest: {new Date(product.estimatedHarvestDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <FaHandshake className="mr-2 text-green-600" />
            <span>Min. Contract: {product.minimumOrderQuantity} {product.unit}</span>
          </div>
        </div>

        {/* Price and Availability */}
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-xl font-bold text-green-600">₹{product.price}</p>
            <p className="text-sm text-gray-500">per {product.unit}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">Available Quantity</p>
            <p className="text-sm text-gray-500">{product.availableQuantity} {product.unit}</p>
          </div>
        </div>

        {/* Contract Terms */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {product.farmingPractices?.map((practice, index) => (
              <span 
                key={index}
                className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
              >
                {practice}
              </span>
            ))}
          </div>
        </div>

        {/* Contract Duration */}
        {product.contractPreferences && (
          <div className="text-sm text-gray-600 mb-4">
            <p>Contract Duration: {product.contractPreferences.minDuration}-{product.contractPreferences.maxDuration} days</p>
          </div>
        )}

        {/* Action Button */}
        <Link 
          to={`/product/${product._id}`}
          className="block w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors text-center font-medium flex items-center justify-center gap-2"
        >
          <FaHandshake size={16} />
          View Contract Details
        </Link>
      </div>
    </div>
  );
};

export default ProductCard; 