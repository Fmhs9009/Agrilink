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
  FaRegularCalendar,
  FaClock,
  FaStore,
  FaUsers,
  FaWallet
} from 'react-icons/fa';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Loader from '../layout/Loader';
import toast from 'react-hot-toast';
import { orderAPI, contractAPI, productAPI } from '../../services/api';
import RecommendedProducts from '../product/RecommendedProducts';
import ContractSummaryList from '../contract/ContractSummaryList';

// Dashboard welcome section
const WelcomeSection = ({ user, stats }) => (
  <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg shadow-lg p-6 mb-6 text-white">
    <div className="flex flex-col md:flex-row justify-between">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome {user?.name || 'Customer'}!</h1>
        <p className="text-blue-100 mb-4">Your Contract Buying Dashboard</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-white bg-opacity-20 p-4 rounded-lg backdrop-blur-sm">
            <div className="text-xl font-bold">{stats.activeContracts || 0}</div>
            <div className="text-sm">Active Purchases</div>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-lg backdrop-blur-sm">
            <div className="text-xl font-bold">₹{formatCurrency(stats.totalContractValue || 0)}</div>
            <div className="text-sm">Total Investment</div>
          </div>
          <div className="md:block hidden bg-white bg-opacity-20 p-4 rounded-lg backdrop-blur-sm">
            <div className="text-xl font-bold">{stats.upcomingHarvests || 0}</div>
            <div className="text-sm">Upcoming Deliveries</div>
          </div>
        </div>
      </div>
      <div className="hidden md:flex items-center">
        <img src="/assets/buyer-illustration.svg" alt="Buyer" className="h-32" 
          onError={(e) => {e.target.style.display = 'none'}} />
      </div>
    </div>
  </div>
);

