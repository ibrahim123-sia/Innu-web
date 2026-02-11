import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectAllBrands, 
  selectBrandLoading, 
  selectBrandError,
  getAllBrands,
  createBrand,
  updateBrand  // Changed from toggleBrandStatus to updateBrand
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
const DEFAULT_BRAND_LOGO = 'https://cdn-icons-png.flaticon.com/512/891/891419.png'; // Building icon
const DEFAULT_PROFILE_PIC = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; // User icon

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
    admin_contact: '',
    is_active: true
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    is_active: true,
    admin_id: '',
    admin_email: '',
    admin_first_name: '',
    admin_last_name: '',
    admin_contact: '',
    admin_profile_pic: '',
    original_admin_first_name: '',
    original_admin_last_name: '',
    original_admin_contact: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [brandAdmins, setBrandAdmins] = useState({});

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
          is_active: user.is_active
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      // Create brand
      const brandFormData = new FormData();
      brandFormData.append('name', formData.name);
      brandFormData.append('is_active', formData.is_active);
      
      if (logoFile) {
        brandFormData.append('logo', logoFile);
      }

      const brandResult = await dispatch(createBrand(brandFormData)).unwrap();
      
      if (brandResult.success) {
        // Create brand admin user WITHOUT password field
        const userFormData = new FormData();
        userFormData.append('email', formData.admin_email);
        userFormData.append('first_name', formData.admin_first_name);
        userFormData.append('last_name', formData.admin_last_name);
        
        // Format phone number before saving
        const formattedPhone = formatPhoneNumber(formData.admin_contact);
        userFormData.append('contact_no', formattedPhone || '');
        
        userFormData.append('role', 'brand_admin');
        userFormData.append('brand_id', brandResult.data.id);
        userFormData.append('is_active', true);
        
        if (adminProfilePicFile) {
          userFormData.append('profile_pic', adminProfilePicFile);
        }

        const userResult = await dispatch(createUser(userFormData)).unwrap();
        
        if (userResult.success) {
          // Show success popup with SweetAlert
          Swal.fire({
            icon: 'success',
            title: 'Brand Created Successfully!',
            html: `
              <div style="text-align: left;">
                <p><strong>Brand:</strong> ${formData.name}</p>
                <p><strong>Brand Admin:</strong> ${formData.admin_first_name} ${formData.admin_last_name}</p>
                <p><strong>Admin Email:</strong> ${formData.admin_email}</p>
                <p><strong>Contact:</strong> ${formData.admin_contact || 'Not provided'}</p>
                <br>
                <p style="color: #4CAF50; font-weight: bold;">
                  A random password has been sent to ${formData.admin_email}
                </p>
                <p style="font-size: 14px; color: #666;">
                  The admin can use this password for first-time login and will be prompted to create a new password.
                </p>
              </div>
            `,
            confirmButtonText: 'OK',
            confirmButtonColor: '#4CAF50',
            width: '500px'
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
      setFormError(err?.error || 'Failed to create brand. Please try again.');
      // Show error popup
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.error || 'Failed to create brand. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

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

      // Update brand admin user (NO PASSWORD HANDLING)
      if (editFormData.admin_id) {
        const adminFormData = new FormData();
        
        // Update name if changed
        if (editFormData.admin_first_name !== editFormData.original_admin_first_name) {
          adminFormData.append('first_name', editFormData.admin_first_name);
        }
        if (editFormData.admin_last_name !== editFormData.original_admin_last_name) {
          adminFormData.append('last_name', editFormData.admin_last_name);
        }
        
        // Format phone number before updating
        if (editFormData.admin_contact !== editFormData.original_admin_contact) {
          const formattedPhone = formatPhoneNumber(editFormData.admin_contact);
          adminFormData.append('contact_no', formattedPhone);
        }
        
        // NO PASSWORD FIELD - Users manage their own passwords
        if (adminProfilePicFile) {
          adminFormData.append('profile_pic', adminProfilePicFile);
        }

        // Only update if there are changes
        if (Array.from(adminFormData.entries()).length > 0) {
          await dispatch(updateUser({
            id: editFormData.admin_id,
            data: adminFormData
          })).unwrap();
          dispatch(getAllUsers());
        }
      }

      // Show success popup
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Brand and admin updated successfully!',
        confirmButtonText: 'OK',
        confirmButtonColor: '#4CAF50'
      });
      
      resetEditForm();
      dispatch(getAllBrands());
      setTimeout(() => {
        setShowEditModal(null);
      }, 100);
      
    } catch (err) {
      setFormError(err?.error || 'Failed to update brand. Please try again.');
      // Show error popup
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
      admin_contact: '',
      is_active: true
    });
    setLogoFile(null);
    setLogoPreview(null);
    setAdminProfilePicFile(null);
    setAdminProfilePicPreview(null);
  };

  const resetEditForm = () => {
    setEditFormData({
      name: '',
      is_active: true,
      admin_id: '',
      admin_email: '',
      admin_first_name: '',
      admin_last_name: '',
      admin_contact: '',
      admin_profile_pic: '',
      original_admin_first_name: '',
      original_admin_last_name: '',
      original_admin_contact: ''
    });
    setLogoFile(null);
    setLogoPreview(null);
    setAdminProfilePicFile(null);
    setAdminProfilePicPreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'admin_contact') {
      // Format phone number as user types
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
    
    if (name === 'admin_contact') {
      // Format phone number as user types
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

  const handleViewDetails = (brandId) => {
    setShowBrandDetail(brandId);
  };

  const handleEdit = (brand) => {
    // Find brand admin user
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
      admin_contact: brandAdmin.contact_no || '',
      admin_profile_pic: adminProfilePic,
      original_admin_first_name: brandAdmin.first_name || '',
      original_admin_last_name: brandAdmin.last_name || '',
      original_admin_contact: brandAdmin.contact_no || ''
    });
    setLogoPreview(brandLogo);
    setLogoFile(null);
    setAdminProfilePicPreview(adminProfilePic);
    setAdminProfilePicFile(null);
  };

  // NEW: Handle toggle status using updateBrand
  const handleToggleStatus = async (brand) => {
    try {
      const brandFormData = new FormData();
      brandFormData.append('name', brand.name);
      brandFormData.append('is_active', !brand.is_active); // Toggle the status
      
      // Preserve existing logo if no new one is uploaded
      if (brand.logo_url) {
        brandFormData.append('logo_url', brand.logo_url);
      }

      await dispatch(updateBrand({
        id: brand.id,
        data: brandFormData
      })).unwrap();

      // Show success message
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

  // Get admin for a specific brand
  const getAdminForBrand = (brandId) => {
    return brandAdmins[brandId] || null;
  };

  return (
    <div>
      {/* Create Brand Button */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-800">All Brands</h2>
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
            {brands?.length || 0} Brands
          </span>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {showCreateForm ? 'Cancel' : 'New Brand'}
        </button>
      </div>

      {/* Create Brand Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-blue-600 mb-4">Create New Brand</h2>
          
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
              {/* Left Column: Brand Logo & Admin Profile Picture */}
              <div className="space-y-8">
                {/* Brand Logo Upload */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Brand Logo</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {logoPreview ? (
                      <div className="space-y-2">
                        <img 
                          src={logoPreview} 
                          alt="Brand logo preview" 
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
                          alt="Default brand logo" 
                          className="max-h-48 mx-auto rounded-lg object-contain opacity-50"
                        />
                        <p className="text-sm text-gray-500">Default logo will be used if not uploaded</p>
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
                        name="admin_profile_pic"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: Brand & Admin Info */}
              <div className="space-y-6">
                {/* Brand Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Brand Information</h3>
                  
                  {/* Add information about auto-generated password */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> A random password will be auto-generated and sent to the admin's email.
                      The admin will use this password for first-time login and will be prompted to create a new password.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter brand name"
                      required
                    />
                  </div>
                </div>

                {/* Admin Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Admin Account</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Email *
                    </label>
                    <input
                      type="email"
                      name="admin_email"
                      value={formData.admin_email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="admin@example.com"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="admin_first_name"
                        value={formData.admin_first_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="First name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="admin_last_name"
                        value={formData.admin_last_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Last name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      name="admin_contact"
                      value={formData.admin_contact}
                      onChange={handleInputChange}
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

            <div className="mt-8 pt-6 border-t">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Create Brand & Admin Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Brands Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading brands...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : brands && brands.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brand Details
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
                  
                  return (
                    <tr key={brand.id} className="hover:bg-gray-50">
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
                              <div className="text-xs text-gray-400">{admin.contact_no}</div>
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
                            className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleEdit(brand)}
                            className="px-3 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(brand)} // Pass the entire brand object
                            className={`px-3 py-1 rounded text-sm ${
                              brand.is_active 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
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
        ) : (
          <div className="py-12 text-center">
            <img 
              src={DEFAULT_BRAND_LOGO}
              alt="No brands" 
              className="w-16 h-16 mx-auto mb-4 opacity-50"
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Brands Found</h3>
            <p className="text-gray-500 mb-4">Create your first brand to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Create First Brand
            </button>
          </div>
        )}
      </div>

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
              <h2 className="text-xl font-bold text-blue-600 mb-4">Edit Brand</h2>
              
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
                      <h3 className="font-semibold text-gray-700">Brand Logo</h3>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        {logoPreview ? (
                          <div className="space-y-2">
                            <img 
                              src={logoPreview} 
                              alt="Brand logo preview" 
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
                            <p className="text-sm text-gray-500">Current brand logo</p>
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
                      <h3 className="font-semibold text-gray-700">Brand Information</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Brand Name *
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
                        <h3 className="font-semibold text-gray-700">Brand Admin</h3>
                        
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
                            Contact Number
                          </label>
                          <input
                            type="tel"
                            name="admin_contact"
                            value={editFormData.admin_contact}
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

                        {/* Note about password management */}
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Note:</strong> Password management is handled by users themselves.
                            Admins can reset their password using the "Forgot Password" feature.
                          </p>
                        </div>

                        {/* Admin Email (Read-only) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Admin Email
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
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    Update Brand
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