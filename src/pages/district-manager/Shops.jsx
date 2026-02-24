import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  getShopsByDistrict,
  selectShopsByDistrict,
  selectShopLoading,
  selectShopError,
  createShop,
  updateShop,
  deleteShop
} from '../../redux/slice/shopSlice';
import {
  getDistrictById,
  selectCurrentDistrict,
  selectDistrictLoading
} from '../../redux/slice/districtSlice';
import axios from 'axios';

// Import SweetAlert for popup notifications
import Swal from 'sweetalert2';

// Create axios instance
const API = axios.create({
  baseURL: 'https://innu-api-112488489004.us-central1.run.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Default images
const DEFAULT_SHOP_IMAGE = 'https://cdn-icons-png.flaticon.com/512/891/891419.png';

// Skeleton Components
const TableRowSkeleton = () => (
  <tr className="hover:bg-gray-50">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse mr-4"></div>
        <div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-24 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-28"></div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-40 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-28"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex space-x-2">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
        <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
      </div>
    </td>
  </tr>
);

const TableSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[1, 2, 3, 4, 5].map((i) => (
              <th key={i} className="px-6 py-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[1, 2, 3, 4, 5].map((i) => (
            <TableRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const Shops = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user.currentUser);
  const districtId = user?.district_id;
  
  // Shop data
  const shopsByDistrict = useSelector(selectShopsByDistrict);
  
  // Current district data from Redux
  const currentDistrict = useSelector(selectCurrentDistrict);
  const districtLoading = useSelector(selectDistrictLoading);
  
  const loading = useSelector(selectShopLoading);
  const error = useSelector(selectShopError);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add initial load state
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  
  // Form data - district_id removed from form
  const [formData, setFormData] = useState({
    name: '',
    street_address: '',
    city: '',
    state: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    tekmetric_shop_id: '',
    is_active: true
  });
  
  const [editFormData, setEditFormData] = useState({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Extract shops from the data object structure
  const filteredShops = React.useMemo(() => {
    if (!shopsByDistrict) return [];
    
    if (shopsByDistrict.data && Array.isArray(shopsByDistrict.data)) {
      return shopsByDistrict.data;
    }
    
    if (Array.isArray(shopsByDistrict)) {
      return shopsByDistrict;
    }
    
    if (shopsByDistrict.shops && Array.isArray(shopsByDistrict.shops)) {
      return shopsByDistrict.shops;
    }
    
    if (typeof shopsByDistrict === 'object') {
      const values = Object.values(shopsByDistrict);
      if (values.length > 0 && Array.isArray(values[0])) {
        return values[0];
      }
    }
    
    return [];
  }, [shopsByDistrict]);

  // Common US timezones for dropdown
  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Phoenix',
    'America/Los_Angeles',
    'America/Anchorage',
    'America/Honolulu',
    'America/Puerto_Rico',
    'America/Juneau',
    'America/Boise',
    'America/Indiana/Indianapolis',
    'America/Detroit',
    'America/Menominee',
    'America/North_Dakota/Center',
    'America/Kentucky/Louisville'
  ];

  // ============================================
  // FETCH CURRENT DISTRICT USING REDUX
  // ============================================
  const fetchCurrentDistrict = async () => {
    if (!districtId) return;
    
    try {
      await dispatch(getDistrictById(districtId)).unwrap();
    } catch (error) {
      console.error('Error fetching current district:', error);
    }
  };

  // ============================================
  // EFFECTS
  // ============================================

  // Fetch shops and current district
  useEffect(() => {
    if (districtId) {
      fetchData();
      fetchCurrentDistrict();
    }
  }, [districtId]);

  // Handle loading completion
  useEffect(() => {
    if (!loading && filteredShops) {
      setTimeout(() => {
        setIsInitialLoad(false);
        setIsDataReady(true);
      }, 300);
    }
  }, [loading, filteredShops]);

  const fetchData = async () => {
    setIsInitialLoad(true);
    setIsDataReady(false);
    
    try {
      console.log('Fetching shops for district:', districtId);
      await dispatch(getShopsByDistrict(districtId)).unwrap();
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsInitialLoad(false);
    }
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const getDistrictName = () => {
    return currentDistrict?.name || 'Your District';
  };

  // ============================================
  // CREATE SHOP
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(true);

    // Validate required fields
    if (!formData.name) {
      setFormError('Shop name is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.street_address) {
      setFormError('Street address is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.city) {
      setFormError('City is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.state) {
      setFormError('State is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.timezone) {
      setFormError('Timezone is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.tekmetric_shop_id || formData.tekmetric_shop_id.trim() === '') {
      setFormError('Tekmetric Shop ID is required');
      setIsSubmitting(false);
      return;
    }

    // Check if we have district ID
    if (!districtId) {
      setFormError('No district assigned to your account');
      setIsSubmitting(false);
      return;
    }

    try {
      // Create shop with current district_id
      const shopData = {
        name: formData.name,
        brand_id: user.brand_id,
        district_id: districtId, // Automatically use current district
        tekmetric_shop_id: formData.tekmetric_shop_id,
        street_address: formData.street_address,
        city: formData.city,
        state: formData.state,
        timezone: formData.timezone,
        is_active: formData.is_active
      };

      const shopResult = await dispatch(createShop(shopData)).unwrap();
      
      if (shopResult.success) {
        // Show success popup
        Swal.fire({
          icon: 'success',
          title: 'Shop Created Successfully!',
          html: `
            <div style="text-align: left;">
              <p><strong>Shop:</strong> ${formData.name}</p>
              <p><strong>Tekmetric ID:</strong> ${formData.tekmetric_shop_id}</p>
              <p><strong>Location:</strong> ${formData.city}, ${formData.state}</p>
              <p><strong>Timezone:</strong> ${formData.timezone}</p>
              <p><strong>District:</strong> ${currentDistrict?.name || 'Your District'}</p>
            </div>
          `,
          confirmButtonText: 'OK',
          confirmButtonColor: '#4CAF50',
          width: '500px'
        });

        resetForm();
        await dispatch(getShopsByDistrict(districtId));
        setTimeout(() => {
          setShowCreateForm(false);
        }, 100);
      }
    } catch (err) {
      console.error('Shop creation failed:', err);
      setFormError(err?.error || 'Failed to create shop. Please try again.');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.error || 'Failed to create shop. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // EDIT SHOP
  // ============================================
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Validate required fields
    if (!editFormData.street_address) {
      setFormError('Street address is required');
      return;
    }

    if (!editFormData.city) {
      setFormError('City is required');
      return;
    }

    if (!editFormData.state) {
      setFormError('State is required');
      return;
    }

    if (!editFormData.timezone) {
      setFormError('Timezone is required');
      return;
    }

    if (!editFormData.tekmetric_shop_id || editFormData.tekmetric_shop_id.trim() === '') {
      setFormError('Tekmetric Shop ID is required');
      return;
    }

    try {
      // Prepare update data - district_id is not editable, keep original
      const updateData = {
        name: editFormData.name,
        tekmetric_shop_id: editFormData.tekmetric_shop_id,
        street_address: editFormData.street_address,
        city: editFormData.city,
        state: editFormData.state,
        timezone: editFormData.timezone,
        district_id: editFormData.district_id, // Keep original district
        is_active: editFormData.is_active
      };

      const result = await dispatch(updateShop({
        id: showEditModal,
        data: updateData
      })).unwrap();

      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Shop updated successfully!',
          confirmButtonText: 'OK',
          confirmButtonColor: '#4CAF50',
          timer: 2000
        });
        
        resetEditForm();
        await dispatch(getShopsByDistrict(districtId));
        
        setTimeout(() => {
          setShowEditModal(null);
        }, 100);
      }
      
    } catch (err) {
      console.error('Shop update failed:', err);
      setFormError(err?.error || 'Failed to update shop. Please try again.');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.error || 'Failed to update shop. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    }
  };

  // Toggle shop status
  const handleToggleStatus = async (shop) => {
    try {
      const updateData = {
        name: shop.name,
        district_id: shop.district_id,
        tekmetric_shop_id: shop.tekmetric_shop_id,
        street_address: shop.street_address,
        city: shop.city,
        state: shop.state,
        timezone: shop.timezone,
        is_active: !shop.is_active
      };

      await dispatch(updateShop({
        id: shop.id,
        data: updateData
      })).unwrap();

      await dispatch(getShopsByDistrict(districtId));
      
      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: `${shop.name} has been ${!shop.is_active ? 'activated' : 'deactivated'} successfully.`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#4CAF50',
        timer: 2000
      });
    } catch (err) {
      console.error('Failed to toggle shop status:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update shop status.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    }
  };

  // ============================================
  // FORM HANDLERS
  // ============================================

  const resetForm = () => {
    setFormData({
      name: '',
      street_address: '',
      city: '',
      state: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      tekmetric_shop_id: '',
      is_active: true
    });
  };

  const resetEditForm = () => {
    setEditFormData({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEdit = (shop) => {
    setShowEditModal(shop.id);
    setEditFormData({
      name: shop.name,
      street_address: shop.street_address || '',
      city: shop.city || '',
      state: shop.state || '',
      timezone: shop.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      tekmetric_shop_id: shop.tekmetric_shop_id || '',
      district_id: shop.district_id, // Keep original district but don't show in form
      is_active: shop.is_active
    });
  };

  // ============================================
  // RENDER
  // ============================================

  // Show skeleton during initial load
  if (isInitialLoad || (loading && !isDataReady) || districtLoading) {
    return (
      <div className="p-6 transition-opacity duration-300 ease-in-out">
        {/* Header Skeleton */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-32"></div>
            <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-32"></div>
        </div>

        {/* Table Skeleton */}
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="transition-opacity duration-300 ease-in-out">
      {/* Create Shop Button */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-800">
            Shops in {currentDistrict?.name || 'Your District'}
          </h2>
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
            {filteredShops?.length || 0} Shops
          </span>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setFormError('');
            if (!showCreateForm) {
              resetForm();
            }
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {showCreateForm ? 'Cancel' : 'New Shop'}
        </button>
      </div>

      {/* Create Shop Form - WITHOUT DISTRICT FIELD */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 animate-fadeIn">
          <h2 className="text-xl font-bold text-blue-600 mb-4">Create New Shop in {currentDistrict?.name || 'Your District'}</h2>
          
          {formError && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
              {formError}
            </div>
          )}
          
          {formSuccess && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg">
              {formSuccess}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Shop Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Shop Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shop Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter shop name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tekmetric Shop ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="tekmetric_shop_id"
                      value={formData.tekmetric_shop_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter Tekmetric Shop ID"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="street_address"
                    value={formData.street_address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Street address"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="City"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="State"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {timezones.map(tz => (
                      <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                {/* District Info - Display only, not editable */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">District:</span> {currentDistrict?.name || 'Your District'} (auto-assigned)
                  </p>
                </div>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSubmitting ? 'Creating Shop...' : 'Create Shop'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Shops Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
        {error ? (
          <div className="py-12 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : filteredShops && filteredShops.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shop Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    District
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredShops.map((shop) => {
                  return (
                    <tr key={shop.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center mr-4 border bg-gray-100">
                            <img 
                              src={DEFAULT_SHOP_IMAGE}
                              alt={shop.name}
                              className="w-8 h-8 opacity-50"
                            />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{shop.name}</div>
                            <div className="text-xs font-medium text-blue-600">
                              Tekmetric ID: {shop.tekmetric_shop_id || 'Not Set'}
                            </div>
                            <div className="text-xs text-gray-400">{shop.timezone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{shop.street_address}</div>
                        <div className="text-sm text-gray-500">{shop.city}, {shop.state}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {shop.district_id === districtId ? currentDistrict?.name : 'Other District'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          shop.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {shop.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(shop)}
                            className="px-3 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded text-sm transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(shop)}
                            className={`px-3 py-1 rounded text-sm transition-colors ${
                              shop.is_active 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {shop.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <img 
              src={DEFAULT_SHOP_IMAGE}
              alt="No shops" 
              className="w-16 h-16 mx-auto mb-4 opacity-50"
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Shops Found in {currentDistrict?.name || 'Your District'}</h3>
            <p className="text-gray-500 mb-4">Create your first shop in this district to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create First Shop
            </button>
          </div>
        )}
      </div>

      {/* Edit Shop Modal - WITHOUT DISTRICT FIELD */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-blue-600 mb-4">Edit Shop</h2>
              
              {formError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
                  {formError}
                </div>
              )}
              
              {formSuccess && (
                <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg">
                  {formSuccess}
                </div>
              )}
              
              <form onSubmit={handleEditSubmit}>
                <div className="space-y-6">
                  {/* Shop Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Shop Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Shop Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={editFormData.name || ''}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter shop name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tekmetric Shop ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="tekmetric_shop_id"
                          value={editFormData.tekmetric_shop_id || ''}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter Tekmetric Shop ID"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="street_address"
                        value={editFormData.street_address || ''}
                        onChange={handleEditInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Street address"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={editFormData.city || ''}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="City"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={editFormData.state || ''}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="State"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timezone <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="timezone"
                        value={editFormData.timezone || ''}
                        onChange={handleEditInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        {timezones.map(tz => (
                          <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>

                    {/* District Info - Display only, not editable */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">District:</span> {
                          editFormData.district_id === districtId 
                            ? currentDistrict?.name 
                            : 'Other District'
                        } (cannot be changed)
                      </p>
                    </div>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={editFormData.is_active || false}
                        onChange={handleEditInputChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Active</span>
                    </label>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Update Shop
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shops;