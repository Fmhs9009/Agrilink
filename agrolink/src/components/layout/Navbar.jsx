import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../reducer/Slice/authSlice';
import { FaUser, FaBars, FaTimes, FaHome, FaShoppingBag, FaInfoCircle, FaEnvelope, FaTachometerAlt } from 'react-icons/fa';
import logo from '../../assets/Logo.png';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loginData, isAuthenticated } = useSelector((state) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Check if the current path matches the link
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  // Handle scrolling effect on navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-dropdown')) {
        setIsProfileDropdownOpen(false);
      }
      if (!event.target.closest('.mobile-menu') && !event.target.closest('.menu-button')) {
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

  // Check if profile page is active
  const isProfileActive = () => {
    return location.pathname.includes('/dashboard') || 
           location.pathname.includes('/profile');
  };

  return (
    <>
      <nav className={`bg-white shadow-lg z-50 transition-all duration-300 ${scrolled ? 'shadow-md' : 'shadow-lg'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <img className="h-12 w-auto transition-transform hover:scale-105" src={logo} alt="AgriLink" />
                {/* <span className="hidden sm:block font-bold text-xl text-green-700">AgriLink</span> */}
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-1">
              <Link 
                to="/" 
                className={`px-4 py-2 rounded-md text-base font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  isActive('/') 
                    ? 'text-green-700 bg-green-50' 
                    : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <FaHome className="h-4 w-4" />
                <span>Home</span>
              </Link>
              <Link 
                to="/shop" 
                className={`px-4 py-2 rounded-md text-base font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  isActive('/shop') 
                    ? 'text-green-700 bg-green-50' 
                    : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <FaShoppingBag className="h-4 w-4" />
                <span>Shop</span>
              </Link>
              <Link 
                to="/about" 
                className={`px-4 py-2 rounded-md text-base font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  isActive('/about') 
                    ? 'text-green-700 bg-green-50' 
                    : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <FaInfoCircle className="h-4 w-4" />
                <span>About</span>
              </Link>
              <Link 
                to="/contact" 
                className={`px-4 py-2 rounded-md text-base font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  isActive('/contact') 
                    ? 'text-green-700 bg-green-50' 
                    : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <FaEnvelope className="h-4 w-4" />
                <span>Contact</span>
              </Link>
            </div>

            {/* Desktop Right Section */}
            <div className="hidden md:flex md:items-center">
              {isAuthenticated ? (
                <div className="relative profile-dropdown">
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                      isProfileActive()
                        ? 'text-green-700 bg-green-50' 
                        : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                    }`}
                  >
                    <FaUser className="h-5 w-5" />
                    <span className="font-medium">{loginData?.name || 'Profile'}</span>
                  </button>
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 z-10 border border-gray-100 transition-all duration-200 transform origin-top-right">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm text-gray-500">Signed in as</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{loginData?.email || 'user@example.com'}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        className={`flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 ${isActive('/dashboard') ? 'bg-green-50 text-green-700' : ''}`}
                      >
                        <FaTachometerAlt className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <Link
                        to="/profile/edit"
                        className={`flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 ${isActive('/profile/edit') ? 'bg-green-50 text-green-700' : ''}`}
                      >
                        <FaUser className="h-4 w-4" />
                        Edit Profile
                      </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/auth/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 shadow-sm transition-all duration-200 hover:shadow"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-green-600 focus:outline-none menu-button"
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
          <div className="md:hidden mobile-menu bg-white border-t border-gray-100 mt-2 shadow-lg animate-fadeDown">
            <div className="px-3 pt-3 pb-4 space-y-1">
              <Link
                to="/"
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/') 
                    ? 'text-green-700 bg-green-50' 
                    : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <FaHome className="h-5 w-5" />
                Home
              </Link>
              <Link
                to="/shop"
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/shop') 
                    ? 'text-green-700 bg-green-50' 
                    : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <FaShoppingBag className="h-5 w-5" />
                Shop
              </Link>
              <Link
                to="/about"
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/about') 
                    ? 'text-green-700 bg-green-50' 
                    : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <FaInfoCircle className="h-5 w-5" />
                About
              </Link>
              <Link
                to="/contact"
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/contact') 
                    ? 'text-green-700 bg-green-50' 
                    : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <FaEnvelope className="h-5 w-5" />
                Contact
              </Link>
              
              {isAuthenticated ? (
                <>
                  <div className="border-t border-gray-100 my-2 pt-2">
                    <div className="px-3 py-2">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{loginData?.name || 'User'}</p>
                    </div>
                  </div>
                  <Link
                    to="/dashboard"
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium ${
                      isActive('/dashboard') 
                        ? 'text-green-700 bg-green-50' 
                        : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaTachometerAlt className="h-5 w-5" />
                    Dashboard
                  </Link>
                  <Link
                    to="/profile/edit"
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium ${
                      isActive('/profile/edit') 
                        ? 'text-green-700 bg-green-50' 
                        : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaUser className="h-5 w-5" />
                    Edit Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/auth/login"
                  className="block w-full text-center mt-3 px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 mx-3"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar; 