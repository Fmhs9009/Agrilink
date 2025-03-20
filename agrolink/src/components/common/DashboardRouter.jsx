import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { ROLES } from '../../config/constants';
import LoadingSpinner from './LoadingSpinner';
import FarmerDashboard from '../dashboard/FarmerDashboard';
import CustomerDashboard from '../dashboard/CustomerDashboard';

// We don't need to import the dashboard components directly
// as they are lazy-loaded in App.js

/**
 * DashboardRouter component that renders the appropriate dashboard
 * based on the user's account type
 */
const DashboardRouter = () => {
  const { user, loading } = useSelector((state) => state.auth);
  
  // If auth state is still loading, show a spinner
  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner message="Loading dashboard..." />
      </div>
    );
  }
  console.log(user.accountType)
  // Render the appropriate dashboard based on user's account type
  switch (user.accountType) {
    case ROLES.FARMER:
      console.log("DashboardRouter: Rendering Farmer Dashboard");
      return <FarmerDashboard />;
    case ROLES.BUYER:
      console.log("DashboardRouter: Rendering Customer Dashboard");
      return <CustomerDashboard />;
    case ROLES.ADMIN:
      console.log("DashboardRouter: Redirecting to Admin Dashboard");
      return <Navigate to="/admin/dashboard" replace />;
    default:
      console.log("DashboardRouter: Unknown account type, redirecting to home");
      return <Navigate to="/" replace />;
  }
};

export default DashboardRouter; 