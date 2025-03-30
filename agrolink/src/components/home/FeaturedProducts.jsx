import React from 'react';
import { useApi } from '../../hooks/useApi';
import { productService } from '../../services/productService';
import LoadingSpinner from '../common/LoadingSpinner';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaStar, FaRupeeSign, FaLeaf } from 'react-icons/fa';

const FeaturedProducts = () => {
  const { data: products, loading, error } = useApi(
    productService.getAllProducts,
    [] // Execute on mount with empty dependencies array
  );

  if (loading) return (
    <div className="py-20 flex justify-center">
      <LoadingSpinner />
    </div>
  );
  
  if (error) return null;

  const featuredProducts = products?.slice(0, 3) || [];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-block p-1 px-3 mb-4 bg-green-100 rounded-full text-green-700 text-sm font-semibold">
            <span className="flex items-center"><FaLeaf className="mr-2" /> Featured Opportunities</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Trending Farming Contracts</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover the most popular farming contracts available on our platform. Connect with buyers and farmers to grow together.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredProducts.map((product) => (
            <div key={product._id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="h-56 md:h-64 bg-gray-200 relative">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0].url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-green-50">
                    <FaLeaf className="text-5xl text-green-200" />
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                  <FaStar className="mr-1" /> Featured
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-bold mb-2 text-gray-800">{product.name}</h3>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex items-center text-green-600 font-bold">
                    <FaRupeeSign className="mr-1" />
                    <span>{product.price}</span>
                    <span className="text-gray-500 font-normal text-sm ml-1">/{product.unit}</span>
                  </div>
                  
                  <Link
                    to={`/product/${product._id}`}
                    className="inline-flex items-center text-green-600 font-semibold hover:text-green-700 transition-colors group"
                  >
                    View Details
                    <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Link 
            to="/shop" 
            className="inline-flex items-center px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-semibold transition-all duration-300 hover:shadow-lg"
          >
            Explore All Contracts
            <FaArrowRight className="ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts; 