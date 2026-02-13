import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectShopsByDistrict,
  selectShopLoading, 
  selectShopError,
  getShopsByDistrict,
  createShop,
  updateShop
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
import ShopDetailModal from '../../components/district-manager/ShopDetailModal';

// Import SweetAlert for popup notifications
import Swal from 'sweetalert2';

const DEFAULT_PROFILE_PIC = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

// Common US timezones
const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Phoenix',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Honolulu',
  'America/Puerto_Rico',
  'America/Detroit',
  'America/Indiana/Indianapolis',
  'America/Kentucky/Louisville',
  'America/Boise',
  'America/Salt_Lake_City'
];

const Shops = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.user.currentUser);
  const districtId = currentUser?.district_id;
  const brandId = currentUser?.brand_id;
  
  // Use selectShopsByDistrict - this gets shops for the current district directly from the API
  const shops = useSelector(selectShopsByDistrict) || [];
  const users = useSelector(selectAllUsers);
  const loading = useSelector(selectShopLoading);
  const error = useSelector(selectShopError);
  // Get districts for this brand
  const districts = useSelector(selectDistrictsByBrand) || [];
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showShopDetail, setShowShopDetail] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // File states
  const [managerProfilePicFile, setManagerProfilePicFile] = useState(null);
  const [managerProfilePicPreview, setManagerProfilePicPreview] = useState(null);
  const [editManagerProfilePicFile, setEditManagerProfilePicFile] = useState(null);
  const [editManagerProfilePicPreview, setEditManagerProfilePicPreview] = useState(null);
  
  // ✅ FIX: Use street_address (not address) to match backend
  const [formData, setFormData] = useState({
    name: '',                    // Required
    street_address: '',         // ✅ Required - match backend field name
    city: '',                  // Required
    state: '',                 // Required
    zip_code: '',
    phone: '',
    email: '',
    tekmetric_shop_id: '',      // Required
    timezone: 'America/New_York', // Required - default to Eastern Time
    is_active: true,
    // Manager fields
    manager_email: '',
    manager_first_name: '',
    manager_last_name: '',
    manager_contact: ''
  });
  
  const [editFormData, setEditFormData] = useState({
    name: '',
    street_address: '',        // ✅ Fix: street_address
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
    tekmetric_shop_id: '',
    timezone: 'America/New_York',
    is_active: true,
    manager_id: '',
    manager_email: '',
    manager_first_name: '',
    manager_last_name: '',
    manager_contact: '',
    manager_profile_pic: '',
    original_phone: '',
    original_manager_first_name: '',
    original_manager_last_name: '',
    original_manager_contact: ''
  });
  
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [shopManagers, setShopManagers] = useState({});
  const [emailExistsError, setEmailExistsError] = useState('');

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  // Generate random password
  const generateRandomPassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';
    
    let password = '';
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += special.charAt(Math.floor(Math.random() * special.length));
    
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = 0; i < 6; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  // Phone formatting function
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
    const exists = users.some(user => user.email?.toLowerCase() === email.toLowerCase());
    setEmailExistsError(exists ? 'A user with this email already exists. Please use a different email.' : '');
    return exists;
  };

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (brandId) {
      dispatch(getDistrictsByBrand(brandId));
    }
    if (districtId) {
      dispatch(getShopsByDistrict(districtId));
      dispatch(getAllUsers());
    }
  }, [dispatch, brandId, districtId]);

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

  const getShopCounts = () => {
    return {
      total: shops.length,
      active: shops.filter(s => s.is_active).length,
      inactive: shops.filter(s => !s.is_active).length
    };
  };

  // ============================================
  // HANDLERS
  // ============================================

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
  // CREATE SHOP - WITH CORRECT FIELD NAMES
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(true);

    // ✅ Validate ALL required fields with correct field names
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

    // Check if email exists when manager is being created
    if (formData.manager_email && checkEmailExists(formData.manager_email)) {
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
      // ✅ Create shop with CORRECT field names matching backend
      const shopData = {
        name: formData.name,
        street_address: formData.street_address, // ✅ Changed from address to street_address
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code || '',
        phone: formData.phone ? formatPhoneNumber(formData.phone) : '',
        email: formData.email || '',
        tekmetric_shop_id: formData.tekmetric_shop_id,
        timezone: formData.timezone,
        district_id: districtId,
        brand_id: brandId,
        is_active: formData.is_active
      };

      console.log('Creating shop with data:', shopData);

      const shopResult = await dispatch(createShop(shopData)).unwrap();
      
      if (shopResult.success) {
        // Create shop manager user if email is provided
        if (formData.manager_email) {
          const randomPassword = generateRandomPassword();
          
          const userData = {
            email: formData.manager_email,
            first_name: formData.manager_first_name || 'Shop',
            last_name: formData.manager_last_name || 'Manager',
            contact_no: formData.manager_contact ? formatPhoneNumber(formData.manager_contact) : '',
            role: 'shop_manager',
            shop_id: shopResult.data.id,
            district_id: districtId,
            brand_id: brandId,
            is_active: true,
            ft_password: randomPassword,
            password_type: 'ft_password',
            is_first_login: true
          };

          const userFormData = new FormData();
          Object.keys(userData).forEach(key => {
            userFormData.append(key, userData[key]);
          });
          
          if (managerProfilePicFile) {
            userFormData.append('profile_pic', managerProfilePicFile);
          }

          await dispatch(createUser(userFormData)).unwrap();
          
          Swal.fire({
            icon: 'success',
            title: 'Shop Created Successfully!',
            html: `
              <div style="text-align: left;">
                <p><strong>Shop:</strong> ${formData.name}</p>
                <p><strong>Address:</strong> ${formData.street_address}, ${formData.city}, ${formData.state}</p>
                <p><strong>Tekmetric ID:</strong> ${formData.tekmetric_shop_id}</p>
                <p><strong>Timezone:</strong> ${formData.timezone}</p>
                <p><strong>Shop Manager:</strong> ${formData.manager_first_name || 'Shop'} ${formData.manager_last_name || 'Manager'}</p>
                <p><strong>Manager Email:</strong> ${formData.manager_email}</p>
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
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Shop Created Successfully!',
            html: `
              <div style="text-align: left;">
                <p><strong>Shop:</strong> ${formData.name}</p>
                <p><strong>Address:</strong> ${formData.street_address}, ${formData.city}, ${formData.state}</p>
                <p><strong>Tekmetric ID:</strong> ${formData.tekmetric_shop_id}</p>
                <p><strong>Timezone:</strong> ${formData.timezone}</p>
                <p><strong>Status:</strong> ${formData.is_active ? 'Active' : 'Inactive'}</p>
                <br>
                <p style="color: #666;">No shop manager was assigned. You can assign one later.</p>
              </div>
            `,
            confirmButtonText: 'OK',
            confirmButtonColor: '#4CAF50',
            width: '500px'
          });
        }

        resetForm();
        dispatch(getShopsByDistrict(districtId));
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

    // ✅ Validate required fields for edit with correct field names
    if (!editFormData.name) {
      setFormError('Shop name is required');
      return;
    }

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
      // ✅ Update shop with CORRECT field names
      const shopData = {
        name: editFormData.name,
        street_address: editFormData.street_address, // ✅ Changed from address to street_address
        city: editFormData.city,
        state: editFormData.state,
        zip_code: editFormData.zip_code || '',
        phone: editFormData.phone !== editFormData.original_phone 
          ? formatPhoneNumber(editFormData.phone) 
          : editFormData.phone,
        email: editFormData.email || '',
        tekmetric_shop_id: editFormData.tekmetric_shop_id,
        timezone: editFormData.timezone,
        is_active: editFormData.is_active
      };

      await dispatch(updateShop({
        id: showEditModal,
        data: shopData
      })).unwrap();

      // Update shop manager if exists
      if (editFormData.manager_id) {
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
            id: editFormData.manager_id,
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
      dispatch(getShopsByDistrict(districtId));
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
      await dispatch(updateShop({
        id: shop.id,
        data: { is_active: !shop.is_active }
      })).unwrap();

      dispatch(getShopsByDistrict(districtId));
      
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
      street_address: '',  // ✅ Fix: street_address
      city: '',
      state: '',
      zip_code: '',
      phone: '',
      email: '',
      tekmetric_shop_id: '',
      timezone: 'America/New_York',
      is_active: true,
      manager_email: '',
      manager_first_name: '',
      manager_last_name: '',
      manager_contact: ''
    });
    setManagerProfilePicFile(null);
    setManagerProfilePicPreview(null);
    setEmailExistsError('');
  };

  const resetEditForm = () => {
    setEditFormData({
      name: '',
      street_address: '',  // ✅ Fix: street_address
      city: '',
      state: '',
      zip_code: '',
      phone: '',
      email: '',
      tekmetric_shop_id: '',
      timezone: 'America/New_York',
      is_active: true,
      manager_id: '',
      manager_email: '',
      manager_first_name: '',
      manager_last_name: '',
      manager_contact: '',
      manager_profile_pic: '',
      original_phone: '',
      original_manager_first_name: '',
      original_manager_last_name: '',
      original_manager_contact: ''
    });
    setEditManagerProfilePicFile(null);
    setEditManagerProfilePicPreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'phone' || name === 'manager_contact') {
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

  const handleViewDetails = (shopId) => {
    setShowShopDetail(shopId);
  };

  const handleEdit = (shop) => {
    const shopManager = getManagerForShop(shop.id) || {};
    const managerProfilePic = getManagerProfilePic(shop.id);
    
    setShowEditModal(shop.id);
    setEditFormData({
      name: shop.name,
      street_address: shop.street_address || '',  // ✅ Fix: street_address
      city: shop.city || '',
      state: shop.state || '',
      zip_code: shop.zip_code || '',
      phone: shop.phone || '',
      email: shop.email || '',
      tekmetric_shop_id: shop.tekmetric_shop_id || '',
      timezone: shop.timezone || 'America/New_York',
      is_active: shop.is_active,
      manager_id: shopManager.id || '',
      manager_email: shopManager.email || '',
      manager_first_name: shopManager.first_name || '',
      manager_last_name: shopManager.last_name || '',
      manager_contact: shopManager.contact_no || '',
      manager_profile_pic: managerProfilePic,
      original_phone: shop.phone || '',
      original_manager_first_name: shopManager.first_name || '',
      original_manager_last_name: shopManager.last_name || '',
      original_manager_contact: shopManager.contact_no || ''
    });
    setEditManagerProfilePicPreview(managerProfilePic);
    setEditManagerProfilePicFile(null);
  };

  const shopCounts = getShopCounts();

  // Debug: Log shops to see what's coming from Redux
  useEffect(() => {
    console.log('Shops from Redux (selectShopsByDistrict):', shops);
  }, [shops]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Shop Management</h1>
        <p className="text-gray-600">Manage all shops in your district</p>
      </div>

      {/* Create Shop Button */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-800">All Shops</h2>
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
            {shopCounts.total} Shops
          </span>
        </div>
        <div className="flex space-x-4 items-center">
          <span className="text-sm text-gray-600 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            {shopCounts.active} Active
          </span>
          <span className="text-sm text-gray-600 flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            {shopCounts.inactive} Inactive
          </span>
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setFormError('');
              setEmailExistsError('');
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors ml-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {showCreateForm ? 'Cancel' : 'New Shop'}
          </button>
        </div>
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
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Manager Profile Picture */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Manager Profile Picture</h3>
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> If you assign a manager, a random password will be auto-generated and sent to their email.
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
                {/* Shop Information - ALL FIELDS MARKED REQUIRED */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Shop Information <span className="text-red-500 text-sm">* All fields required</span></h3>
                  
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
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="street_address"  // ✅ Fix: street_address
                      value={formData.street_address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter street address"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Zip Code
                      </label>
                      <input
                        type="text"
                        name="zip_code"
                        value={formData.zip_code}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Zip Code"
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

                  <div className="grid grid-cols-2 gap-4">
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
                        {TIMEZONES.map(tz => (
                          <option key={tz} value={tz}>{tz.replace('America/', '')}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+1 (XXX) XXX-XXXX"
                      />
                    </div>
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="shop@example.com"
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

                {/* Manager Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Manager Account (Optional)</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manager Email
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
                    />
                    {emailExistsError && (
                      <p className="mt-1 text-sm text-red-600">{emailExistsError}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="manager_first_name"
                        value={formData.manager_first_name}
                        onChange={handleInputChange}
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
                        value={formData.manager_last_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Last name"
                      />
                    </div>
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+1 (XXX) XXX-XXXX"
                    />
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
                {isSubmitting ? 'Creating...' : emailExistsError ? 'Email Already Exists' : `Create Shop ${formData.manager_email ? '& Manager Account' : ''}`}
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
                    Manager
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tekmetric ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timezone
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
                            <svg className="w-8 h-8 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 00-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{shop.name}</div>
                            {shop.phone && (
                              <div className="text-xs text-gray-400">{shop.phone}</div>
                            )}
                            {manager?.is_first_login && (
                              <span className="text-xs text-orange-600">🔄 First login pending</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            {shop.street_address}, {shop.city}, {shop.state}
                          </div>
                          <div className="text-xs text-gray-500">{shop.zip_code || ''}</div>
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
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 italic">No manager assigned</div>
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
                        <span className="text-xs font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          {shop.tekmetric_shop_id || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {shop.timezone?.replace('America/', '') || 'Not set'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetails(shop.id)}
                            className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm"
                          >
                            View
                          </button>
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
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Shops Found</h3>
            <p className="text-gray-500 mb-4">Create your first shop to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Create First Shop
            </button>
          </div>
        )}
      </div>

      {/* Shop Detail Modal */}
      {showShopDetail && (
        <ShopDetailModal
          shopId={showShopDetail}
          onClose={() => setShowShopDetail(null)}
        />
      )}

      {/* Edit Shop Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-blue-600">Edit Shop</h2>
                <button
                  onClick={() => setShowEditModal(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {formError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
                  {formError}
                </div>
              )}
              
              <form onSubmit={handleEditSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Manager Profile Picture */}
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-700">Manager Profile Picture</h3>
                      
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> Password management is handled by users themselves.
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
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Shop Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={editFormData.name}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="street_address"  // ✅ Fix: street_address
                          value={editFormData.street_address}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={editFormData.city}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            value={editFormData.state}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Zip Code
                          </label>
                          <input
                            type="text"
                            name="zip_code"
                            value={editFormData.zip_code}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tekmetric ID <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="tekmetric_shop_id"
                            value={editFormData.tekmetric_shop_id}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Timezone <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="timezone"
                            value={editFormData.timezone}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            {TIMEZONES.map(tz => (
                              <option key={tz} value={tz}>{tz.replace('America/', '')}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={editFormData.phone}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={editFormData.email}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={editFormData.is_active}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Active</span>
                      </label>
                    </div>

                    {/* Shop Manager Information */}
                    {editFormData.manager_id && (
                      <div className="space-y-4 border-t pt-6">
                        <h3 className="font-semibold text-gray-700">Shop Manager</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              First Name
                            </label>
                            <input
                              type="text"
                              name="manager_first_name"
                              value={editFormData.manager_first_name}
                              onChange={handleEditInputChange}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Last Name
                            </label>
                            <input
                              type="text"
                              name="manager_last_name"
                              value={editFormData.manager_last_name}
                              onChange={handleEditInputChange}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contact Number
                          </label>
                          <input
                            type="tel"
                            name="manager_contact"
                            value={editFormData.manager_contact}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Manager Email
                          </label>
                          <input
                            type="email"
                            value={editFormData.manager_email}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                            readOnly
                          />
                        </div>
                      </div>
                    )}
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