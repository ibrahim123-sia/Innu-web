import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectAllUsers,
  getUsersByShopId,
  createUser,
  updateUser,
  toggleUserActiveStatus,
  selectUserLoading,
  selectUserError,
  selectUserSuccess
} from '../../redux/slice/userSlice';
import {
  getMyShop,
  selectMyShop
} from '../../redux/slice/shopSlice';

const DEFAULT_PROFILE_PIC = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

const Users = () => {
  const dispatch = useDispatch();
  const myShop = useSelector(selectMyShop);
  const shopUsers = useSelector(selectAllUsers);
  const loading = useSelector(selectUserLoading);
  const error = useSelector(selectUserError);
  const success = useSelector(selectUserSuccess);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
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
    change_password: false,
    new_password: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    if (myShop) {
      dispatch(getUsersByShopId(myShop.id));
    }
  }, [dispatch, myShop]);

  useEffect(() => {
    if (success) {
      setFormSuccess('Operation completed successfully!');
      setTimeout(() => {
        setFormSuccess('');
        if (showCreateForm) setShowCreateForm(false);
        if (showEditModal) setShowEditModal(null);
      }, 2000);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      setFormError(error);
    }
  }, [error]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setProfilePicFile(file);
      setProfilePicPreview(previewUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!myShop) {
      setFormError('Shop information not available');
      return;
    }

    try {
      const userFormData = new FormData();
      userFormData.append('first_name', formData.first_name);
      userFormData.append('last_name', formData.last_name);
      userFormData.append('email', formData.email);
      userFormData.append('password', formData.password);
      userFormData.append('contact_no', formData.contact_no || '');
      userFormData.append('role', formData.role);
      userFormData.append('shop_id', myShop.id);
      userFormData.append('is_active', formData.is_active);
      
      if (profilePicFile) {
        userFormData.append('profile_pic', profilePicFile);
      }

      await dispatch(createUser(userFormData)).unwrap();
      
      resetForm();
      dispatch(getUsersByShopId(myShop.id));
      
    } catch (err) {
      setFormError(err?.error || 'Failed to create user. Please try again.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      const adminFormData = new FormData();
      
      // Update name if changed
      if (editFormData.first_name !== editFormData.original_first_name) {
        adminFormData.append('first_name', editFormData.first_name);
      }
      if (editFormData.last_name !== editFormData.original_last_name) {
        adminFormData.append('last_name', editFormData.last_name);
      }
      if (editFormData.contact_no !== editFormData.original_contact_no) {
        adminFormData.append('contact_no', editFormData.contact_no);
      }
      if (editFormData.change_password && editFormData.new_password) {
        adminFormData.append('password', editFormData.new_password);
      }
      if (profilePicFile) {
        adminFormData.append('profile_pic', profilePicFile);
      }

      // Only update if there are changes
      if (Array.from(adminFormData.entries()).length > 0) {
        await dispatch(updateUser({
          id: showEditModal,
          data: adminFormData
        })).unwrap();
        dispatch(getUsersByShopId(myShop.id));
      }

      resetEditForm();
      
    } catch (err) {
      setFormError(err?.error || 'Failed to update user. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      contact_no: '',
      role: 'technician',
      is_active: true
    });
    setProfilePicFile(null);
    setProfilePicPreview(null);
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
      change_password: false,
      new_password: ''
    });
    setProfilePicFile(null);
    setProfilePicPreview(null);
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
      change_password: false,
      new_password: ''
    });
    setProfilePicPreview(user.profile_pic_url || DEFAULT_PROFILE_PIC);
    setProfilePicFile(null);
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await dispatch(toggleUserActiveStatus({
        userId,
        is_active: !currentStatus
      })).unwrap();
      dispatch(getUsersByShopId(myShop.id));
    } catch (err) {
      console.error('Failed to toggle user status:', err);
    }
  };

  const filteredUsers = shopUsers?.filter(user => {
    let matches = true;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const email = user.email.toLowerCase();
      
      if (!fullName.includes(searchLower) && !email.includes(searchLower)) {
        matches = false;
      }
    }
    
    if (roleFilter !== 'all' && user.role !== roleFilter) {
      matches = false;
    }
    
    return matches;
  });

  const getRoleDisplay = (role) => {
    switch(role) {
      case 'technician': return 'Technician';
      case 'shop_manager': return 'Shop Manager';
      case 'supervisor': return 'Supervisor';
      default: return role.replace('_', ' ');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Shop Users Management</h1>
        <p className="text-gray-600">Manage users for {myShop?.name || 'your shop'}</p>
      </div>

      {/* Create User Button and Stats */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-800">All Users</h2>
          <span className="bg-[#002868] text-white px-3 py-1 rounded-full text-sm">
            {shopUsers?.length || 0} Users
          </span>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-[#BF0A30] hover:bg-red-800 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {showCreateForm ? 'Cancel' : 'New User'}
          </button>
        </div>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-[#002868] mb-4">Create New User</h2>
          
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
              {/* Left Column: Profile Picture */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Profile Picture</h3>
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
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: User Info */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">User Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
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
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                        placeholder="Last name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                      placeholder="user@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
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
                      name="contact_no"
                      value={formData.contact_no}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                      placeholder="+1234567890"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                      required
                    >
                      <option value="technician">Technician</option>
                      <option value="supervisor">Supervisor</option>
                    </select>
                  </div>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-[#002868] focus:ring-[#002868]"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <button
                type="submit"
                className="w-full bg-[#002868] hover:bg-blue-800 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
            <input
              type="text"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role Filter</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
            >
              <option value="all">All Roles</option>
              <option value="technician">Technician</option>
              <option value="supervisor">Supervisor</option>
              <option value="shop_manager">Shop Manager</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="flex space-x-4 w-full">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {shopUsers?.filter(u => u.is_active).length || 0}
                </div>
                <div className="text-sm text-gray-500">Active</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {shopUsers?.filter(u => u.role === 'technician').length || 0}
                </div>
                <div className="text-sm text-gray-500">Technicians</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {shopUsers?.filter(u => u.role === 'supervisor').length || 0}
                </div>
                <div className="text-sm text-gray-500">Supervisors</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#002868]"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        ) : filteredUsers && filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Information
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
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
                {filteredUsers.map((user) => {
                  const profilePic = user.profile_pic_url || DEFAULT_PROFILE_PIC;
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
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
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{user.contact_no || 'No contact number'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {getRoleDisplay(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="px-3 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user.id, user.is_active)}
                            className={`px-3 py-1 rounded text-sm ${
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
            <img 
              src={DEFAULT_PROFILE_PIC}
              alt="No users" 
              className="w-16 h-16 mx-auto mb-4 opacity-50"
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || roleFilter !== 'all' 
                ? 'Try changing your search filters' 
                : 'Create your first user to get started'}
            </p>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-[#002868] hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Create First User
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-[#002868] mb-4">Edit User</h2>
              
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
                <div className="space-y-6">
                  {/* Profile Picture */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Profile Picture</h3>
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
                              setProfilePicPreview(editFormData.profile_pic);
                            }}
                            className="text-sm text-red-600 hover:text-red-800"
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
                        <span className="bg-[#002868] hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer inline-block">
                          Change Photo
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* User Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">User Information</h3>
                    
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
                          name="last_name"
                          value={editFormData.last_name}
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
                        name="contact_no"
                        value={editFormData.contact_no}
                        onChange={handleEditInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                        placeholder="+1234567890"
                      />
                    </div>

                    {/* Password Change Section */}
                    <div className="space-y-4 border-t pt-4">
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
                        <span className="text-sm font-medium text-gray-700">Change Password</span>
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

                    {/* Email and Role (Read-only) */}
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