import React from 'react';
import HeroSection from './HeroSection';
import FeaturedProducts from './FeaturedProducts';
import HowItWorks from './HowItWorks';
import Testimonials from './Testimonials';

const HomePage = () => {
  return (
    <div className="bg-gray-100">
      <HeroSection />
      <FeaturedProducts />
      <HowItWorks />
      <Testimonials />
    </div>
  );
};

export default HomePage; 