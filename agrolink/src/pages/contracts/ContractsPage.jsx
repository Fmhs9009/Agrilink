import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import ContractsList from '../../components/contract/ContractsList';

// Main container component
const ContractsPage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-10 px-4 sm:px-6 lg:px-8">
      <ContractsList title="Manage Your Contract Farming Agreements" />
    </div>
  );
};

export default ContractsPage; 