import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES, ROLES } from '../../config/constants';
import LoadingSpinner from './LoadingSpinner';

/**
 * Protected route component that checks if user is authenticated
 * and has the required role before rendering children
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  
  // console.log("ProtectedRoute: Auth state:", { isAuthenticated, loading, hasUser: !!user });
  
  // If auth state is still loading, show a spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner message="Verifying authentication..." />
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log("ProtectedRoute: Not authenticated, redirecting to login");
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }
  
  // If user object is not available yet, show a spinner
  if (!user) {
    console.log("ProtectedRoute: Authenticated but no user data");
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner message="Loading user data..." />
          <p className="mt-4 text-red-600">If this persists, please try logging out and back in.</p>
        </div>
      </div>
    );
  }
  
  // If roles are specified and user doesn't have required role, redirect to home
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.accountType)) {
    console.log("ProtectedRoute: User doesn't have required role", { 
      userRole: user.accountType, 
      allowedRoles 
    });
    return <Navigate to={ROUTES.HOME} replace />;
  }
  
  // console.log("ProtectedRoute: Access granted", { userRole: user.accountType });
  
  // If children is a function, call it with user data
  if (typeof children === 'function') {
    return children({ user });
  }
  
  // Otherwise, render children normally
  return children;
};

export default ProtectedRoute; 