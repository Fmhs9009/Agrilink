import React from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FaArrowLeft,
  FaCalendarAlt,
  FaExchangeAlt,
  FaHandshake,
  FaClipboardCheck,
  FaFileContract
} from 'react-icons/fa';
import ContractDetail from '../../components/contract/ContractDetail';
import Loader from '../../components/layout/Loader';
import { formatDate, formatCurrency } from '../../utils/helpers';

const ContractDetailPage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <ContractDetail />;
};

export default ContractDetailPage; 