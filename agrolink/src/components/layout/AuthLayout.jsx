import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import logo from '../../assets/Logo.png';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/">
          <img
            className="mx-auto h-16 w-auto"
            src={logo}
            alt="AgriLink Logo"
          />
        </Link>
      </div>
      
      <Outlet />
    </div>
  );
};

export default AuthLayout; 