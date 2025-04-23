import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import ContractsManager from '../../components/contract/ContractsManager';

// Main container component
const ContractsPage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <ContractsManager />
      </div>
    </div>
  );
};

export default ContractsPage; 