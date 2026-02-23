import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  getBrandUsers,
  createUser,
  updateUser
} from '../../redux/slice/userSlice';
import {
  getShopsByBrand,
  selectShopsForBrand
} from '../../redux/slice/shopSlice';
import {
  selectDistrictsByBrand,
  getDistrictsByBrand
} from '../../redux/slice/districtSlice';

// Import SweetAlert for popup notifications
import Swal from 'sweetalert2';

const DEFAULT_PROFILE_PIC = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

// Skeleton Loader Components
const TableRowSkeleton = () => (
  <tr className="hover:bg-gray-50">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse mr-3"></div>
        <div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-40"></div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
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
            {['User', 'Role', 'Assigned Shop', 'Assigned District', 'Status', 'Actions'].map((header) => (
              <th key={header} className="px-6 py-3 text-left">
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

const HeaderSkeleton = () => (
  <div className="mb-6 flex justify-between items-center">
    <div className="flex items-center space-x-4">
      <div className="h-8 bg-gray-200 rounded animate-pulse w-32"></div>
      <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16"></div>
    </div>
    <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-32"></div>
  </div>
);

const FormSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
    <div className="h-8 bg-gray-200 rounded animate-pulse w-48 mb-4"></div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="space-y-4">
        <div className="h-5 bg-gray-200 rounded animate-pulse w-32"></div>
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
          <div className="space-y-4">
            <div className="w-32 h-32 bg-gray-200 rounded-full animate-pulse mx-auto"></div>
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full"></div>
          </div>
        </div>
      </div>
      <div className="lg:col-span-2 space-y-6">
        <div className="space-y-4">
          <div className="h-5 bg-gray-200 rounded animate-pulse w-32"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full"></div>
            </div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full"></div>
          </div>
        </div>
        <div className="space-y-4 pt-6 border-t">
          <div className="h-5 bg-gray-200 rounded animate-pulse w-32"></div>
          <div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
          </div>
        </div>
      </div>
    </div>
    <div className="mt-8 pt-6 border-t">
      <div className="h-12 bg-gray-200 rounded-lg animate-pulse w-full"></div>
    </div>
  </div>
);

const Users = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.user.currentUser);
  const brandId = currentUser?.brand_id;
  
  // Data from Redux - FIXED: Direct access to state.user.users
  const users = useSelector(state => state.user.users) || [];
  const loading = useSelector(state => state.user.loading);
  const error = useSelector(state => state.user.error);
  
  const shops = useSelector(selectShopsForBrand(brandId)) || [];
  const districts = useSelector(selectDistrictsByBrand) || [];
  
  // Debug logging
  useEffect(() => {
    console.log('Current brand users from state:', users);
    console.log('Brand ID:', brandId);
    console.log('Loading state:', loading);
    console.log('Error state:', error);
  }, [users, brandId, loading, error]);
  
  // UI States
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // File states
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [editProfilePicFile, setEditProfilePicFile] = useState(null);
  const [editProfilePicPreview, setEditProfilePicPreview] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'user',
    shop_id: '',
    district_id: '',
    is_active: true
  });
  
  const [editFormData, setEditFormData] = useState({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [emailExistsError, setEmailExistsError] = useState('');

  // Role options
  const roles = [
    { value: 'district_manager', label: 'District Manager' },
    { value: 'shop_manager', label: 'Shop Manager' },
    { value: 'technician', label: 'Technician' },
    { value: 'user', label: 'User' }
  ];

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (currentUser?.brand_id) {
      fetchData();
    }
  }, [dispatch, currentUser?.brand_id]);

  const fetchData = async () => {
    setLocalLoading(true);
    setIsInitialLoad(true);
    try {
      console.log('Fetching brand users for brand ID:', currentUser.brand_id);
      const result = await dispatch(getBrandUsers(currentUser.brand_id)).unwrap();
      console.log('Fetch result:', result);
      
      await Promise.all([
        dispatch(getShopsByBrand(currentUser.brand_id)),
        dispatch(getDistrictsByBrand(currentUser.brand_id))
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load users. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    } finally {
      setLocalLoading(false);
      setIsInitialLoad(false);
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
    const exists = users.some(u => 
      u.email?.toLowerCase() === email.toLowerCase() && 
      u.id !== excludeUserId
    );
    setEmailExistsError(exists ? 'A user with this email already exists in your brand. Please use a different email.' : '');
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
    const shop = shops.find(s => s.id === shopId);
    return shop ? shop.name : 'Unknown Shop';
  };

  const getDistrictName = (districtId) => {
    if (!districtId) return 'None';
    const district = districts.find(d => d.id === districtId);
    return district ? district.name : 'Unknown District';
  };

  const getRoleLabel = (roleValue) => {
    const role = roles.find(r => r.value === roleValue);
    return role ? role.label : roleValue;
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleFileChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      
      if (isEdit) {
        setEditProfilePicFile(file);
        setEditProfilePicPreview(previewUrl);
      } else {
        setProfilePicFile(file);
        setProfilePicPreview(previewUrl);
      }
    }
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
        text: 'This email is already registered in your brand. Please use a different email address.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
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
      userFormData.append('brand_id', currentUser.brand_id);
      
      if (formData.shop_id && formData.shop_id !== '') {
        userFormData.append('shop_id', formData.shop_id);
      }
      
      if (formData.district_id && formData.district_id !== '') {
        userFormData.append('district_id', formData.district_id);
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
              <p><strong>District:</strong> ${formData.district_id ? getDistrictName(formData.district_id) : 'None'}</p>
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
        await dispatch(getBrandUsers(currentUser.brand_id)).unwrap();
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
  // EDIT USER
  // ============================================
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      const userFormData = new FormData();
      let hasChanges = false;
      
      if (editFormData.first_name !== editFormData.original_first_name) {
        userFormData.append('first_name', editFormData.first_name);
        hasChanges = true;
      }
      if (editFormData.last_name !== editFormData.original_last_name) {
        userFormData.append('last_name', editFormData.last_name);
        hasChanges = true;
      }
      
      if (editFormData.role !== editFormData.original_role) {
        userFormData.append('role', editFormData.role);
        hasChanges = true;
      }
      
      if (editFormData.shop_id !== editFormData.original_shop_id) {
        if (editFormData.shop_id && editFormData.shop_id !== '') {
          userFormData.append('shop_id', editFormData.shop_id);
        } else {
          userFormData.append('shop_id', '');
        }
        hasChanges = true;
      }
      
      if (editFormData.district_id !== editFormData.original_district_id) {
        if (editFormData.district_id && editFormData.district_id !== '') {
          userFormData.append('district_id', editFormData.district_id);
        } else {
          userFormData.append('district_id', '');
        }
        hasChanges = true;
      }
      
      if (editFormData.is_active !== editFormData.original_is_active) {
        userFormData.append('is_active', editFormData.is_active);
        hasChanges = true;
      }
      
      if (editProfilePicFile) {
        userFormData.append('profile_pic', editProfilePicFile);
        hasChanges = true;
      }

      if (hasChanges) {
        await dispatch(updateUser({
          id: showEditModal,
          data: userFormData
        })).unwrap();

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'User updated successfully!',
          confirmButtonText: 'OK',
          confirmButtonColor: '#4CAF50',
          timer: 2000
        });
        
        resetEditForm();
        await dispatch(getBrandUsers(currentUser.brand_id)).unwrap();
        setTimeout(() => {
          setShowEditModal(null);
        }, 100);
      } else {
        setShowEditModal(null);
      }
      
    } catch (err) {
      console.error('User update failed:', err);
      setFormError(err?.error || 'Failed to update user. Please try again.');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.error || 'Failed to update user. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    }
  };

  // Toggle user status
  const handleToggleStatus = async (user) => {
    try {
      const userFormData = new FormData();
      userFormData.append('is_active', !user.is_active);

      await dispatch(updateUser({
        id: user.id,
        data: userFormData
      })).unwrap();

      await dispatch(getBrandUsers(currentUser.brand_id)).unwrap();
      
      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: `${user.first_name} ${user.last_name} has been ${!user.is_active ? 'activated' : 'deactivated'} successfully.`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#4CAF50',
        timer: 2000
      });
    } catch (err) {
      console.error('Failed to toggle user status:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update user status.',
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
      first_name: '',
      last_name: '',
      email: '',
      role: 'user',
      shop_id: '',
      district_id: '',
      is_active: true
    });
    setProfilePicFile(null);
    setProfilePicPreview(null);
    setEmailExistsError('');
  };

  const resetEditForm = () => {
    setEditFormData({});
    setEditProfilePicFile(null);
    setEditProfilePicPreview(null);
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

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEdit = (user) => {
    setShowEditModal(user.id);
    setEditFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      role: user.role || 'user',
      shop_id: user.shop_id || '',
      district_id: user.district_id || '',
      is_active: user.is_active,
      profile_pic: getProfilePicUrl(user.profile_pic_url),
      original_first_name: user.first_name || '',
      original_last_name: user.last_name || '',
      original_role: user.role || 'user',
      original_shop_id: user.shop_id || '',
      original_district_id: user.district_id || '',
      original_is_active: user.is_active
    });
    setEditProfilePicPreview(getProfilePicUrl(user.profile_pic_url));
    setEditProfilePicFile(null);
  };

  // Filter active shops and districts
  const getAvailableShops = () => {
    return shops.filter(shop => shop.is_active);
  };

  const getAvailableDistricts = () => {
    return districts.filter(district => district.is_active);
  };

  // Show skeleton during initial load
  if (isInitialLoad && (localLoading || loading)) {
    return (
      <div className="transition-opacity duration-300 ease-in-out">
        <HeaderSkeleton />
        {showCreateForm && <FormSkeleton />}
        <TableSkeleton />
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  // Debug: Log the current state
  console.log('Rendering with users:', users);
  console.log('Users length:', users?.length);

  return (
    <div className="transition-opacity duration-300 ease-in-out">
      {/* Create User Button */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-800">Brand Users</h2>
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
            {users?.length || 0} Users
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

      {/* Create User Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-blue-600 mb-4">Create New User</h2>
          
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
                      onChange={(e) => handleFileChange(e, false)}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign District
                    </label>
                    <select
                      name="district_id"
                      value={formData.district_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None (No district assigned)</option>
                      {getAvailableDistricts().map(district => (
                        <option key={district.id} value={district.id}>
                          {district.name} {district.is_active ? '' : '(Inactive)'}
                        </option>
                      ))}
                    </select>
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

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {(localLoading || loading) && !isInitialLoad ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-red-600 mb-4">{typeof error === 'string' ? error : 'Failed to load users'}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : users && users.length > 0 ? (
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
                {users.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50">
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
                        <button
                          onClick={() => handleEdit(userItem)}
                          className="px-3 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(userItem)}
                          className={`px-3 py-1 rounded text-sm ${
                            userItem.is_active 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {userItem.is_active ? 'Deactivate' : 'Activate'}
                        </button>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
            <p className="text-gray-500 mb-4">Create your first user to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Create First User
            </button>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-blue-600 mb-4">Edit User</h2>
              
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Profile Picture */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Profile Picture</h3>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {editProfilePicPreview ? (
                        <div className="space-y-2">
                          <img 
                            src={editProfilePicPreview} 
                            alt="Profile preview" 
                            className="w-32 h-32 rounded-full mx-auto object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setEditProfilePicFile(null);
                              setEditProfilePicPreview(editFormData.profile_pic);
                            }}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <img 
                            src={editFormData.profile_pic || DEFAULT_PROFILE_PIC}
                            alt="Profile" 
                            className="w-32 h-32 rounded-full mx-auto object-cover"
                          />
                          <p className="text-sm text-gray-500">Current profile picture</p>
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
                            First Name
                          </label>
                          <input
                            type="text"
                            name="first_name"
                            value={editFormData.first_name || ''}
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
                            name="last_name"
                            value={editFormData.last_name || ''}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Last name"
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
                          value={editFormData.email || ''}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          readOnly
                        />
                      </div>
                    </div>

                    {/* Role and Assignments */}
                    <div className="space-y-4 border-t pt-6">
                      <h3 className="font-semibold text-gray-700">Role & Assignments</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Role
                        </label>
                        <select
                          name="role"
                          value={editFormData.role || 'user'}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {roles.map(role => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Assign Shop
                        </label>
                        <select
                          name="shop_id"
                          value={editFormData.shop_id || ''}
                          onChange={handleEditInputChange}
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Assign District
                        </label>
                        <select
                          name="district_id"
                          value={editFormData.district_id || ''}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">None (No district assigned)</option>
                          {getAvailableDistricts().map(district => (
                            <option key={district.id} value={district.id}>
                              {district.name} {district.is_active ? '' : '(Inactive)'}
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
                    Update User
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

export default Users;