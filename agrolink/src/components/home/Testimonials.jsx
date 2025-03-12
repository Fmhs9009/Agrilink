import React from 'react';
import { FaQuoteLeft } from 'react-icons/fa';

const testimonials = [
  {
    name: 'Rajesh Kumar',
    role: 'Farmer',
    image: 'https://randomuser.me/api/portraits/men/1.jpg',
    quote: 'AgroLink has transformed how I do business. I now have direct access to buyers and better prices for my produce.'
  },
  {
    name: 'Priya Sharma',
    role: 'Buyer',
    image: 'https://randomuser.me/api/portraits/women/1.jpg',
    quote: 'The platform makes it easy to find quality produce and establish long-term relationships with farmers.'
  },
  {
    name: 'Amit Patel',
    role: 'Farmer',
    image: 'https://randomuser.me/api/portraits/men/2.jpg',
    quote: 'Contract farming through AgroLink has given me financial security and peace of mind.'
  }
];

const Testimonials = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center mb-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <h3 className="font-semibold">{testimonial.name}</h3>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
              <div className="relative">
                <FaQuoteLeft className="text-green-200 text-4xl absolute -top-2 -left-2" />
                <p className="text-gray-700 relative z-10 pl-8 pt-4">
                  "{testimonial.quote}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials; 