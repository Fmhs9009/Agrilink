import React from 'react';
import { Helmet } from 'react-helmet';
import ContractRequestsList from '../components/contract/ContractRequestsList';

const ContractRequestsPage = () => {
  return (
    <>
      <Helmet>
        <title>Your Contract Requests | AgroLink</title>
        <meta name="description" content="View and manage your contract farming requests with farmers on AgroLink." />
      </Helmet>
      <div className="container mx-auto px-4 py-8">
        <ContractRequestsList />
      </div>
    </>
  );
};

export default ContractRequestsPage; 