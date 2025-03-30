import React from 'react';
import { Link } from 'react-router-dom';
import bgVideo from '../../assets/bgvideo.mp4';
import { FaSeedling, FaArrowRight } from 'react-icons/fa';

const HeroSection = () => {
  return (
    <div className="relative h-screen flex items-center overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          className="w-full h-full object-cover"
        >
          <source src={bgVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black opacity-60"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 mt-[-50px]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-4">
            <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold inline-flex items-center">
              <FaSeedling className="mr-2" /> Building the future of farming
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 text-white text-center leading-tight">
            Transform Your <span className="text-green-400">Farming Business</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-10 text-gray-200 text-center max-w-3xl mx-auto">
            Connect directly with farmers and buyers. Secure contracts, grow together, and be part of a sustainable agricultural ecosystem.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              to="/shop"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg inline-flex items-center justify-center group"
            >
              Browse Contracts
              <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/about"
              className="bg-white hover:bg-gray-100 text-green-900 px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Learn More
            </Link>
          </div>
          
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { number: '2,500+', label: 'Farmers' },
              { number: '150+', label: 'Buyers' },
              { number: '₹10M+', label: 'Contracts Value' },
              { number: '5,000+', label: 'Hectares' }
            ].map((stat, index) => (
              <div key={index} className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4">
                <div className="text-xl md:text-2xl font-bold text-white">{stat.number}</div>
                <div className="text-xs md:text-sm text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="fill-white">
          <path d="M0,96L60,80C120,64,240,32,360,32C480,32,600,64,720,74.7C840,85,960,75,1080,64C1200,53,1320,43,1380,37.3L1440,32L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"></path>
        </svg>
      </div>
    </div>
  );
};

export default HeroSection; 