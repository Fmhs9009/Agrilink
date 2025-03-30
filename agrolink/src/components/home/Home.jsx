import React from 'react';
import HeroSection from './HeroSection';
import FeaturedProducts from './FeaturedProducts';
import HowItWorks from './HowItWorks';
import Testimonials from './Testimonials';
import { FaLeaf, FaSeedling, FaHandHoldingUsd, FaArrowRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const HomePage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div className="relative overflow-hidden">
      <HeroSection />
      <FeaturedProducts />
      <HowItWorks />
      <Testimonials />
      
      {/* CTA Section */}
      <section className="py-20 bg-green-600 relative">
        <div className="absolute top-0 right-0 opacity-10">
          <FaLeaf className="text-white text-[300px]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-6">
              <FaSeedling className="text-green-600 text-2xl" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Ready to Grow Your Agricultural Business?</h2>
            <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
              Join thousands of farmers and buyers on AgriLink. Start securing contracts and growing together today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link 
                  to="/shop" 
                  className="bg-white hover:bg-gray-100 text-green-700 px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg inline-flex items-center justify-center group"
                >
                  Browse Contracts
                  <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <Link 
                  to="/auth/signup" 
                  className="bg-white hover:bg-gray-100 text-green-700 px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Join AgriLink Today
                </Link>
              )}
              <Link 
                to="/contact" 
                className="bg-transparent border-2 border-white hover:bg-white/10 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300"
              >
                Contact Us
              </Link>
            </div>
            
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaSeedling className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">For Farmers</h3>
                <p className="text-green-100">Access new markets and secure contracts for your produce</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaHandHoldingUsd className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">For Buyers</h3>
                <p className="text-green-100">Source quality produce directly from verified farmers</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaLeaf className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">For Communities</h3>
                <p className="text-green-100">Support local farming and sustainable agricultural practices</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 