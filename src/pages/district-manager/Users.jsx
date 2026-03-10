import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
  getDistrictUsers,
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

import Swal from 'sweetalert2';

const DEFAULT_PROFILE_PIC = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

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
  const { districtId } = useParams();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  
  const currentUser = useSelector(state => state.user.currentUser);
  const brandId = currentUser?.brand_id;
  const userDistrictId = currentUser?.district_id;
  
  const users = useSelector(state => state.user.users) || [];
  const loading = useSelector(state => state.user.loading);
  const error = useSelector(state => state.user.error);
  
  const shops = useSelector(selectShopsForBrand(brandId)) || [];
  const districts = useSelector(selectDistrictsByBrand) || [];
  
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [showViewModal, setShowViewModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [editProfilePicFile, setEditProfilePicFile] = useState(null);
  const [editProfilePicPreview, setEditProfilePicPreview] = useState(null);
  
  const [viewData, setViewData] = useState({});
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'shop_manager',
    shop_id: '',
    is_active: true
  });
  
  const [editFormData, setEditFormData] = useState({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [emailExistsError, setEmailExistsError] = useState('');

  const [formErrors, setFormErrors] = useState({
    first_name: false, last_name: false, email: false, role: false
  });

  const [validationErrors, setValidationErrors] = useState({
    first_name: '', last_name: '', email: '', role: ''
  });

  const [editFormErrors, setEditFormErrors] = useState({
    first_name: false, last_name: false, role: false
  });

  const [editValidationErrors, setEditValidationErrors] = useState({
    first_name: '', last_name: '', role: ''
  });

  const roles = [
    { value: 'shop_manager', label: 'Shop Manager' },
    { value: 'technician', label: 'Service Advisor' }
  ];

  const getCurrentDistrictInfo = () => {
    if (districtId) {
      const selectedDistrict = localStorage.getItem('selectedDistrict');
      if (selectedDistrict) return JSON.parse(selectedDistrict);
      return districts.find(d => d.id === parseInt(districtId));
    } else if (userId) {
      return districts.find(d => d.id === userDistrictId);
    }
    return null;
  };

  const currentDistrict = getCurrentDistrictInfo();

  const filteredUsers = React.useMemo(() => {
    if (!users?.length) return [];
    
    let filtered = users.filter(user => user.role !== 'brand_admin');
    
    if (currentDistrict?.id) {
      filtered = filtered.filter(user => user.district_id === currentDistrict.id);
    } else if (userDistrictId) {
      filtered = filtered.filter(user => user.district_id === userDistrictId);
    }
    
    return filtered;
  }, [users, currentDistrict, userDistrictId]);

  const validateFirstName = (firstName) => {
    if (!firstName?.trim()) return 'First name is required';
    if (firstName.trim().length < 2) return 'First name must be at least 2 characters long';
    if (firstName.trim().length > 50) return 'First name must not exceed 50 characters';
    if (!/^[a-zA-Z\s\-']+$/.test(firstName)) return 'First name can only contain letters, spaces, hyphens, and apostrophes';
    return '';
  };

  const validateLastName = (lastName) => {
    if (!lastName?.trim()) return 'Last name is required';
    if (lastName.trim().length < 2) return 'Last name must be at least 2 characters long';
    if (lastName.trim().length > 50) return 'Last name must not exceed 50 characters';
    if (!/^[a-zA-Z\s\-']+$/.test(lastName)) return 'Last name can only contain letters, spaces, hyphens, and apostrophes';
    return '';
  };

  const validateEmail = (email) => {
    if (!email?.trim()) return 'Email is required';
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address (e.g., name@example.com)';
    if (email.length > 254) return 'Email address is too long';
    if (email.includes('..')) return 'Email cannot contain consecutive dots';
    if (email.startsWith('.') || email.endsWith('.')) return 'Email cannot start or end with a dot';
    return '';
  };

  const validateRole = (role) => {
    if (!role) return 'Role is required';
    if (!['shop_manager', 'technician'].includes(role)) return 'Please select a valid role';
    return '';
  };

  const validateFileType = (file) => {
    if (!file) return '';
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) return 'Please upload a valid image file (JPEG, PNG, GIF, or WEBP)';
    if (file.size > 5 * 1024 * 1024) return 'File size must not exceed 5MB';
    return '';
  };

  useEffect(() => {
    if (currentUser?.brand_id) {
      fetchData();
    }
  }, [dispatch, currentUser?.brand_id, districtId, userId]);

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
      let targetDistrictId = districtId || userId ? currentUser?.district_id : currentUser?.district_id;
      
      if (targetDistrictId) {
        await dispatch(getDistrictUsers(targetDistrictId)).unwrap();
      }
      
      await Promise.all([
        dispatch(getShopsByBrand(currentUser.brand_id)),
        dispatch(getDistrictsByBrand(currentUser.brand_id))
      ]);
    } catch {
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

  const checkEmailExists = (email, excludeUserId = null) => {
    if (!email) return false;
    const exists = filteredUsers.some(u => 
      u.email?.toLowerCase() === email.toLowerCase() && u.id !== excludeUserId
    );
    setEmailExistsError(exists ? 'A user with this email already exists in this district. Please use a different email.' : '');
    return exists;
  };

  const getProfilePicUrl = (profilePicData) => {
    if (!profilePicData) return DEFAULT_PROFILE_PIC;
    
    if (typeof profilePicData === 'string') {
      if (profilePicData.startsWith('{')) {
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
    const allRoles = [
      { value: 'district_manager', label: 'District Manager' },
      { value: 'shop_manager', label: 'Shop Manager' },
      { value: 'technician', label: 'Service Advisor' },
      { value: 'user', label: 'User' }
    ];
    const role = allRoles.find(r => r.value === roleValue);
    return role ? role.label : roleValue;
  };

  const validateCreateForm = () => {
    const firstNameError = validateFirstName(formData.first_name);
    const lastNameError = validateLastName(formData.last_name);
    const emailError = validateEmail(formData.email);
    const roleError = validateRole(formData.role);

    setValidationErrors({
      first_name: firstNameError,
      last_name: lastNameError,
      email: emailError,
      role: roleError
    });

    setFormErrors({
      first_name: !!firstNameError,
      last_name: !!lastNameError,
      email: !!emailError,
      role: !!roleError
    });

    const hasErrors = firstNameError || lastNameError || emailError || roleError;

    if (hasErrors) {
      const errorMessages = [firstNameError, lastNameError, emailError, roleError].filter(Boolean);
      
      Swal.fire({
        icon: 'error',
        title: 'Validation Errors',
        html: `<ul style="text-align: left;">${errorMessages.map(msg => `<li>• ${msg}</li>`).join('')}</ul>`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      return false;
    }

    if (checkEmailExists(formData.email)) {
      setFormError('Email already exists. Please use a different email.');
      Swal.fire({
        icon: 'error',
        title: 'Email Already Exists',
        text: 'This email is already registered in this district. Please use a different email address.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      return false;
    }

    return true;
  };

  const validateEditForm = () => {
    let firstNameError = '';
    let lastNameError = '';
    let roleError = '';

    if (editFormData.first_name !== editFormData.original_first_name) {
      firstNameError = validateFirstName(editFormData.first_name);
    }
    
    if (editFormData.last_name !== editFormData.original_last_name) {
      lastNameError = validateLastName(editFormData.last_name);
    }
    
    if (editFormData.role !== editFormData.original_role) {
      roleError = validateRole(editFormData.role);
    }

    setEditValidationErrors({
      first_name: firstNameError,
      last_name: lastNameError,
      role: roleError
    });

    setEditFormErrors({
      first_name: !!firstNameError,
      last_name: !!lastNameError,
      role: !!roleError
    });

    const hasErrors = firstNameError || lastNameError || roleError;

    if (hasErrors) {
      const errorMessages = [firstNameError, lastNameError, roleError].filter(Boolean);
      
      Swal.fire({
        icon: 'error',
        title: 'Validation Errors',
        html: `<ul style="text-align: left;">${errorMessages.map(msg => `<li>• ${msg}</li>`).join('')}</ul>`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      return false;
    }

    return true;
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
        setEditProfilePicFile(file);
        setEditProfilePicPreview(previewUrl);
      } else {
        setProfilePicFile(file);
        setProfilePicPreview(previewUrl);
      }
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    if (!validateCreateForm()) return;

    setIsSubmitting(true);

    try {
      const randomPassword = generateRandomPassword();
      
      const userFormData = new FormData();
      userFormData.append('email', formData.email.trim().toLowerCase());
      userFormData.append('first_name', formData.first_name.trim());
      userFormData.append('last_name', formData.last_name.trim());
      userFormData.append('contact_no', '');
      userFormData.append('role', formData.role);
      userFormData.append('brand_id', currentUser.brand_id);
      
      if (formData.shop_id) {
        userFormData.append('shop_id', formData.shop_id);
      }
      
      const targetDistrictId = districtId || userDistrictId;
      if (targetDistrictId) userFormData.append('district_id', targetDistrictId);
      
      userFormData.append('is_active', formData.is_active);
      userFormData.append('ft_password', randomPassword);
      userFormData.append('password_type', 'ft_password');
      userFormData.append('is_first_login', 'true');
      
      if (profilePicFile) userFormData.append('profile_pic', profilePicFile);

      const result = await dispatch(createUser(userFormData)).unwrap();
      
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'User Created Successfully!',
          html: `
            <div style="text-align: left;">
              <p><strong>Name:</strong> ${formData.first_name.trim()} ${formData.last_name.trim()}</p>
              <p><strong>Email:</strong> ${formData.email.trim().toLowerCase()}</p>
              <p><strong>Role:</strong> ${getRoleLabel(formData.role)}</p>
              <p><strong>Shop:</strong> ${formData.shop_id ? getShopName(formData.shop_id) : 'None'}</p>
              <p><strong>District:</strong> ${currentDistrict?.name || 'Your District'} (auto-assigned)</p>
              <br>
              <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 10px 0;">
                <p style="color: #0d47a1; margin: 0; font-weight: bold;">✓ Welcome email sent!</p>
                <p style="color: #0d47a1; margin: 5px 0 0 0; font-size: 14px;">
                  A temporary password has been sent to <strong>${formData.email.trim().toLowerCase()}</strong>
                </p>
              </div>
            </div>
          `,
          confirmButtonText: 'OK',
          confirmButtonColor: '#4CAF50',
          width: '550px'
        });

        resetForm();
        
        const targetDistrictId = districtId || userDistrictId;
        if (targetDistrictId) await dispatch(getDistrictUsers(targetDistrictId)).unwrap();
        
        setTimeout(() => setShowCreateForm(false), 100);
      }
    } catch (err) {
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

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!validateEditForm()) return;

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
      
      if (editFormData.role !== editFormData.original_role) {
        userFormData.append('role', editFormData.role);
        hasChanges = true;
      }
      
      if (editFormData.shop_id !== editFormData.original_shop_id) {
        userFormData.append('shop_id', editFormData.shop_id || '');
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
        await dispatch(updateUser({ id: showEditModal, data: userFormData })).unwrap();

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'User updated successfully!',
          confirmButtonText: 'OK',
          confirmButtonColor: '#4CAF50',
          timer: 2000
        });
        
        resetEditForm();
        
        const targetDistrictId = districtId || userDistrictId;
        if (targetDistrictId) await dispatch(getDistrictUsers(targetDistrictId)).unwrap();
        
        setTimeout(() => setShowEditModal(null), 100);
      } else {
        setShowEditModal(null);
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
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const userFormData = new FormData();
      userFormData.append('is_active', !user.is_active);

      await dispatch(updateUser({ id: user.id, data: userFormData })).unwrap();

      const targetDistrictId = districtId || userDistrictId;
      if (targetDistrictId) await dispatch(getDistrictUsers(targetDistrictId)).unwrap();
      
      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: `${user.first_name} ${user.last_name} has been ${!user.is_active ? 'activated' : 'deactivated'} successfully.`,
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

  const resetForm = () => {
    setFormData({
      first_name: '', last_name: '', email: '', role: 'shop_manager', shop_id: '', is_active: true
    });
    setFormErrors({ first_name: false, last_name: false, email: false, role: false });
    setValidationErrors({ first_name: '', last_name: '', email: '', role: '' });
    setProfilePicFile(null);
    setProfilePicPreview(null);
    setEmailExistsError('');
  };

  const resetEditForm = () => {
    setEditFormData({});
    setEditFormErrors({ first_name: false, last_name: false, role: false });
    setEditValidationErrors({ first_name: '', last_name: '', role: '' });
    setEditProfilePicFile(null);
    setEditProfilePicPreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));

    const validators = {
      first_name: validateFirstName,
      last_name: validateLastName,
      email: validateEmail,
      role: validateRole
    };

    if (name in validators) {
      const error = validators[name](value);
      setValidationErrors(prev => ({ ...prev, [name]: error }));
      setFormErrors(prev => ({ ...prev, [name]: !!error }));
      
      if (name === 'email' && !error && value.trim()) {
        checkEmailExists(value);
      } else if (name === 'email') {
        setEmailExistsError('');
      }
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setEditFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));

    if (name === 'first_name' && value !== editFormData.original_first_name) {
      const error = validateFirstName(value);
      setEditValidationErrors(prev => ({ ...prev, [name]: error }));
      setEditFormErrors(prev => ({ ...prev, [name]: !!error }));
    } else if (name === 'last_name' && value !== editFormData.original_last_name) {
      const error = validateLastName(value);
      setEditValidationErrors(prev => ({ ...prev, [name]: error }));
      setEditFormErrors(prev => ({ ...prev, [name]: !!error }));
    } else if (name === 'role' && value !== editFormData.original_role) {
      const error = validateRole(value);
      setEditValidationErrors(prev => ({ ...prev, [name]: error }));
      setEditFormErrors(prev => ({ ...prev, [name]: !!error }));
    } else if (['first_name', 'last_name', 'role'].includes(name)) {
      setEditValidationErrors(prev => ({ ...prev, [name]: '' }));
      setEditFormErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleEdit = (user) => {
    setShowEditModal(user.id);
    setEditFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      role: user.role || 'shop_manager',
      shop_id: user.shop_id || '',
      is_active: user.is_active,
      profile_pic: getProfilePicUrl(user.profile_pic_url),
      original_first_name: user.first_name || '',
      original_last_name: user.last_name || '',
      original_role: user.role || 'shop_manager',
      original_shop_id: user.shop_id || '',
      original_is_active: user.is_active
    });
    setEditFormErrors({ first_name: false, last_name: false, role: false });
    setEditValidationErrors({ first_name: '', last_name: '', role: '' });
    setEditProfilePicPreview(getProfilePicUrl(user.profile_pic_url));
    setEditProfilePicFile(null);
    setFormError('');
  };

  const getAvailableShops = () => shops.filter(shop => shop.is_active);

  const hasEditChanges = () => (
    editFormData.first_name !== editFormData.original_first_name ||
    editFormData.last_name !== editFormData.original_last_name ||
    editFormData.role !== editFormData.original_role ||
    editFormData.shop_id !== editFormData.original_shop_id ||
    editFormData.is_active !== editFormData.original_is_active ||
    editProfilePicFile !== null
  );

  if (isInitialLoad || ((localLoading || loading) && !isDataReady)) {
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

  return (
    <div className="transition-opacity duration-300 ease-in-out">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {currentDistrict ? `${currentDistrict.name} District Users` : 'District Users'}
            </h2>
            {currentDistrict && (
              <p className="text-sm text-gray-500">
                {currentDistrict.city}{currentDistrict.state ? `, ${currentDistrict.state}` : ''}
              </p>
            )}
          </div>
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
            {filteredUsers?.length || 0} Users
          </span>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setFormError('');
            setEmailExistsError('');
            resetForm();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {showCreateForm ? 'Cancel' : 'New User'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 animate-fadeIn">
          <h2 className="text-xl font-bold text-blue-600 mb-4">
            Create New User in {currentDistrict?.name || 'Your District'}
          </h2>
          
          {(formError || formSuccess) && (
            <div className={`mb-4 p-3 rounded-lg ${formError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {formError || formSuccess}
            </div>
          )}
          
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                      <p className="text-sm text-gray-500">Optional - JPEG, PNG, GIF, WEBP (Max 5MB)</p>
                    </div>
                  )}
                  <label className="block mt-4">
                    <span className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer inline-block">
                      Choose Photo
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={(e) => handleFileChange(e, false)}
                      className="hidden"
                      name="profile_pic"
                    />
                  </label>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
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
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.first_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="First name"
                        maxLength={50}
                        required
                      />
                      {formErrors.first_name && (
                        <p className="mt-1 text-xs text-red-600">{validationErrors.first_name}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {formData.first_name.length}/50 characters
                      </p>
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
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.last_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Last name"
                        maxLength={50}
                        required
                      />
                      {formErrors.last_name && (
                        <p className="mt-1 text-xs text-red-600">{validationErrors.last_name}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {formData.last_name.length}/50 characters
                      </p>
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
                        formErrors.email || emailExistsError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="user@example.com"
                      maxLength={254}
                      required
                    />
                    {(formErrors.email || emailExistsError) && (
                      <p className="mt-1 text-xs text-red-600">
                        {validationErrors.email || emailExistsError}
                      </p>
                    )}
                  </div>
                </div>

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
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.role ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                    {formErrors.role && (
                      <p className="mt-1 text-xs text-red-600">{validationErrors.role}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Shop</label>
                    <select
                      name="shop_id"
                      value={formData.shop_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None (No shop assigned)</option>
                      {getAvailableShops().map(shop => (
                        <option key={shop.id} value={shop.id}>{shop.name}</option>
                      ))}
                    </select>
                  </div>

                  {currentDistrict && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">District:</span> {currentDistrict.name} (auto-assigned)
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
                disabled={!!emailExistsError || isSubmitting || Object.values(formErrors).some(Boolean)}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  emailExistsError || isSubmitting || Object.values(formErrors).some(Boolean)
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

      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
        {error ? (
          <div className="py-12 text-center">
            <p className="text-red-600 mb-4">{typeof error === 'string' ? error : 'Failed to load users'}</p>
            <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Retry
            </button>
          </div>
        ) : filteredUsers?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Shop</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned District</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                            onError={(e) => { e.target.src = DEFAULT_PROFILE_PIC; }}
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
                        userItem.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {userItem.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {userItem.role === 'district_manager' ? (
                          <button
                            onClick={() => handleViewUser(userItem)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm transition-colors"
                          >
                            View
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEdit(userItem)}
                            className="px-3 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded text-sm transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleToggleStatus(userItem)}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Users Found in {currentDistrict?.name || 'This District'}
            </h3>
            <p className="text-gray-500 mb-4">Create your first user for this district</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create First User
            </button>
          </div>
        )}
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-blue-600 mb-4">Edit User</h2>
              
              {(formError || formSuccess) && (
                <div className={`mb-4 p-3 rounded-lg ${formError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {formError || formSuccess}
                </div>
              )}
              
              <form onSubmit={handleEditSubmit} noValidate>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={(e) => handleFileChange(e, true)}
                          className="hidden"
                          name="profile_pic"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-700">Basic Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                          <input
                            type="text"
                            name="first_name"
                            value={editFormData.first_name || ''}
                            onChange={handleEditInputChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              editFormErrors.first_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="First name"
                            maxLength={50}
                          />
                          {editFormErrors.first_name && (
                            <p className="mt-1 text-xs text-red-600">{editValidationErrors.first_name}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                          <input
                            type="text"
                            name="last_name"
                            value={editFormData.last_name || ''}
                            onChange={handleEditInputChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              editFormErrors.last_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="Last name"
                            maxLength={50}
                          />
                          {editFormErrors.last_name && (
                            <p className="mt-1 text-xs text-red-600">{editValidationErrors.last_name}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={editFormData.email || ''}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="space-y-4 border-t pt-6">
                      <h3 className="font-semibold text-gray-700">Role & Assignments</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                          name="role"
                          value={editFormData.role || 'shop_manager'}
                          onChange={handleEditInputChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            editFormErrors.role ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        >
                          {roles.map(role => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                          ))}
                        </select>
                        {editFormErrors.role && (
                          <p className="mt-1 text-xs text-red-600">{editValidationErrors.role}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assign Shop</label>
                        <select
                          name="shop_id"
                          value={editFormData.shop_id || ''}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">None (No shop assigned)</option>
                          {getAvailableShops().map(shop => (
                            <option key={shop.id} value={shop.id}>{shop.name}</option>
                          ))}
                        </select>
                      </div>

                      {currentDistrict && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">District:</span> {currentDistrict.name} (cannot be changed)
                          </p>
                        </div>
                      )}

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
                    disabled={Object.values(editFormErrors).some(Boolean) || !hasEditChanges()}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      Object.values(editFormErrors).some(Boolean) || !hasEditChanges()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    Update User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
                <div className="flex justify-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100">
                    <img 
                      src={viewData.profile_pic || DEFAULT_PROFILE_PIC}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

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