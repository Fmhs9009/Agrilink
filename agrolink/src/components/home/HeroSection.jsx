import React from 'react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <div className="relative bg-green-900 text-white">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Transform Your Farming Business
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Connect directly with farmers and buyers. Secure contracts, grow together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/shop"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Browse Contracts
            </Link>
            <Link
              to="/about"
              className="bg-white hover:bg-gray-100 text-green-900 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection; 