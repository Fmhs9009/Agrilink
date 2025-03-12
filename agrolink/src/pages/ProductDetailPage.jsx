import React from 'react';
import { Helmet } from 'react-helmet';
import ProductDetail from '../components/product/ProductDetail';

const ProductDetailPage = () => {
  return (
    <>
      <Helmet>
        <title>Crop Details | AgroLink</title>
        <meta name="description" content="View detailed information about crops available for contract farming." />
      </Helmet>
      <ProductDetail />
    </>
  );
};

export default ProductDetailPage; 