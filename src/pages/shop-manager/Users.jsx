import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
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

import Swal from 'sweetalert2';

const DEFAULT_PROFILE_PIC = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const validateName = (name) => {
  const nameRegex = /^[A-Za-z\s\-']+$/;
  return nameRegex.test(name);
};

const validateNameLength = (name, fieldName) => {
  if (name.length < 2) return `${fieldName} must be at least 2 characters long`;
  if (name.length > 50) return `${fieldName} must be less than 50 characters`;
  return '';
};

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
  const { shopId } = useParams();
  const currentUser = useSelector(state => state.user.currentUser);
  
  const targetShopId = shopId || currentUser?.shop_id;
  
  const myShop = useSelector(selectCurrentShop);
  
  const shopUsers = useSelector(state => selectUsersByShopId(targetShopId)(state)) || [];
  
  const loading = useSelector(selectUserLoading);
  const error = useSelector(selectUserError);
  const success = useSelector(selectUserSuccess);
  
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [showViewModal, setShowViewModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastOperation, setLastOperation] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [editProfilePicFile, setEditProfilePicFile] = useState(null);
  const [editProfilePicPreview, setEditProfilePicPreview] = useState(null);
  
  const [validationErrors, setValidationErrors] = useState({
    first_name: '', last_name: '', email: ''
  });

  const [editValidationErrors, setEditValidationErrors] = useState({
    first_name: '', last_name: ''
  });
  
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', role: 'technician', is_active: true
  });
  
  const [editFormData, setEditFormData] = useState({
    first_name: '', last_name: '', email: '', role: '', is_active: true,
    original_first_name: '', original_last_name: '', profile_pic: ''
  });
  
  const [viewUserData, setViewUserData] = useState(null);
  const [formError, setFormError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [emailExistsError, setEmailExistsError] = useState('');

  const validateFirstName = (name) => {
    if (!name?.trim()) return 'First name is required';
    if (!validateName(name)) return 'First name can only contain letters, spaces, hyphens, and apostrophes';
    return validateNameLength(name, 'First name');
  };

  const validateLastName = (name) => {
    if (!name?.trim()) return 'Last name is required';
    if (!validateName(name)) return 'Last name can only contain letters, spaces, hyphens, and apostrophes';
    return validateNameLength(name, 'Last name');
  };

  const validateEmailField = (email) => {
    if (!email?.trim()) return 'Email is required';
    if (!validateEmail(email)) return 'Please enter a valid email address (e.g., name@example.com)';
    if (email.length > 100) return 'Email must be less than 100 characters';
    return '';
  };

  const validateProfilePic = (file) => {
    if (!file) return '';
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) return 'Please upload only image files (JPEG, PNG, GIF, WEBP)';
    if (file.size > 5 * 1024 * 1024) return 'Profile picture must be less than 5MB';
    return '';
  };

  const validateForm = () => {
    const errors = {
      first_name: validateFirstName(formData.first_name),
      last_name: validateLastName(formData.last_name),
      email: validateEmailField(formData.email)
    };
    
    setValidationErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const validateEditForm = () => {
    const errors = {
      first_name: editFormData.first_name ? validateFirstName(editFormData.first_name) : '',
      last_name: editFormData.last_name ? validateLastName(editFormData.last_name) : ''
    };
    
    setEditValidationErrors(errors);
    return !Object.values(errors).some(error => error);
  };
  
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

  const checkEmailExists = (email) => {
    if (!email) return false;
    const exists = shopUsers.some(user => user.email?.toLowerCase() === email.toLowerCase());
    setEmailExistsError(exists ? 'A user with this email already exists. Please use a different email.' : '');
    return exists;
  };

  const getProfilePicUrl = (profilePicData) => {
    if (!profilePicData) return DEFAULT_PROFILE_PIC;

    if (typeof profilePicData === "string") {
      if (profilePicData.startsWith("{")) {
        try {
          const parsed = JSON.parse(profilePicData);
          return parsed.publicUrl || parsed.signedUrl || parsed.filePath || DEFAULT_PROFILE_PIC;
        } catch {
          return profilePicData;
        }
      }
      return profilePicData;
    }

    return DEFAULT_PROFILE_PIC;
  };

  const getRoleDisplay = (role) => {
    switch(role) {
      case 'technician': return 'Service Advisor';
      case 'shop_manager': return 'Shop Manager';
      case 'district_manager': return 'District Manager';
      case 'brand_manager': return 'Brand Manager';
      default: return role?.replace(/_/g, ' ') || 'Unknown';
    }
  };

  useEffect(() => {
    if (targetShopId) {
      Promise.all([dispatch(getShopById(targetShopId))]).then(() => {
        setTimeout(() => setIsInitialLoad(false), 300);
      });
    }
  }, [dispatch, targetShopId]);

  useEffect(() => {
    if (targetShopId && myShop?.id) {
      dispatch(getUsersByShopId(targetShopId))
        .unwrap()
        .then(() => setIsDataReady(true))
        .catch(() => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load users. Please try again.',
            confirmButtonColor: '#d33'
          });
        });
    }
  }, [dispatch, targetShopId, myShop]);

  // Filter users to show only technicians and shop managers
  const filteredShopUsers = shopUsers.filter(user => 
    user.role === 'technician' || user.role === 'shop_manager'
  );

  useEffect(() => {
    if (success && lastOperation) {
      if (lastOperation === 'create') {
        setSuccessMessage('User created successfully!');
        setTimeout(() => {
          setSuccessMessage('');
          setShowCreateForm(false);
          setLastOperation(null);
          resetForm();
        }, 2000);
      } else if (lastOperation === 'update') {
        setSuccessMessage('User updated successfully!');
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

  const handleFileChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      const picError = validateProfilePic(file);
      if (picError) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid File',
          text: picError,
          confirmButtonText: 'OK',
          confirmButtonColor: '#d33'
        });
        e.target.value = '';
        return;
      }

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
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

    if (!myShop) {
      setFormError('Shop information not available');
      return;
    }

    if (checkEmailExists(formData.email)) {
      setFormError('Email already exists. Please use a different email.');
      Swal.fire({
        icon: 'error',
        title: 'Email Already Exists',
        text: 'This email is already registered. Please use a different email address.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      return;
    }

    setLastOperation('create');
    setIsSubmitting(true);

    try {
      const randomPassword = generateRandomPassword();
      
      const userFormData = new FormData();
      userFormData.append('first_name', formData.first_name.trim());
      userFormData.append('last_name', formData.last_name.trim());
      userFormData.append('email', formData.email.trim());
      userFormData.append('role', formData.role);
      userFormData.append('shop_id', myShop.id);
      userFormData.append('brand_id', myShop.brand_id);
      if (myShop.district_id) userFormData.append('district_id', myShop.district_id);
      userFormData.append('is_active', formData.is_active);
      userFormData.append('ft_password', randomPassword);
      userFormData.append('password_type', 'ft_password');
      userFormData.append('is_first_login', 'true');
      
      if (profilePicFile) userFormData.append('profile_pic', profilePicFile);

      const userResult = await dispatch(createUser(userFormData)).unwrap();
      
      if (userResult.success) {
        Swal.fire({
          icon: 'success',
          title: `${formData.role === 'shop_manager' ? 'Shop Manager' : 'Technician'} Created Successfully!`,
          html: `
            <div style="text-align: left;">
              <p><strong>Name:</strong> ${formData.first_name} ${formData.last_name}</p>
              <p><strong>Email:</strong> ${formData.email}</p>
              <p><strong>Role:</strong> ${getRoleDisplay(formData.role)}</p>
              <br>
              <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 10px 0;">
                <p style="color: #0d47a1; margin: 0; font-weight: bold;">✓ Welcome email sent!</p>
                <p style="color: #0d47a1; margin: 5px 0 0 0; font-size: 14px;">
                  A temporary password has been sent to <strong>${formData.email}</strong>
                </p>
              </div>
              <p style="font-size: 14px; color: #666; margin-top: 15px;">
                The user will use this password for first-time login and will be prompted to create a new password.
              </p>
            </div>
          `,
          confirmButtonText: 'OK',
          confirmButtonColor: '#4CAF50',
          width: '550px'
        });
        
        dispatch(getUsersByShopId(myShop.id));
      }
      
    } catch (err) {
      setFormError(err?.error || `Failed to create ${formData.role === 'shop_manager' ? 'shop manager' : 'technician'}. Please try again.`);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.error || `Failed to create ${formData.role === 'shop_manager' ? 'shop manager' : 'technician'}. Please try again.`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      setLastOperation(null);
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
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

    setLastOperation('update');

    try {
      const userFormData = new FormData();
      let hasChanges = false;
      
      if (editFormData.first_name !== editFormData.original_first_name) {
        userFormData.append('first_name', editFormData.first_name.trim());
        hasChanges = true;
      }
      if (editFormData.last_name !== editFormData.original_last_name) {
        userFormData.append('last_name', editFormData.last_name.trim());
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
        
        dispatch(getUsersByShopId(myShop.id));
        
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'User updated successfully!',
          confirmButtonText: 'OK',
          confirmButtonColor: '#4CAF50',
          timer: 2000
        });
      } else {
        Swal.fire({
          icon: 'info',
          title: 'No Changes',
          text: 'No changes were made to the user profile.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#4CAF50',
          timer: 2000
        });
        setLastOperation(null);
        setShowEditModal(null);
        resetEditForm();
      }
      
    } catch (err) {
      setFormError(err?.error || 'Failed to update user. Please try again.');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.error || 'Failed to update user. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      setLastOperation(null);
    }
  };

  const handleView = (user) => {
    setViewUserData({
      ...user,
      profile_pic: getProfilePicUrl(user.profile_pic_url),
      role_label: getRoleDisplay(user.role),
    });
    setShowViewModal(user.id);
  };

  const resetForm = () => {
    setFormData({ first_name: '', last_name: '', email: '', role: 'technician', is_active: true });
    setValidationErrors({ first_name: '', last_name: '', email: '' });
    setProfilePicFile(null);
    setProfilePicPreview(null);
    setEmailExistsError('');
    setIsSubmitting(false);
  };

  const resetEditForm = () => {
    setEditFormData({ first_name: '', last_name: '', email: '', role: '', is_active: true,
      original_first_name: '', original_last_name: '', profile_pic: '' });
    setEditValidationErrors({ first_name: '', last_name: '' });
    setEditProfilePicFile(null);
    setEditProfilePicPreview(null);
    setShowEditModal(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));

    const validators = {
      email: validateEmailField,
      first_name: validateFirstName,
      last_name: validateLastName
    };

    if (name in validators) {
      const error = validators[name](value);
      setValidationErrors(prev => ({ ...prev, [name]: error }));
      if (name === 'email') checkEmailExists(value);
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setEditFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));

    const validators = {
      first_name: validateFirstName,
      last_name: validateLastName
    };

    if (name in validators) {
      const error = value ? validators[name](value) : '';
      setEditValidationErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleEdit = (user) => {
    setShowEditModal(user.id);
    setEditFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      original_first_name: user.first_name,
      original_last_name: user.last_name,
      profile_pic: getProfilePicUrl(user.profile_pic_url)
    });
    setEditValidationErrors({ first_name: '', last_name: '' });
    setEditProfilePicPreview(getProfilePicUrl(user.profile_pic_url));
    setEditProfilePicFile(null);
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await dispatch(toggleUserActiveStatus({
        userId,
        is_active: !currentStatus
      })).unwrap();
      
      dispatch(getUsersByShopId(myShop.id));
      
      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#4CAF50',
        timer: 2000
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update user status.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    }
  };

  const filteredUsers = filteredShopUsers?.filter(user => {
    let matches = true;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const email = user.email.toLowerCase();
      
      if (!fullName.includes(searchLower) && !email.includes(searchLower)) matches = false;
    }
    
    return matches;
  });

  const getUserCounts = () => {
    if (!filteredShopUsers) return { total: 0, active: 0, technicians: 0, shopManagers: 0 };
    return {
      total: filteredShopUsers.length,
      active: filteredShopUsers.filter(u => u.is_active).length,
      technicians: filteredShopUsers.filter(u => u.role === 'technician').length,
      shopManagers: filteredShopUsers.filter(u => u.role === 'shop_manager').length,
    };
  };

  const userCounts = getUserCounts();
  const hasValidationErrors = Object.values(validationErrors).some(error => error);
  const hasEditValidationErrors = Object.values(editValidationErrors).some(error => error);
  
  // Check if current user is shop manager
  const isShopManager = currentUser?.role === 'shop_manager';

  const roles = [
    { value: 'technician', label: 'Service Advisor' },
    { value: 'shop_manager', label: 'Shop Manager' },
  ];

  if (isInitialLoad || (loading && !isDataReady)) {
    return (
      <div className="transition-opacity duration-300 ease-in-out">
        <StatsSkeleton />
        <SearchSkeleton />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="transition-opacity duration-300 ease-in-out">
     <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            {userCounts.total} Total
          </span>
        </div>
        
        <div className="flex space-x-2 items-center">
         
            <button
              onClick={() => {
                if (showCreateForm) {
                  setShowCreateForm(false);
                  resetForm();
                } else {
                  setShowCreateForm(true);
                  setFormError('');
                  setEmailExistsError('');
                  setValidationErrors({ first_name: '', last_name: '', email: '' });
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
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
              {showCreateForm ? 'Cancel' : 'New Member'}
            </button>
          
        </div>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 transition-all duration-300 ease-in-out">
          <h2 className="text-xl font-bold text-blue-600 mb-4">Add New Team Member</h2>
          
          {(formError || successMessage) && (
            <div className={`mb-4 p-3 rounded-lg ${formError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {formError || successMessage}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Profile Picture</h3>
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> A random password will be auto-generated and sent to the user's email.
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
                    <p className="text-xs text-gray-500 mt-2">Max size: 5MB. Allowed: JPEG, PNG, GIF, WEBP</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Member Information</h3>
                  
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
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                          validationErrors.first_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="First name"
                        required
                      />
                      {validationErrors.first_name && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.first_name}</p>
                      )}
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
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                          validationErrors.last_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Last name"
                        required
                      />
                      {validationErrors.last_name && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.last_name}</p>
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
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                        validationErrors.email || emailExistsError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="member@example.com"
                      required
                    />
                    {(validationErrors.email || emailExistsError) && (
                      <p className="mt-1 text-sm text-red-600">
                        {validationErrors.email || emailExistsError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                      required
                    >
                      {roles.map((role) => (
                        <option key={role.value} value={role.value}>{role.label}</option>
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
                disabled={!!emailExistsError || hasValidationErrors || isSubmitting || lastOperation === 'create'}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  emailExistsError || hasValidationErrors || isSubmitting || lastOperation === 'create'
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSubmitting || lastOperation === 'create' 
                  ? 'Creating...' 
                  : hasValidationErrors 
                    ? 'Fix Validation Errors' 
                    : emailExistsError 
                      ? 'Email Already Exists' 
                      : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-4 mb-6 hover:shadow-lg transition-shadow duration-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Team Members</label>
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

      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
        {loading && !isDataReady ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading team members...</p>
          </div>
        ) : filteredUsers?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
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
                  const profilePic = getProfilePicUrl(user.profile_pic_url);
                  const isFirstLogin = user.is_first_login || (user.ft_password && !user.password);
                  const isCurrentUser = currentUser?.id === user.id;
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full overflow-hidden mr-3 border bg-gray-100">
                            <img 
                              src={profilePic}
                              alt={`${user.first_name} ${user.last_name}`}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = DEFAULT_PROFILE_PIC; }}
                            />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">You</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {isFirstLogin && user.role === 'technician' && (
                              <span className="inline-flex items-center mt-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>
                                First login pending
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'shop_manager' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {getRoleDisplay(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
                          month: 'short', day: 'numeric', year: 'numeric' 
                        }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {/* For shop manager users: View button for themselves, Edit button for technicians */}
                          {isShopManager ? (
                            <>
                              {isCurrentUser ? (
                                <button
                                  onClick={() => handleView(user)}
                                  className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium transition-colors duration-200"
                                  title="View your details"
                                >
                                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View
                                </button>
                              ) : user.role === 'technician' ? (
                                <>
                                  <button
                                    onClick={() => handleEdit(user)}
                                    className="px-3 py-1.5 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg text-sm font-medium transition-colors duration-200"
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
                                </>
                              ) : null}
                            </>
                          ) : (
                            // For non-shop manager users (brand admin etc): Show edit for everyone
                            <>
                              <button
                                onClick={() => handleEdit(user)}
                                className="px-3 py-1.5 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg text-sm font-medium transition-colors duration-200"
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
                            </>
                          )}
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Members Found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'Try adjusting your search' : 'Add your first team member to get started'}
            </p>
            {!showCreateForm && !isShopManager && (
              <button
                onClick={() => {
                  setShowCreateForm(true);
                  setFormError('');
                  setEmailExistsError('');
                  setValidationErrors({ first_name: '', last_name: '', email: '' });
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Member
              </button>
            )}
          </div>
        )}
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
            <div className="p-6">
              <h2 className="text-xl font-bold text-blue-600 mb-4">Edit Team Member</h2>
              
              {(formError || successMessage) && (
                <div className={`mb-4 p-3 rounded-lg ${formError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {formError || successMessage}
                </div>
              )}
              
              <form onSubmit={handleEditSubmit}>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Profile Picture</h3>
                    
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Password management is handled by users themselves.
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
                      <p className="text-xs text-gray-500 mt-2">Max size: 5MB. Allowed: JPEG, PNG, GIF, WEBP</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Member Information</h3>
                    
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
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                            editValidationErrors.first_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        {editValidationErrors.first_name && (
                          <p className="mt-1 text-sm text-red-600">{editValidationErrors.first_name}</p>
                        )}
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
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                            editValidationErrors.last_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        {editValidationErrors.last_name && (
                          <p className="mt-1 text-sm text-red-600">{editValidationErrors.last_name}</p>
                        )}
                      </div>
                    </div>

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
                      <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <input
                        type="text"
                        value={getRoleDisplay(editFormData.role)}
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
                    disabled={hasEditValidationErrors || lastOperation === 'update'}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      hasEditValidationErrors || lastOperation === 'update'
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {lastOperation === 'update' ? 'Updating...' : 
                     hasEditValidationErrors ? 'Fix Validation Errors' : 'Update Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showViewModal && viewUserData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-blue-600">Member Details</h2>
                <button
                  onClick={() => {
                    setShowViewModal(null);
                    setViewUserData(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100">
                    <img
                      src={viewUserData.profile_pic}
                      alt={`${viewUserData.first_name} ${viewUserData.last_name}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = DEFAULT_PROFILE_PIC; }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">First Name</label>
                      <p className="text-lg font-semibold text-gray-900">{viewUserData.first_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                      <p className="text-gray-900">{viewUserData.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
                      <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded">
                        {viewUserData.role_label}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Last Name</label>
                      <p className="text-lg font-semibold text-gray-900">{viewUserData.last_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Assigned Shop</label>
                      <p className="text-gray-900">{myShop?.shop_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Assigned District</label>
                      <p className="text-gray-900">{myShop?.district_name || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-500">Account Status</label>
                    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                      viewUserData.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {viewUserData.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                    <div><span className="font-medium">User ID:</span> {viewUserData.id}</div>
                    <div>
                      <span className="font-medium">Joined:</span>{" "}
                      {viewUserData.created_at ? new Date(viewUserData.created_at).toLocaleDateString() : "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t flex justify-end">
                <button
                  onClick={() => {
                    setShowViewModal(null);
                    setViewUserData(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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