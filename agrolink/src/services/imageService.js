/**
 * Image Loading and Caching Service
 * This service helps with preloading, caching, and optimizing images
 */
const imageCache = {};
const inProgressLoads = {};

const imageService = {
  /**
   * Preload an image and cache it
   * @param {string} url - Image URL to preload
   * @returns {Promise} - Promise that resolves when image is loaded
   */
  preloadImage: (url) => {
    if (!url) return Promise.reject('No URL provided');
    
    // Skip if already cached
    if (imageCache[url]) {
      return Promise.resolve(imageCache[url]);
    }
    
    // Skip data URLs, they're already loaded
    if (url.startsWith('data:')) {
      return Promise.resolve(null);
    }
    
    // If there's already a load in progress for this URL, return that promise
    if (inProgressLoads[url]) {
      return inProgressLoads[url];
    }
    
    // Create a new promise for image loading
    const loadPromise = new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        // Cache the loaded image
        imageCache[url] = img;
        // Remove from in progress
        delete inProgressLoads[url];
        resolve(img);
      };
      
      img.onerror = (err) => {
        console.error('Failed to preload image:', url, err);
        // Remove from in progress
        delete inProgressLoads[url];
        reject(err);
      };
      
      // Start loading
      img.src = url;
    });
    
    // Store in progress loads
    inProgressLoads[url] = loadPromise;
    
    return loadPromise;
  },
  
  /**
   * Preload multiple images at once
   * @param {Array<string>} urls - Array of image URLs to preload
   * @returns {Promise} - Promise that resolves when all images are loaded
   */
  preloadImages: (urls) => {
    if (!urls || !Array.isArray(urls)) return Promise.reject('Invalid URL array');
    
    // Skip empty arrays
    if (urls.length === 0) return Promise.resolve([]);
    
    // Filter out data URLs and duplicates
    const uniqueUrls = [...new Set(urls)].filter(url => 
      url && !url.startsWith('data:') && !imageCache[url]
    );
    
    if (uniqueUrls.length === 0) {
      return Promise.resolve([]);
    }
    
    console.log(`Preloading ${uniqueUrls.length} images...`);
    
    // Create promises for each image
    const promises = uniqueUrls.map(url => imageService.preloadImage(url));
    
    // Wait for all to complete
    return Promise.allSettled(promises);
  },
  
  /**
   * Get image from cache or load it
   * @param {string} url - Image URL
   * @returns {HTMLImageElement|null} - Cached image element or null
   */
  getImage: (url) => {
    if (!url) return null;
    
    // Return from cache if available
    if (imageCache[url]) {
      return imageCache[url];
    }
    
    // For data URLs, don't try to load
    if (url.startsWith('data:')) {
      return null;
    }
    
    // If not already loading, start loading for next time
    if (!inProgressLoads[url]) {
      imageService.preloadImage(url);
    }
    
    // Return null as it's not yet loaded
    return null;
  },
  
  /**
   * Check if an image is loaded in cache
   * @param {string} url - Image URL to check
   * @returns {boolean} - Whether the image is cached
   */
  isImageLoaded: (url) => {
    if (!url) return false;
    return !!imageCache[url] || url.startsWith('data:');
  },
  
  /**
   * Clear image cache
   * @param {string|null} url - Specific URL to clear, or all if null
   */
  clearCache: (url = null) => {
    if (url) {
      delete imageCache[url];
      delete inProgressLoads[url];
    } else {
      // Clear all
      Object.keys(imageCache).forEach(key => {
        delete imageCache[key];
      });
      Object.keys(inProgressLoads).forEach(key => {
        delete inProgressLoads[key];
      });
    }
  }
};

export default imageService; 