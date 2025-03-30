import React from 'react';
import { FaSearch, FaHandshake, FaFileContract, FaTractor } from 'react-icons/fa';

const steps = [
  {
    icon: FaSearch,
    title: 'Browse Contracts',
    description: 'Search and filter through available farming contracts that match your needs and goals.'
  },
  {
    icon: FaHandshake,
    title: 'Negotiate Terms',
    description: 'Discuss and agree on contract terms directly with farmers or buyers in a transparent environment.'
  },
  {
    icon: FaFileContract,
    title: 'Sign Agreement',
    description: 'Securely sign and manage your farming contracts online with legal protection and clarity.'
  },
  {
    icon: FaTractor,
    title: 'Start Growing',
    description: 'Begin the farming process with clear terms, mutual understanding, and ongoing support.'
  }
];

const HowItWorks = () => {
  return (
    <section className="py-20 bg-gray-50 overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-white" style={{ clipPath: 'ellipse(75% 100% at 50% 0%)' }}></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="bg-green-100 text-green-700 text-sm font-semibold px-4 py-1 rounded-full inline-block mb-4">
            Simple Process
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How AgroLink Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our platform streamlines the farming contract process, making it easy for farmers and buyers to connect and collaborate.
          </p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-[10%] right-[10%] h-1 bg-green-100 -translate-y-1/2 z-0 rounded-full"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 relative z-10">
            {steps.map((step, index) => (
              <div key={index} className="group">
                <div className="bg-white rounded-2xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 h-full flex flex-col items-center text-center relative">
                  <div className="absolute -top-6 bg-white rounded-full p-2 shadow-md">
                    <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-green-600">
                      <span className="font-bold text-xl">{index + 1}</span>
                    </div>
                  </div>
                  <div className="mt-8 mb-4">
                    <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-green-200">
                      <step.icon className="text-3xl text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800">{step.title}</h3>
                  <p className="text-gray-600 flex-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="fill-white">
          <path d="M0,96L60,80C120,64,240,32,360,32C480,32,600,64,720,74.7C840,85,960,75,1080,64C1200,53,1320,43,1380,37.3L1440,32L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default HowItWorks; 