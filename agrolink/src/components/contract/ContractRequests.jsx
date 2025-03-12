import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { FaTrash, FaEdit, FaEye, FaClipboardList, FaShoppingCart, FaPlus, FaMinus } from 'react-icons/fa';
import { removeContractRequest } from '../../reducer/Slice/contractRequestsSlice';
import { useApi } from '../../hooks/useApi';
import { contractService } from '../../services/contractService';
import LoadingSpinner from '../common/LoadingSpinner';

const ContractRequests = () => {
  const dispatch = useDispatch();
  const contractRequests = useSelector((state) => state.contractRequests.contractRequests);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  const { execute: submitContract, loading } = useApi(
    contractService.createContract,
    false // Don't execute on mount
  );

  const handleRemoveRequest = (id) => {
    dispatch(removeContractRequest(id));
    toast.success('Request removed');
  };

  const handleSubmitContract = async () => {
    if (!selectedRequest) return;
    
    await submitContract({
      productId: selectedRequest.product._id,
      quantity: selectedRequest.quantity,
      price: selectedRequest.product.price,
      contractTerms: selectedRequest.contractTerms,
      startDate: selectedRequest.startDate,
      endDate: selectedRequest.endDate
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (contractRequests.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FaClipboardList className="text-5xl text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-4">No Contract Requests</h2>
          <p className="text-gray-600 mb-6">
            You haven't made any contract requests yet. Browse products and create a contract request.
          </p>
          <Link
            to="/shop"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg inline-block transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Contract Requests</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Requests List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h2 className="font-semibold">Your Requests ({contractRequests.length})</h2>
            </div>
            
            <div className="divide-y">
              {contractRequests.map((request) => (
                <div 
                  key={request._id} 
                  className={`p-4 flex flex-col md:flex-row md:items-center hover:bg-gray-50 transition-colors ${
                    selectedRequest?._id === request._id ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-4">
                    <img 
                      src={request.product.images?.[0] || 'https://via.placeholder.com/80'} 
                      alt={request.product.name}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                  </div>
                  
                  <div className="flex-grow">
                    <h3 className="font-semibold">{request.product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Quantity: {request.quantity} {request.product.unit}
                    </p>
                    <p className="text-sm text-gray-600">
                      Price: ₹{request.product.price}/{request.product.unit}
                    </p>
                  </div>
                  
                  <div className="flex mt-4 md:mt-0">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => handleRemoveRequest(request._id)}
                      className="text-red-600 hover:text-red-800"
                      title="Remove Request"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Selected Request Details */}
        <div className="lg:col-span-1">
          {selectedRequest ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Request Details</h2>
              
              <div className="mb-4">
                <h3 className="font-medium">{selectedRequest.product.name}</h3>
                <p className="text-sm text-gray-600">{selectedRequest.product.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Quantity</p>
                  <p className="font-medium">{selectedRequest.quantity} {selectedRequest.product.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-medium">₹{selectedRequest.product.price}/{selectedRequest.product.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Value</p>
                  <p className="font-medium">₹{selectedRequest.quantity * selectedRequest.product.price}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Farmer</p>
                  <p className="font-medium">{selectedRequest.product.farmer?.name || 'Unknown'}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500">Contract Terms</p>
                <p className="text-sm border p-2 rounded bg-gray-50 h-20 overflow-y-auto">
                  {selectedRequest.contractTerms || 'No specific terms provided.'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium">{new Date(selectedRequest.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium">{new Date(selectedRequest.endDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              <button
                onClick={handleSubmitContract}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md transition-colors"
              >
                Submit Contract Request
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <FaClipboardList className="text-4xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select a request to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractRequests; 