import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectAllShops, 
  selectShopLoading, 
  selectShopError,
  getDistrictShops,  // Changed here
  createShop,
  toggleShopStatus,
  updateShop
} from '../../redux/slice/shopSlice';
import { 
  createUser,
  updateUser,
  getAllUsers,
  selectAllUsers
} from '../../redux/slice/userSlice';
import ShopDetailModal from '../../components/district-manager/ShopDetailModal';

const DEFAULT_PROFILE_PIC = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

const Shops = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.user.currentUser);
  const districtId = currentUser?.district_id;
  
  const allShops = useSelector(selectAllShops);
  const users = useSelector(selectAllUsers);
  const loading = useSelector(selectShopLoading);
  const error = useSelector(selectShopError);
  
  const shops = allShops?.filter(shop => shop.district_id === districtId) || [];
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showShopDetail, setShowShopDetail] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [managerProfilePicFile, setManagerProfilePicFile] = useState(null);
  const [managerProfilePicPreview, setManagerProfilePicPreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
    tekmetric_shop_id: '',
    manager_email: '',
    manager_first_name: '',
    manager_last_name: '',
    manager_password: '',
    manager_contact: '',
    is_active: true
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
    tekmetric_shop_id: '',
    is_active: true,
    manager_id: '',
    manager_email: '',
    manager_first_name: '',
    manager_last_name: '',
    manager_contact: '',
    manager_profile_pic: '',
    change_password: false,
    new_password: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [shopManagers, setShopManagers] = useState({});

  useEffect(() => {
    if (districtId) {
      dispatch(getShopsByDistrict(districtId));
      dispatch(getAllUsers());
    }
  }, [dispatch, districtId]);

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

  // Helper function to get manager profile pic with fallback
  const getManagerProfilePic = (shopId) => {
    const manager = shopManagers[shopId];
    if (!manager) return DEFAULT_PROFILE_PIC;
    
    if (manager.profile_pic_url && manager.profile_pic_url.trim() !== '') {
      return manager.profile_pic_url;
    }
    return DEFAULT_PROFILE_PIC;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setManagerProfilePicFile(file);
      setManagerProfilePicPreview(previewUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      // Create shop
      const shopFormData = new FormData();
      shopFormData.append('name', formData.name);
      shopFormData.append('address', formData.address || '');
      shopFormData.append('city', formData.city || '');
      shopFormData.append('state', formData.state || '');
      shopFormData.append('zip_code', formData.zip_code || '');
      shopFormData.append('phone', formData.phone || '');
      shopFormData.append('email', formData.email || '');
      shopFormData.append('tekmetric_shop_id', formData.tekmetric_shop_id || '');
      shopFormData.append('district_id', districtId);
      shopFormData.append('is_active', formData.is_active);

      const shopResult = await dispatch(createShop(shopFormData)).unwrap();
      
      if (shopResult.success) {
        // Create shop manager user
        const userFormData = new FormData();
        userFormData.append('email', formData.manager_email);
        userFormData.append('first_name', formData.manager_first_name);
        userFormData.append('last_name', formData.manager_last_name);
        userFormData.append('password', formData.manager_password);
        userFormData.append('contact_no', formData.manager_contact || '');
        userFormData.append('role', 'shop_manager');
        userFormData.append('shop_id', shopResult.data.id);
        userFormData.append('district_id', districtId);
        userFormData.append('is_active', true);
        
        if (managerProfilePicFile) {
          userFormData.append('profile_pic', managerProfilePicFile);
        }

        const userResult = await dispatch(createUser(userFormData)).unwrap();
        
        if (userResult.success) {
          setFormSuccess('Shop and manager created successfully!');
          resetForm();
          dispatch(getShopsByDistrict(districtId));
          dispatch(getAllUsers());
          setTimeout(() => {
            setShowCreateForm(false);
            setFormSuccess('');
          }, 2000);
        }
      }
    } catch (err) {
      setFormError(err?.error || 'Failed to create shop. Please try again.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      // Update shop
      const shopFormData = new FormData();
      shopFormData.append('name', editFormData.name);
      shopFormData.append('address', editFormData.address || '');
      shopFormData.append('city', editFormData.city || '');
      shopFormData.append('state', editFormData.state || '');
      shopFormData.append('zip_code', editFormData.zip_code || '');
      shopFormData.append('phone', editFormData.phone || '');
      shopFormData.append('email', editFormData.email || '');
      shopFormData.append('tekmetric_shop_id', editFormData.tekmetric_shop_id || '');
      shopFormData.append('is_active', editFormData.is_active);

      await dispatch(updateShop({
        id: showEditModal,
        data: shopFormData
      })).unwrap();

      // Update shop manager user
      if (editFormData.manager_id) {
        const managerFormData = new FormData();
        
        // Update name if changed
        if (editFormData.manager_first_name !== editFormData.original_manager_first_name) {
          managerFormData.append('first_name', editFormData.manager_first_name);
        }
        if (editFormData.manager_last_name !== editFormData.original_manager_last_name) {
          managerFormData.append('last_name', editFormData.manager_last_name);
        }
        if (editFormData.manager_contact !== editFormData.original_manager_contact) {
          managerFormData.append('contact_no', editFormData.manager_contact);
        }
        if (editFormData.change_password && editFormData.new_password) {
          managerFormData.append('password', editFormData.new_password);
        }
        if (managerProfilePicFile) {
          managerFormData.append('profile_pic', managerProfilePicFile);
        }

        // Only update if there are changes
        if (Array.from(managerFormData.entries()).length > 0) {
          await dispatch(updateUser({
            id: editFormData.manager_id,
            data: managerFormData
          })).unwrap();
          dispatch(getAllUsers());
        }
      }

      setFormSuccess('Shop and manager updated successfully!');
      resetEditForm();
      dispatch(getShopsByDistrict(districtId));
      setTimeout(() => {
        setShowEditModal(null);
        setFormSuccess('');
      }, 2000);
      
    } catch (err) {
      setFormError(err?.error || 'Failed to update shop. Please try again.');
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
      manager_email: '',
      manager_first_name: '',
      manager_last_name: '',
      manager_password: '',
      manager_contact: '',
      is_active: true
    });
    setManagerProfilePicFile(null);
    setManagerProfilePicPreview(null);
  };

  const resetEditForm = () => {
    setEditFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      phone: '',
      email: '',
      tekmetric_shop_id: '',
      is_active: true,
      manager_id: '',
      manager_email: '',
      manager_first_name: '',
      manager_last_name: '',
      manager_contact: '',
      manager_profile_pic: '',
      change_password: false,
      new_password: ''
    });
    setManagerProfilePicFile(null);
    setManagerProfilePicPreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleViewDetails = (shopId) => {
    setShowShopDetail(shopId);
  };

  const handleEdit = (shop) => {
    // Find shop manager user
    const shopManager = shopManagers[shop.id] || {};
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
      is_active: shop.is_active,
      manager_id: shopManager.id || '',
      manager_email: shopManager.email || '',
      manager_first_name: shopManager.first_name || '',
      manager_last_name: shopManager.last_name || '',
      manager_contact: shopManager.contact_no || '',
      manager_profile_pic: managerProfilePic,
      original_manager_first_name: shopManager.first_name || '',
      original_manager_last_name: shopManager.last_name || '',
      original_manager_contact: shopManager.contact_no || '',
      change_password: false,
      new_password: ''
    });
    setManagerProfilePicPreview(managerProfilePic);
    setManagerProfilePicFile(null);
  };

  const handleToggleStatus = async (shopId) => {
    try {
      await dispatch(toggleShopStatus(shopId)).unwrap();
      dispatch(getShopsByDistrict(districtId));
    } catch (err) {
      console.error('Failed to toggle shop status:', err);
    }
  };

  // Get manager for a specific shop
  const getManagerForShop = (shopId) => {
    return shopManagers[shopId] || null;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Shop Management</h1>
        <p className="text-gray-600">Manage all shops in your district</p>
      </div>

      {/* Create Shop Button */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-800">All Shops</h2>
          <span className="bg-[#002868] text-white px-3 py-1 rounded-full text-sm">
            {shops?.length || 0} Shops
          </span>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-[#BF0A30] hover:bg-red-800 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
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
          <h2 className="text-xl font-bold text-[#002868] mb-4">Create New Shop</h2>
          
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
              {/* Left Column: Manager Profile Picture */}
              <div className="space-y-8">
                {/* Manager Profile Picture Upload */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Manager Profile Picture</h3>
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
                          className="text-sm text-red-600 hover:text-red-800"
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
                      <span className="bg-[#002868] hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer inline-block">
                        Choose Photo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        name="manager_profile_pic"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: Shop & Manager Info */}
              <div className="space-y-6">
                {/* Shop Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Shop Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shop Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                      placeholder="Enter shop name"
                      required
                    />
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                      placeholder="Enter shop address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                        placeholder="State"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                        placeholder="Zip Code"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tekmetric Shop ID
                      </label>
                      <input
                        type="text"
                        name="tekmetric_shop_id"
                        value={formData.tekmetric_shop_id}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                        placeholder="Tekmetric ID"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                        placeholder="Phone number"
                      />
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                        placeholder="shop@example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Manager Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Manager Account</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manager Email *
                    </label>
                    <input
                      type="email"
                      name="manager_email"
                      value={formData.manager_email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                      placeholder="manager@example.com"
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
                        name="manager_first_name"
                        value={formData.manager_first_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
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
                        name="manager_last_name"
                        value={formData.manager_last_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                        placeholder="Last name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="manager_password"
                      value={formData.manager_password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                      placeholder="Enter password"
                      required
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <button
                type="submit"
                className="w-full bg-[#002868] hover:bg-blue-800 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Create Shop & Manager Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Shops Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#002868]"></div>
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
                            <svg className="w-8 h-8 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 00-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{shop.name}</div>
                            <div className="text-sm text-gray-500">ID: {shop.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm text-gray-900">{shop.city}{shop.state ? `, ${shop.state}` : ''}</div>
                          <div className="text-sm text-gray-500">{shop.address}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {manager ? (
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full overflow-hidden mr-3 border bg-gray-100">
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
                              <div className="text-sm text-gray-500">{manager.email}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full overflow-hidden mr-3 border bg-gray-100 flex items-center justify-center">
                              <img 
                                src={DEFAULT_PROFILE_PIC}
                                alt="No manager"
                                className="w-8 h-8 opacity-50"
                              />
                            </div>
                            <div className="text-sm text-gray-500 italic">No manager assigned</div>
                          </div>
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
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                        {shop.tekmetric_shop_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetails(shop.id)}
                            className="px-3 py-1 bg-[#002868] text-white hover:bg-blue-700 rounded text-sm"
                          >
                            View Details
                          </button>
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
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Shops Found</h3>
            <p className="text-gray-500 mb-4">Create your first shop to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-[#002868] hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
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
              <h2 className="text-xl font-bold text-[#002868] mb-4">Edit Shop</h2>
              
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
                  {/* Left Column: Manager Profile Picture */}
                  <div className="space-y-8">
                    {/* Manager Profile Picture */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-700">Manager Profile Picture</h3>
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
                                setManagerProfilePicPreview(editFormData.manager_profile_pic);
                              }}
                              className="text-sm text-red-600 hover:text-red-800"
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
                          <span className="bg-[#002868] hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer inline-block">
                            Change Photo
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
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
                          Shop Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={editFormData.name}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                          placeholder="Enter shop name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={editFormData.address}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                          placeholder="Enter shop address"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={editFormData.city}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
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
                            value={editFormData.state}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                            placeholder="State"
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                            placeholder="Zip Code"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tekmetric Shop ID
                          </label>
                          <input
                            type="text"
                            name="tekmetric_shop_id"
                            value={editFormData.tekmetric_shop_id}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                            placeholder="Tekmetric ID"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={editFormData.phone}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                            placeholder="Phone number"
                          />
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                            placeholder="shop@example.com"
                          />
                        </div>
                      </div>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={editFormData.is_active}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                          className="rounded border-gray-300 text-[#002868] focus:ring-[#002868]"
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
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
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
                              value={editFormData.manager_last_name}
                              onChange={handleEditInputChange}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
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
                            value={editFormData.manager_contact}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                            placeholder="+1234567890"
                          />
                        </div>

                        {/* Password Change Section */}
                        <div className="space-y-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              name="change_password"
                              checked={editFormData.change_password}
                              onChange={(e) => setEditFormData(prev => ({ 
                                ...prev, 
                                change_password: e.target.checked,
                                new_password: e.target.checked ? prev.new_password : ''
                              }))}
                              className="rounded border-gray-300 text-[#002868] focus:ring-[#002868]"
                            />
                            <span className="text-sm font-medium text-gray-700">Change Manager Password</span>
                          </label>

                          {editFormData.change_password && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                New Password
                              </label>
                              <input
                                type="password"
                                name="new_password"
                                value={editFormData.new_password}
                                onChange={handleEditInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                                placeholder="Enter new password"
                              />
                            </div>
                          )}
                        </div>

                        {/* Manager Email (Read-only) */}
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
                    className="px-4 py-2 bg-[#002868] hover:bg-blue-700 text-white rounded-lg font-medium"
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