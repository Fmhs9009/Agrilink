import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  FaShoppingBasket, 
  FaFileContract,
  FaChartLine, 
  FaCalendarAlt,
  FaLeaf,
  FaHandshake,
  FaTimes,
  FaExchangeAlt,
  FaTractor,
  FaClipboardCheck,
  FaMoneyBillWave,
  FaSearch,
  FaArrowRight,
  FaFilter,
  FaSeedling,
  FaCheck,
  FaClock,
  FaStore,
  FaUsers,
  FaWallet,
  FaAppleAlt,
  FaWater,
  FaBell,
  FaInfoCircle
} from 'react-icons/fa';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Loader from '../layout/Loader';
import toast from 'react-hot-toast';
import { orderAPI, contractAPI, productAPI } from '../../services/api';
import RecommendedProducts from '../product/RecommendedProducts';
import ContractSummaryList from '../contract/ContractSummaryList';

// Dashboard welcome section
const WelcomeSection = ({ user, stats }) => {
  // Calculate the time of day for personalized greeting
  const hour = new Date().getHours();
  let timeGreeting = "Good Morning";
  if (hour >= 12 && hour < 17) timeGreeting = "Good Afternoon";
  if (hour >= 17) timeGreeting = "Good Evening";

  return (
    <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg shadow-xl p-6 mb-6 text-white">
      <div className="flex flex-col md:flex-row justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">{timeGreeting}, {user?.name?.split(' ')[0] || 'Customer'}!</h1>
          <p className="text-blue-100 mb-4">Your Contract Farming Dashboard</p>
          
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="relative bg-white bg-opacity-20 p-4 rounded-lg backdrop-blur-sm flex items-center">
              <div className="mr-3 p-2 bg-white bg-opacity-30 rounded-full">
                <FaFileContract className="text-white text-xl" />
              </div>
              <div>
                <div className="text-xl font-bold">{stats.activeContracts || 0}</div>
                <div className="text-xs">Active Contracts</div>
              </div>
            </div>
            
            <div className="relative bg-white bg-opacity-20 p-4 rounded-lg backdrop-blur-sm flex items-center">
              <div className="mr-3 p-2 bg-white bg-opacity-30 rounded-full">
                <FaWallet className="text-white text-xl" />
              </div>
              <div>
                <div className="text-xl font-bold">₹{formatCurrency(stats.totalContractValue || 0)}</div>
                <div className="text-xs">Total Investment</div>
              </div>
            </div>
            
            <div className="relative bg-white bg-opacity-20 p-4 rounded-lg backdrop-blur-sm flex items-center">
              <div className="mr-3 p-2 bg-white bg-opacity-30 rounded-full">
                <FaTractor className="text-white text-xl" />
              </div>
              <div>
                <div className="text-xl font-bold">{stats.upcomingHarvests || 0}</div>
                <div className="text-xs">Upcoming Harvests</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="hidden md:flex items-center justify-center">
          <div className="bg-white bg-opacity-10 p-6 rounded-full">
            <img 
              src="/assets/dashboard-illustration.svg" 
              alt="Dashboard" 
              className="h-36 w-36" 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${user?.Name || 'Customer'}&background=random&color=fff&size=128`;
              }}
            />
          </div>
        </div>
      </div>
      
      <div className="flex gap-3 mt-5">
        <Link 
          to="/products" 
          className="inline-flex items-center px-4 py-2 border border-white bg-white bg-opacity-10 hover:bg-opacity-20 rounded-md font-medium text-white transition-all"
        >
          <FaStore className="mr-2" />
          Browse Products
        </Link>
        <Link 
          to="/contracts/new" 
          className="inline-flex items-center px-4 py-2 border border-white border-opacity-50 rounded-md font-medium text-white hover:bg-white hover:bg-opacity-10 transition-all"
        >
          <FaHandshake className="mr-2" />
          New Contract
        </Link>
      </div>
    </div>
  );
};

// Contract status summary with chart-like visualization
const ContractStatusChart = ({ stats }) => {
  if (!stats) return null;
  
  const statuses = [
    { id: 'requested', label: 'Requested', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: <FaClipboardCheck />, count: stats.byStatus?.requested || 0 },
    { id: 'negotiating', label: 'Negotiating', color: 'bg-purple-500', textColor: 'text-purple-700', bgColor: 'bg-purple-100', icon: <FaExchangeAlt />, count: stats.byStatus?.negotiating || 0 },
    { id: 'active', label: 'Active', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-100', icon: <FaHandshake />, count: stats.byStatus?.active || 0 },
    { id: 'completed', label: 'Completed', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-100', icon: <FaCheck />, count: stats.byStatus?.completed || 0 },
    { id: 'cancelled', label: 'Cancelled', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-100', icon: <FaTimes />, count: stats.byStatus?.cancelled || 0 }
  ];

  const total = statuses.reduce((sum, status) => sum + status.count, 0) || 1; // Avoid div by zero
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-800">Contract Status Overview</h2>
        <div className="text-sm text-gray-500">Total: {total} contract{total !== 1 ? 's' : ''}</div>
      </div>
      
      <div className="flex w-full h-8 rounded-full overflow-hidden mb-6 shadow-inner bg-gray-100">
        {statuses.map(status => (
          <div 
            key={status.id} 
            className={`${status.color} transition-all duration-500 ease-in-out ${status.count > 0 ? '' : 'hidden'}`} 
            style={{ width: `${(status.count / total) * 100}%` }}
            title={`${status.label}: ${status.count} (${Math.round((status.count / total) * 100)}%)`}
          />
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {statuses.map(status => (
          <Link
            key={status.id} 
            to={`/contracts?status=${status.id}`}
            className={`p-4 ${status.bgColor} rounded-lg flex items-center space-x-3 hover:shadow-md transition-shadow`}
          >
            <div className={`p-2 ${status.color} bg-opacity-20 rounded-full`}>
              <span className={status.textColor}>{status.icon}</span>
            </div>
            <div>
              <div className="text-xs text-gray-600">{status.label}</div>
              <div className="font-bold text-lg text-gray-800">{status.count}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

// Recent contracts component with timeline-like UI
const RecentContracts = ({ contracts }) => {
  const recentContracts = contracts?.slice(0, 3) || [];
  
  if (recentContracts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-800">Recent Purchases</h2>
          <Link to="/contracts" className="text-green-600 hover:text-green-800 text-sm font-medium">
            View All
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-lg">
          <div className="p-4 bg-gray-100 rounded-full mb-3">
            <FaFileContract className="text-gray-400 text-4xl" />
          </div>
          <p className="text-gray-600 font-medium mb-2">No Active Contracts Yet</p>
          <p className="text-gray-500 text-sm mb-6 max-w-md text-center">Start your contract farming journey by browsing available produce and making offers to farmers.</p>
          <Link 
            to="/products" 
            className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none transition-colors"
          >
            <FaStore className="mr-2" />
            Browse Farm Products
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-800">Recent Contracts</h2>
        <Link to="/contracts" className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center">
          View All <FaArrowRight className="ml-1 text-xs" />
        </Link>
      </div>
      
      <div className="space-y-4">
        {recentContracts.map((contract, index) => {
          // Status style mapping
          const getStatusColor = (status) => {
            switch (status) {
              case 'requested': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
              case 'negotiating': return 'bg-purple-100 text-purple-800 border-purple-200';
              case 'active': return 'bg-green-100 text-green-800 border-green-200';
              case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
              case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
              default: return 'bg-gray-100 text-gray-800 border-gray-200';
            }
          };
          
          const getStatusIcon = (status) => {
            switch (status) {
              case 'requested': return <FaClipboardCheck />;
              case 'negotiating': return <FaExchangeAlt />;
              case 'active': return <FaHandshake />;
              case 'completed': return <FaCheck />;
              case 'cancelled': return <FaTimes />;
              default: return <FaClipboardCheck />;
            }
          };
          
          const statusClass = getStatusColor(contract.status);
          const statusIcon = getStatusIcon(contract.status);
          
          return (
            <Link key={contract._id} to={`/contracts/${contract._id}`}>
              <div className="border border-gray-200 hover:border-green-500 rounded-lg p-4 transition-all hover:shadow-md group">
                <div className="flex items-start">
                  {/* Product Image */}
                  <div className="relative w-24 h-24 flex-shrink-0 mr-4">
                    {contract.crop?.images && contract.crop.images.length > 0 ? (
                      <img 
                        src={contract.crop.images[0].url} 
                        alt={contract.crop.name}
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://source.unsplash.com/300x300/?${contract.crop.name},farm,agriculture`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                        <FaLeaf className="text-green-500 text-2xl" />
                      </div>
                    )}
                    <div className={`absolute top-2 right-2 ${statusClass} px-2 py-1 rounded-full text-xs font-medium flex items-center`}>
                      {statusIcon}
                      <span className="ml-1">{contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}</span>
                    </div>
                  </div>

                  {/* Contract Details */}
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 text-lg">{contract.crop?.name}</h3>
                      <div className="text-green-600 font-bold text-lg">₹{formatCurrency(contract.totalAmount)}</div>
                    </div>
                    
                    <div className="flex flex-wrap text-sm text-gray-500 mt-2">
                      <div className="flex items-center mr-4">
                        <FaLeaf className="mr-1 text-xs" />
                        <span>Farmer: {contract.farmer?.name}</span>
                      </div>
                      <div className="flex items-center">
                        <FaCalendarAlt className="mr-1 text-xs" />
                        <span>{formatDate(contract.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{contract.quantity}</span> {contract.unit}
                        </div>
                        {contract.expectedHarvestDate && (
                          <div className="text-sm text-gray-600">
                            <FaCalendarAlt className="inline mr-1" />
                            Harvest: {formatDate(contract.expectedHarvestDate)}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-green-600 font-medium group-hover:text-green-700">
                        View Details →
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// Investment breakdown component
const InvestmentBreakdown = ({ contractStats }) => {
  if (!contractStats) return null;
  
  // Sample data - in a real app this would come from contractStats
  const cropCategories = [
    { name: "Grains", value: contractStats.totalValue * 0.4 || 0, color: "bg-yellow-500", icon: <FaSeedling /> },
    { name: "Vegetables", value: contractStats.totalValue * 0.25 || 0, color: "bg-green-500", icon: <FaLeaf /> },
    { name: "Fruits", value: contractStats.totalValue * 0.2 || 0, color: "bg-red-500", icon: <FaAppleAlt /> },
    { name: "Other", value: contractStats.totalValue * 0.15 || 0, color: "bg-blue-500", icon: <FaWater /> }
  ];
  
  const total = cropCategories.reduce((sum, category) => sum + category.value, 0) || 1;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-medium text-gray-800 mb-4">Investment Portfolio</h2>
      
      <div className="flex w-full h-10 rounded-lg overflow-hidden mb-6 shadow-inner">
        {cropCategories.map((category, index) => (
          <div 
            key={index} 
            className={`${category.color} relative group cursor-pointer transition-all duration-500 ease-in-out`} 
            style={{ 
              width: `${(category.value / total) * 100}%`,
              animation: `grow-${index} 1s ease-out`
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20">
              <span className="text-white text-xs font-medium">{Math.round((category.value / total) * 100)}%</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="space-y-4">
        {cropCategories.map((category, index) => (
          <div key={index} className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors">
            <div className="flex items-center">
              <div className={`w-8 h-8 ${category.color} rounded-lg flex items-center justify-center text-white mr-3`}>
                {category.icon}
              </div>
              <span className="text-sm font-medium text-gray-700">{category.name}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-gray-900">₹{formatCurrency(category.value)}</span>
              <div className="text-xs text-gray-500">({Math.round((category.value / total) * 100)}%)</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Total Investment</span>
          <span className="text-lg font-bold text-green-600">₹{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <Link to="/contracts/analytics" className="text-sm text-green-600 hover:text-green-800 flex items-center justify-center">
          View Detailed Analytics <FaArrowRight className="ml-1 text-xs" />
        </Link>
      </div>
    </div>
  );
};

// Upcoming deliveries component
const UpcomingDeliveries = ({ contracts }) => {
  // Filter contracts that are active and have upcoming harvests
  const upcomingDeliveries = contracts?.filter(c => c.status === 'active' && c.expectedHarvestDate)
    .sort((a, b) => new Date(a.expectedHarvestDate) - new Date(b.expectedHarvestDate))
    .slice(0, 3) || [];
  
  if (upcomingDeliveries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-800">Upcoming Deliveries</h2>
        </div>
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-3">
            <FaCalendarAlt className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-gray-500 mb-1">No upcoming deliveries</p>
          <p className="text-xs text-gray-400 mb-2">Active contracts will show expected harvest dates here</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-800">Upcoming Harvests</h2>
        <Link to="/contracts?filter=upcoming" className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center">
          View All <FaArrowRight className="ml-1 text-xs" />
        </Link>
      </div>
      <div className="space-y-4">
        {upcomingDeliveries.map((contract) => {
          const harvestDate = new Date(contract.expectedHarvestDate);
          const today = new Date();
          const daysRemaining = Math.ceil((harvestDate - today) / (1000 * 60 * 60 * 24));
          
          // Determine the urgency styling based on days remaining
          let urgencyClass = 'bg-green-100 text-green-600';
          let urgencyText = 'Upcoming';
          let urgencyIcon = <FaCalendarAlt />;
          
          if (daysRemaining <= 7) {
            urgencyClass = 'bg-yellow-100 text-yellow-600';
            urgencyText = 'Coming Soon';
            urgencyIcon = <FaClock />;
          }
          
          if (daysRemaining <= 3) {
            urgencyClass = 'bg-red-100 text-red-600';
            urgencyText = 'Imminent';
            urgencyIcon = <FaBell />;
          }
          
          return (
            <Link key={contract._id} to={`/contracts/${contract._id}`}>
              <div className="border border-gray-200 hover:border-green-500 rounded-lg p-4 transition-all hover:shadow-md">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <div className={`p-3 ${urgencyClass} rounded-full`}>
                      {urgencyIcon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{contract.crop?.name}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <FaLeaf className="mr-1 text-xs" />
                        <span>Farmer: {contract.farmer?.name}</span>
                      </div>
                      <div className="flex items-center text-sm mt-2">
                        <span className={`${urgencyClass} px-2 py-0.5 rounded-full text-xs font-medium`}>
                          {urgencyText}
                        </span>
                        <span className="text-gray-500 ml-2">
                          {contract.quantity} {contract.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${daysRemaining <= 7 ? 'text-yellow-600' : 'text-gray-600'} flex items-center`}>
                      <span className="flex items-center border border-gray-200 rounded-full px-2 py-0.5">
                        <FaCalendarAlt className="mr-1 text-xs" />
                        {daysRemaining} days
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{formatDate(contract.expectedHarvestDate)}</div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center">
        <div className="text-xs text-gray-500 flex items-center">
          <FaInfoCircle className="mr-1" />
          Expected harvest dates may vary based on growing conditions
        </div>
      </div>
    </div>
  );
};

// Main customer dashboard component
const CustomerDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeContracts: 0,
    totalContractValue: 0,
    upcomingHarvests: 0
  });
  const [contracts, setContracts] = useState([]);
  const [contractStats, setContractStats] = useState(null);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch contracts
        try {
          if (!user || !user._id) {
            console.warn('User ID is missing, cannot fetch contracts');
            setContracts([]);
          } else {
            const contractsResponse = await contractAPI.getByBuyer(user._id);
            if (contractsResponse.success) {
              const contractsData = contractsResponse.contracts || [];
              setContracts(contractsData);
              
              // Calculate dashboard stats
              const activeContracts = contractsData.filter(c => c.status === 'active');
              const upcomingHarvests = activeContracts.filter(c => {
                if (!c.expectedHarvestDate) return false;
                const harvestDate = new Date(c.expectedHarvestDate);
                const today = new Date();
                return harvestDate > today;
              });
              
              // Update stats
              setStats(prev => ({
                ...prev,
                activeContracts: activeContracts.length,
                upcomingHarvests: upcomingHarvests.length,
                totalContractValue: contractsData.reduce((sum, c) => sum + (c.totalAmount || 0), 0)
              }));
            } else {
              setContracts([]);
            }
          }
        } catch (contractError) {
          console.error('Error fetching contracts:', contractError);
          setContracts([]);
        }
        
        // Fetch contract statistics separately
        try {
          const contractStatsResponse = await contractAPI.getContractStats();
          if (contractStatsResponse.success) {
            setContractStats(contractStatsResponse.stats);
          }
        } catch (statsError) {
          console.error('Error fetching contract stats:', statsError);
          setContractStats(null);
        }
        
        // Fetch recommended products
        try {
          const productsResponse = await productAPI.getRecommendedProducts();
          if (productsResponse.success) {
            setRecommendedProducts(productsResponse.products || []);
          }
        } catch (productsError) {
          console.error('Error fetching recommended products:', productsError);
          setRecommendedProducts([]);
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load some dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user && user._id) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader />
      </div>
    );
  }

  const newUser = contracts.length === 0;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* First-time user guided banner */}
      {newUser && showWelcomeBanner && (
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg shadow-md p-5 mb-6 relative">
          <button 
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            onClick={() => setShowWelcomeBanner(false)}
          >
            <FaTimes />
          </button>
          <div className="flex items-center">
            <div className="mr-4 p-2 bg-blue-100 rounded-full">
              <FaInfoCircle className="text-blue-600 text-lg" />
            </div>
            <div>
              <h3 className="font-bold text-blue-700">Welcome to Contract Farming!</h3>
              <p className="text-blue-600 text-sm mt-1">
                Connect directly with farmers, explore seasonal produce, and establish secure contract agreements. 
                Start by browsing available products below.
              </p>
            </div>
          </div>
          <div className="mt-3 ml-12">
            <Link 
              to="/guide/contracts" 
              className="text-blue-700 text-sm font-medium hover:text-blue-800 underline mr-4"
            >
              How It Works
            </Link>
            <Link 
              to="/products" 
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              Browse Products
            </Link>
          </div>
        </div>
      )}
      
      {/* Welcome Section */}
      <WelcomeSection user={user} stats={stats} />
      
      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Contract Status Chart */}
          <div className="animate-[fadeIn_0.6s_ease-in-out] [animation-fill-mode:both] [animation-delay:0.1s]">
            <ContractStatusChart stats={contractStats} />
          </div>
          
          {/* Recent Contracts */}
          <div className="animate-[fadeIn_0.6s_ease-in-out] [animation-fill-mode:both] [animation-delay:0.3s]">
            <RecentContracts contracts={contracts} />
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Investment Breakdown */}
          <div className="animate-[fadeIn_0.6s_ease-in-out] [animation-fill-mode:both] [animation-delay:0.2s]">
            <InvestmentBreakdown contractStats={contractStats} />
          </div>
          
          {/* Upcoming Deliveries */}
          <div className="animate-[fadeIn_0.6s_ease-in-out] [animation-fill-mode:both] [animation-delay:0.4s]">
            <UpcomingDeliveries contracts={contracts} />
          </div>
        </div>
      </div>
      
      {/* Full Contract List */}
      <div className="animate-[fadeIn_0.6s_ease-in-out] [animation-fill-mode:both] [animation-delay:0.5s] bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-800">All Your Contracts</h2>
          <div className="flex flex-wrap gap-3">
            <Link 
              to="/contracts"
              className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white rounded-md font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              <FaFilter className="mr-2" />
              Filter & Sort
            </Link>
            <Link 
              to="/products"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              <FaStore className="mr-2" />
              Browse Products
            </Link>
          </div>
        </div>
        
        <ContractSummaryList 
          title=""
          initialContracts={contracts.slice(0, 5)}
          limit={5}
          showFilters={false}
          showViewAll={true}
          userRole="buyer"
        />
      </div>
      
      {/* Recommended Products */}
      {recommendedProducts.length > 0 && (
        <div className="animate-[fadeIn_0.6s_ease-in-out] [animation-fill-mode:both] [animation-delay:0.6s] mb-8">
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 bg-green-100 p-3 rounded-full mr-4">
              <FaLeaf className="text-green-600 text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Seasonal Products for Contract</h2>
              <p className="text-gray-500">Explore farm-fresh produce available for contracting directly from verified farmers</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 via-white to-blue-50 p-6 rounded-xl shadow-sm">
            <RecommendedProducts products={recommendedProducts} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;