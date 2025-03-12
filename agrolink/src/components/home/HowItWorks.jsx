import React from 'react';
import { FaSearch, FaHandshake, FaFileContract, FaTractor } from 'react-icons/fa';

const steps = [
  {
    icon: FaSearch,
    title: 'Browse Contracts',
    description: 'Search and filter through available farming contracts that match your needs.'
  },
  {
    icon: FaHandshake,
    title: 'Negotiate Terms',
    description: 'Discuss and agree on contract terms directly with farmers or buyers.'
  },
  {
    icon: FaFileContract,
    title: 'Sign Agreement',
    description: 'Securely sign and manage your farming contracts online.'
  },
  {
    icon: FaTractor,
    title: 'Start Growing',
    description: 'Begin the farming process with clear terms and mutual understanding.'
  }
];

const HowItWorks = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <step.icon className="text-3xl text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks; 