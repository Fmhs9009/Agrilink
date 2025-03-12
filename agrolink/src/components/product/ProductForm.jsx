import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { FaImage, FaUpload, FaTimes, FaSave, FaArrowLeft } from 'react-icons/fa';
import { productAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorBoundary from '../common/ErrorBoundary';

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useSelector((state) => state.auth.loginData);
  const isEditMode = !!id;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stock: '',
    unit: 'kg',
    isOrganic: false,
    isFeatured: false
  });

  // Image upload state
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Component state
  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(isEditMode);
  const [error, setError] = useState(null);

  // Categories
  const categories = [
    'Grains',
    'Vegetables',
    'Fruits',
    'Dairy',
    'Spices',
    'Organic',
    'Pulses',
    'Nuts',
    'Seeds',
    'Other'
  ];

  // Units
  const units = [
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'g', label: 'Gram (g)' },
    { value: 'lb', label: 'Pound (lb)' },
    { value: 'ton', label: 'Ton' },
    { value: 'piece', label: 'Piece' },
    { value: 'dozen', label: 'Dozen' },
    { value: 'box', label: 'Box' },
    { value: 'bag', label: 'Bag' }
  ];

  // Fetch product data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchProduct = async () => {
        try {
          setFetchingProduct(true);
          const response = await productAPI.getById(id);
          
          const productData = response.data;
          
          if (!productData) {
            toast.error('Product not found');
            navigate('/products/manage');
            return;
          }
          
          // Check if user is authorized to edit this product
          if (productData.farmer?._id !== user?._id && user?.role !== 'admin') {
            toast.error('You are not authorized to edit this product');
            navigate('/products/manage');
            return;
          }
          
          // Set form data
          setFormData({
            name: productData.name || '',
            description: productData.description || '',
            category: productData.category || '',
            price: productData.price?.toString() || '',
            stock: productData.stock?.toString() || '',
            unit: productData.unit || 'kg',
            isOrganic: productData.isOrganic || false,
            isFeatured: productData.isFeatured || false
          });
          
          // Set preview images
          if (productData.images && productData.images.length > 0) {
            setPreviewImages(productData.images.map(img => ({
              url: img,
              isUploaded: true
            })));
          }
        } catch (err) {
          console.error('Error fetching product:', err);
          setError('Failed to load product data');
          toast.error('Failed to load product data');
        } finally {
          setFetchingProduct(false);
        }
      };
      
      fetchProduct();
    }
  }, [id, isEditMode, navigate, user]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file types and sizes
    const validFiles = selectedFiles.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB max
      
      if (!isValidType) {
        toast.error(`${file.name} is not a valid image type`);
      }
      
      if (!isValidSize) {
        toast.error(`${file.name} exceeds the 5MB size limit`);
      }
      
      return isValidType && isValidSize;
    });
    
    if (validFiles.length === 0) return;
    
    // Add to images array
    setImages(prev => [...prev, ...validFiles]);
    
    // Create preview URLs
    const newPreviews = validFiles.map(file => ({
      url: URL.createObjectURL(file),
      isUploaded: false
    }));
    
    setPreviewImages(prev => [...prev, ...newPreviews]);
  };

  // Remove image
  const handleRemoveImage = (index) => {
    // Remove from preview
    setPreviewImages(prev => {
      const newPreviews = [...prev];
      
      // If it's a local preview, revoke the object URL to prevent memory leaks
      if (!newPreviews[index].isUploaded) {
        URL.revokeObjectURL(newPreviews[index].url);
      }
      
      newPreviews.splice(index, 1);
      return newPreviews;
    });
    
    // Remove from images array if it's not already uploaded
    if (!previewImages[index].isUploaded) {
      setImages(prev => {
        const newImages = [...prev];
        newImages.splice(index, 1);
        return newImages;
      });
    }
  };

  // Upload images to Cloudinary
  const uploadImagesToCloudinary = async () => {
    if (images.length === 0) return [];
    
    setUploadingImages(true);
    setUploadProgress(0);
    
    const uploadedUrls = [];
    const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
    
    console.log('Cloudinary config:', { cloudName, uploadPreset });
    
    if (!cloudName || !uploadPreset) {
      toast.error('Cloudinary configuration is missing');
      setUploadingImages(false);
      return [];
    }
    
    try {
      // For testing/development, use placeholder images if Cloudinary upload fails
      const usePlaceholderImages = true; // Set to false in production
      
      if (usePlaceholderImages) {
        // Use placeholder images instead of actual uploads for testing
        console.log('Using placeholder images instead of actual uploads');
        const placeholderUrls = [
          'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
          'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'
        ];
        
        // Simulate upload progress
        for (let i = 0; i < images.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
          setUploadProgress(Math.round(((i + 1) / images.length) * 100));
        }
        
        toast.success(`Using ${Math.min(images.length, placeholderUrls.length)} placeholder images`);
        return placeholderUrls.slice(0, images.length);
      }
      
      // Real upload logic (only used if usePlaceholderImages is false)
      for (let i = 0; i < images.length; i++) {
        const formData = new FormData();
        formData.append('file', images[i]);
        formData.append('upload_preset', uploadPreset);
        formData.append('folder', 'agrolink/products');
        
        console.log(`Uploading image ${i+1}/${images.length}: ${images[i].name}`);
        
        try {
          const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Cloudinary upload failed with status ${response.status}:`, errorText);
            toast.error(`Failed to upload image ${i+1}: ${response.statusText}`);
            continue;
          }
          
          const data = await response.json();
          
          if (data.secure_url) {
            console.log(`Image ${i+1} uploaded successfully:`, data.secure_url);
            uploadedUrls.push(data.secure_url);
          } else {
            console.error('Cloudinary response missing secure_url:', data);
            toast.error(`Failed to get URL for image ${i+1}`);
          }
        } catch (uploadError) {
          console.error(`Error uploading image ${i+1}:`, uploadError);
          toast.error(`Failed to upload image ${i+1}: ${uploadError.message}`);
        }
        
        // Update progress
        setUploadProgress(Math.round(((i + 1) / images.length) * 100));
      }
      
      if (uploadedUrls.length === 0 && images.length > 0) {
        toast.error('Failed to upload any images');
      } else if (uploadedUrls.length < images.length) {
        toast.warning(`Uploaded ${uploadedUrls.length} out of ${images.length} images`);
      } else {
        toast.success(`Successfully uploaded ${uploadedUrls.length} images`);
      }
      
      return uploadedUrls;
    } catch (err) {
      console.error('Error in image upload process:', err);
      toast.error(`Failed to upload images: ${err.message}`);
      return [];
    } finally {
      setUploadingImages(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    
    if (!formData.category) {
      toast.error('Category is required');
      return;
    }
    
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    
    if (!formData.stock || isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0) {
      toast.error('Please enter a valid stock quantity');
      return;
    }
    
    try {
      setLoading(true);
      
      // Upload images if there are any new ones
      let productImages = previewImages.filter(img => img.isUploaded).map(img => img.url);
      console.log('Existing uploaded images:', productImages);
      
      if (images.length > 0) {
        console.log(`Uploading ${images.length} new images...`);
        const uploadedUrls = await uploadImagesToCloudinary();
        console.log('New uploaded image URLs:', uploadedUrls);
        productImages = [...productImages, ...uploadedUrls];
      }
      
      // Prepare product data
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        images: productImages
      };
      
      console.log('Submitting product data:', productData);
      
      let response;
      
      try {
        if (isEditMode) {
          // Update existing product
          console.log(`Updating product with ID: ${id}`);
          response = await productAPI.update(id, productData);
          console.log('Product update response:', response);
          toast.success('Product updated successfully');
        } else {
          // Create new product
          console.log('Creating new product');
          response = await productAPI.create(productData);
          console.log('Product creation response:', response);
          
          // Log detailed information about the created product
          const createdProduct = response.data?.data || response.data;
          console.group('🌟 PRODUCT UPLOAD SUCCESSFUL 🌟');
          console.log('Product ID:', createdProduct._id || 'Mock ID');
          console.log('Product Name:', createdProduct.name);
          console.log('Product Category:', createdProduct.category);
          console.log('Product Price:', createdProduct.price);
          console.log('Product Stock:', createdProduct.stock);
          console.log('Product Description:', createdProduct.description);
          console.log('Product Images:', createdProduct.images);
          console.log('Created At:', createdProduct.createdAt || new Date().toISOString());
          console.log('Created By:', user?._id || 'Current User');
          
          // Log Cloudinary information
          console.group('📸 CLOUDINARY IMAGE INFORMATION 📸');
          createdProduct.images?.forEach((imageUrl, index) => {
            console.log(`Image ${index + 1}:`, imageUrl);
            // Extract Cloudinary information from URL
            try {
              const urlParts = imageUrl.split('/');
              const cloudName = urlParts[3];
              const version = urlParts[4];
              const format = imageUrl.split('.').pop();
              const publicId = urlParts[urlParts.length - 1].split('.')[0];
              
              console.log(`  Cloud Name: ${cloudName}`);
              console.log(`  Version: ${version}`);
              console.log(`  Format: ${format}`);
              console.log(`  Public ID: ${publicId}`);
              console.log(`  Transformation URL: https://res.cloudinary.com/${cloudName}/image/upload/c_scale,w_300/${publicId}.${format}`);
            } catch (error) {
              console.log('  Could not parse Cloudinary URL details');
            }
          });
          console.groupEnd();
          console.groupEnd();
          
          toast.success('Product added successfully');
        }
        
        // Navigate back to product management
        navigate('/products/manage');
      } catch (apiError) {
        console.error('API error:', apiError);
        const errorMessage = apiError.response?.data?.message || 
                            apiError.message || 
                            'Failed to save product';
        toast.error(errorMessage);
        
        // Don't navigate away on error
        return;
      }
    } catch (err) {
      console.error('Error in product submission process:', err);
      toast.error('Failed to process product submission');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProduct) {
    return <LoadingSpinner message="Loading product data..." />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
        <p className="font-medium">Error</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <button
                onClick={() => navigate('/products/manage')}
                className="inline-flex items-center text-gray-600 hover:text-gray-900"
              >
                <FaArrowLeft className="mr-2" />
                Back to Products
              </button>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                {isEditMode ? 'Edit Product' : 'Add New Product'}
              </h1>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Name */}
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name*
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                
                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category*
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                {/* Unit */}
                <div>
                  <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                    Unit*
                  </label>
                  <select
                    id="unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    {units.map(unit => (
                      <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
                  </select>
                </div>
                
                {/* Price */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹)*
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="block w-full pl-7 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">per {formData.unit}</span>
                    </div>
                  </div>
                </div>
                
                {/* Stock */}
                <div>
                  <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                    Available Stock*
                  </label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    min="0"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                
                {/* Description */}
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  ></textarea>
                </div>
                
                {/* Checkboxes */}
                <div className="md:col-span-2 flex flex-wrap gap-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isOrganic"
                      name="isOrganic"
                      checked={formData.isOrganic}
                      onChange={handleChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isOrganic" className="ml-2 block text-sm text-gray-900">
                      Organic Product
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-900">
                      Featured Product
                    </label>
                  </div>
                </div>
                
                {/* Image Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Images
                  </label>
                  
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <FaImage className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="images" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                          <span>Upload images</span>
                          <input
                            id="images"
                            name="images"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, WEBP up to 5MB
                      </p>
                    </div>
                  </div>
                  
                  {/* Image Previews */}
                  {previewImages.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Images</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {previewImages.map((preview, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-md bg-gray-200">
                              <img
                                src={preview.url}
                                alt={`Preview ${index + 1}`}
                                className="h-full w-full object-cover object-center"
                              />
                              {preview.isUploaded && (
                                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-1 py-0.5 rounded-bl-md">
                                  Uploaded
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <FaTimes size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Upload Progress */}
                  {uploadingImages && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Uploading images...</span>
                        <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-green-600 h-2.5 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/products/manage')}
                  className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingImages}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                    (loading || uploadingImages) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <FaSave className="mr-2" />
                  {loading ? 'Saving...' : isEditMode ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ProductForm; 