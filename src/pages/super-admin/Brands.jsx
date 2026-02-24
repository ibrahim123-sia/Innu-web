import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectAllBrands, 
  selectBrandLoading, 
  selectBrandError,
  getAllBrands,
  createBrand,
  updateBrand
} from '../../redux/slice/brandSlice';
import { 
  createUser,
  updateUser,
  getAllUsers,
  selectAllUsers
} from '../../redux/slice/userSlice';
import BrandDetailModal from '../../components/super-admin/BrandDetailModal';

// Import SweetAlert for popup notifications
import Swal from 'sweetalert2';

// Default images
const DEFAULT_BRAND_LOGO = 'https://cdn-icons-png.flaticon.com/512/891/891419.png';
const DEFAULT_PROFILE_PIC = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

// Skeleton Loader Components
const TableRowSkeleton = () => (
  <tr className="hover:bg-gray-50">
    <td className="px-6 py-4">
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-lg bg-gray-200 animate-pulse mr-4"></div>
        <div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse mr-3"></div>
        <div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-32 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
    </td>
    <td className="px-6 py-4">
      <div className="flex space-x-2">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
        <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
        <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
      </div>
    </td>
  </tr>
);

const BrandsTableSkeleton = () => (
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

const Brands = () => {
  const dispatch = useDispatch();
  const brands = useSelector(selectAllBrands);
  const users = useSelector(selectAllUsers);
  const loading = useSelector(selectBrandLoading);
  const error = useSelector(selectBrandError);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBrandDetail, setShowBrandDetail] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [adminProfilePicFile, setAdminProfilePicFile] = useState(null);
  const [adminProfilePicPreview, setAdminProfilePicPreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    admin_email: '',
    admin_first_name: '',
    admin_last_name: '',
    is_active: true
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    is_active: true,
    admin_id: '',
    admin_email: '',
    admin_first_name: '',
    admin_last_name: '',
    admin_profile_pic: '',
    original_admin_first_name: '',
    original_admin_last_name: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [brandAdmins, setBrandAdmins] = useState({});
  const [emailExistsError, setEmailExistsError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({
    name: false,
    admin_email: false,
    admin_first_name: false,
    admin_last_name: false
  });

  useEffect(() => {
    dispatch(getAllBrands());
    dispatch(getAllUsers());
  }, [dispatch]);

  useEffect(() => {
    // Organize brand admins by brand_id
    const adminsMap = {};
    users.forEach(user => {
      if (user.role === 'brand_admin' && user.brand_id) {
        adminsMap[user.brand_id] = {
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
    setBrandAdmins(adminsMap);
  }, [users]);

  // Helper function to get brand logo with fallback
  const getBrandLogo = (brand) => {
    if (brand.logo_url && brand.logo_url.trim() !== '') {
      return brand.logo_url;
    }
    return DEFAULT_BRAND_LOGO;
  };

  // Helper function to get admin profile pic with fallback
  const getAdminProfilePic = (brandId) => {
    const admin = brandAdmins[brandId];
    if (!admin) return DEFAULT_PROFILE_PIC;
    
    if (admin.profile_pic_url && admin.profile_pic_url.trim() !== '') {
      return admin.profile_pic_url;
    }
    return DEFAULT_PROFILE_PIC;
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      
      if (e.target.name === 'logo') {
        setLogoFile(file);
        setLogoPreview(previewUrl);
      } else if (e.target.name === 'admin_profile_pic') {
        setAdminProfilePicFile(file);
        setAdminProfilePicPreview(previewUrl);
      }
    }
  };

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

  // Validate form fields
  const validateForm = () => {
    const errors = {
      name: !formData.name.trim(),
      admin_email: !formData.admin_email.trim(),
      admin_first_name: !formData.admin_first_name.trim(),
      admin_last_name: !formData.admin_last_name.trim()
    };
    
    setFormErrors(errors);
    
    // Check if any field is empty
    const hasErrors = Object.values(errors).some(error => error === true);
    
    if (hasErrors) {
      setFormError('Please fill in all required fields');
      Swal.fire({
        icon: 'error',
        title: 'Required Fields Missing',
        text: 'Please fill in all required fields (Brand Name, Admin Email, First Name, and Last Name)',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    // Validate all required fields
    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);

    // Check if email already exists before proceeding
    if (checkEmailExists(formData.admin_email)) {
      setFormError('Email already exists. Please use a different email for the brand admin.');
      Swal.fire({
        icon: 'error',
        title: 'Email Already Exists',
        text: 'This email is already registered. Please use a different email address for the brand admin.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Step 1: Create brand
      const brandFormData = new FormData();
      brandFormData.append('name', formData.name);
      brandFormData.append('is_active', formData.is_active);
      
      if (logoFile) {
        brandFormData.append('logo', logoFile);
      }

      const brandResult = await dispatch(createBrand(brandFormData)).unwrap();
      
      if (brandResult.success) {
        // Generate random password for first-time login
        const randomPassword = generateRandomPassword();
        
        // Step 2: Create brand admin user with ft_password
        const userFormData = new FormData();
        userFormData.append('email', formData.admin_email);
        userFormData.append('first_name', formData.admin_first_name);
        userFormData.append('last_name', formData.admin_last_name);
        
        userFormData.append('role', 'brand_admin');
        userFormData.append('brand_id', brandResult.data.id);
        userFormData.append('is_active', true);
        
        // Add ft_password and password_type
        userFormData.append('ft_password', randomPassword);
        userFormData.append('password_type', 'ft_password');
        userFormData.append('is_first_login', 'true');
        
        if (adminProfilePicFile) {
          userFormData.append('profile_pic', adminProfilePicFile);
        }

        const userResult = await dispatch(createUser(userFormData)).unwrap();
        
        if (userResult.success) {
          // Success popup WITHOUT displaying password
          Swal.fire({
            icon: 'success',
            title: 'Brand Created Successfully!',
            html: `
              <div style="text-align: left;">
                <p><strong>Brand:</strong> ${formData.name}</p>
                <p><strong>Brand Admin:</strong> ${formData.admin_first_name} ${formData.admin_last_name}</p>
                <p><strong>Admin Email:</strong> ${formData.admin_email}</p>
                <div style="background: #e3f2fd; padding: 12px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #2196F3;">
                  <p style="margin: 0; font-weight: bold;">📧 Welcome Email Sent</p>
                  <p style="margin: 5px 0 0 0; color: #555;">
                    An email with instructions to set up their password has been sent to ${formData.admin_email}
                  </p>
                </div>
              </div>
            `,
            confirmButtonText: 'OK',
            confirmButtonColor: '#4CAF50',
            width: '550px'
          });
          
          resetForm();
          dispatch(getAllBrands());
          dispatch(getAllUsers());
          setTimeout(() => {
            setShowCreateForm(false);
          }, 100);
        }
      }
    } catch (err) {
      console.error('Brand creation failed:', err);
      setFormError(err?.error || 'Failed to create brand. Please try again.');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.error || 'Failed to create brand. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validate edit form fields
  const validateEditForm = () => {
    if (!editFormData.name.trim()) {
      setFormError('Brand name is required');
      Swal.fire({
        icon: 'error',
        title: 'Required Field Missing',
        text: 'Brand name is required',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      return false;
    }
    return true;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    // Validate required fields
    if (!validateEditForm()) {
      return;
    }

    try {
      // Update brand
      const brandFormData = new FormData();
      brandFormData.append('name', editFormData.name);
      brandFormData.append('is_active', editFormData.is_active);
      
      if (logoFile) {
        brandFormData.append('logo', logoFile);
      } else if (editFormData.logo_url && editFormData.logo_url !== DEFAULT_BRAND_LOGO) {
        brandFormData.append('logo_url', editFormData.logo_url);
      }

      await dispatch(updateBrand({
        id: showEditModal,
        data: brandFormData
      })).unwrap();

      // Update brand admin if there are changes
      if (editFormData.admin_id) {
        const adminFormData = new FormData();
        let hasChanges = false;
        
        if (editFormData.admin_first_name !== editFormData.original_admin_first_name) {
          adminFormData.append('first_name', editFormData.admin_first_name);
          hasChanges = true;
        }
        if (editFormData.admin_last_name !== editFormData.original_admin_last_name) {
          adminFormData.append('last_name', editFormData.admin_last_name);
          hasChanges = true;
        }
        
        if (adminProfilePicFile) {
          adminFormData.append('profile_pic', adminProfilePicFile);
          hasChanges = true;
        }

        if (hasChanges) {
          await dispatch(updateUser({
            id: editFormData.admin_id,
            data: adminFormData
          })).unwrap();
          dispatch(getAllUsers());
        }
      }

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Brand and admin updated successfully!',
        confirmButtonText: 'OK',
        confirmButtonColor: '#4CAF50',
        timer: 2000
      });
      
      resetEditForm();
      dispatch(getAllBrands());
      setTimeout(() => {
        setShowEditModal(null);
      }, 100);
      
    } catch (err) {
      setFormError(err?.error || 'Failed to update brand. Please try again.');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.error || 'Failed to update brand. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      admin_email: '',
      admin_first_name: '',
      admin_last_name: '',
      is_active: true
    });
    setFormErrors({
      name: false,
      admin_email: false,
      admin_first_name: false,
      admin_last_name: false
    });
    setLogoFile(null);
    setLogoPreview(null);
    setAdminProfilePicFile(null);
    setAdminProfilePicPreview(null);
    setEmailExistsError('');
  };

  const resetEditForm = () => {
    setEditFormData({
      name: '',
      is_active: true,
      admin_id: '',
      admin_email: '',
      admin_first_name: '',
      admin_last_name: '',
      admin_profile_pic: '',
      original_admin_first_name: '',
      original_admin_last_name: ''
    });
    setLogoFile(null);
    setLogoPreview(null);
    setAdminProfilePicFile(null);
    setAdminProfilePicPreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'admin_email') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      // Clear error for this field
      setFormErrors(prev => ({ ...prev, [name]: false }));
      // Check email as user types
      checkEmailExists(value);
    } else if (name === 'name' || name === 'admin_first_name' || name === 'admin_last_name') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      // Clear error for this field
      setFormErrors(prev => ({ ...prev, [name]: false }));
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

  const handleViewDetails = (brandId) => {
    setShowBrandDetail(brandId);
  };

  const handleEdit = (brand) => {
    const brandAdmin = brandAdmins[brand.id] || {};
    const brandLogo = getBrandLogo(brand);
    const adminProfilePic = getAdminProfilePic(brand.id);
    
    setShowEditModal(brand.id);
    setEditFormData({
      name: brand.name,
      logo_url: brandLogo,
      is_active: brand.is_active,
      admin_id: brandAdmin.id || '',
      admin_email: brandAdmin.email || '',
      admin_first_name: brandAdmin.first_name || '',
      admin_last_name: brandAdmin.last_name || '',
      admin_profile_pic: adminProfilePic,
      original_admin_first_name: brandAdmin.first_name || '',
      original_admin_last_name: brandAdmin.last_name || ''
    });
    setLogoPreview(brandLogo);
    setLogoFile(null);
    setAdminProfilePicPreview(adminProfilePic);
    setAdminProfilePicFile(null);
  };

  const handleToggleStatus = async (brand) => {
    // Check if brand has an admin
    const admin = brandAdmins[brand.id];
    if (!admin) {
      Swal.fire({
        icon: 'warning',
        title: 'No Admin Assigned',
        text: 'This brand does not have an admin assigned. Please assign an admin first.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#FFA500'
      });
      return;
    }

    try {
      const brandFormData = new FormData();
      brandFormData.append('name', brand.name);
      brandFormData.append('is_active', !brand.is_active);
      
      if (brand.logo_url) {
        brandFormData.append('logo_url', brand.logo_url);
      }

      await dispatch(updateBrand({
        id: brand.id,
        data: brandFormData
      })).unwrap();

      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: `${brand.name} has been ${!brand.is_active ? 'activated' : 'deactivated'} successfully!`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#4CAF50',
        timer: 2000
      });

      dispatch(getAllBrands());
    } catch (err) {
      console.error('Failed to toggle brand status:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.error || 'Failed to update brand status. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    }
  };

  const handleResendWelcomeEmail = async (brandId, adminEmail) => {
    try {
      // This would need a new API endpoint to resend welcome email
      Swal.fire({
        icon: 'info',
        title: 'Coming Soon',
        text: 'Resend welcome email feature will be available soon.',
        confirmButtonText: 'OK'
      });
    } catch (err) {
      console.error('Failed to resend email:', err);
    }
  };

  const getAdminForBrand = (brandId) => {
    return brandAdmins[brandId] || null;
  };

  // Validate that brand has admin before allowing activation
  const canActivateBrand = (brand) => {
    if (brand.is_active) return true; // Already active
    const admin = brandAdmins[brand.id];
    return !!admin; // Can only activate if admin exists
  };

  return (
    <div className="transition-opacity duration-300 ease-in-out">
      {/* Create Brand Button */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-800">All Companies</h2>
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
            {brands?.length || 0} Companies
          </span>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setFormError('');
            setEmailExistsError('');
            setFormErrors({
              name: false,
              admin_email: false,
              admin_first_name: false,
              admin_last_name: false
            });
          }}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {showCreateForm ? 'Cancel' : 'New Company'}
        </button>
      </div>

      {/* Create Brand Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-blue-600 mb-4">Create New Company</h2>
          
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
          
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Brand Logo & Admin Profile Picture */}
              <div className="space-y-8">
                {/* Brand Logo Upload */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Company Logo</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {logoPreview ? (
                      <div className="space-y-2">
                        <img 
                          src={logoPreview} 
                          alt="Company logo preview" 
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
                          src={DEFAULT_BRAND_LOGO}
                          alt="Default Company logo" 
                          className="max-h-48 mx-auto rounded-lg object-contain opacity-50"
                        />
                        <p className="text-sm text-gray-500">Optional - Default logo will be used if not uploaded</p>
                      </div>
                    )}
                    <label className="block mt-4">
                      <span className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer inline-block">
                        Choose Logo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        name="logo"
                      />
                    </label>
                  </div>
                </div>

                {/* Admin Profile Picture Upload */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Admin Profile Picture</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {adminProfilePicPreview ? (
                      <div className="space-y-2">
                        <img 
                          src={adminProfilePicPreview} 
                          alt="Admin profile preview" 
                          className="w-32 h-32 rounded-full mx-auto object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setAdminProfilePicFile(null);
                            setAdminProfilePicPreview(null);
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
                        <p className="text-sm text-gray-500">Optional - Default profile picture will be used if not uploaded</p>
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
                        name="admin_profile_pic"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: Brand & Admin Info - ALL FIELDS REQUIRED */}
              <div className="space-y-6">
                {/* Brand Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Companies Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter brand name"
                      required
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-xs text-red-600">Company name is required</p>
                    )}
                  </div>
                </div>

                {/* Admin Info - ALL FIELDS REQUIRED */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Company Admin Account <span className="text-red-500">*</span></h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="admin_email"
                      value={formData.admin_email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.admin_email || emailExistsError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="admin@example.com"
                      required
                    />
                    {formErrors.admin_email && (
                      <p className="mt-1 text-xs text-red-600">Admin email is required</p>
                    )}
                    {emailExistsError && (
                      <p className="mt-1 text-xs text-red-600">{emailExistsError}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="admin_first_name"
                        value={formData.admin_first_name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.admin_first_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="First name"
                        required
                      />
                      {formErrors.admin_first_name && (
                        <p className="mt-1 text-xs text-red-600">First name is required</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="admin_last_name"
                        value={formData.admin_last_name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.admin_last_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Last name"
                        required
                      />
                      {formErrors.admin_last_name && (
                        <p className="mt-1 text-xs text-red-600">Last name is required</p>
                      )}
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
                {isSubmitting ? 'Creating...' : emailExistsError ? 'Email Already Exists' : 'Create Company & Admin Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Brands Table with Skeleton Loader */}
      {loading ? (
        <BrandsTableSkeleton />
      ) : error ? (
        <div className="bg-white rounded-lg shadow-md py-12 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : brands && brands.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {brands.map((brand) => {
                  const admin = getAdminForBrand(brand.id);
                  const brandLogo = getBrandLogo(brand);
                  const adminProfilePic = getAdminProfilePic(brand.id);
                  const canActivate = canActivateBrand(brand);
                  
                  return (
                    <tr key={brand.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center mr-4 border bg-gray-100">
                            <img 
                              src={brandLogo}
                              alt={brand.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = DEFAULT_BRAND_LOGO;
                              }}
                            />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{brand.name}</div>
                            {!admin && (
                              <span className="text-xs text-red-600">⚠️ No admin assigned</span>
                            )}
                            {admin?.is_first_login && (
                              <span className="text-xs text-orange-800">First login pending</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {admin ? (
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full overflow-hidden mr-3 border bg-gray-100">
                              <img 
                                src={adminProfilePic}
                                alt={`${admin.first_name} ${admin.last_name}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = DEFAULT_PROFILE_PIC;
                                }}
                              />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {admin.first_name} {admin.last_name}
                              </div>
                              <div className="text-sm text-gray-500">{admin.email}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full overflow-hidden mr-3 border bg-gray-100 flex items-center justify-center">
                              <img 
                                src={DEFAULT_PROFILE_PIC}
                                alt="No admin"
                                className="w-8 h-8 opacity-50"
                              />
                            </div>
                            <div className="text-sm text-gray-500 italic">No admin assigned</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          brand.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {brand.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(brand.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetails(brand.id)}
                            className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(brand)}
                            className="px-3 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded text-sm transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(brand)}
                            disabled={!brand.is_active && !admin}
                            className={`px-3 py-1 rounded text-sm transition-colors ${
                              !brand.is_active && !admin
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : brand.is_active 
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            title={!brand.is_active && !admin ? 'Cannot activate: No admin assigned' : ''}
                          >
                            {brand.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md py-12 text-center">
          <img 
            src={DEFAULT_BRAND_LOGO}
            alt="No brands" 
            className="w-16 h-16 mx-auto mb-4 opacity-50"
          />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Companies Found</h3>
          <p className="text-gray-500 mb-4">Create your first company to get started</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Create First Company
          </button>
        </div>
      )}

      {/* Brand Detail Modal */}
      {showBrandDetail && (
        <BrandDetailModal
          brandId={showBrandDetail}
          onClose={() => setShowBrandDetail(null)}
        />
      )}

      {/* Edit Brand Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-blue-600 mb-4">Edit Company</h2>
              
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
                  {/* Left Column: Brand Logo & Admin Profile Picture */}
                  <div className="space-y-8">
                    {/* Brand Logo */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-700">Company Logo</h3>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        {logoPreview ? (
                          <div className="space-y-2">
                            <img 
                              src={logoPreview} 
                              alt="Company logo preview" 
                              className="max-h-48 mx-auto rounded-lg object-contain"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setLogoFile(null);
                                setLogoPreview(editFormData.logo_url);
                              }}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <img 
                              src={editFormData.logo_url || DEFAULT_BRAND_LOGO}
                              alt="Brand logo" 
                              className="max-h-48 mx-auto rounded-lg object-contain"
                            />
                            <p className="text-sm text-gray-500">Current company logo</p>
                          </div>
                        )}
                        <label className="block mt-4">
                          <span className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer inline-block">
                            Change Logo
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            name="logo"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Admin Profile Picture */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-700">Admin Profile Picture</h3>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        {adminProfilePicPreview ? (
                          <div className="space-y-2">
                            <img 
                              src={adminProfilePicPreview} 
                              alt="Admin profile preview" 
                              className="w-32 h-32 rounded-full mx-auto object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setAdminProfilePicFile(null);
                                setAdminProfilePicPreview(editFormData.admin_profile_pic);
                              }}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <img 
                              src={editFormData.admin_profile_pic || DEFAULT_PROFILE_PIC}
                              alt="Admin profile" 
                              className="w-32 h-32 rounded-full mx-auto object-cover"
                            />
                            <p className="text-sm text-gray-500">Current admin profile picture</p>
                          </div>
                        )}
                        <label className="block mt-4">
                          <span className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer inline-block">
                            Change Photo
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            name="admin_profile_pic"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Brand & Admin Info */}
                  <div className="space-y-6">
                    {/* Brand Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-700">Company Information</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={editFormData.name}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter brand name"
                          required
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

                    {/* Brand Admin Information */}
                    {editFormData.admin_id && (
                      <div className="space-y-4 border-t pt-6">
                        <h3 className="font-semibold text-gray-700">Company Admin</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              First Name
                            </label>
                            <input
                              type="text"
                              name="admin_first_name"
                              value={editFormData.admin_first_name}
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
                              name="admin_last_name"
                              value={editFormData.admin_last_name}
                              onChange={handleEditInputChange}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Last name"
                            />
                          </div>
                        </div>

                       

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Admin Email (Read-only)
                          </label>
                          <input
                            type="email"
                            value={editFormData.admin_email}
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
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Update Company
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

export default Brands;