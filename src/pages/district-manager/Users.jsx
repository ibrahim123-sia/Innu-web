import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  getBrandUsers,
  createUser,
  updateUser
} from '../../redux/slice/userSlice';
import {
  getShopsByDistrict,
  selectShopsByDistrict
} from '../../redux/slice/shopSlice';
import {
  getDistrictById,
  selectCurrentDistrict,
  selectDistrictLoading
} from '../../redux/slice/districtSlice';

// Import SweetAlert for popup notifications
import Swal from 'sweetalert2';

const DEFAULT_PROFILE_PIC = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

// Skeleton Components
const TableRowSkeleton = () => (
  <tr className="hover:bg-gray-50">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse mr-3"></div>
        <div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-40"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-24 mt-1"></div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-28"></div>
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
            {[1, 2, 3, 4, 5, 6].map((i) => (
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

const Users = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.user.currentUser);
  const districtId = currentUser?.district_id;
  const brandId = currentUser?.brand_id;
  
  // Data from Redux
  const users = useSelector(state => state.user.users) || [];
  const loading = useSelector(state => state.user.loading);
  const error = useSelector(state => state.user.error);
  
  // Shop data - only shops in current district
  const shopsByDistrict = useSelector(selectShopsByDistrict);
  
  // Current district data from Redux
  const currentDistrict = useSelector(selectCurrentDistrict);
  const districtLoading = useSelector(selectDistrictLoading);
  
  // Add initial load state
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  
  // UI States
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  
  // File states
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  
  // Form states - NO district field in form data
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'shop_manager',
    shop_id: '',
    is_active: true
  });
  
  const [viewData, setViewData] = useState({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [emailExistsError, setEmailExistsError] = useState('');

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

  // Role options - District Manager can only create Shop Manager and Technician
  const roles = [
    { value: 'shop_manager', label: 'Shop Manager' },
    { value: 'technician', label: 'Technician' }
  ];

  // Check if current user is district manager
  const isDistrictManager = currentUser?.role === 'district_manager';

  // ============================================
  // FILTER USERS - REMOVE BRAND ADMIN
  // ============================================
  const filteredUsers = React.useMemo(() => {
    if (!users || users.length === 0) return [];
    
    // Filter out brand admins completely
    return users.filter(user => user.role !== 'brand_admin');
  }, [users]);

  // ============================================
  // EFFECTS
  // ============================================
  const fetchCurrentDistrict = async () => {
    if (!districtId) return;
    
    try {
      await dispatch(getDistrictById(districtId)).unwrap();
    } catch (error) {
      console.error('Error fetching current district:', error);
    }
  };

  useEffect(() => {
    if (brandId) {
      fetchData();
    }
    if (districtId) {
      fetchCurrentDistrict();
    }
  }, [brandId, districtId]);

  // Handle loading completion
  useEffect(() => {
    if (!loading && !localLoading && filteredUsers) {
      setTimeout(() => {
        setIsInitialLoad(false);
        setIsDataReady(true);
      }, 300);
    }
  }, [loading, localLoading, filteredUsers]);

  const fetchData = async () => {
    setLocalLoading(true);
    setIsInitialLoad(true);
    setIsDataReady(false);
    
    try {
      console.log('Fetching brand users for brand ID:', brandId);
      const result = await dispatch(getBrandUsers(brandId)).unwrap();
      console.log('Fetch result:', result);
      
      // Fetch shops for this district if district manager
      if (districtId) {
        await dispatch(getShopsByDistrict(districtId));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsInitialLoad(false);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load users. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    } finally {
      setLocalLoading(false);
    }
  };

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

  // Check if email already exists
  const checkEmailExists = (email, excludeUserId = null) => {
    if (!email) return false;
    const exists = filteredUsers.some(u => 
      u.email?.toLowerCase() === email.toLowerCase() && 
      u.id !== excludeUserId
    );
    setEmailExistsError(exists ? 'A user with this email already exists. Please use a different email.' : '');
    return exists;
  };

  // Extract public URL from profile_pic_url
  const getProfilePicUrl = (profilePicData) => {
    if (!profilePicData) return DEFAULT_PROFILE_PIC;
    
    if (typeof profilePicData === 'string') {
      if (profilePicData.startsWith('{')) {
        try {
          const parsed = JSON.parse(profilePicData);
          return parsed.publicUrl || parsed.signedUrl || parsed.filePath || DEFAULT_PROFILE_PIC;
        } catch (e) {
          return profilePicData;
        }
      }
      return profilePicData;
    }
    
    return DEFAULT_PROFILE_PIC;
  };

  const getShopName = (shopId) => {
    if (!shopId) return 'None';
    const shop = filteredShops.find(s => s.id === shopId);
    return shop ? shop.name : 'Unknown Shop';
  };

  const getDistrictName = (districtId) => {
    if (!districtId) return 'None';
    if (districtId === currentDistrict?.id) return currentDistrict.name;
    return 'Other District';
  };

  const getRoleLabel = (roleValue) => {
    const allRoles = [
      { value: 'brand_admin', label: 'Brand Admin' },
      { value: 'district_manager', label: 'District Manager' },
      { value: 'shop_manager', label: 'Shop Manager' },
      { value: 'technician', label: 'Technician' },
      { value: 'user', label: 'User' }
    ];
    const role = allRoles.find(r => r.value === roleValue);
    return role ? role.label : roleValue;
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setProfilePicFile(file);
      setProfilePicPreview(previewUrl);
    }
  };

  // ============================================
  // VIEW USER (for district managers to view details)
  // ============================================
  const handleViewUser = (user) => {
    setShowViewModal(user.id);
    setViewData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      role: user.role || '',
      shop_id: user.shop_id || '',
      district_id: user.district_id || '',
      is_active: user.is_active,
      profile_pic: getProfilePicUrl(user.profile_pic_url)
    });
  };

  // ============================================
  // CREATE USER
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(true);

    // Validate required fields
    if (!formData.first_name) {
      setFormError('First name is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.last_name) {
      setFormError('Last name is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.email) {
      setFormError('Email is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.role) {
      setFormError('Role is required');
      setIsSubmitting(false);
      return;
    }

    // Check if email already exists
    if (checkEmailExists(formData.email)) {
      setFormError('Email already exists. Please use a different email.');
      Swal.fire({
        icon: 'error',
        title: 'Email Already Exists',
        text: 'This email is already registered. Please use a different email address.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      setIsSubmitting(false);
      return;
    }

    // Check if we have district ID for district manager
    if (isDistrictManager && !districtId) {
      setFormError('No district assigned to your account');
      setIsSubmitting(false);
      return;
    }

    try {
      const randomPassword = generateRandomPassword();
      
      const userFormData = new FormData();
      userFormData.append('email', formData.email);
      userFormData.append('first_name', formData.first_name);
      userFormData.append('last_name', formData.last_name);
      userFormData.append('contact_no', '');
      userFormData.append('role', formData.role);
      userFormData.append('brand_id', brandId);
      
      // Auto-assign district for district manager (NO DISTRICT DROPDOWN)
      if (isDistrictManager && districtId) {
        userFormData.append('district_id', districtId);
      }
      
      if (formData.shop_id && formData.shop_id !== '') {
        userFormData.append('shop_id', formData.shop_id);
      }
      
      userFormData.append('is_active', formData.is_active);
      userFormData.append('ft_password', randomPassword);
      userFormData.append('password_type', 'ft_password');
      userFormData.append('is_first_login', 'true');
      
      if (profilePicFile) {
        userFormData.append('profile_pic', profilePicFile);
      }

      const result = await dispatch(createUser(userFormData)).unwrap();
      
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'User Created Successfully!',
          html: `
            <div style="text-align: left;">
              <p><strong>Name:</strong> ${formData.first_name} ${formData.last_name}</p>
              <p><strong>Email:</strong> ${formData.email}</p>
              <p><strong>Role:</strong> ${getRoleLabel(formData.role)}</p>
              <p><strong>Shop:</strong> ${formData.shop_id ? getShopName(formData.shop_id) : 'None'}</p>
              ${isDistrictManager ? `<p><strong>District:</strong> ${currentDistrict?.name || 'Your District'} (auto-assigned)</p>` : ''}
              <br>
              <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 10px 0;">
                <p style="color: #0d47a1; margin: 0; font-weight: bold;">✓ Welcome email sent!</p>
                <p style="color: #0d47a1; margin: 5px 0 0 0; font-size: 14px;">
                  A temporary password has been sent to <strong>${formData.email}</strong>
                </p>
              </div>
            </div>
          `,
          confirmButtonText: 'OK',
          confirmButtonColor: '#4CAF50',
          width: '550px'
        });

        resetForm();
        await dispatch(getBrandUsers(brandId)).unwrap();
        setTimeout(() => {
          setShowCreateForm(false);
        }, 100);
      }
    } catch (err) {
      console.error('User creation failed:', err);
      setFormError(err?.error || 'Failed to create user. Please try again.');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.error || 'Failed to create user. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // FORM HANDLERS
  // ============================================

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      role: 'shop_manager',
      shop_id: '',
      is_active: true
    });
    setProfilePicFile(null);
    setProfilePicPreview(null);
    setEmailExistsError('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'email') {
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

  // Filter active shops
  const getAvailableShops = () => {
    return filteredShops.filter(shop => shop.is_active);
  };

  // ============================================
  // RENDER
  // ============================================

  // Show skeleton during initial load
  if (isInitialLoad || ((localLoading || loading) && !isDataReady) || districtLoading) {
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
      {/* Create User Button */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-800">
            {isDistrictManager ? `Users in ${currentDistrict?.name || 'Your District'}` : 'Brand Users'}
          </h2>
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
            {filteredUsers?.length || 0} Users
          </span>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setFormError('');
            setEmailExistsError('');
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {showCreateForm ? 'Cancel' : 'New User'}
        </button>
      </div>

      {/* Create User Form - WITHOUT DISTRICT FIELD */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 animate-fadeIn">
          <h2 className="text-xl font-bold text-blue-600 mb-4">
            Create New User {isDistrictManager ? `in ${currentDistrict?.name || 'Your District'}` : ''}
          </h2>
          
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Profile Picture */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Profile Picture</h3>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> A random password will be auto-generated and sent to the user's email.
                  </p>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {profilePicPreview ? (
                    <div className="space-y-2">
                      <img 
                        src={profilePicPreview} 
                        alt="Profile preview" 
                        className="w-32 h-32 rounded-full mx-auto object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setProfilePicFile(null);
                          setProfilePicPreview(null);
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
                      onChange={handleFileChange}
                      className="hidden"
                      name="profile_pic"
                    />
                  </label>
                </div>
              </div>

              {/* Middle and Right Columns: User Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
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
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Last name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        emailExistsError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="user@example.com"
                      required
                    />
                    {emailExistsError && (
                      <p className="mt-1 text-sm text-red-600">{emailExistsError}</p>
                    )}
                  </div>
                </div>

                {/* Role and Assignments */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="font-semibold text-gray-700">Role & Assignments</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    {isDistrictManager && (
                      <p className="mt-1 text-sm text-gray-500">
                        As a District Manager, you can only create Shop Manager and Technician roles.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign Shop
                    </label>
                    <select
                      name="shop_id"
                      value={formData.shop_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None (No shop assigned)</option>
                      {getAvailableShops().map(shop => (
                        <option key={shop.id} value={shop.id}>
                          {shop.name} {shop.is_active ? '' : '(Inactive)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* District Info - Auto-assigned for district managers (NO DROPDOWN) */}
                  {isDistrictManager && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">District:</span> {currentDistrict?.name || 'Your District'} (auto-assigned)
                      </p>
                    </div>
                  )}

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
                disabled={!!emailExistsError || isSubmitting}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  emailExistsError || isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSubmitting ? 'Creating User...' : emailExistsError ? 'Email Already Exists' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table - No brand admin, View only for district manager */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
        {error ? (
          <div className="py-12 text-center">
            <p className="text-red-600 mb-4">{typeof error === 'string' ? error : 'Failed to load users'}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredUsers && filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Shop
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned District
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
                {filteredUsers.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full overflow-hidden mr-3 border bg-gray-100">
                          <img 
                            src={getProfilePicUrl(userItem.profile_pic_url)}
                            alt={`${userItem.first_name} ${userItem.last_name}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = DEFAULT_PROFILE_PIC;
                            }}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {userItem.first_name} {userItem.last_name}
                          </div>
                          <div className="text-xs text-gray-500">{userItem.email}</div>
                          {userItem.is_first_login && (
                            <span className="text-xs text-orange-600">🔄 First login pending</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {getRoleLabel(userItem.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {userItem.shop_id ? getShopName(userItem.shop_id) : 
                        <span className="text-gray-400 italic">None</span>
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {userItem.district_id ? getDistrictName(userItem.district_id) : 
                        <span className="text-gray-400 italic">None</span>
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        userItem.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {userItem.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {/* For district managers: Only View button */}
                        {isDistrictManager ? (
                          <button
                            onClick={() => handleViewUser(userItem)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm transition-colors"
                          >
                            View
                          </button>
                        ) : (
                          // For other roles (brand admin): Show edit button (if needed)
                          <button
                            onClick={() => handleViewUser(userItem)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm transition-colors"
                          >
                            View
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <img 
              src={DEFAULT_PROFILE_PIC}
              alt="No users" 
              className="w-16 h-16 mx-auto mb-4 opacity-50 rounded-full"
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isDistrictManager ? `No Users Found in ${currentDistrict?.name || 'Your District'}` : 'No Users Found'}
            </h3>
            <p className="text-gray-500 mb-4">Create your first user to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create First User
            </button>
          </div>
        )}
      </div>

      {/* View User Modal (for district managers to view details) */}
      {showViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-blue-600">User Details</h2>
                <button
                  onClick={() => {
                    setShowViewModal(null);
                    setViewData({});
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Profile Picture */}
                <div className="flex justify-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100">
                    <img 
                      src={viewData.profile_pic || DEFAULT_PROFILE_PIC}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* User Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">First Name</label>
                    <p className="font-medium text-gray-900">{viewData.first_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Last Name</label>
                    <p className="font-medium text-gray-900">{viewData.last_name}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="font-medium text-gray-900">{viewData.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Role</label>
                    <p className="font-medium text-gray-900">{getRoleLabel(viewData.role)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Status</label>
                    <p className={`font-medium ${viewData.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {viewData.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Assigned Shop</label>
                    <p className="font-medium text-gray-900">
                      {viewData.shop_id ? getShopName(viewData.shop_id) : 'None'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Assigned District</label>
                    <p className="font-medium text-gray-900">
                      {viewData.district_id ? getDistrictName(viewData.district_id) : 'None'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t flex justify-end">
                <button
                  onClick={() => {
                    setShowViewModal(null);
                    setViewData({});
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;