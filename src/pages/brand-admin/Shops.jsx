import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  getShopsByBrand,
  selectShopsForBrand,
  selectShopLoading,
  selectShopError,
  createShop,
  updateShop,
  deleteShop
} from '../../redux/slice/shopSlice';
import {
  selectDistrictsByBrand,
  getDistrictsByBrand
} from '../../redux/slice/districtSlice';
import {
  createUser,
  updateUser,
  getAllUsers,
  selectAllUsers
} from '../../redux/slice/userSlice';

// Import SweetAlert for popup notifications
import Swal from 'sweetalert2';

// Default images
const DEFAULT_SHOP_IMAGE = 'https://cdn-icons-png.flaticon.com/512/891/891419.png';
const DEFAULT_PROFILE_PIC = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

const Shops = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user.currentUser);
  const brandId = user?.brand_id;
  
  // Correct selectors
  const shops = useSelector(selectShopsForBrand(brandId));
  const districts = useSelector(selectDistrictsByBrand) || [];
  const users = useSelector(selectAllUsers);
  const loading = useSelector(selectShopLoading);
  const error = useSelector(selectShopError);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // File states for create form
  const [managerProfilePicFile, setManagerProfilePicFile] = useState(null);
  const [managerProfilePicPreview, setManagerProfilePicPreview] = useState(null);
  
  // File states for edit form
  const [editManagerProfilePicFile, setEditManagerProfilePicFile] = useState(null);
  const [editManagerProfilePicPreview, setEditManagerProfilePicPreview] = useState(null);
  
  // Updated formData to match backend requirements
  const [formData, setFormData] = useState({
    name: '',
    street_address: '',
    city: '',
    state: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    tekmetric_shop_id: '',
    district_id: '',
    is_active: true,
    // Manager fields - now REQUIRED
    manager_first_name: '',
    manager_last_name: '',
    manager_email: '',
    manager_contact: ''
  });
  
  const [editFormData, setEditFormData] = useState({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [shopManagers, setShopManagers] = useState({});
  const [emailExistsError, setEmailExistsError] = useState('');

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
  // HELPER FUNCTIONS
  // ============================================
  
  // Generate random password (10 characters, strong)
  const generateRandomPassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';
    
    // Ensure at least one of each type
    let password = '';
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += special.charAt(Math.floor(Math.random() * special.length));
    
    // Add 6 more random characters
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = 0; i < 6; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  // Phone formatting function for USA numbers
  const formatPhoneNumber = (value) => {
    if (!value) return value;
    
    const phoneNumber = value.replace(/[^\d]/g, '');
    
    if (phoneNumber.length === 0) return '';
    if (phoneNumber.length <= 1) return `+1${phoneNumber}`;
    if (phoneNumber.length <= 4) return `+1 (${phoneNumber.substring(1, 4)}`;
    if (phoneNumber.length <= 7) return `+1 (${phoneNumber.substring(1, 4)}) ${phoneNumber.substring(4, 7)}`;
    
    return `+1 (${phoneNumber.substring(1, 4)}) ${phoneNumber.substring(4, 7)}-${phoneNumber.substring(7, 11)}`;
  };

  // Check if email already exists
  const checkEmailExists = (email) => {
    if (!email) return false;
    const exists = users.some(user => user.email.toLowerCase() === email.toLowerCase());
    setEmailExistsError(exists ? 'A user with this email already exists. Please use a different email.' : '');
    return exists;
  };

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (user?.brand_id) {
      dispatch(getShopsByBrand(user.brand_id));
      dispatch(getDistrictsByBrand(user.brand_id));
      dispatch(getAllUsers());
    }
  }, [dispatch, user?.brand_id]);

  useEffect(() => {
    // Organize shop managers by shop_id
    const managersMap = {};
    users.forEach(user => {
      if (user.role === 'shop_manager' && user.shop_id) {
        managersMap[user.shop_id] = {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          contact_no: user.contact_no,
          profile_pic_url: user.profile_pic_url,
          is_active: user.is_active,
          is_first_login: user.is_first_login,
          password_type: user.password_type
        };
      }
    });
    setShopManagers(managersMap);
  }, [users]);

  // ============================================
  // HELPER FUNCTIONS FOR DATA
  // ============================================

  const getManagerForShop = (shopId) => {
    return shopManagers[shopId] || null;
  };

  const getManagerProfilePic = (shopId) => {
    const manager = getManagerForShop(shopId);
    if (!manager) return DEFAULT_PROFILE_PIC;
    
    if (manager.profile_pic_url && manager.profile_pic_url.trim() !== '') {
      return manager.profile_pic_url;
    }
    return DEFAULT_PROFILE_PIC;
  };

  const getDistrictName = (districtId) => {
    if (!districtId) return 'None';
    const district = districts.find(d => d.id === districtId);
    return district ? district.name : 'Unknown District';
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleFileChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      
      if (e.target.name === 'manager_profile_pic') {
        if (isEdit) {
          setEditManagerProfilePicFile(file);
          setEditManagerProfilePicPreview(previewUrl);
        } else {
          setManagerProfilePicFile(file);
          setManagerProfilePicPreview(previewUrl);
        }
      }
    }
  };

  // ============================================
  // CREATE SHOP - WITH FT_PASSWORD
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(true);

    // Validate required fields according to backend
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

    // Validate manager fields - ALL REQUIRED
    if (!formData.manager_first_name) {
      setFormError('Manager first name is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.manager_last_name) {
      setFormError('Manager last name is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.manager_email) {
      setFormError('Manager email is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.manager_contact) {
      setFormError('Manager contact number is required');
      setIsSubmitting(false);
      return;
    }

    // Check if email already exists
    if (checkEmailExists(formData.manager_email)) {
      setFormError('Email already exists. Please use a different email for the shop manager.');
      Swal.fire({
        icon: 'error',
        title: 'Email Already Exists',
        text: 'This email is already registered. Please use a different email address for the shop manager.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Step 1: Create shop - using correct field names for backend
      const shopData = {
        name: formData.name,
        brand_id: user.brand_id,
        district_id: formData.district_id || null,
        tekmetric_shop_id: formData.tekmetric_shop_id,
        street_address: formData.street_address,
        city: formData.city,
        state: formData.state,
        timezone: formData.timezone,
        is_active: formData.is_active
      };

      const shopResult = await dispatch(createShop(shopData)).unwrap();
      
      if (shopResult.success) {
        // Step 2: Create shop manager user - REQUIRED
        // Generate random password for first-time login
        const randomPassword = generateRandomPassword();
        
        const userFormData = new FormData();
        userFormData.append('email', formData.manager_email);
        userFormData.append('first_name', formData.manager_first_name);
        userFormData.append('last_name', formData.manager_last_name);
        
        const formattedPhone = formatPhoneNumber(formData.manager_contact);
        userFormData.append('contact_no', formattedPhone || '');
        
        userFormData.append('role', 'shop_manager');
        userFormData.append('brand_id', user.brand_id);
        userFormData.append('shop_id', shopResult.data.id);
        
        // Only append district_id if it has a value
        if (formData.district_id && formData.district_id !== '') {
          userFormData.append('district_id', formData.district_id);
        }
        
        userFormData.append('is_active', true);
        
        // Add ft_password and password_type
        userFormData.append('ft_password', randomPassword);
        userFormData.append('password_type', 'ft_password');
        userFormData.append('is_first_login', 'true');
        
        if (managerProfilePicFile) {
          userFormData.append('profile_pic', managerProfilePicFile);
        }

        const userResult = await dispatch(createUser(userFormData)).unwrap();
        
        if (userResult.success) {
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
                <p><strong>District:</strong> ${formData.district_id ? getDistrictName(formData.district_id) : 'None'}</p>
                <p><strong>Shop Manager:</strong> ${formData.manager_first_name} ${formData.manager_last_name}</p>
                <p><strong>Manager Email:</strong> ${formData.manager_email}</p>
                <p><strong>Manager Contact:</strong> ${formattedPhone}</p>
                <br>
                <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 10px 0;">
                  <p style="color: #0d47a1; margin: 0; font-weight: bold;">✓ Welcome email sent!</p>
                  <p style="color: #0d47a1; margin: 5px 0 0 0; font-size: 14px;">
                    A temporary password has been sent to <strong>${formData.manager_email}</strong>
                  </p>
                </div>
              </div>
            `,
            confirmButtonText: 'OK',
            confirmButtonColor: '#4CAF50',
            width: '550px'
          });
        }

        resetForm();
        dispatch(getShopsByBrand(user.brand_id));
        dispatch(getAllUsers());
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
      // Update shop - only include fields that exist in backend
      const updateData = {
        name: editFormData.name,
        district_id: editFormData.district_id || null,
        tekmetric_shop_id: editFormData.tekmetric_shop_id,
        street_address: editFormData.street_address,
        city: editFormData.city,
        state: editFormData.state,
        timezone: editFormData.timezone,
        is_active: editFormData.is_active
      };

      await dispatch(updateShop({
        id: showEditModal,
        data: updateData
      })).unwrap();

      // Update shop manager if exists
      const manager = getManagerForShop(showEditModal);
      if (manager) {
        const managerFormData = new FormData();
        let hasChanges = false;
        
        if (editFormData.manager_first_name !== editFormData.original_manager_first_name) {
          managerFormData.append('first_name', editFormData.manager_first_name);
          hasChanges = true;
        }
        if (editFormData.manager_last_name !== editFormData.original_manager_last_name) {
          managerFormData.append('last_name', editFormData.manager_last_name);
          hasChanges = true;
        }
        
        if (editFormData.manager_contact !== editFormData.original_manager_contact) {
          const formattedPhone = formatPhoneNumber(editFormData.manager_contact);
          managerFormData.append('contact_no', formattedPhone);
          hasChanges = true;
        }
        
        if (editManagerProfilePicFile) {
          managerFormData.append('profile_pic', editManagerProfilePicFile);
          hasChanges = true;
        }

        if (hasChanges) {
          await dispatch(updateUser({
            id: manager.id,
            data: managerFormData
          })).unwrap();
          dispatch(getAllUsers());
        }
      }

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Shop updated successfully!',
        confirmButtonText: 'OK',
        confirmButtonColor: '#4CAF50',
        timer: 2000
      });
      
      resetEditForm();
      dispatch(getShopsByBrand(user.brand_id));
      setTimeout(() => {
        setShowEditModal(null);
      }, 100);
      
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

      dispatch(getShopsByBrand(user.brand_id));
      
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
      district_id: '',
      is_active: true,
      manager_first_name: '',
      manager_last_name: '',
      manager_email: '',
      manager_contact: ''
    });
    setManagerProfilePicFile(null);
    setManagerProfilePicPreview(null);
    setEmailExistsError('');
  };

  const resetEditForm = () => {
    setEditFormData({});
    setEditManagerProfilePicFile(null);
    setEditManagerProfilePicPreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'manager_contact') {
      const formattedValue = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else if (name === 'manager_email') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      checkEmailExists(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'manager_contact') {
      const formattedValue = formatPhoneNumber(value);
      setEditFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleEdit = (shop) => {
    const manager = getManagerForShop(shop.id);
    const managerProfilePic = getManagerProfilePic(shop.id);
    
    setShowEditModal(shop.id);
    setEditFormData({
      name: shop.name,
      street_address: shop.street_address || '',
      city: shop.city || '',
      state: shop.state || '',
      timezone: shop.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      tekmetric_shop_id: shop.tekmetric_shop_id || '',
      district_id: shop.district_id || '',
      is_active: shop.is_active,
      manager_first_name: manager?.first_name || '',
      manager_last_name: manager?.last_name || '',
      manager_email: manager?.email || '',
      manager_contact: manager?.contact_no || '',
      original_manager_first_name: manager?.first_name || '',
      original_manager_last_name: manager?.last_name || '',
      original_manager_contact: manager?.contact_no || '',
      manager_profile_pic: managerProfilePic
    });
    setEditManagerProfilePicPreview(managerProfilePic);
    setEditManagerProfilePicFile(null);
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div>
      {/* Create Shop Button */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-800">All Shops</h2>
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
            {shops?.length || 0} Shops
          </span>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setFormError('');
            setEmailExistsError('');
          }}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {showCreateForm ? 'Cancel' : 'New Shop'}
        </button>
      </div>

      {/* Create Shop Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-blue-600 mb-4">Create New Shop</h2>
          
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Shop Manager Profile Picture */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Shop Manager Profile Picture</h3>
                  
                  {/* Information about auto-generated password */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> A random password will be auto-generated and sent to the manager's email.
                      The manager will use this password for first-time login and will be prompted to create a new password.
                    </p>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {managerProfilePicPreview ? (
                      <div className="space-y-2">
                        <img 
                          src={managerProfilePicPreview} 
                          alt="Manager profile preview" 
                          className="w-32 h-32 rounded-full mx-auto object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setManagerProfilePicFile(null);
                            setManagerProfilePicPreview(null);
                          }}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <img 
                          src={DEFAULT_PROFILE_PIC}
                          alt="Default profile" 
                          className="w-32 h-32 rounded-full mx-auto object-cover opacity-50"
                        />
                        <p className="text-sm text-gray-500">Default profile picture will be used if not uploaded</p>
                      </div>
                    )}
                    <label className="block mt-4">
                      <span className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer inline-block">
                        Choose Photo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, false)}
                        className="hidden"
                        name="manager_profile_pic"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: Shop & Manager Info */}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      District
                    </label>
                    <select
                      name="district_id"
                      value={formData.district_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None (Shop without district)</option>
                      {districts.map(district => (
                        <option key={district.id} value={district.id}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      District is optional for shops
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

                {/* Shop Manager Information - ALL FIELDS REQUIRED */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="font-semibold text-gray-700">Shop Manager <span className="text-red-500">*</span></h3>
                  <p className="text-sm text-gray-500 mb-2">All manager fields are required</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="manager_first_name"
                        value={formData.manager_first_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="First name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="manager_last_name"
                        value={formData.manager_last_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Last name"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="manager_email"
                        value={formData.manager_email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          emailExistsError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="manager@example.com"
                        required
                      />
                      {emailExistsError && (
                        <p className="mt-1 text-sm text-red-600">{emailExistsError}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="manager_contact"
                        value={formData.manager_contact}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+1 (XXX) XXX-XXXX"
                        pattern="^\+1\s\(\d{3}\)\s\d{3}-\d{4}$"
                        title="Please enter a valid US phone number in format: +1 (XXX) XXX-XXXX"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Format: +1 (XXX) XXX-XXXX
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <button
                type="submit"
                disabled={!!emailExistsError || isSubmitting}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  emailExistsError || isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSubmitting ? 'Creating...' : emailExistsError ? 'Email Already Exists' : 'Create Shop with Manager'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Shops Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading shops...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : shops && shops.length > 0 ? (
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
                    Manager
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
                {shops.map((shop) => {
                  const manager = getManagerForShop(shop.id);
                  const managerProfilePic = getManagerProfilePic(shop.id);
                  
                  return (
                    <tr key={shop.id} className="hover:bg-gray-50">
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
                            {manager?.is_first_login && (
                              <span className="text-xs text-orange-600">🔄 First login pending</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{shop.street_address}</div>
                        <div className="text-sm text-gray-500">{shop.city}, {shop.state}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getDistrictName(shop.district_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {manager ? (
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full overflow-hidden mr-3 border bg-gray-100">
                              <img 
                                src={managerProfilePic}
                                alt={`${manager.first_name} ${manager.last_name}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = DEFAULT_PROFILE_PIC;
                                }}
                              />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {manager.first_name} {manager.last_name}
                              </div>
                              <div className="text-xs text-gray-500">{manager.email}</div>
                              {manager.contact_no && (
                                <div className="text-xs text-gray-400">{manager.contact_no}</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-red-500 font-medium">No manager assigned!</div>
                        )}
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
                            className="px-3 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(shop)}
                            className={`px-3 py-1 rounded text-sm ${
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Shops Found</h3>
            <p className="text-gray-500 mb-4">Create your first shop with a manager to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Create First Shop
            </button>
          </div>
        )}
      </div>

      {/* Edit Shop Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Shop Manager Profile Picture */}
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-700">Shop Manager Profile Picture</h3>
                      
                      {/* Note about password management */}
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> Password management is handled by users themselves.
                          Managers can reset their password using the "Forgot Password" feature.
                        </p>
                      </div>
                      
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        {editManagerProfilePicPreview ? (
                          <div className="space-y-2">
                            <img 
                              src={editManagerProfilePicPreview} 
                              alt="Manager profile preview" 
                              className="w-32 h-32 rounded-full mx-auto object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setEditManagerProfilePicFile(null);
                                setEditManagerProfilePicPreview(editFormData.manager_profile_pic);
                              }}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <img 
                              src={editFormData.manager_profile_pic || DEFAULT_PROFILE_PIC}
                              alt="Manager profile" 
                              className="w-32 h-32 rounded-full mx-auto object-cover"
                            />
                            <p className="text-sm text-gray-500">Current manager profile picture</p>
                          </div>
                        )}
                        <label className="block mt-4">
                          <span className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer inline-block">
                            Change Photo
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, true)}
                            className="hidden"
                            name="manager_profile_pic"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Shop & Manager Info */}
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          District
                        </label>
                        <select
                          name="district_id"
                          value={editFormData.district_id || ''}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">None (Shop without district)</option>
                          {districts.map(district => (
                            <option key={district.id} value={district.id}>
                              {district.name}
                            </option>
                          ))}
                        </select>
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

                    {/* Shop Manager Information */}
                    <div className="space-y-4 border-t pt-6">
                      <h3 className="font-semibold text-gray-700">Shop Manager</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            First Name
                          </label>
                          <input
                            type="text"
                            name="manager_first_name"
                            value={editFormData.manager_first_name || ''}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="First name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name
                          </label>
                          <input
                            type="text"
                            name="manager_last_name"
                            value={editFormData.manager_last_name || ''}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Last name"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            name="manager_email"
                            value={editFormData.manager_email || ''}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                            readOnly
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contact Number
                          </label>
                          <input
                            type="tel"
                            name="manager_contact"
                            value={editFormData.manager_contact || ''}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="+1 (XXX) XXX-XXXX"
                            pattern="^\+1\s\(\d{3}\)\s\d{3}-\d{4}$"
                            title="Please enter a valid US phone number in format: +1 (XXX) XXX-XXXX"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
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