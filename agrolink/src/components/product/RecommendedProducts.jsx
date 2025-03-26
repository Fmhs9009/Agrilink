import React from 'react';
import { Link } from 'react-router-dom';
import { FaLeaf, FaMapMarkerAlt } from 'react-icons/fa';
import { formatCurrency } from '../../utils/helpers';

// Recommended products component
const RecommendedProducts = ({ products }) => {
  if (!products || products.length === 0) {
    return null;
  }
console.log(products)
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Recommended For You</h2>
        <Link to="/shop" className="text-green-600 hover:text-green-800 text-sm font-medium">
          View More
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <div key={product._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-32 overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img 
                  src={product.images[0].url} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <FaLeaf className="text-gray-400 text-2xl" />
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <FaMapMarkerAlt className="mr-1" />
                <span className="truncate">{product.farmer?.location || 'Location not available'}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-900 font-medium">₹{formatCurrency(product.price)}</span>
                <span className="text-xs text-gray-500">{product.unit}</span>
              </div>
              <Link 
                to={`/product/${product._id}`}
                className="mt-2 block text-center bg-green-600 text-white text-sm py-1 px-2 rounded hover:bg-green-700 transition-colors"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedProducts; 