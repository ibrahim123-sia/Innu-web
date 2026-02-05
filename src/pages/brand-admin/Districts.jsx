import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectDistrictsByBrandFromState, // Changed from selectAllDistricts
  selectDistrictLoading,
  selectDistrictError,
  getDistrictsByBrand,
  createDistrict,
  toggleDistrictStatus,
  updateDistrict
} from '../../redux/slice/districtSlice';
import {
  createUser,
  updateUser,
  getAllUsers,
  selectAllUsers
} from '../../redux/slice/userSlice';
import { Link } from 'react-router-dom';

const DEFAULT_PROFILE_PIC = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

const Districts = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user.currentUser);
  
  // FIXED: Use districtsByBrand instead of all districts
  const districtsByBrand = useSelector(selectDistrictsByBrandFromState);
  const users = useSelector(selectAllUsers);
  const loading = useSelector(selectDistrictLoading);
  const error = useSelector(selectDistrictError);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    manager_first_name: '',
    manager_last_name: '',
    manager_email: '',
    manager_password: '',
    manager_contact: ''
  });
  const [editFormData, setEditFormData] = useState({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [districtManagers, setDistrictManagers] = useState({});

  // Debug: Check what's happening
  useEffect(() => {
    console.log('Districts Component Debug:');
    console.log('User:', user);
    console.log('User brand_id:', user?.brand_id);
    console.log('Districts from API (districtsByBrand):', districtsByBrand);
    console.log('Districts length:', districtsByBrand?.length);
    
    if (user?.brand_id) {
      console.log(`Fetching districts for brand: ${user.brand_id}`);
      dispatch(getDistrictsByBrand(user.brand_id));
      dispatch(getAllUsers());
    } else {
      console.error('User has no brand_id!');
    }
  }, [dispatch, user?.brand_id]);

  useEffect(() => {
    // Organize district managers by district_id
    const managersMap = {};
    users.forEach(user => {
      if (user.role === 'district_manager' && user.district_id) {
        managersMap[user.district_id] = {
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
    setDistrictManagers(managersMap);
  }, [users]);

  const getManagerForDistrict = (districtId) => {
    return districtManagers[districtId] || null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      // Create district
      const districtData = {
        ...formData,
        brand_id: user.brand_id
      };

      const districtResult = await dispatch(createDistrict(districtData)).unwrap();
      
      if (districtResult.success) {
        // Create district manager user if provided
        if (formData.manager_email && formData.manager_password) {
          const userData = {
            email: formData.manager_email,
            first_name: formData.manager_first_name,
            last_name: formData.manager_last_name,
            password: formData.manager_password,
            contact_no: formData.manager_contact || '',
            role: 'district_manager',
            brand_id: user.brand_id,
            district_id: districtResult.data.id,
            is_active: true
          };

          await dispatch(createUser(userData)).unwrap();
          dispatch(getAllUsers());
        }

        setFormSuccess('District created successfully!');
        resetForm();
        dispatch(getDistrictsByBrand(user.brand_id));
        setTimeout(() => {
          setShowCreateForm(false);
          setFormSuccess('');
        }, 2000);
      }
    } catch (err) {
      setFormError(err?.error || 'Failed to create district. Please try again.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      // Update district
      await dispatch(updateDistrict({
        id: showEditModal,
        data: editFormData
      })).unwrap();

      // Update district manager if exists
      const manager = getManagerForDistrict(showEditModal);
      if (manager && editFormData.manager_email) {
        const managerData = {
          first_name: editFormData.manager_first_name,
          last_name: editFormData.manager_last_name,
          contact_no: editFormData.manager_contact
        };

        await dispatch(updateUser({
          id: manager.id,
          data: managerData
        })).unwrap();
        dispatch(getAllUsers());
      }

      setFormSuccess('District updated successfully!');
      resetEditForm();
      dispatch(getDistrictsByBrand(user.brand_id));
      setTimeout(() => {
        setShowEditModal(null);
        setFormSuccess('');
      }, 2000);
      
    } catch (err) {
      setFormError(err?.error || 'Failed to update district. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true,
      manager_first_name: '',
      manager_last_name: '',
      manager_email: '',
      manager_password: '',
      manager_contact: ''
    });
  };

  const resetEditForm = () => {
    setEditFormData({});
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

  const handleEdit = (district) => {
    const manager = getManagerForDistrict(district.id);
    
    setShowEditModal(district.id);
    setEditFormData({
      name: district.name,
      description: district.description || '',
      is_active: district.is_active,
      manager_first_name: manager?.first_name || '',
      manager_last_name: manager?.last_name || '',
      manager_email: manager?.email || '',
      manager_contact: manager?.contact_no || ''
    });
  };

  const handleToggleStatus = async (districtId) => {
    try {
      await dispatch(toggleDistrictStatus(districtId)).unwrap();
      dispatch(getDistrictsByBrand(user.brand_id));
    } catch (err) {
      console.error('Failed to toggle district status:', err);
    }
  };

  // Use districtsByBrand for display
  const displayDistricts = districtsByBrand || [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">District Management</h1>
        <p className="text-gray-600">Organize shops by districts</p>
      </div>

      {/* Create District Button */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-800">Your Brand's Districts</h2>
          <span className="bg-[#002868] text-white px-3 py-1 rounded-full text-sm">
            {displayDistricts.length} Districts
          </span>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-[#BF0A30] hover:bg-red-800 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {showCreateForm ? 'Cancel' : 'New District'}
        </button>
      </div>

      {/* Create District Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-[#002868] mb-4">Create New District</h2>
          
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
            <div className="space-y-6">
              {/* District Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">District Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                    placeholder="Enter district name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                    placeholder="Optional description about this district"
                  />
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

              {/* District Manager Information */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="font-semibold text-gray-700">District Manager (Optional)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="manager_first_name"
                      value={formData.manager_first_name}
                      onChange={handleInputChange}
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
                      value={formData.manager_last_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="manager_email"
                      value={formData.manager_email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                      placeholder="manager@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      name="manager_password"
                      value={formData.manager_password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                      placeholder="Set password"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                    placeholder="(123) 456-7890"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <button
                type="submit"
                className="w-full bg-[#002868] hover:bg-blue-800 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Create District
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Districts Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#002868]"></div>
            <p className="mt-4 text-gray-600">Loading districts...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : displayDistricts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    District Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager
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
                {displayDistricts.map((district) => {
                  const manager = getManagerForDistrict(district.id);
                  
                  return (
                    <tr key={district.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center mr-4 border bg-gray-100">
                            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{district.name}</div>
                            <div className="text-sm text-gray-500">ID: {district.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {district.description || 'No description'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {manager ? (
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full overflow-hidden mr-3 border bg-gray-100">
                              <img 
                                src={manager.profile_pic_url || DEFAULT_PROFILE_PIC}
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
                          <div className="text-sm text-gray-500 italic">No manager</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          district.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {district.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(district.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Link
                            to={`/brand-admin/districts/${district.id}/shops`}
                            className="px-3 py-1 bg-[#002868] text-white hover:bg-blue-700 rounded text-sm"
                          >
                            View Shops
                          </Link>
                          <button
                            onClick={() => handleEdit(district)}
                            className="px-3 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(district.id)}
                            className={`px-3 py-1 rounded text-sm ${
                              district.is_active 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {district.is_active ? 'Deactivate' : 'Activate'}
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
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Districts Found</h3>
            <p className="text-gray-500 mb-4">Create your first district to organize shops</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-[#002868] hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Create First District
            </button>
          </div>
        )}
      </div>

      {/* Edit District Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-[#002868] mb-4">Edit District</h2>
              
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
                  {/* District Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">District Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        District Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={editFormData.name || ''}
                        onChange={handleEditInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                        placeholder="Enter district name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={editFormData.description || ''}
                        onChange={handleEditInputChange}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                        placeholder="Optional description about this district"
                      />
                    </div>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={editFormData.is_active || false}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="rounded border-gray-300 text-[#002868] focus:ring-[#002868]"
                      />
                      <span className="text-sm font-medium text-gray-700">Active</span>
                    </label>
                  </div>

                  {/* District Manager Information */}
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="font-semibold text-gray-700">District Manager</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          name="manager_first_name"
                          value={editFormData.manager_first_name || ''}
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
                          value={editFormData.manager_last_name || ''}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                          placeholder="Last name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          name="manager_email"
                          value={editFormData.manager_email || ''}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          readOnly
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Number
                        </label>
                        <input
                          type="tel"
                          name="manager_contact"
                          value={editFormData.manager_contact || ''}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
                          placeholder="(123) 456-7890"
                        />
                      </div>
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
                    Update District
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

export default Districts;