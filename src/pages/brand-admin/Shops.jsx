import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectAllShops,
  selectShopLoading,
  selectShopError,
  getBrandShops,
  createShop,
  toggleShopStatus,
  updateShop
} from '../../redux/slice/shopSlice';
import {
  selectAllDistricts,
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
  
  // Correct selectors
  const shops = useSelector(selectAllShops);
  const districts = useSelector(selectAllDistricts);
  const users = useSelector(selectAllUsers);
  const loading = useSelector(selectShopLoading);
  const error = useSelector(selectShopError);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  
  // File states for create form
  const [managerProfilePicFile, setManagerProfilePicFile] = useState(null);
  const [managerProfilePicPreview, setManagerProfilePicPreview] = useState(null);
  
  // File states for edit form
  const [editManagerProfilePicFile, setEditManagerProfilePicFile] = useState(null);
  const [editManagerProfilePicPreview, setEditManagerProfilePicPreview] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
    tekmetric_shop_id: '',
    district_id: '',
    is_active: true,
    manager_first_name: '',
    manager_last_name: '',
    manager_email: '',
    manager_contact: ''
  });
  
  const [editFormData, setEditFormData] = useState({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [shopManagers, setShopManagers] = useState({});

  // Phone formatting function for USA numbers
  const formatPhoneNumber = (value) => {
    if (!value) return value;
    
    // Remove all non-digits
    const phoneNumber = value.replace(/[^\d]/g, '');
    
    // If starting with 1, keep it as country code
    if (phoneNumber.length === 0) return '';
    
    // Format: +1 (XXX) XXX-XXXX
    if (phoneNumber.length <= 1) return `+1${phoneNumber}`;
    if (phoneNumber.length <= 4) return `+1 (${phoneNumber.substring(1, 4)}`;
    if (phoneNumber.length <= 7) return `+1 (${phoneNumber.substring(1, 4)}) ${phoneNumber.substring(4, 7)}`;
    
    return `+1 (${phoneNumber.substring(1, 4)}) ${phoneNumber.substring(4, 7)}-${phoneNumber.substring(7, 11)}`;
  };

  useEffect(() => {
    if (user?.brand_id) {
      dispatch(getBrandShops(user.brand_id));
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
          is_active: user.is_active
        };
      }
    });
    setShopManagers(managersMap);
  }, [users]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Validate Tekmetric Shop ID - Required Field
    if (!formData.tekmetric_shop_id || formData.tekmetric_shop_id.trim() === '') {
      setFormError('Tekmetric Shop ID is required');
      return;
    }

    try {
      // Create shop
      const shopData = {
        ...formData,
        brand_id: user.brand_id
      };

      const shopResult = await dispatch(createShop(shopData)).unwrap();
      
      if (shopResult.success) {
        // Create shop manager user if email is provided
        if (formData.manager_email) {
          const userFormData = new FormData();
          userFormData.append('email', formData.manager_email);
          userFormData.append('first_name', formData.manager_first_name);
          userFormData.append('last_name', formData.manager_last_name);
          
          // Format phone number before saving
          const formattedPhone = formatPhoneNumber(formData.manager_contact);
          userFormData.append('contact_no', formattedPhone || '');
          
          userFormData.append('role', 'shop_manager');
          userFormData.append('brand_id', user.brand_id);
          userFormData.append('shop_id', shopResult.data.id);
          userFormData.append('district_id', formData.district_id || null);
          userFormData.append('is_active', true);
          
          if (managerProfilePicFile) {
            userFormData.append('profile_pic', managerProfilePicFile);
          }

          const userResult = await dispatch(createUser(userFormData)).unwrap();
          
          if (userResult.success) {
            // Show success popup with SweetAlert
            Swal.fire({
              icon: 'success',
              title: 'Shop Created Successfully!',
              html: `
                <div style="text-align: left;">
                  <p><strong>Shop:</strong> ${formData.name}</p>
                  <p><strong>Tekmetric ID:</strong> ${formData.tekmetric_shop_id}</p>
                  <p><strong>District:</strong> ${formData.district_id ? getDistrictName(formData.district_id) : 'None'}</p>
                  <p><strong>Shop Manager:</strong> ${formData.manager_first_name} ${formData.manager_last_name}</p>
                  <p><strong>Manager Email:</strong> ${formData.manager_email}</p>
                  <p><strong>Contact:</strong> ${formData.manager_contact || 'Not provided'}</p>
                  <br>
                  <p style="color: #4CAF50; font-weight: bold;">
                    A random password has been sent to ${formData.manager_email}
                  </p>
                  <p style="font-size: 14px; color: #666;">
                    The manager can use this password for first-time login and will be prompted to create a new password.
                  </p>
                </div>
              `,
              confirmButtonText: 'OK',
              confirmButtonColor: '#4CAF50',
              width: '500px'
            });
          }
        } else {
          // Show success popup without manager
          Swal.fire({
            icon: 'success',
            title: 'Shop Created Successfully!',
            html: `
              <div style="text-align: left;">
                <p><strong>Shop:</strong> ${formData.name}</p>
                <p><strong>Tekmetric ID:</strong> ${formData.tekmetric_shop_id}</p>
                <p><strong>District:</strong> ${formData.district_id ? getDistrictName(formData.district_id) : 'None'}</p>
                <p><strong>Status:</strong> ${formData.is_active ? 'Active' : 'Inactive'}</p>
                <br>
                <p style="color: #666;">
                  No shop manager was assigned. You can assign one later.
                </p>
              </div>
            `,
            confirmButtonText: 'OK',
            confirmButtonColor: '#4CAF50',
            width: '500px'
          });
        }

        resetForm();
        dispatch(getBrandShops(user.brand_id));
        dispatch(getAllUsers());
        setTimeout(() => {
          setShowCreateForm(false);
        }, 100);
      }
    } catch (err) {
      setFormError(err?.error || 'Failed to create shop. Please try again.');
      // Show error popup
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.error || 'Failed to create shop. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Validate Tekmetric Shop ID - Required Field
    if (!editFormData.tekmetric_shop_id || editFormData.tekmetric_shop_id.trim() === '') {
      setFormError('Tekmetric Shop ID is required');
      return;
    }

    try {
      // Update shop
      await dispatch(updateShop({
        id: showEditModal,
        data: editFormData
      })).unwrap();

      // Update shop manager if exists
      const manager = getManagerForShop(showEditModal);
      if (manager) {
        const managerFormData = new FormData();
        
        // Update name if changed
        if (editFormData.manager_first_name !== editFormData.original_manager_first_name) {
          managerFormData.append('first_name', editFormData.manager_first_name);
        }
        if (editFormData.manager_last_name !== editFormData.original_manager_last_name) {
          managerFormData.append('last_name', editFormData.manager_last_name);
        }
        
        // Format phone number before updating
        if (editFormData.manager_contact !== editFormData.original_manager_contact) {
          const formattedPhone = formatPhoneNumber(editFormData.manager_contact);
          managerFormData.append('contact_no', formattedPhone);
        }
        
        if (editManagerProfilePicFile) {
          managerFormData.append('profile_pic', editManagerProfilePicFile);
        }

        // Only update if there are changes
        if (Array.from(managerFormData.entries()).length > 0) {
          await dispatch(updateUser({
            id: manager.id,
            data: managerFormData
          })).unwrap();
          dispatch(getAllUsers());
        }
      }

      // Show success popup
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Shop updated successfully!',
        confirmButtonText: 'OK',
        confirmButtonColor: '#4CAF50'
      });
      
      resetEditForm();
      dispatch(getBrandShops(user.brand_id));
      setTimeout(() => {
        setShowEditModal(null);
      }, 100);
      
    } catch (err) {
      setFormError(err?.error || 'Failed to update shop. Please try again.');
      // Show error popup
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.error || 'Failed to update shop. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      phone: '',
      email: '',
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
  };

  const resetEditForm = () => {
    setEditFormData({});
    setEditManagerProfilePicFile(null);
    setEditManagerProfilePicPreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Format phone numbers
    if (name === 'phone' || name === 'manager_contact') {
      const formattedValue = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Format phone numbers
    if (name === 'phone' || name === 'manager_contact') {
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
      address: shop.address || '',
      city: shop.city || '',
      state: shop.state || '',
      zip_code: shop.zip_code || '',
      phone: shop.phone || '',
      email: shop.email || '',
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

  const handleToggleStatus = async (shopId) => {
    try {
      await dispatch(toggleShopStatus(shopId)).unwrap();
      dispatch(getBrandShops(user.brand_id));
      
      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: 'Shop status has been updated successfully.',
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

  const getDistrictName = (districtId) => {
    if (!districtId) return 'None';
    const district = districts.find(d => d.id === districtId);
    return district ? district.name : 'Unknown District';
  };

  // Filter districts to only show those from the current brand
  const getFilteredDistricts = () => {
    return districts.filter(district => district.brand_id === user?.brand_id);
  };

  return (
    <div>
      {/* Create Shop Button */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-800">All Shops</h2>
          <span className="bg-primary-blue text-white px-3 py-1 rounded-full text-sm">
            {shops?.length || 0} Shops
          </span>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-primary-red hover:bg-primary-red-dark text-white px-4 py-2 rounded-lg flex items-center transition-colors"
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
          <h2 className="text-xl font-bold text-primary-blue mb-4">Create New Shop</h2>
          
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
                  
                  {/* Add information about auto-generated password */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> If you assign a manager, a random password will be auto-generated and sent to their email.
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
                          className="text-sm text-primary-red hover:text-primary-red-dark"
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
                      <span className="bg-primary-blue hover:bg-primary-blue-dark text-white px-4 py-2 rounded-lg cursor-pointer inline-block">
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
                        Shop Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        placeholder="Enter shop name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        District
                      </label>
                      <select
                        name="district_id"
                        value={formData.district_id}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      >
                        <option value="">None (Shop without district)</option>
                        {getFilteredDistricts().map(district => (
                          <option key={district.id} value={district.id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Select "None" to create a shop without a district
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      placeholder="Street address"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        placeholder="City"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        placeholder="State"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        name="zip_code"
                        value={formData.zip_code}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        placeholder="ZIP Code"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        placeholder="+1 (XXX) XXX-XXXX"
                        pattern="^\+1\s\(\d{3}\)\s\d{3}-\d{4}$"
                        title="Please enter a valid US phone number in format: +1 (XXX) XXX-XXXX"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Format: +1 (XXX) XXX-XXXX
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        placeholder="shop@example.com"
                      />
                    </div>
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      placeholder="Enter Tekmetric Shop ID"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This is a required field
                    </p>
                  </div>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-primary-blue focus:ring-primary-blue"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>

                {/* Shop Manager Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Shop Manager (Optional)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="manager_first_name"
                        value={formData.manager_first_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
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
                        value={formData.manager_last_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
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
                        value={formData.manager_email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        placeholder="manager@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        name="manager_contact"
                        value={formData.manager_contact}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        placeholder="+1 (XXX) XXX-XXXX"
                        pattern="^\+1\s\(\d{3}\)\s\d{3}-\d{4}$"
                        title="Please enter a valid US phone number in format: +1 (XXX) XXX-XXXX"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Format: +1 (XXX) XXX-XXXX
                      </p>
                    </div>
                  </div>
                  
                  {/* REMOVED: Password Field */}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <button
                type="submit"
                className="w-full bg-primary-blue hover:bg-primary-blue-dark text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Create Shop
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Shops Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
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
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center mr-4 border bg-gray-100">
                            <img 
                              src={DEFAULT_SHOP_IMAGE}
                              alt={shop.name}
                              className="w-8 h-8 opacity-50"
                            />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{shop.name}</div>
                            <div className="text-sm font-medium text-blue-600">
                              Tekmetric ID: {shop.tekmetric_shop_id || 'Not Set'}
                            </div>
                            {shop.phone && (
                              <div className="text-xs text-gray-400">{shop.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{shop.city || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{shop.state || ''}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {getDistrictName(shop.district_id)}
                      </td>
                      <td className="px-6 py-4">
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
                          <div className="text-sm text-gray-500 italic">No manager</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          shop.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {shop.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(shop)}
                            className="px-3 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(shop.id)}
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
            <p className="text-gray-500 mb-4">Create your first shop to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-primary-blue hover:bg-primary-blue-dark text-white px-4 py-2 rounded-lg"
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
              <h2 className="text-xl font-bold text-primary-blue mb-4">Edit Shop</h2>
              
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
                              className="text-sm text-primary-red hover:text-primary-red-dark"
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
                          <span className="bg-primary-blue hover:bg-primary-blue-dark text-white px-4 py-2 rounded-lg cursor-pointer inline-block">
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
                            Shop Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={editFormData.name || ''}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                            placeholder="Enter shop name"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            District
                          </label>
                          <select
                            name="district_id"
                            value={editFormData.district_id || ''}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                          >
                            <option value="">None (Shop without district)</option>
                            {getFilteredDistricts().map(district => (
                              <option key={district.id} value={district.id}>
                                {district.name}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            Select "None" to remove district assignment
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={editFormData.address || ''}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                          placeholder="Street address"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={editFormData.city || ''}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                            placeholder="City"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            name="state"
                            value={editFormData.state || ''}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                            placeholder="State"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ZIP Code
                          </label>
                          <input
                            type="text"
                            name="zip_code"
                            value={editFormData.zip_code || ''}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                            placeholder="ZIP Code"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={editFormData.phone || ''}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                            placeholder="+1 (XXX) XXX-XXXX"
                            pattern="^\+1\s\(\d{3}\)\s\d{3}-\d{4}$"
                            title="Please enter a valid US phone number in format: +1 (XXX) XXX-XXXX"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Format: +1 (XXX) XXX-XXXX
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={editFormData.email || ''}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                            placeholder="shop@example.com"
                          />
                        </div>
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                          placeholder="Enter Tekmetric Shop ID"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          This is a required field
                        </p>
                      </div>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={editFormData.is_active || false}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                          className="rounded border-gray-300 text-primary-blue focus:ring-primary-blue"
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                            placeholder="+1 (XXX) XXX-XXXX"
                            pattern="^\+1\s\(\d{3}\)\s\d{3}-\d{4}$"
                            title="Please enter a valid US phone number in format: +1 (XXX) XXX-XXXX"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Format: +1 (XXX) XXX-XXXX
                          </p>
                        </div>
                      </div>
                      
                      {/* REMOVED: Password Change Section */}
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
                    className="px-4 py-2 bg-primary-blue hover:bg-primary-blue-dark text-white rounded-lg font-medium"
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