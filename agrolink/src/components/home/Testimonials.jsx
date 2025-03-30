import React, { useState } from 'react';
import { FaQuoteLeft, FaChevronLeft, FaChevronRight, FaStar } from 'react-icons/fa';

const testimonials = [
  {
    name: 'Rajesh Kumar',
    role: 'Farmer, Maharashtra',
    image: 'https://randomuser.me/api/portraits/men/1.jpg',
    quote: 'AgroLink has transformed how I do business. I now have direct access to buyers and better prices for my produce. The contract management system is seamless and transparent.',
    rating: 5
  },
  {
    name: 'Priya Sharma',
    role: 'Produce Buyer, Delhi',
    image: 'https://randomuser.me/api/portraits/women/1.jpg',
    quote: 'The platform makes it easy to find quality produce and establish long-term relationships with farmers. I\'ve been able to source organic vegetables consistently thanks to AgroLink.',
    rating: 5
  },
  {
    name: 'Amit Patel',
    role: 'Farmer, Gujarat',
    image: 'https://randomuser.me/api/portraits/men/2.jpg',
    quote: 'Contract farming through AgroLink has given me financial security and peace of mind. The transparent process and secure payments have made a significant difference in my farming business.',
    rating: 4
  }
];

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextTestimonial = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute -top-24 -right-24 w-64 h-64 bg-green-50 rounded-full opacity-70"
        style={{ filter: 'blur(50px)' }}
      ></div>
      <div 
        className="absolute -bottom-24 -left-24 w-64 h-64 bg-green-50 rounded-full opacity-70"
        style={{ filter: 'blur(50px)' }}
      ></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="bg-green-100 text-green-700 text-sm font-semibold px-4 py-1 rounded-full inline-block mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Hear from farmers and buyers who have transformed their agricultural business with AgroLink.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Desktop View - Show all testimonials */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 transition-all duration-300 hover:shadow-xl relative h-full flex flex-col">
                <div className="absolute -top-5 -left-5">
                  <FaQuoteLeft className="text-green-100 text-6xl" />
                </div>
                
                <div className="flex items-center mb-6 relative z-10">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-14 h-14 rounded-full border-2 border-green-500 object-cover"
                  />
                  <div className="ml-4">
                    <h3 className="font-bold text-gray-800">{testimonial.name}</h3>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                
                <div className="mb-4 flex">
                  {[...Array(5)].map((_, i) => (
                    <FaStar 
                      key={i} 
                      className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                
                <p className="text-gray-700 italic relative z-10 flex-1">
                  "{testimonial.quote}"
                </p>
              </div>
            ))}
          </div>

          {/* Mobile View - Carousel */}
          <div className="md:hidden relative">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 relative">
              <div className="absolute -top-5 -left-5">
                <FaQuoteLeft className="text-green-100 text-5xl" />
              </div>
              
              <div className="flex items-center mb-6 relative z-10">
                <img
                  src={testimonials[activeIndex].image}
                  alt={testimonials[activeIndex].name}
                  className="w-14 h-14 rounded-full border-2 border-green-500 object-cover"
                />
                <div className="ml-4">
                  <h3 className="font-bold text-gray-800">{testimonials[activeIndex].name}</h3>
                  <p className="text-gray-600 text-sm">{testimonials[activeIndex].role}</p>
                </div>
              </div>
              
              <div className="mb-4 flex">
                {[...Array(5)].map((_, i) => (
                  <FaStar 
                    key={i} 
                    className={`w-4 h-4 ${i < testimonials[activeIndex].rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              
              <p className="text-gray-700 italic relative z-10">
                "{testimonials[activeIndex].quote}"
              </p>
              
              <div className="flex justify-between mt-8">
                <button 
                  onClick={prevTestimonial}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-green-500 hover:text-white transition-colors"
                >
                  <FaChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-2">
                  {testimonials.map((_, index) => (
                    <button 
                      key={index}
                      onClick={() => setActiveIndex(index)}
                      className={`w-3 h-3 rounded-full ${activeIndex === index ? 'bg-green-500' : 'bg-gray-300'}`}
                    ></button>
                  ))}
                </div>
                <button 
                  onClick={nextTestimonial}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-green-500 hover:text-white transition-colors"
                >
                  <FaChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials; 