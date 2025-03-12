import React from 'react';
import { Helmet } from 'react-helmet';
import ContractDetail from '../components/contract/ContractDetail';

const ContractDetailPage = () => {
  return (
    <>
      <Helmet>
        <title>Contract Details | AgroLink</title>
        <meta name="description" content="View detailed information about your contract farming agreement." />
      </Helmet>
      <div className="container mx-auto px-4 py-8">
        <ContractDetail />
      </div>
    </>
  );
};

export default ContractDetailPage; 