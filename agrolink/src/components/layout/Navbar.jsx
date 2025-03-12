import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../reducer/Slice/authSlice';
import { FaUser, FaShoppingCart, FaHeart, FaBars, FaTimes } from 'react-icons/fa';
import logo from '../../assets/Logo.png';

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loginData, isAuthenticated } = useSelector((state) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-dropdown')) {
        setIsProfileDropdownOpen(false);
      }
      if (!event.target.closest('.mobile-menu')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/auth/login');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/">
              <img className="h-12 w-auto" src={logo} alt="AgroLink" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link to="/" className="text-gray-700 hover:text-green-600">Home</Link>
            <Link to="/shop" className="text-gray-700 hover:text-green-600">Shop</Link>
            <Link to="/about" className="text-gray-700 hover:text-green-600">About</Link>
            <Link to="/contact" className="text-gray-700 hover:text-green-600">Contact</Link>
          </div>

          {/* Desktop Right Section */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/cart" className="text-gray-700 hover:text-green-600">
                  <FaShoppingCart className="h-6 w-6" />
                </Link>
                <Link to="/wishlist" className="text-gray-700 hover:text-green-600">
                  <FaHeart className="h-6 w-6" />
                </Link>
                <div className="relative profile-dropdown">
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-green-600"
                  >
                    <FaUser className="h-6 w-6" />
                    <span>{loginData?.name || 'Profile'}</span>
                  </button>
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/profile/edit"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50"
                      >
                        Edit Profile
                      </Link>
                      <Link
                        to="/profile/password"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50"
                      >
                        Change Password
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/auth/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-green-600 focus:outline-none"
            >
              {isMenuOpen ? (
                <FaTimes className="h-6 w-6" />
              ) : (
                <FaBars className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50"
            >
              Home
            </Link>
            <Link
              to="/shop"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50"
            >
              Shop
            </Link>
            <Link
              to="/about"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50"
            >
              Contact
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/cart"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50"
                >
                  Cart
                </Link>
                <Link
                  to="/wishlist"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50"
                >
                  Wishlist
                </Link>
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50"
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile/edit"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50"
                >
                  Edit Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/auth/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 