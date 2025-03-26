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
    <div className="container mx-auto px-4 py-8">
      <ContractsList title="Manage Your Contract Farming Purchases" />
    </div>
  );
};

export default ContractsPage; 