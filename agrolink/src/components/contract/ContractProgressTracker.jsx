import React from 'react';
import { 
  FaFileContract, 
  FaHandshake, 
  FaSeedling, 
  FaLeaf, 
  FaTruck, 
  FaCheckCircle, 
  FaExchangeAlt,
  FaClock
} from 'react-icons/fa';
import { formatDate } from '../../utils/helpers';

// Helper function to get step details based on contract status
const getStepDetails = (status, contract) => {
  const steps = [
    {
      id: 'requested',
      name: 'Contract Requested',
      icon: <FaFileContract className="h-6 w-6" />,
      description: 'Contract request has been submitted',
      date: contract.createdAt,
      completed: ['requested', 'negotiating', 'accepted', 'active', 'readyForHarvest', 'harvested', 'delivered', 'completed'].includes(status),
      current: status === 'requested'
    },
    {
      id: 'negotiating',
      name: 'Negotiation',
      icon: <FaExchangeAlt className="h-6 w-6" />,
      description: 'Terms are being negotiated',
      date: contract.negotiationHistory && contract.negotiationHistory.length > 0 
        ? contract.negotiationHistory[0].proposedAt
        : null,
      completed: ['accepted', 'active', 'readyForHarvest', 'harvested', 'delivered', 'completed'].includes(status),
      current: status === 'negotiating'
    },
    {
      id: 'accepted',
      name: 'Contract Accepted',
      icon: <FaHandshake className="h-6 w-6" />,
      description: 'Both parties have agreed to terms',
      date: contract.statusHistory 
        ? contract.statusHistory.find(s => s.status === 'accepted')?.timestamp
        : null,
      completed: ['accepted', 'active', 'readyForHarvest', 'harvested', 'delivered', 'completed'].includes(status),
      current: status === 'accepted'
    },
    {
      id: 'active',
      name: 'Growing Phase',
      icon: <FaSeedling className="h-6 w-6" />,
      description: 'Crop is being grown',
      date: contract.statusHistory 
        ? contract.statusHistory.find(s => s.status === 'active')?.timestamp
        : null,
      completed: ['readyForHarvest', 'harvested', 'delivered', 'completed'].includes(status),
      current: status === 'active'
    },
    {
      id: 'readyForHarvest',
      name: 'Ready for Harvest',
      icon: <FaLeaf className="h-6 w-6" />,
      description: 'Crop is ready to be harvested',
      date: contract.statusHistory 
        ? contract.statusHistory.find(s => s.status === 'readyForHarvest')?.timestamp
        : null,
      completed: ['harvested', 'delivered', 'completed'].includes(status),
      current: status === 'readyForHarvest'
    },
    {
      id: 'harvested',
      name: 'Harvested',
      icon: <FaLeaf className="h-6 w-6" />,
      description: 'Crop has been harvested',
      date: contract.statusHistory 
        ? contract.statusHistory.find(s => s.status === 'harvested')?.timestamp
        : null,
      completed: ['delivered', 'completed'].includes(status),
      current: status === 'harvested'
    },
    {
      id: 'delivered',
      name: 'Delivered',
      icon: <FaTruck className="h-6 w-6" />,
      description: 'Product has been delivered',
      date: contract.statusHistory 
        ? contract.statusHistory.find(s => s.status === 'delivered')?.timestamp
        : null,
      completed: ['completed'].includes(status),
      current: status === 'delivered'
    },
    {
      id: 'completed',
      name: 'Completed',
      icon: <FaCheckCircle className="h-6 w-6" />,
      description: 'Contract has been fulfilled',
      date: contract.statusHistory 
        ? contract.statusHistory.find(s => s.status === 'completed')?.timestamp
        : null,
      completed: status === 'completed',
      current: status === 'completed'
    }
  ];
  
  return steps;
};

const ContractProgressTracker = ({ contract }) => {
  if (!contract) return null;
  
  const { status } = contract;
  const steps = getStepDetails(status, contract);
  
  // Handle cancelled or disputed contracts
  if (status === 'cancelled' || status === 'disputed') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Contract Progress</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
          <div className="bg-red-100 rounded-full p-2 mr-3">
            <FaClock className="text-red-600 h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium text-red-800">
              {status === 'cancelled' ? 'Contract Cancelled' : 'Contract Disputed'}
            </h3>
            <p className="text-sm text-red-600">
              {status === 'cancelled' 
                ? 'This contract has been cancelled and is no longer active.'
                : 'This contract is currently under dispute. Please contact support for assistance.'}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Contract Progress</h2>
      
      <div className="flow-root">
        <ul className="-mb-8">
          {steps.map((step, stepIdx) => (
            <li key={step.id}>
              <div className="relative pb-8">
                {stepIdx !== steps.length - 1 ? (
                  <span
                    className={`absolute top-4 left-4 -ml-px h-full w-0.5 ${
                      step.completed ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        step.completed
                          ? 'bg-green-500 text-white'
                          : step.current
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {step.icon}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className={`text-sm font-medium ${
                        step.completed
                          ? 'text-green-900'
                          : step.current
                          ? 'text-blue-900'
                          : 'text-gray-500'
                      }`}>
                        {step.name}
                      </p>
                      <p className="text-sm text-gray-500">{step.description}</p>
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                      {step.date ? formatDate(step.date) : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Current status */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="mr-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Current Status: {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          
          {contract.expectedHarvestDate && (
            <div className="ml-auto text-sm text-gray-500">
              <span className="font-medium">Expected Completion:</span> {formatDate(contract.expectedHarvestDate)}
            </div>
          )}
        </div>
      </div>
      
      {/* Progress updates (if available) */}
      {contract.progressUpdates && contract.progressUpdates.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Progress Updates</h3>
          <div className="space-y-3">
            {contract.progressUpdates.slice().reverse().map((update, idx) => (
              <div key={idx} className="bg-gray-50 rounded-md p-3 border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {update.updateType.charAt(0).toUpperCase() + update.updateType.slice(1)}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(update.updatedAt)}</span>
                </div>
                <p className="text-sm text-gray-700">{update.description}</p>
                
                {update.images && update.images.length > 0 && (
                  <div className="mt-2 flex items-center space-x-2 overflow-x-auto">
                    {update.images.map((image, imgIdx) => (
                      <img 
                        key={imgIdx} 
                        src={image.url} 
                        alt={`Update ${idx + 1} image ${imgIdx + 1}`}
                        className="h-16 w-16 object-cover rounded-md"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractProgressTracker;