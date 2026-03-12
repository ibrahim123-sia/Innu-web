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

import Swal from 'sweetalert2';

const API = axios.create({
  baseURL: 'https://innu-api-112488489004.us-central1.run.app/api',
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const DEFAULT_SHOP_IMAGE = 'https://cdn-icons-png.flaticon.com/512/3047/3047928.png';

const validateShopName = (name) => {
  if (!name?.trim()) return 'Shop name is required';
  if (name.length < 2) return 'Shop name must be at least 2 characters long';
  if (name.length > 100) return 'Shop name must be less than 100 characters';
  if (!/^[a-zA-Z0-9\s\&\-\.\,]+$/.test(name)) return 'Shop name can only contain letters, numbers, spaces, and & - . ,';
  return '';
};

const validateTekmetricId = (id) => {
  if (!id?.trim()) return 'Tekmetric Shop ID is required';
  if (id.length < 1) return 'Tekmetric Shop ID must be at least 1 character';
  if (id.length > 50) return 'Tekmetric Shop ID must be less than 50 characters';
  if (!/^[a-zA-Z0-9\-]+$/.test(id)) return 'Tekmetric Shop ID can only contain letters, numbers, and hyphens';
  return '';
};

const validateStreetAddress = (address) => {
  if (!address?.trim()) return 'Street address is required';
  if (address.length < 5) return 'Street address must be at least 5 characters long';
  if (address.length > 200) return 'Street address must be less than 200 characters';
  return '';
};

const validateCity = (city) => {
  if (!city?.trim()) return 'City is required';
  if (city.length < 2) return 'City must be at least 2 characters long';
  if (city.length > 100) return 'City must be less than 100 characters';
  if (!/^[a-zA-Z\s\-\.]+$/.test(city)) return 'City can only contain letters, spaces, hyphens, and periods';
  return '';
};

const validateState = (state) => {
  if (!state?.trim()) return 'State is required';
  if (state.length < 2) return 'State must be at least 2 characters long';
  if (state.length > 50) return 'State must be less than 50 characters';
  if (!/^[a-zA-Z\s\-\.]+$/.test(state)) return 'State can only contain letters, spaces, hyphens, and periods';
  return '';
};

const validateFileType = (file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']) => {
  if (!file) return '';
  if (!allowedTypes.includes(file.type)) return 'Please upload a valid image file (JPEG, PNG, GIF, or WEBP)';
  if (file.size > 5 * 1024 * 1024) return 'File size must not exceed 5MB';
  return '';
};

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
  
  const shopsByDistrict = useSelector(selectShopsByDistrict);
  const currentDistrict = useSelector(selectCurrentDistrict);
  const districtLoading = useSelector(selectDistrictLoading);
  
  const loading = useSelector(selectShopLoading);
  const error = useSelector(selectShopError);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  
  const [editLogoPreview, setEditLogoPreview] = useState(null);
  const [editLogoFile, setEditLogoFile] = useState(null);
  
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

  const [validationErrors, setValidationErrors] = useState({
    name: '', tekmetric_shop_id: '', street_address: '', city: '', state: ''
  });

  const [editValidationErrors, setEditValidationErrors] = useState({
    name: '', tekmetric_shop_id: '', street_address: '', city: '', state: ''
  });

  const filteredShops = React.useMemo(() => {
    if (!shopsByDistrict) return [];
    if (shopsByDistrict.data && Array.isArray(shopsByDistrict.data)) return shopsByDistrict.data;
    if (Array.isArray(shopsByDistrict)) return shopsByDistrict;
    if (shopsByDistrict.shops && Array.isArray(shopsByDistrict.shops)) return shopsByDistrict.shops;
    if (typeof shopsByDistrict === 'object') {
      const values = Object.values(shopsByDistrict);
      if (values.length > 0 && Array.isArray(values[0])) return values[0];
    }
    return [];
  }, [shopsByDistrict]);

  const timezones = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix',
    'America/Los_Angeles', 'America/Anchorage', 'America/Honolulu', 'America/Puerto_Rico',
    'America/Juneau', 'America/Boise', 'America/Indiana/Indianapolis', 'America/Detroit',
    'America/Menominee', 'America/North_Dakota/Center', 'America/Kentucky/Louisville'
  ];

  const getShopLogo = (shop) => {
    return (shop?.logo_url?.trim()) ? shop.logo_url : DEFAULT_SHOP_IMAGE;
  };

  const validateForm = () => {
    const errors = {
      name: validateShopName(formData.name),
      tekmetric_shop_id: validateTekmetricId(formData.tekmetric_shop_id),
      street_address: validateStreetAddress(formData.street_address),
      city: validateCity(formData.city),
      state: validateState(formData.state)
    };
    
    setValidationErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const validateEditForm = () => {
    const errors = {
      name: editFormData.name ? validateShopName(editFormData.name) : '',
      tekmetric_shop_id: editFormData.tekmetric_shop_id ? validateTekmetricId(editFormData.tekmetric_shop_id) : '',
      street_address: editFormData.street_address ? validateStreetAddress(editFormData.street_address) : '',
      city: editFormData.city ? validateCity(editFormData.city) : '',
      state: editFormData.state ? validateState(editFormData.state) : ''
    };
    
    setEditValidationErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const fetchCurrentDistrict = async () => {
    if (!districtId) return;
    try {
      await dispatch(getDistrictById(districtId)).unwrap();
    } catch {
    }
  };

  useEffect(() => {
    if (districtId) {
      fetchData();
      fetchCurrentDistrict();
    }
  }, [districtId]);

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
      await dispatch(getShopsByDistrict(districtId)).unwrap();
    } catch {
      setIsInitialLoad(false);
    }
  };

  const getDistrictName = () => currentDistrict?.name || 'Your District';

  const checkTekmetricIdExists = (id, excludeShopId = null) => {
    if (!id) return false;
    return filteredShops.some(shop => 
      shop.tekmetric_shop_id?.toString() === id.toString() && 
      shop.id !== excludeShopId
    );
  };

  const handleFileChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    const fileError = validateFileType(file);
    
    if (fileError) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File',
        text: fileError,
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      e.target.value = '';
      return;
    }

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      
      if (isEdit) {
        setEditLogoFile(file);
        setEditLogoPreview(previewUrl);
      } else {
        setLogoFile(file);
        setLogoPreview(previewUrl);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!validateForm()) {
      setFormError('Please fix the validation errors before submitting');
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fix the validation errors before submitting',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      return;
    }

    if (!districtId) {
      setFormError('No district assigned to your account');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No district assigned to your account',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      return;
    }

    if (checkTekmetricIdExists(formData.tekmetric_shop_id)) {
      setFormError('A shop with this Tekmetric ID already exists in your district');
      Swal.fire({
        icon: 'error',
        title: 'Duplicate Tekmetric ID',
        text: 'A shop with this Tekmetric ID already exists in your district',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const shopFormData = new FormData();
      shopFormData.append('name', formData.name.trim());
      shopFormData.append('brand_id', user.brand_id);
      shopFormData.append('district_id', districtId);
      shopFormData.append('tekmetric_shop_id', formData.tekmetric_shop_id.trim());
      shopFormData.append('street_address', formData.street_address.trim());
      shopFormData.append('city', formData.city.trim());
      shopFormData.append('state', formData.state.trim());
      shopFormData.append('timezone', formData.timezone);
      shopFormData.append('is_active', formData.is_active ? 'true' : 'false');
      
      if (logoFile) shopFormData.append('logo', logoFile);

      const shopResult = await dispatch(createShop(shopFormData)).unwrap();
      
      if (shopResult.success) {
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
        setTimeout(() => setShowCreateForm(false), 100);
      }
    } catch (err) {
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

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!validateEditForm()) {
      setFormError('Please fix the validation errors before submitting');
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fix the validation errors before submitting',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      return;
    }

    if (checkTekmetricIdExists(editFormData.tekmetric_shop_id, showEditModal)) {
      setFormError('A shop with this Tekmetric ID already exists in your district');
      Swal.fire({
        icon: 'error',
        title: 'Duplicate Tekmetric ID',
        text: 'A shop with this Tekmetric ID already exists in your district',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      return;
    }

    try {
      const shopFormData = new FormData();
      shopFormData.append('name', editFormData.name.trim());
      shopFormData.append('tekmetric_shop_id', editFormData.tekmetric_shop_id.trim());
      shopFormData.append('street_address', editFormData.street_address.trim());
      shopFormData.append('city', editFormData.city.trim());
      shopFormData.append('state', editFormData.state.trim());
      shopFormData.append('timezone', editFormData.timezone);
      shopFormData.append('is_active', editFormData.is_active ? 'true' : 'false');
      
      if (editFormData.district_id) {
        shopFormData.append('district_id', editFormData.district_id);
      }

      if (editLogoFile) {
        shopFormData.append('logo', editLogoFile);
      }

      const result = await dispatch(updateShop({
        id: showEditModal,
        data: shopFormData
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
        setTimeout(() => setShowEditModal(null), 100);
      }
      
    } catch (err) {
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

  const handleToggleStatus = async (shop) => {
    try {
      const shopFormData = new FormData();
      shopFormData.append('name', shop.name);
      shopFormData.append('tekmetric_shop_id', shop.tekmetric_shop_id);
      shopFormData.append('street_address', shop.street_address);
      shopFormData.append('city', shop.city);
      shopFormData.append('state', shop.state);
      shopFormData.append('timezone', shop.timezone);
      shopFormData.append('district_id', shop.district_id);
      shopFormData.append('is_active', (!shop.is_active).toString());

      await dispatch(updateShop({
        id: shop.id,
        data: shopFormData
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
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update shop status.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', street_address: '', city: '', state: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      tekmetric_shop_id: '', is_active: true
    });
    setValidationErrors({ name: '', tekmetric_shop_id: '', street_address: '', city: '', state: '' });
    setLogoFile(null);
    setLogoPreview(null);
  };

  const resetEditForm = () => {
    setEditFormData({});
    setEditValidationErrors({ name: '', tekmetric_shop_id: '', street_address: '', city: '', state: '' });
    setEditLogoFile(null);
    setEditLogoPreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    const validators = {
      name: validateShopName,
      tekmetric_shop_id: validateTekmetricId,
      street_address: validateStreetAddress,
      city: validateCity,
      state: validateState
    };

    if (name in validators) {
      const error = validators[name](value);
      setValidationErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    const validators = {
      name: validateShopName,
      tekmetric_shop_id: validateTekmetricId,
      street_address: validateStreetAddress,
      city: validateCity,
      state: validateState
    };

    if (name in validators) {
      const error = value ? validators[name](value) : '';
      setEditValidationErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleEdit = (shop) => {
    const shopLogo = getShopLogo(shop);
    
    setShowEditModal(shop.id);
    setEditFormData({
      name: shop.name,
      street_address: shop.street_address || '',
      city: shop.city || '',
      state: shop.state || '',
      timezone: shop.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      tekmetric_shop_id: shop.tekmetric_shop_id || '',
      district_id: shop.district_id,
      is_active: shop.is_active,
      logo_url: shopLogo
    });
    setEditLogoPreview(shopLogo);
    setEditLogoFile(null);
    setEditValidationErrors({ name: '', tekmetric_shop_id: '', street_address: '', city: '', state: '' });
  };

  if (isInitialLoad || (loading && !isDataReady) || districtLoading) {
    return (
      <div className="p-6 transition-opacity duration-300 ease-in-out">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-32"></div>
            <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-32"></div>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  const hasValidationErrors = Object.values(validationErrors).some(error => error);
  const hasEditValidationErrors = Object.values(editValidationErrors).some(error => error);

  return (
    <div className="transition-opacity duration-300 ease-in-out">
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
            if (!showCreateForm) resetForm();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {showCreateForm ? 'Cancel' : 'New Shop'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 animate-fadeIn">
          <h2 className="text-xl font-bold text-blue-600 mb-4">Create New Shop in {currentDistrict?.name || 'Your District'}</h2>
          
          {(formError || formSuccess) && (
            <div className={`mb-4 p-3 rounded-lg ${formError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {formError || formSuccess}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Shop Logo</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {logoPreview ? (
                      <div className="space-y-2">
                        <img 
                          src={logoPreview} 
                          alt="Shop logo preview" 
                          className="max-h-48 mx-auto rounded-lg object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLogoFile(null);
                            setLogoPreview(null);
                          }}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <img 
                          src={DEFAULT_SHOP_IMAGE}
                          alt="Default Shop logo" 
                          className="max-h-48 mx-auto rounded-lg object-contain opacity-50"
                        />
                        <p className="text-sm text-gray-500">Optional - Default logo will be used if not uploaded (Max 5MB, JPEG/PNG/GIF/WEBP)</p>
                      </div>
                    )}
                    <label className="block mt-4">
                      <span className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer inline-block">
                        Choose Logo
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={(e) => handleFileChange(e, false)}
                        className="hidden"
                        name="logo"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
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
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Enter shop name"
                        required
                      />
                      {validationErrors.name && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                      )}
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
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.tekmetric_shop_id ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Enter Tekmetric Shop ID"
                        required
                      />
                      {validationErrors.tekmetric_shop_id && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.tekmetric_shop_id}</p>
                      )}
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
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.street_address ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Street address"
                      required
                    />
                    {validationErrors.street_address && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.street_address}</p>
                    )}
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
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.city ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="City"
                        required
                      />
                      {validationErrors.city && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.city}</p>
                      )}
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
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.state ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="State"
                        required
                      />
                      {validationErrors.state && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.state}</p>
                      )}
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
            </div>

            <div className="mt-8 pt-6 border-t">
              <button
                type="submit"
                disabled={isSubmitting || hasValidationErrors}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isSubmitting || hasValidationErrors
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSubmitting ? 'Creating Shop...' : hasValidationErrors ? 'Fix Validation Errors' : 'Create Shop'}
              </button>
            </div>
          </form>
        </div>
      )}

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
        ) : filteredShops?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredShops.map((shop) => {
                  const shopLogo = getShopLogo(shop);
                  
                  return (
                    <tr key={shop.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center mr-4 border bg-gray-100">
                            <img 
                              src={shopLogo}
                              alt={shop.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = DEFAULT_SHOP_IMAGE; }}
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
                          shop.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-blue-600 mb-4">Edit Shop</h2>
              
              {(formError || formSuccess) && (
                <div className={`mb-4 p-3 rounded-lg ${formError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {formError || formSuccess}
                </div>
              )}
              
              <form onSubmit={handleEditSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-700">Shop Logo</h3>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        {editLogoPreview ? (
                          <div className="space-y-2">
                            <img 
                              src={editLogoPreview} 
                              alt="Shop logo preview" 
                              className="max-h-48 mx-auto rounded-lg object-contain"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setEditLogoFile(null);
                                setEditLogoPreview(editFormData.logo_url);
                              }}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <img 
                              src={editFormData.logo_url || DEFAULT_SHOP_IMAGE}
                              alt="Shop logo" 
                              className="max-h-48 mx-auto rounded-lg object-contain"
                            />
                            <p className="text-sm text-gray-500">Current shop logo</p>
                          </div>
                        )}
                        <label className="block mt-4">
                          <span className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer inline-block">
                            Change Logo
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={(e) => handleFileChange(e, true)}
                            className="hidden"
                            name="logo"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
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
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              editValidationErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="Enter shop name"
                            required
                          />
                          {editValidationErrors.name && (
                            <p className="mt-1 text-sm text-red-600">{editValidationErrors.name}</p>
                          )}
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
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              editValidationErrors.tekmetric_shop_id ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="Enter Tekmetric Shop ID"
                            required
                          />
                          {editValidationErrors.tekmetric_shop_id && (
                            <p className="mt-1 text-sm text-red-600">{editValidationErrors.tekmetric_shop_id}</p>
                          )}
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
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            editValidationErrors.street_address ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="Street address"
                          required
                        />
                        {editValidationErrors.street_address && (
                          <p className="mt-1 text-sm text-red-600">{editValidationErrors.street_address}</p>
                        )}
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
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              editValidationErrors.city ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="City"
                            required
                          />
                          {editValidationErrors.city && (
                            <p className="mt-1 text-sm text-red-600">{editValidationErrors.city}</p>
                          )}
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
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              editValidationErrors.state ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="State"
                            required
                          />
                          {editValidationErrors.state && (
                            <p className="mt-1 text-sm text-red-600">{editValidationErrors.state}</p>
                          )}
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
                    disabled={hasEditValidationErrors}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      hasEditValidationErrors
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
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