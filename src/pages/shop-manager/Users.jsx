import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  getUsersByShopId,
  createUser,
  updateUser,
  toggleUserActiveStatus,
  selectUserLoading,
  selectUserError,
  selectUserSuccess,
  selectUsersByShopId
} from '../../redux/slice/userSlice';
import {
  getShopById,
  selectCurrentShop
} from '../../redux/slice/shopSlice';

// Import SweetAlert for popup notifications
import Swal from 'sweetalert2';

const DEFAULT_PROFILE_PIC = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

// Skeleton Loader Components
const StatsSkeleton = () => (
  <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
    <div className="flex items-center space-x-4">
      <div className="h-8 bg-gray-200 rounded animate-pulse w-48"></div>
      <div className="h-6 bg-gray-200 rounded-full animate-pulse w-24"></div>
    </div>
    <div className="flex space-x-4">
      <div className="h-6 bg-gray-200 rounded animate-pulse w-24"></div>
      <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-32"></div>
    </div>
  </div>
);

const SearchSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-4 mb-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full"></div>
      </div>
      <div className="flex items-end">
        <div className="flex space-x-4 w-full">
          <div className="text-center flex-1">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-16 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-12 mx-auto"></div>
          </div>
          <div className="text-center flex-1">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-16 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-12 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const TableSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[1, 2, 3, 4, 5].map((i) => (
              <th key={i} className="px-6 py-3 text-left">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[1, 2, 3, 4].map((row) => (
            <tr key={row} className="hover:bg-gray-50">
              {[1, 2, 3, 4, 5].map((col) => (
                <td key={col} className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {col === 1 && (
                      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse mr-3"></div>
                    )}
                    <div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-2"></div>
                      {col === 1 && (
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                      )}
                    </div>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const Users = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.user.currentUser);
  const shopId = currentUser?.shop_id;
  
  const myShop = useSelector(selectCurrentShop);
  
  const shopUsers = useSelector(state => selectUsersByShopId(shopId)(state)) || [];
  
  const loading = useSelector(selectUserLoading);
  const error = useSelector(selectUserError);
  const success = useSelector(selectUserSuccess);
  
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastOperation, setLastOperation] = useState(null); // 'create', 'update', null
  const [successMessage, setSuccessMessage] = useState('');
  
  // File states
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [editProfilePicFile, setEditProfilePicFile] = useState(null);
  const [editProfilePicPreview, setEditProfilePicPreview] = useState(null);
  
  // Form states - role is fixed to 'technician'
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    contact_no: '',
    role: 'technician',
    is_active: true
  });
  
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    contact_no: '',
    role: '',
    is_active: true,
    original_first_name: '',
    original_last_name: '',
    original_contact_no: '',
    profile_pic: ''
  });
  
  const [formError, setFormError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [emailExistsError, setEmailExistsError] = useState('');

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  // Generate random password (10 characters, strong)
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
    const exists = shopUsers.some(user => user.email?.toLowerCase() === email.toLowerCase());
    setEmailExistsError(exists ? 'A user with this email already exists. Please use a different email.' : '');
    return exists;
  };

  // Get role display name
  const getRoleDisplay = (role) => {
    switch(role) {
      case 'technician': return 'Technician';
      case 'shop_manager': return 'Shop Manager';
      case 'district_manager': return 'District Manager';
      case 'brand_manager': return 'Brand Manager';
      default: return role?.replace(/_/g, ' ') || 'Unknown';
    }
  };

  // ============================================
  // EFFECTS
  // ============================================

  // Fetch shop data when component mounts
  useEffect(() => {
    if (shopId) {
      Promise.all([dispatch(getShopById(shopId))]).then(() => {
        setTimeout(() => setIsInitialLoad(false), 300);
      });
    }
  }, [dispatch, shopId]);

  // Fetch users for this specific shop
  useEffect(() => {
    if (shopId && myShop?.id) {
      dispatch(getUsersByShopId(shopId))
        .unwrap()
        .then(() => {
          setIsDataReady(true);
        })
        .catch(error => {
          console.error('Failed to fetch shop users:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load technicians. Please try again.',
            confirmButtonColor: '#d33'
          });
        });
    }
  }, [dispatch, shopId, myShop]);

  // Filter users to only show those belonging to this shop
  const filteredShopUsers = shopUsers.filter(user => 
    user.role === 'technician' // Additional role filter for safety
  );

  // Handle success messages and form closing
  useEffect(() => {
    if (success && lastOperation) {
      if (lastOperation === 'create') {
        setSuccessMessage('Technician created successfully!');
        setTimeout(() => {
          setSuccessMessage('');
          setShowCreateForm(false);
          setLastOperation(null);
          resetForm();
        }, 2000);
      } else if (lastOperation === 'update') {
        setSuccessMessage('Technician updated successfully!');
        setTimeout(() => {
          setSuccessMessage('');
          setShowEditModal(null);
          setLastOperation(null);
          resetEditForm();
        }, 2000);
      }
    }
  }, [success, lastOperation]);

  useEffect(() => {
    if (error) {
      setFormError(error);
      setLastOperation(null);
    }
  }, [error]);

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
  // CREATE USER - ONLY TECHNICIAN
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setLastOperation('create');
    setIsSubmitting(true);

    if (!myShop) {
      setFormError('Shop information not available');
      setIsSubmitting(false);
      setLastOperation(null);
      return;
    }

    // Validate required fields
    if (!formData.first_name) {
      setFormError('First name is required');
      setIsSubmitting(false);
      setLastOperation(null);
      return;
    }
    
    if (!formData.last_name) {
      setFormError('Last name is required');
      setIsSubmitting(false);
      setLastOperation(null);
      return;
    }
    
    if (!formData.email) {
      setFormError('Email is required');
      setIsSubmitting(false);
      setLastOperation(null);
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
      setLastOperation(null);
      return;
    }

    try {
      // Generate random password for first-time login
      const randomPassword = generateRandomPassword();
      
      const userFormData = new FormData();
      userFormData.append('first_name', formData.first_name);
      userFormData.append('last_name', formData.last_name);
      userFormData.append('email', formData.email);
      
      const formattedPhone = formatPhoneNumber(formData.contact_no);
      userFormData.append('contact_no', formattedPhone || '');
      
      // Always set role to 'technician'
      userFormData.append('role', 'technician');
      userFormData.append('shop_id', myShop.id);
      userFormData.append('brand_id', myShop.brand_id);
       if (myShop.district_id) {
      userFormData.append('district_id', myShop.district_id);
    }
      userFormData.append('is_active', formData.is_active);
      
      // Add ft_password and password_type
      userFormData.append('ft_password', randomPassword);
      userFormData.append('password_type', 'ft_password');
      userFormData.append('is_first_login', 'true');
      
      if (profilePicFile) {
        userFormData.append('profile_pic', profilePicFile);
      }

      const userResult = await dispatch(createUser(userFormData)).unwrap();
      
      if (userResult.success) {
        Swal.fire({
          icon: 'success',
          title: 'Technician Created Successfully!',
          html: `
            <div style="text-align: left;">
              <p><strong>Name:</strong> ${formData.first_name} ${formData.last_name}</p>
              <p><strong>Email:</strong> ${formData.email}</p>
              <p><strong>Role:</strong> Technician</p>
              <p><strong>Contact:</strong> ${formData.contact_no || 'Not provided'}</p>
              <br>
              <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 10px 0;">
                <p style="color: #0d47a1; margin: 0; font-weight: bold;">✓ Welcome email sent!</p>
                <p style="color: #0d47a1; margin: 5px 0 0 0; font-size: 14px;">
                  A temporary password has been sent to <strong>${formData.email}</strong>
                </p>
              </div>
              <p style="font-size: 14px; color: #666; margin-top: 15px;">
                The technician will use this password for first-time login and will be prompted to create a new password.
              </p>
            </div>
          `,
          confirmButtonText: 'OK',
          confirmButtonColor: '#4CAF50',
          width: '550px'
        });
        
        // Refresh the users list for this shop
        dispatch(getUsersByShopId(myShop.id));
      }
      
    } catch (err) {
      console.error('User creation failed:', err);
      setFormError(err?.error || 'Failed to create technician. Please try again.');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.error || 'Failed to create technician. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      setLastOperation(null);
      setIsSubmitting(false);
    }
  };

  // ============================================
  // EDIT USER - ONLY PROFILE INFO, NOT ROLE
  // ============================================
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setLastOperation('update');

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
      
      if (editFormData.contact_no !== editFormData.original_contact_no) {
        const formattedPhone = formatPhoneNumber(editFormData.contact_no);
        userFormData.append('contact_no', formattedPhone);
        hasChanges = true;
      }
      
      if (editProfilePicFile) {
        userFormData.append('profile_pic', editProfilePicFile);
        hasChanges = true;
      }

      // Only update if there are changes
      if (hasChanges) {
        await dispatch(updateUser({
          id: showEditModal,
          data: userFormData
        })).unwrap();
        
        // Refresh the users list for this shop
        dispatch(getUsersByShopId(myShop.id));
        
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Technician updated successfully!',
          confirmButtonText: 'OK',
          confirmButtonColor: '#4CAF50',
          timer: 2000
        });
      } else {
        Swal.fire({
          icon: 'info',
          title: 'No Changes',
          text: 'No changes were made to the technician profile.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#4CAF50',
          timer: 2000
        });
        setLastOperation(null);
        setShowEditModal(null);
        resetEditForm();
      }
      
    } catch (err) {
      console.error('User update failed:', err);
      setFormError(err?.error || 'Failed to update technician. Please try again.');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.error || 'Failed to update technician. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      setLastOperation(null);
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
      contact_no: '',
      role: 'technician',
      is_active: true
    });
    setProfilePicFile(null);
    setProfilePicPreview(null);
    setEmailExistsError('');
    setIsSubmitting(false);
  };

  const resetEditForm = () => {
    setEditFormData({
      first_name: '',
      last_name: '',
      email: '',
      contact_no: '',
      role: '',
      is_active: true,
      original_first_name: '',
      original_last_name: '',
      original_contact_no: '',
      profile_pic: ''
    });
    setEditProfilePicFile(null);
    setEditProfilePicPreview(null);
    setShowEditModal(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'contact_no') {
      const formattedValue = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else if (name === 'email') {
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
    
    if (name === 'contact_no') {
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

  const handleEdit = (user) => {
    setShowEditModal(user.id);
    setEditFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      contact_no: user.contact_no || '',
      role: user.role,
      is_active: user.is_active,
      original_first_name: user.first_name,
      original_last_name: user.last_name,
      original_contact_no: user.contact_no || '',
      profile_pic: user.profile_pic_url || DEFAULT_PROFILE_PIC
    });
    setEditProfilePicPreview(user.profile_pic_url || DEFAULT_PROFILE_PIC);
    setEditProfilePicFile(null);
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await dispatch(toggleUserActiveStatus({
        userId,
        is_active: !currentStatus
      })).unwrap();
      
      // Refresh the users list for this shop
      dispatch(getUsersByShopId(myShop.id));
      
      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: `Technician ${!currentStatus ? 'activated' : 'deactivated'} successfully!`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#4CAF50',
        timer: 2000
      });
    } catch (err) {
      console.error('Failed to toggle user status:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update technician status.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    }
  };

  // ============================================
  // FILTERS AND UTILITIES
  // ============================================

  const filteredUsers = filteredShopUsers?.filter(user => {
    let matches = true;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const email = user.email.toLowerCase();
      
      if (!fullName.includes(searchLower) && !email.includes(searchLower)) {
        matches = false;
      }
    }
    
    return matches;
  });

  // Get user counts
  const getUserCounts = () => {
    if (!filteredShopUsers) return { total: 0, active: 0, technicians: 0 };
    
    return {
      total: filteredShopUsers.length,
      active: filteredShopUsers.filter(u => u.is_active).length,
      technicians: filteredShopUsers.length,
    };
  };

  const userCounts = getUserCounts();

  // Show skeleton during initial load
  if (isInitialLoad || (loading && !isDataReady)) {
    return (
      <div className="transition-opacity duration-300 ease-in-out">
        <StatsSkeleton />
        <SearchSkeleton />
        <TableSkeleton />
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="transition-opacity duration-300 ease-in-out">
      {/* Create Technician Button and Stats */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-800">
            {myShop?.shop_name || 'Shop'} - Technicians
          </h2>
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
            {userCounts.total} Technicians
          </span>
        </div>
        
        <div className="flex space-x-2">
          <span className="text-sm text-gray-600 flex items-center mr-4">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            {userCounts.active} Active
          </span>
          <button
            onClick={() => {
              if (showCreateForm) {
                setShowCreateForm(false);
                resetForm();
              } else {
                setShowCreateForm(true);
                setFormError('');
                setEmailExistsError('');
              }
            }}
            className={`px-4 py-2 rounded-lg flex items-center transition-colors duration-200 ${
              showCreateForm 
                ? 'bg-gray-500 hover:bg-gray-600' 
                : 'bg-red-600 hover:bg-red-700'
            } text-white`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={showCreateForm 
                  ? "M6 18L18 6M6 6l12 12"
                  : "M12 6v6m0 0v6m0-6h6m-6 0H6"
                } 
              />
            </svg>
            {showCreateForm ? 'Cancel' : 'New Technician'}
          </button>
        </div>
      </div>

      {/* Create Technician Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 transition-all duration-300 ease-in-out">
          <h2 className="text-xl font-bold text-blue-600 mb-4">Add New Technician</h2>
          
          {formError && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
              {formError}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg">
              {successMessage}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Profile Picture */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Profile Picture</h3>
                  
                  {/* Information about auto-generated password */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> A random password will be auto-generated and sent to the technician's email.
                      They will use this password for first-time login and will be prompted to create a new password.
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
                      <span className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer inline-block transition-colors duration-200">
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
              </div>

              {/* Right Column: Technician Info */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Technician Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
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
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                        emailExistsError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="technician@example.com"
                      required
                    />
                    {emailExistsError && (
                      <p className="mt-1 text-sm text-red-600">{emailExistsError}</p>
                    )}
                  </div>

                 

                  {/* Role is fixed to Technician - hidden field */}
                  <input type="hidden" name="role" value="technician" />

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
                disabled={!!emailExistsError || isSubmitting || lastOperation === 'create'}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  emailExistsError || isSubmitting || lastOperation === 'create'
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSubmitting || lastOperation === 'create' ? 'Creating...' : emailExistsError ? 'Email Already Exists' : 'Add Technician'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 hover:shadow-lg transition-shadow duration-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Technicians</label>
            <input
              type="text"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            />
          </div>
          
          <div className="flex items-end">
            <div className="flex space-x-4 w-full">
              <div className="text-center flex-1">
                <div className="text-2xl font-bold text-blue-600">{userCounts.total}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-2xl font-bold text-green-600">{userCounts.active}</div>
                <div className="text-xs text-gray-500">Active</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technicians Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
        {loading && !isDataReady ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading technicians...</p>
          </div>
        ) : filteredUsers && filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Technician Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const profilePic = user.profile_pic_url || DEFAULT_PROFILE_PIC;
                  const isFirstLogin = user.is_first_login || (user.ft_password && !user.password);
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full overflow-hidden mr-3 border bg-gray-100">
                            <img 
                              src={profilePic}
                              alt={`${user.first_name} ${user.last_name}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = DEFAULT_PROFILE_PIC;
                              }}
                            />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {isFirstLogin && (
                              <span className="inline-flex items-center mt-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                                First login pending
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.contact_no || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium transition-colors duration-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user.id, user.is_active)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                              user.is_active 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
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
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Technicians Found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? 'Try adjusting your search' 
                : 'Add your first technician to get started'}
            </p>
            {!showCreateForm && (
              <button
                onClick={() => {
                  setShowCreateForm(true);
                  setFormError('');
                  setEmailExistsError('');
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Technician
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit Technician Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
            <div className="p-6">
              <h2 className="text-xl font-bold text-blue-600 mb-4">Edit Technician</h2>
              
              {formError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
                  {formError}
                </div>
              )}
              
              {successMessage && (
                <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg">
                  {successMessage}
                </div>
              )}
              
              <form onSubmit={handleEditSubmit}>
                <div className="space-y-6">
                  {/* Profile Picture */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Profile Picture</h3>
                    
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Password management is handled by technicians themselves.
                        They can reset their password using the "Forgot Password" feature.
                      </p>
                    </div>
                    
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
                            className="text-sm text-red-600 hover:text-red-700 transition-colors duration-200"
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
                        <span className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer inline-block transition-colors duration-200">
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

                  {/* Technician Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Technician Information</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          name="first_name"
                          value={editFormData.first_name}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          name="last_name"
                          value={editFormData.last_name}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        name="contact_no"
                        value={editFormData.contact_no}
                        onChange={handleEditInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                      />
                    </div>

                    {/* Email (Read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editFormData.email}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        readOnly
                      />
                    </div>

                    {/* Role (Read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <input
                        type="text"
                        value="Technician"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        readOnly
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
                </div>

                <div className="mt-8 pt-6 border-t flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(null);
                      resetEditForm();
                      setLastOperation(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={lastOperation === 'update'}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      lastOperation === 'update'
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {lastOperation === 'update' ? 'Updating...' : 'Update Technician'}
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