import React from 'react';
import { FaLeaf, FaHandshake, FaSeedling } from 'react-icons/fa';

const AboutUs = () => {
  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-green-800 mb-4">
            About AgriLink
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connecting farmers and consumers for a sustainable agricultural future
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-green-700 mb-4">Our Mission</h2>
            <p className="text-gray-600">
              To revolutionize agricultural commerce by creating a direct bridge between farmers and consumers, 
              ensuring fair prices, quality produce, and sustainable farming practices.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-green-700 mb-4">Our Vision</h2>
            <p className="text-gray-600">
              A world where agriculture is sustainable, farmers are empowered, and consumers have access to 
              fresh, quality produce directly from the source.
            </p>
          </div>
        </div>

        {/* Core Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-green-800 mb-8">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaLeaf className="text-3xl text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-700 mb-2">Sustainability</h3>
              <p className="text-gray-600">
                Promoting eco-friendly farming practices and sustainable agriculture
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaHandshake className="text-3xl text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-700 mb-2">Fair Trade</h3>
              <p className="text-gray-600">
                Ensuring fair prices and transparent transactions for all parties
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaSeedling className="text-3xl text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-700 mb-2">Quality</h3>
              <p className="text-gray-600">
                Maintaining high standards for agricultural products and services
              </p>
            </div>
          </div>
        </div>

        {/* Impact Section */}
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-center text-green-800 mb-8">Our Impact</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="text-4xl font-bold text-green-600 mb-2">1000+</h3>
              <p className="text-gray-600">Farmers Empowered</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-green-600 mb-2">5000+</h3>
              <p className="text-gray-600">Happy Customers</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-green-600 mb-2">20+</h3>
              <p className="text-gray-600">Districts Covered</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs; 