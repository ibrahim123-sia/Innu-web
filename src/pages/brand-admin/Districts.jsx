// src/components/Districts.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectDistrictsByBrand,
  selectDistrictLoading,
  selectDistrictError,
  getDistrictsByBrand,
  createDistrict,
  updateDistrict
} from '../../redux/slice/districtSlice';
import {
  createUser,
  updateUser,
  getAllUsers,
  selectAllUsers
} from '../../redux/slice/userSlice';
import {
  getShopsByBrand,
  selectShopsForBrand
} from '../../redux/slice/shopSlice';

// Import SweetAlert for popup notifications
import Swal from 'sweetalert2';

const DEFAULT_PROFILE_PIC = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

const Districts = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user?.currentUser);
  
  // Correct selectors with fallbacks
  const districtsByBrand = useSelector(selectDistrictsByBrand) || [];
  const users = useSelector(selectAllUsers) || [];
  const loading = useSelector(selectDistrictLoading);
  const error = useSelector(selectDistrictError);
  
  // Get shops for the brand
  const shops = useSelector(
    user?.brand_id ? selectShopsForBrand(user.brand_id) : () => []
  ) || [];
  
  // Debug logging
  useEffect(() => {
    console.log('Districts from Redux:', districtsByBrand);
    console.log('Current user:', user);
    console.log('Shops for brand:', shops);
  }, [districtsByBrand, user, shops]);
  
  // Modal and form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [expandedDistrict, setExpandedDistrict] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // File states for create form
  const [managerProfilePicFile, setManagerProfilePicFile] = useState(null);
  const [managerProfilePicPreview, setManagerProfilePicPreview] = useState(null);
  
  // File states for edit form
  const [editManagerProfilePicFile, setEditManagerProfilePicFile] = useState(null);
  const [editManagerProfilePicPreview, setEditManagerProfilePicPreview] = useState(null);
  
  // Data states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });
  const [editFormData, setEditFormData] = useState({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [districtManagers, setDistrictManagers] = useState({});
  const [emailExistsError, setEmailExistsError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Manager creation states - ALL FIELDS ARE REQUIRED
  const [managerFormData, setManagerFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    contact_no: ''
  });

  // Validation errors for manager fields
  const [managerValidationErrors, setManagerValidationErrors] = useState({
    first_name: '',
    last_name: '',
    email: '',
    contact_no: ''
  });

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

  // Check if email already exists
  const checkEmailExists = (email) => {
    if (!email) return false;
    const exists = users.some(user => user.email?.toLowerCase() === email.toLowerCase());
    setEmailExistsError(exists ? 'A user with this email already exists. Please use a different email.' : '');
    return exists;
  };

  // Validate manager fields
  const validateManagerFields = () => {
    const errors = {
      first_name: '',
      last_name: '',
      email: '',
      contact_no: ''
    };
    let isValid = true;

    // Validate first name
    if (!managerFormData.first_name.trim()) {
      errors.first_name = 'First name is required';
      isValid = false;
    }

    // Validate last name
    if (!managerFormData.last_name.trim()) {
      errors.last_name = 'Last name is required';
      isValid = false;
    }

    // Validate email
    if (!managerFormData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(managerFormData.email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    } else if (checkEmailExists(managerFormData.email)) {
      errors.email = 'Email already exists';
      isValid = false;
    }

    // Validate contact number
    if (!managerFormData.contact_no.trim()) {
      errors.contact_no = 'Contact number is required';
      isValid = false;
    } else {
      // Check if it matches the US phone format
      const phoneRegex = /^\+1\s\(\d{3}\)\s\d{3}-\d{4}$/;
      if (!phoneRegex.test(managerFormData.contact_no)) {
        errors.contact_no = 'Please enter a valid US phone number: +1 (XXX) XXX-XXXX';
        isValid = false;
      }
    }

    setManagerValidationErrors(errors);
    return isValid;
  };

  // ============================================
  // EFFECTS
  // ============================================

  // Fetch districts, users, and shops on component mount
  useEffect(() => {
    if (user?.brand_id) {
      dispatch(getDistrictsByBrand(user.brand_id))
        .unwrap()
        .then((result) => {
          console.log('Districts fetched successfully:', result);
          setRefreshKey(prev => prev + 1);
        })
        .catch((err) => {
          console.error('Failed to fetch districts:', err);
        });
      
      dispatch(getAllUsers());
      dispatch(getShopsByBrand(user.brand_id));
    }
  }, [dispatch, user?.brand_id]);

  // Organize district managers by district_id
  useEffect(() => {
    const managersMap = {};
    users.forEach(user => {
      if (user.role === 'district_manager' && user.district_id) {
        managersMap[user.district_id] = {
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
    setDistrictManagers(managersMap);
  }, [users]);

  // ============================================
  // HELPER FUNCTIONS FOR DATA
  // ============================================

  const getManagerForDistrict = (districtId) => {
    return districtManagers[districtId] || null;
  };

  const getManagerProfilePic = (districtId) => {
    const manager = getManagerForDistrict(districtId);
    if (!manager) return DEFAULT_PROFILE_PIC;
    
    if (manager.profile_pic_url && manager.profile_pic_url.trim() !== '') {
      return manager.profile_pic_url;
    }
    return DEFAULT_PROFILE_PIC;
  };

  const getShopsForDistrict = (districtId) => {
    if (!shops || !Array.isArray(shops)) return [];
    return shops.filter(shop => shop.district_id === districtId);
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleViewShops = (districtId) => {
    if (expandedDistrict === districtId) {
      setExpandedDistrict(null);
    } else {
      setExpandedDistrict(districtId);
    }
  };

  const handleFileChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      
      if (isEdit) {
        setEditManagerProfilePicFile(file);
        setEditManagerProfilePicPreview(previewUrl);
      } else {
        setManagerProfilePicFile(file);
        setManagerProfilePicPreview(previewUrl);
      }
    }
  };

  // ============================================
  // CREATE DISTRICT (WITH REQUIRED MANAGER)
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    // Validate district name
    if (!formData.name) {
      setFormError('District name is required');
      return;
    }

    // Validate all manager fields (required)
    if (!validateManagerFields()) {
      setFormError('Please fill in all manager information correctly');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate random password for first-time login
      const randomPassword = generateRandomPassword();
      
      // Create district manager user FIRST
      const userFormData = new FormData();
      userFormData.append('email', managerFormData.email);
      userFormData.append('first_name', managerFormData.first_name);
      userFormData.append('last_name', managerFormData.last_name);
      
      const formattedPhone = formatPhoneNumber(managerFormData.contact_no);
      userFormData.append('contact_no', formattedPhone);
      
      userFormData.append('role', 'district_manager');
      userFormData.append('brand_id', user.brand_id);
      userFormData.append('is_active', true);
      
      // Add ft_password and password_type
      userFormData.append('ft_password', randomPassword);
      userFormData.append('password_type', 'ft_password');
      userFormData.append('is_first_login', 'true');
      
      if (managerProfilePicFile) {
        userFormData.append('profile_pic', managerProfilePicFile);
      }

      // Create the manager user
      const userResult = await dispatch(createUser(userFormData)).unwrap();
      
      if (userResult.success && userResult.data) {
        const managerId = userResult.data.id;

        // THEN create district with manager_id
        const districtData = {
          name: formData.name,
          description: formData.description,
          is_active: formData.is_active,
          brand_id: user.brand_id,
          manager_id: managerId // This matches the backend expectation
        };

        const districtResult = await dispatch(createDistrict(districtData)).unwrap();
        
        if (districtResult.success) {
          Swal.fire({
            icon: 'success',
            title: 'District Created Successfully!',
            html: `
              <div style="text-align: left;">
                <p><strong>District:</strong> ${formData.name}</p>
                <p><strong>District Manager:</strong> ${managerFormData.first_name} ${managerFormData.last_name}</p>
                <p><strong>Manager Email:</strong> ${managerFormData.email}</p>
                <p><strong>Contact:</strong> ${managerFormData.contact_no}</p>
                <br>
                <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 10px 0;">
                  <p style="color: #0d47a1; margin: 0; font-weight: bold;">✓ Welcome email sent!</p>
                  <p style="color: #0d47a1; margin: 5px 0 0 0; font-size: 14px;">
                    A temporary password has been sent to <strong>${managerFormData.email}</strong>
                  </p>
                </div>
                <p style="font-size: 14px; color: #666; margin-top: 15px;">
                  The manager will use this password for first-time login and will be prompted to create a new password.
                </p>
              </div>
            `,
            confirmButtonText: 'OK',
            confirmButtonColor: '#4CAF50',
            width: '550px'
          });

          resetForm();
          // Refresh data
          dispatch(getDistrictsByBrand(user.brand_id));
          dispatch(getAllUsers());
          setTimeout(() => {
            setShowCreateForm(false);
          }, 100);
        }
      }
    } catch (err) {
      console.error('District creation failed:', err);
      setFormError(err?.error || 'Failed to create district. Please try again.');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.error || 'Failed to create district. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // EDIT DISTRICT
  // ============================================
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      // Prepare district update data
      const districtUpdateData = {
        name: editFormData.name,
        description: editFormData.description,
        is_active: editFormData.is_active
      };

      // Update district
      const districtResult = await dispatch(updateDistrict({
        id: showEditModal,
        data: districtUpdateData
      })).unwrap();

      // Update district manager if exists
      const manager = getManagerForDistrict(showEditModal);
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
        text: 'District updated successfully!',
        confirmButtonText: 'OK',
        confirmButtonColor: '#4CAF50',
        timer: 2000
      });
      
      resetEditForm();
      dispatch(getDistrictsByBrand(user.brand_id));
      setTimeout(() => {
        setShowEditModal(null);
      }, 100);
      
    } catch (err) {
      console.error('District update failed:', err);
      setFormError(err?.error || 'Failed to update district. Please try again.');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.error || 'Failed to update district. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    }
  };

  // Toggle district status
  const handleToggleStatus = async (district) => {
    try {
      const updateData = {
        name: district.name,
        description: district.description,
        is_active: !district.is_active
      };

      await dispatch(updateDistrict({
        id: district.id,
        data: updateData
      })).unwrap();

      dispatch(getDistrictsByBrand(user.brand_id));
      
      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: `${district.name} has been ${!district.is_active ? 'activated' : 'deactivated'} successfully.`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#4CAF50',
        timer: 2000
      });
    } catch (err) {
      console.error('Failed to toggle district status:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update district status.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    }
  };

  // Edit district
  const handleEdit = (district) => {
    const manager = getManagerForDistrict(district.id);
    const managerProfilePic = getManagerProfilePic(district.id);
    
    setShowEditModal(district.id);
    setEditFormData({
      name: district.name,
      description: district.description || '',
      is_active: district.is_active,
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
  // FORM HANDLERS
  // ============================================

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true
    });
    setManagerFormData({
      first_name: '',
      last_name: '',
      email: '',
      contact_no: ''
    });
    setManagerValidationErrors({
      first_name: '',
      last_name: '',
      email: '',
      contact_no: ''
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
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleManagerInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'contact_no') {
      const formattedValue = formatPhoneNumber(value);
      setManagerFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
      
      // Clear validation error for this field
      setManagerValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    } else if (name === 'email') {
      setManagerFormData(prev => ({
        ...prev,
        [name]: value
      }));
      checkEmailExists(value);
      
      // Clear validation error for this field
      setManagerValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    } else {
      setManagerFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Clear validation error for this field
      setManagerValidationErrors(prev => ({
        ...prev,
        [name]: ''
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

  // ============================================
  // RENDER
  // ============================================

  // Ensure districtsByBrand is an array
  const displayDistricts = Array.isArray(districtsByBrand) ? districtsByBrand : [];

  return (
    <div key={refreshKey}>
      {/* Create District Button */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-800">Your Brand's Districts</h2>
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
            {displayDistricts.length} Districts
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
          {showCreateForm ? 'Cancel' : 'New District'}
        </button>
      </div>

      {/* Create District Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-blue-600 mb-4">Create New District</h2>
          
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
              {/* Left Column: District Manager Profile Picture */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">
                    District Manager Profile Picture <span className="text-red-500">*</span>
                  </h3>
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Important:</strong> A district manager is required for every district.
                      All manager fields must be completed.
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
                        Choose Photo (Optional)
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

              {/* Right Column: District & Manager Info */}
              <div className="space-y-6">
                {/* District Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">District Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      District Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter district name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional description about this district"
                    />
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

                {/* District Manager Information - ALL FIELDS REQUIRED */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">
                    District Manager <span className="text-red-500">*</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={managerFormData.first_name}
                        onChange={handleManagerInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          managerValidationErrors.first_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="First name"
                        required
                      />
                      {managerValidationErrors.first_name && (
                        <p className="mt-1 text-xs text-red-600">{managerValidationErrors.first_name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={managerFormData.last_name}
                        onChange={handleManagerInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          managerValidationErrors.last_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Last name"
                        required
                      />
                      {managerValidationErrors.last_name && (
                        <p className="mt-1 text-xs text-red-600">{managerValidationErrors.last_name}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={managerFormData.email}
                      onChange={handleManagerInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        managerValidationErrors.email || emailExistsError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="manager@example.com"
                      required
                    />
                    {(managerValidationErrors.email || emailExistsError) && (
                      <p className="mt-1 text-xs text-red-600">{managerValidationErrors.email || emailExistsError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="contact_no"
                      value={managerFormData.contact_no}
                      onChange={handleManagerInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        managerValidationErrors.contact_no ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="+1 (XXX) XXX-XXXX"
                      pattern="^\+1\s\(\d{3}\)\s\d{3}-\d{4}$"
                      title="Please enter a valid US phone number in format: +1 (XXX) XXX-XXXX"
                      required
                    />
                    {managerValidationErrors.contact_no && (
                      <p className="mt-1 text-xs text-red-600">{managerValidationErrors.contact_no}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Format: +1 (XXX) XXX-XXXX
                    </p>
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
                {isSubmitting ? 'Creating District with Manager...' : emailExistsError ? 'Email Already Exists' : 'Create District with Manager'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Districts Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading districts...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => dispatch(getDistrictsByBrand(user?.brand_id))}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : displayDistricts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    District Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shops
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
                {displayDistricts.map((district) => {
                  const manager = getManagerForDistrict(district.id);
                  const managerProfilePic = getManagerProfilePic(district.id);
                  const isExpanded = expandedDistrict === district.id;
                  const districtShops = getShopsForDistrict(district.id);
                  
                  // Every district should have a manager, but just in case
                  if (!manager) {
                    console.warn(`District ${district.id} has no manager assigned`);
                  }
                  
                  return (
                    <React.Fragment key={district.id}>
                      {/* District Row */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center mr-4 border bg-blue-100">
                              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{district.name}</div>
                              {manager?.is_first_login && (
                                <span className="text-xs text-orange-600">🔄 First login pending</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {district.description || 'No description'}
                          </div>
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
                            <div className="text-sm text-red-500 italic font-medium">⚠️ No manager assigned!</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">{districtShops.length}</span>
                            <span className="text-gray-500 ml-1">shops</span>
                            {districtShops.length > 0 && (
                              <span className="text-xs text-green-600 ml-2">
                                ({districtShops.filter(s => s.is_active).length} active)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            district.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {district.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewShops(district.id)}
                              className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm flex items-center"
                            >
                              <svg 
                                className={`w-4 h-4 mr-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              {isExpanded ? 'Hide Shops' : 'View Shops'}
                            </button>
                            <button
                              onClick={() => handleEdit(district)}
                              className="px-3 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleStatus(district)}
                              className={`px-3 py-1 rounded text-sm ${
                                district.is_active 
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {district.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Shops Dropdown Row */}
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan="6" className="px-6 py-4">
                            <div className="ml-14">
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="font-medium text-gray-700">
                                    Shops in {district.name} ({districtShops.length})
                                  </h4>
                                  <span className="text-xs text-gray-500">
                                    {districtShops.filter(s => s.is_active).length} active shops
                                  </span>
                                </div>
                                
                                {districtShops.length > 0 ? (
                                  <div className="space-y-3">
                                    {districtShops.map((shop) => (
                                      <div key={shop.id} className="bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow">
                                        <div className="flex justify-between items-start">
                                          <div className="flex items-start">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center mr-3 border bg-gray-100">
                                              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                                              </svg>
                                            </div>
                                            <div>
                                              <h5 className="font-medium text-gray-800">{shop.name}</h5>
                                              <p className="text-sm text-gray-600 mt-1">
                                                {shop.address || 'No address provided'}
                                              </p>
                                              {shop.city && (
                                                <p className="text-sm text-gray-500">
                                                  {shop.city}{shop.state ? `, ${shop.state}` : ''} {shop.zip_code}
                                                </p>
                                              )}
                                              <div className="flex items-center mt-2 space-x-3">
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                  shop.is_active 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                  {shop.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                                {shop.phone && (
                                                  <span className="text-sm text-gray-600">
                                                    {shop.phone}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-sm text-gray-600">
                                              Created: {new Date(shop.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="mt-2">
                                              <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                                Tekmetric ID: {shop.tekmetric_shop_id || 'Not Set'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-200">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <p className="text-gray-600">No shops found in this district</p>
                                    <p className="text-sm text-gray-500 mt-2">
                                      Create a shop and assign it to this district
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Districts Found</h3>
            <p className="text-gray-500 mb-4">Create your first district with a manager to organize shops</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Create First District
            </button>
          </div>
        )}
      </div>

      {/* Edit District Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-blue-600 mb-4">Edit District</h2>
              
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
                  {/* Left Column: District Manager Profile Picture */}
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-700">District Manager Profile Picture</h3>
                      
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

                  {/* Right Column: District & Manager Info */}
                  <div className="space-y-6">
                    {/* District Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-700">District Information</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          District Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={editFormData.name || ''}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter district name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={editFormData.description || ''}
                          onChange={handleEditInputChange}
                          rows="3"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Optional description about this district"
                        />
                      </div>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={editFormData.is_active || false}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Active</span>
                      </label>
                    </div>

                    {/* District Manager Information */}
                    <div className="space-y-4 border-t pt-6">
                      <h3 className="font-semibold text-gray-700">District Manager</h3>
                      
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
                          <p className="text-xs text-gray-500 mt-1">
                            Format: +1 (XXX) XXX-XXXX
                          </p>
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
                    Update District
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

export default Districts;