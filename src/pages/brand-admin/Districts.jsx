import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectDistrictsByBrand,
  selectDistrictLoading,
  selectDistrictError,
  getDistrictsByBrand,
  createDistrict,
  updateDistrict
} from '../../redux/slice/districtSlice';
import {
  getShopsByBrand,
  selectShopsForBrand
} from '../../redux/slice/shopSlice';

// Import SweetAlert for popup notifications
import Swal from 'sweetalert2';

const Districts = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user?.currentUser);
  
  // Correct selectors with fallbacks
  const districtsByBrand = useSelector(selectDistrictsByBrand) || [];
  const loading = useSelector(selectDistrictLoading);
  const error = useSelector(selectDistrictError);
  
  // Get shops for the brand
  const shops = useSelector(
    user?.brand_id ? selectShopsForBrand(user.brand_id) : () => []
  ) || [];
  
  // Modal and form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [expandedDistrict, setExpandedDistrict] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });
  const [editFormData, setEditFormData] = useState({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // ============================================
  // EFFECTS
  // ============================================

  // Fetch districts and shops on component mount
  useEffect(() => {
    if (user?.brand_id) {
      dispatch(getDistrictsByBrand(user.brand_id))
        .unwrap()
        .then((result) => {
          console.log('Districts fetched successfully:', result);
          setRefreshKey(prev => prev + 1);
        })
        .catch((err) => {
          console.error('Failed to fetch districts:', err);
        });
      
      dispatch(getShopsByBrand(user.brand_id));
    }
  }, [dispatch, user?.brand_id]);

  // ============================================
  // HELPER FUNCTIONS FOR DATA
  // ============================================

  const getShopsForDistrict = (districtId) => {
    if (!shops || !Array.isArray(shops)) return [];
    return shops.filter(shop => shop.district_id === districtId);
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleViewShops = (districtId) => {
    if (expandedDistrict === districtId) {
      setExpandedDistrict(null);
    } else {
      setExpandedDistrict(districtId);
    }
  };

  // ============================================
  // CREATE DISTRICT
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    // Validate district name
    if (!formData.name) {
      setFormError('District name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create district only - no manager creation
      const districtData = {
        name: formData.name,
        description: formData.description,
        is_active: formData.is_active,
        brand_id: user.brand_id
        // No manager_id field - manager assignment will be done in Users page
      };

      const districtResult = await dispatch(createDistrict(districtData)).unwrap();
      
      if (districtResult.success) {
        Swal.fire({
          icon: 'success',
          title: 'District Created Successfully!',
          html: `
            <div style="text-align: left;">
              <p><strong>District:</strong> ${formData.name}</p>
              <p><strong>Description:</strong> ${formData.description || 'No description'}</p>
            </div>
          `,
          confirmButtonText: 'OK',
          confirmButtonColor: '#4CAF50',
          width: '450px'
        });

        resetForm();
        dispatch(getDistrictsByBrand(user.brand_id));
        setTimeout(() => {
          setShowCreateForm(false);
        }, 100);
      }
    } catch (err) {
      console.error('District creation failed:', err);
      setFormError(err?.error || 'Failed to create district. Please try again.');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.error || 'Failed to create district. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // EDIT DISTRICT
  // ============================================
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      // Prepare district update data
      const districtUpdateData = {
        name: editFormData.name,
        description: editFormData.description,
        is_active: editFormData.is_active
      };

      // Update district only
      const districtResult = await dispatch(updateDistrict({
        id: showEditModal,
        data: districtUpdateData
      })).unwrap();

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'District updated successfully!',
        confirmButtonText: 'OK',
        confirmButtonColor: '#4CAF50',
        timer: 2000
      });
      
      resetEditForm();
      dispatch(getDistrictsByBrand(user.brand_id));
      setTimeout(() => {
        setShowEditModal(null);
      }, 100);
      
    } catch (err) {
      console.error('District update failed:', err);
      setFormError(err?.error || 'Failed to update district. Please try again.');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.error || 'Failed to update district. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    }
  };

  // Toggle district status
  const handleToggleStatus = async (district) => {
    try {
      const updateData = {
        name: district.name,
        description: district.description,
        is_active: !district.is_active
      };

      await dispatch(updateDistrict({
        id: district.id,
        data: updateData
      })).unwrap();

      dispatch(getDistrictsByBrand(user.brand_id));
      
      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: `${district.name} has been ${!district.is_active ? 'activated' : 'deactivated'} successfully.`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#4CAF50',
        timer: 2000
      });
    } catch (err) {
      console.error('Failed to toggle district status:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update district status.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    }
  };

  // Edit district
  const handleEdit = (district) => {
    setShowEditModal(district.id);
    setEditFormData({
      name: district.name,
      description: district.description || '',
      is_active: district.is_active
    });
  };

  // ============================================
  // FORM HANDLERS
  // ============================================

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true
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

  // ============================================
  // RENDER
  // ============================================

  // Ensure districtsByBrand is an array
  const displayDistricts = Array.isArray(districtsByBrand) ? districtsByBrand : [];

  return (
    <div key={refreshKey}>
      {/* Create District Button */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-800">Your Brand's Districts</h2>
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
            {displayDistricts.length} Districts
          </span>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setFormError('');
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
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
          <h2 className="text-xl font-bold text-blue-600 mb-4">Create New District</h2>
          
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
                    District Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional description about this district"
                  />
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

            <div className="mt-8 pt-6 border-t">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSubmitting ? 'Creating District...' : 'Create District'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Districts Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading districts...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => dispatch(getDistrictsByBrand(user?.brand_id))}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
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
                    Shops
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
                {displayDistricts.map((district) => {
                  const isExpanded = expandedDistrict === district.id;
                  const districtShops = getShopsForDistrict(district.id);
                  
                  return (
                    <React.Fragment key={district.id}>
                      {/* District Row */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center mr-4 border bg-blue-100">
                              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{district.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {district.description || 'No description'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">{districtShops.length}</span>
                            <span className="text-gray-500 ml-1">shops</span>
                            {districtShops.length > 0 && (
                              <span className="text-xs text-green-600 ml-2">
                                ({districtShops.filter(s => s.is_active).length} active)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            district.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {district.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewShops(district.id)}
                              className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm flex items-center"
                            >
                              <svg 
                                className={`w-4 h-4 mr-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              {isExpanded ? 'Hide Shops' : 'View Shops'}
                            </button>
                            <button
                              onClick={() => handleEdit(district)}
                              className="px-3 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleStatus(district)}
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

                      {/* Expanded Shops Dropdown Row */}
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan="5" className="px-6 py-4">
                            <div className="ml-14">
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="font-medium text-gray-700">
                                    Shops in {district.name} ({districtShops.length})
                                  </h4>
                                  <span className="text-xs text-gray-500">
                                    {districtShops.filter(s => s.is_active).length} active shops
                                  </span>
                                </div>
                                
                                {districtShops.length > 0 ? (
                                  <div className="space-y-3">
                                    {districtShops.map((shop) => (
                                      <div key={shop.id} className="bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow">
                                        <div className="flex justify-between items-start">
                                          <div className="flex items-start">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center mr-3 border bg-gray-100">
                                              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                                              </svg>
                                            </div>
                                            <div>
                                              <h5 className="font-medium text-gray-800">{shop.name}</h5>
                                              <p className="text-sm text-gray-600 mt-1">
                                                {shop.street_address || 'No address provided'}
                                              </p>
                                              {shop.city && (
                                                <p className="text-sm text-gray-500">
                                                  {shop.city}{shop.state ? `, ${shop.state}` : ''}
                                                </p>
                                              )}
                                              <div className="flex items-center mt-2 space-x-3">
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                  shop.is_active 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                  {shop.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-sm text-gray-600">
                                              Created: {new Date(shop.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="mt-2">
                                              <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                                Tekmetric ID: {shop.tekmetric_shop_id || 'Not Set'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-200">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <p className="text-gray-600">No shops found in this district</p>
                                    <p className="text-sm text-gray-500 mt-2">
                                      Create a shop and assign it to this district from the Shop page
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Create First District
            </button>
          </div>
        )}
      </div>

      {/* Edit District Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-blue-600 mb-4">Edit District</h2>
              
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
                        District Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={editFormData.name || ''}
                        onChange={handleEditInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional description about this district"
                      />
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