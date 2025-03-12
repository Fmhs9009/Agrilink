import { useState, useEffect } from 'react';

// Cache for API responses
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Custom hook for handling API calls with loading and error states
 * @param {Function} apiCall - The API function to call
 * @param {Array|boolean} dependencies - Dependencies for the API call or boolean to execute on mount
 * @returns {Object} - { data, loading, error }
 */
export const useApi = (apiCall, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ensure dependencies is always an array
  const deps = Array.isArray(dependencies) ? dependencies : [];

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await apiCall();
        
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        console.error('API call failed:', err);
        
        if (isMounted) {
          setError(err.message || 'Something went wrong');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, deps);

  return { data, loading, error, refetch: () => {} };
};

export default useApi; 