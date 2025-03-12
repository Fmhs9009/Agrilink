import React from 'react';
import { Link } from 'react-router-dom';

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

    // Log the error to your error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full text-center">
            <h1 className="text-4xl font-bold text-red-600 mb-4">Oops!</h1>
            <p className="text-gray-600 mb-6">
              Something went wrong. We're working on fixing it.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 text-left">
                <p className="text-red-500 font-semibold mb-2">Error Details:</p>
                <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
                  {this.state.error.toString()}
                </pre>
              </div>
            )}
            
            <div className="space-y-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors w-full"
              >
                Refresh Page
              </button>
              
              <Link
                to="/"
                className="block bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
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