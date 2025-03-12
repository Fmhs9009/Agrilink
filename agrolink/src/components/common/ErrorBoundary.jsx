import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/constants';

/**
 * Error boundary component to catch and display React errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log the error to console (could be replaced with a proper error reporting service)
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Send error to monitoring service if in production
    if (process.env.NODE_ENV === 'production' && typeof window.errorReporter === 'function') {
      window.errorReporter(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === 'development';
      
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white rounded-lg shadow-xl p-8">
            <div className="flex items-center mb-6">
              <svg
                className="w-12 h-12 text-red-500 mr-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900">
                Something went wrong
              </h2>
            </div>
            
            {/* Show error details in development mode */}
            {isDev && (
              <div className="bg-red-50 rounded-lg p-4 mb-6">
                <p className="text-red-800 font-medium">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="mt-2 text-sm text-red-700 overflow-auto max-h-60">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
            
            {/* Show friendly message in production */}
            {!isDev && (
              <p className="text-gray-600 mb-6">
                We're sorry, but something went wrong. Our team has been notified and we're working to fix the issue.
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Reload Page
              </button>
              
              <Link
                to={ROUTES.HOME}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-center"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 