// Contract status summary with chart-like visualization
const ContractStatusChart = ({ stats }) => {
  if (!stats) return null;
  
  const statuses = [
    { id: 'requested', label: 'Requested', color: 'bg-yellow-500', count: stats.byStatus?.requested || 0 },
    { id: 'negotiating', label: 'Negotiating', color: 'bg-purple-500', count: stats.byStatus?.negotiating || 0 },
    { id: 'active', label: 'Active', color: 'bg-green-500', count: stats.byStatus?.active || 0 },
    { id: 'completed', label: 'Completed', color: 'bg-blue-500', count: stats.byStatus?.completed || 0 },
    { id: 'cancelled', label: 'Cancelled', color: 'bg-red-500', count: stats.byStatus?.cancelled || 0 }
  ];

  const total = statuses.reduce((sum, status) => sum + status.count, 0) || 1; // Avoid div by zero
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-medium text-gray-800 mb-4">Purchase Status</h2>
      
      <div className="flex w-full h-6 rounded-full overflow-hidden mb-4">
        {statuses.map(status => (
          <div 
            key={status.id} 
            className={`${status.color} ${status.count > 0 ? '' : 'hidden'}`} 
            style={{ width: `${(status.count / total) * 100}%` }}
            title={`${status.label}: ${status.count}`}
          />
        ))}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {statuses.map(status => (
          <div key={status.id} className="flex items-center">
            <div className={`w-3 h-3 ${status.color} rounded-full mr-2`}></div>
            <div className="text-xs text-gray-600">{status.label}</div>
            <div className="ml-auto font-medium text-gray-800">{status.count}</div>
          </div>
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
        <div className="flex flex-col items-center justify-center py-8">
          <FaFileContract className="text-gray-300 text-4xl mb-3" />
          <p className="text-gray-500 mb-4">You haven't made any purchases yet</p>
          <Link 
            to="/products" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
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
        <h2 className="text-lg font-medium text-gray-800">Recent Purchases</h2>
        <Link to="/contracts" className="text-green-600 hover:text-green-800 text-sm font-medium">
          View All <FaArrowRight className="inline ml-1" />
        </Link>
      </div>
      <ContractSummaryList 
        title=""
        initialContracts={recentContracts}
        limit={3}
        showFilters={false}
      />
    </div>
  );
};

// Investment breakdown component
const InvestmentBreakdown = ({ contractStats }) => {
  if (!contractStats) return null;
  
  // Sample data - in a real app this would come from contractStats
  const cropCategories = [
    { name: "Grains", value: contractStats.totalValue * 0.4 || 0, color: "bg-yellow-500" },
    { name: "Vegetables", value: contractStats.totalValue * 0.25 || 0, color: "bg-green-500" },
    { name: "Fruits", value: contractStats.totalValue * 0.2 || 0, color: "bg-red-500" },
    { name: "Other", value: contractStats.totalValue * 0.15 || 0, color: "bg-blue-500" }
  ];
  
  const total = cropCategories.reduce((sum, category) => sum + category.value, 0) || 1;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-medium text-gray-800 mb-4">Investment Breakdown</h2>
      
      <div className="flex w-full h-8 rounded-lg overflow-hidden mb-4">
        {cropCategories.map((category, index) => (
          <div 
            key={index} 
            className={`${category.color}`} 
            style={{ width: `${(category.value / total) * 100}%` }}
            title={`${category.name}: ₹${formatCurrency(category.value)}`}
          />
        ))}
      </div>
      
      <div className="space-y-3">
        {cropCategories.map((category, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-3 h-3 ${category.color} rounded-full mr-2`}></div>
              <span className="text-sm text-gray-700">{category.name}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-900">₹{formatCurrency(category.value)}</span>
              <span className="text-xs text-gray-500 ml-2">({Math.round((category.value / total) * 100)}%)</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Total Investment</span>
          <span className="text-lg font-bold text-green-600">₹{formatCurrency(total)}</span>
        </div>
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
  
  if (upcomingDeliveries.length === 0) return null;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-800">Upcoming Deliveries</h2>
        <Link to="/contracts?filter=upcoming" className="text-green-600 hover:text-green-800 text-sm font-medium">
          View All
        </Link>
      </div>
      <div className="space-y-3">
        {upcomingDeliveries.map((contract) => {
          const harvestDate = new Date(contract.expectedHarvestDate);
          const today = new Date();
          const daysRemaining = Math.ceil((harvestDate - today) / (1000 * 60 * 60 * 24));
          
          return (
            <Link key={contract._id} to={`/contracts/${contract._id}`}>
              <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-green-500 transition-colors">
                <div className={`p-3 ${daysRemaining <= 7 ? 'bg-yellow-100' : 'bg-green-100'} rounded-full mr-3`}>
                  <FaLeaf className={`${daysRemaining <= 7 ? 'text-yellow-600' : 'text-green-600'}`} />
                </div>
                <div className="flex-grow">
                  <div className="font-medium text-gray-900">{contract.crop?.name}</div>
                  <div className="text-sm text-gray-500">Quantity: {contract.quantity} {contract.unit}</div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${daysRemaining <= 7 ? 'text-yellow-600' : 'text-gray-600'}`}>
                    {daysRemaining} days left
                  </div>
                  <div className="text-sm text-gray-500">{formatDate(contract.expectedHarvestDate)}</div>
                </div>
              </div>
            </Link>
          );
        })}
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
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <WelcomeSection user={user} stats={stats} />
      
      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          {/* Contract Status Chart */}
          <ContractStatusChart stats={contractStats} />
          
          {/* Recent Contracts */}
          <RecentContracts contracts={contracts} />
        </div>
        
        <div>
          {/* Investment Breakdown */}
          <InvestmentBreakdown contractStats={contractStats} />
          
          {/* Upcoming Deliveries */}
          <UpcomingDeliveries contracts={contracts} />
        </div>
      </div>
      
      {/* Full Contract List */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">All Your Purchases</h2>
          <div className="flex space-x-2">
            <Link 
              to="/contracts"
              className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white rounded-md font-medium text-gray-700 hover:bg-gray-50"
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
        />
      </div>
      
      {/* Recommended Products */}
      <RecommendedProducts products={recommendedProducts} />

    </div>
  );
};

export default CustomerDashboard;