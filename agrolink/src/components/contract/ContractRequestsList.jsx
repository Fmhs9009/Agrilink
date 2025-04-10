import React, { useEffect, useState, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchContractRequests } from '../../reducer/Slice/contractRequestsSlice';
import { Link } from 'react-router-dom';
import { FaHandshake, FaCalendarAlt, FaMoneyBillWave, FaFileContract, FaCheck, FaTimes, FaClock, FaEye, FaFilter } from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';
import NoResults from '../shop/NoResults';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';

// Memoized contract request item component for better performance
const ContractRequestItem = memo(({ request, style }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800" role="status">
            <FaCheck className="mr-1" aria-hidden="true" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800" role="status">
            <FaTimes className="mr-1" aria-hidden="true" /> Rejected
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800" role="status">
            <FaClock className="mr-1" aria-hidden="true" /> Pending
          </span>
        );
      case 'payment_pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800" role="status">
            <FaMoneyBillWave className="mr-1" aria-hidden="true" /> Payment Required
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800" role="status">
            <FaCheck className="mr-1" aria-hidden="true" /> Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800" role="status">
            {status}
          </span>
        );
    }
  };

  return (
    <div style={style} className="px-2 py-1">
      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg">{request.product?.name || 'Crop Contract'}</h3>
            <p className="text-sm text-gray-600">
              Farmer: {request.farmer?.name || 'Local Farmer'}
            </p>
          </div>
          <div className="flex flex-col items-end">
            {getStatusBadge(request.status)}
            <p className="text-xs text-gray-500 mt-1">
              Requested on {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center text-sm">
            <FaMoneyBillWave className="text-green-600 mr-2" aria-hidden="true" />
            <div>
              <p className="font-medium">Contract Value</p>
              <p>₹{(request.quantity * request.proposedPrice).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center text-sm">
            <FaCalendarAlt className="text-green-600 mr-2" aria-hidden="true" />
            <div>
              <p className="font-medium">Requested Delivery</p>
              <p>{new Date(request.requestedDeliveryDate).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center text-sm">
            <FaFileContract className="text-green-600 mr-2" aria-hidden="true" />
            <div>
              <p className="font-medium">Contract Duration</p>
              <p>{request.contractDuration} days</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm">
            <span className="font-medium">Quantity:</span> {request.quantity} {request.product?.unit || 'units'} at{' '}
            <span className="font-medium">₹{request.proposedPrice}</span> per unit
          </div>
          <Link
            to={`/contracts/${request._id}`}
            className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-md hover:bg-green-100"
            aria-label={`View details for ${request.product?.name || 'contract'}`}
          >
            <FaEye className="mr-1" aria-hidden="true" /> View Details
          </Link>
        </div>
      </div>
    </div>
  );
});

ContractRequestItem.displayName = 'ContractRequestItem';

const ContractRequestsList = () => {
  const dispatch = useDispatch();
  const { contractRequests, loading: reduxLoading } = useSelector(state => state.contractRequests);
  const [filter, setFilter] = useState('all');
  
  // Use our custom hook for API calls
  const { data: apiContractRequests, loading: apiLoading, error } = useApi(
    () => api.get('/contracts'),
    true // Execute on mount
  );

  // Combine data from Redux and API
  const allRequests = contractRequests.length > 0 ? contractRequests : (apiContractRequests || []);
  const loading = reduxLoading || apiLoading;

  // Filter requests based on selected filter
  const filteredRequests = allRequests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  // Memoized filter handler to prevent unnecessary re-renders
  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
  }, []);

  // Row renderer for virtualized list
  const rowRenderer = useCallback(({ index, style }) => {
    const request = filteredRequests[index];
    return <ContractRequestItem request={request} style={style} key={request._id} />;
  }, [filteredRequests]);

  if (loading) {
    return <LoadingSpinner message="Loading your contract requests..." />;
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow-md" role="alert">
        <p className="text-red-500">Error loading contract requests: {error}</p>
      </div>
    );
  }

  if (allRequests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <FaHandshake className="text-gray-400 text-5xl mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">No Contract Requests Yet</h2>
        <p className="text-gray-500 mb-6">
          You haven't made any contract requests with farmers yet. Browse our marketplace to find crops and create your first contract.
        </p>
        <Link
          to="/shop"
          className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          aria-label="Browse the marketplace"
        >
          Browse Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaHandshake className="mr-2 text-green-600" aria-hidden="true" /> Your Contract Requests
        </h2>
        
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter contract requests">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={filter === 'all'}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange('pending')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={filter === 'pending'}
          >
            Pending
          </button>
          <button
            onClick={() => handleFilterChange('payment_pending')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'payment_pending' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={filter === 'payment_pending'}
          >
            Payment Pending
          </button>
          <button
            onClick={() => handleFilterChange('approved')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={filter === 'approved'}
          >
            Approved
          </button>
          <button
            onClick={() => handleFilterChange('rejected')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={filter === 'rejected'}
          >
            Rejected
          </button>
          <button
            onClick={() => handleFilterChange('completed')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={filter === 'completed'}
          >
            Completed
          </button>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center p-8">
          <FaFilter className="text-gray-400 text-4xl mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No matching contracts</h3>
          <p className="text-gray-500 mb-4">
            No contract requests match your current filter.
          </p>
          <button
            onClick={() => handleFilterChange('all')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Show All Contracts
          </button>
        </div>
      ) : (
        <div className="h-[600px] w-full">
          <AutoSizer>
            {({ height, width }) => (
              <List
                height={height}
                width={width}
                itemCount={filteredRequests.length}
                itemSize={200} // Adjust based on your item height
              >
                {rowRenderer}
              </List>
            )}
          </AutoSizer>
        </div>
      )}
    </div>
  );
};

export default ContractRequestsList; 