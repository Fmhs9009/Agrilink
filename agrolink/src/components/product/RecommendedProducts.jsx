import React from 'react';
import { Link } from 'react-router-dom';
import { FaLeaf, FaMapMarkerAlt, FaStar, FaRupeeSign, FaWeightHanging, FaExternalLinkAlt, FaArrowRight } from 'react-icons/fa';
import { formatCurrency } from '../../utils/helpers';

// Recommended products component
const RecommendedProducts = ({ products }) => {
  if (!products || products.length === 0) {
    return null;
  }

  // Add some sample badges for visual enhancement
  const getBadge = (index) => {
    const badges = [
      { text: 'Trending', color: 'bg-red-500' },
      { text: 'Organic', color: 'bg-green-500' },
      { text: 'Best Value', color: 'bg-blue-500' },
      { text: 'Top Rated', color: 'bg-purple-500' },
      { text: 'Seasonal', color: 'bg-yellow-500' }
    ];
    return badges[index % badges.length];
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Recommended For You</h2>
        <Link to="/products" className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center group">
          View All Products 
          <FaArrowRight className="ml-2 transform group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product, index) => {
          const badge = getBadge(index);
          return (
            <div 
              key={product._id} 
              className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Badge */}
              <div className={`absolute top-3 right-3 z-10 ${badge.color} text-white text-xs font-bold px-2 py-1 rounded-full`}>
                {badge.text}
              </div>

              {/* Image container with gradient overlay on hover */}
              <div className="relative h-48 overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <>
                    <img 
                      src={product.images[0].url} 
                      alt={product.name} 
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://source.unsplash.com/300x200/?${product.name.split(' ')[0]},farm,agriculture`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                    <FaLeaf className="text-green-500 text-4xl" />
                  </div>
                )}
                
                {/* Quick view button that appears on hover */}
                <Link 
                  to={`/product/${product._id}`}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 text-green-700 px-4 py-2 rounded-full font-medium text-sm flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white"
                >
                  <FaExternalLinkAlt className="mr-2" />
                  Quick View
                </Link>
              </div>

              {/* Product details */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900 truncate text-lg">{product.name}</h3>
                  <div className="flex items-center text-yellow-500">
                    <FaStar />
                    <span className="ml-1 text-xs font-medium">{(4 + Math.random()).toFixed(1)}</span>
                  </div>
                </div>
                
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <FaMapMarkerAlt className="mr-1 text-gray-400" />
                  <span className="truncate">{product.farmer?.location || 'Location not available'}</span>
                </div>
                
                <div className="flex items-center text-xs text-gray-500 mb-3">
                  <FaLeaf className="mr-1 text-green-500" />
                  <span className="mr-3">By {product.farmer?.name || 'Local Farmer'}</span>
                  <FaWeightHanging className="mr-1 text-gray-400" />
                  <span>{product.unit}</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <div className="flex items-center font-bold text-green-600">
                    <FaRupeeSign className="text-sm" />
                    <span className="text-lg">{formatCurrency(product.price)}</span>
                  </div>
                  <Link 
                    to={`/product/${product._id}`}
                    className="text-green-700 hover:text-green-800 text-sm font-medium"
                  >
                    Contract &rarr;
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendedProducts;