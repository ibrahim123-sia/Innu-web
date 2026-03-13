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

import Swal from 'sweetalert2';

const DEFAULT_SHOP_LOGO = 'https://storage.googleapis.com/innu-video-app/brand_logo/logo.png';

const TableRowSkeleton = () => (
  <tr className="hover:bg-gray-50">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse mr-4"></div>
        <div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-2"></div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-20 mb-1"></div>
      <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex space-x-2">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
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
            {['District Details', 'Shops', 'Status', 'Actions'].map((header) => (
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
      <div className="h-8 bg-gray-200 rounded animate-pulse w-48"></div>
      <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16"></div>
    </div>
    <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-32"></div>
  </div>
);

const FormSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
    <div className="h-8 bg-gray-200 rounded animate-pulse w-48 mb-4"></div>
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="h-5 bg-gray-200 rounded animate-pulse w-32"></div>
        <div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
        </div>
      </div>
      <div className="pt-6 border-t">
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse w-full"></div>
      </div>
    </div>
  </div>
);

const ShopsDropdownSkeleton = () => (
  <tr className="bg-gray-50">
    <td colSpan="4" className="px-6 py-4">
      <div className="ml-14">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 bg-gray-200 rounded animate-pulse w-48"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg border p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start flex-1">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse mr-3"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-40 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-64 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-32 mb-2"></div>
                      <div className="h-5 bg-gray-200 rounded-full animate-pulse w-16"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-32 mb-2"></div>
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </td>
  </tr>
);

const EmptyStateSkeleton = () => (
  <div className="py-12 text-center">
    <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
    <div className="h-6 bg-gray-200 rounded animate-pulse w-48 mx-auto mb-2"></div>
    <div className="h-4 bg-gray-200 rounded animate-pulse w-64 mx-auto mb-4"></div>
    <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-40 mx-auto"></div>
  </div>
);

const Districts = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user?.currentUser);
  
  const districtsByBrand = useSelector(selectDistrictsByBrand) || [];
  const loading = useSelector(selectDistrictLoading);
  const error = useSelector(selectDistrictError);
  
  const shops = useSelector(
    user?.brand_id ? selectShopsForBrand(user.brand_id) : () => []
  ) || [];
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [expandedDistrict, setExpandedDistrict] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    is_active: true
  });
  const [editFormData, setEditFormData] = useState({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [formErrors, setFormErrors] = useState({ name: false });
  const [validationErrors, setValidationErrors] = useState({ name: '' });
  const [editFormErrors, setEditFormErrors] = useState({ name: false });
  const [editValidationErrors, setEditValidationErrors] = useState({ name: '' });

  const displayDistricts = Array.isArray(districtsByBrand) ? districtsByBrand : [];

  const validateDistrictName = (name) => {
    if (!name?.trim()) return 'District name is required';
    const trimmed = name.trim();
    if (trimmed.length < 2) return 'District name must be at least 2 characters long';
    if (trimmed.length > 100) return 'District name must not exceed 100 characters';
    if (!/^[a-zA-Z0-9\s\&\-\.\,]+$/.test(name)) return 'District name can only contain letters, numbers, spaces, and & - . ,';
    return '';
  };

  const checkDistrictNameExists = (name, currentDistrictId = null) => {
    if (!name || !displayDistricts) return false;
    return displayDistricts.some(district => 
      district.name.toLowerCase() === name.toLowerCase().trim() && 
      (!currentDistrictId || district.id !== currentDistrictId)
    );
  };

  // Function to get shop image URL
  const getShopImageUrl = (shop) => {
    if (shop.logo_url) {
      return shop.logo_url;
    }
    return DEFAULT_SHOP_LOGO;
  };

  useEffect(() => {
    if (user?.brand_id) {
      fetchData();
    }
  }, [dispatch, user?.brand_id]);

  const fetchData = async () => {
    setIsInitialLoad(true);
    try {
      await Promise.all([
        dispatch(getDistrictsByBrand(user.brand_id)).unwrap(),
        dispatch(getShopsByBrand(user.brand_id))
      ]);
      setRefreshKey(prev => prev + 1);
    } catch {
    } finally {
      setIsInitialLoad(false);
    }
  };

  const getShopsForDistrict = (districtId) => {
    if (!Array.isArray(shops)) return [];
    return shops.filter(shop => shop.district_id === districtId);
  };

  const validateCreateForm = () => {
    const nameError = validateDistrictName(formData.name);

    setValidationErrors({ name: nameError });
    setFormErrors({ name: !!nameError });

    if (nameError) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: nameError,
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      return false;
    }

    if (checkDistrictNameExists(formData.name)) {
      setFormError('A district with this name already exists');
      Swal.fire({
        icon: 'error',
        title: 'Duplicate District Name',
        text: 'A district with this name already exists. Please use a different name.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      return false;
    }

    return true;
  };

  const validateEditForm = () => {
    const nameError = validateDistrictName(editFormData.name);

    setEditValidationErrors({ name: nameError });
    setEditFormErrors({ name: !!nameError });

    if (nameError) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: nameError,
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      return false;
    }

    const originalDistrict = displayDistricts.find(d => d.id === showEditModal);
    
    if (editFormData.name !== originalDistrict?.name && 
        checkDistrictNameExists(editFormData.name, showEditModal)) {
      setFormError('A district with this name already exists');
      Swal.fire({
        icon: 'error',
        title: 'Duplicate District Name',
        text: 'A district with this name already exists. Please use a different name.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      return false;
    }

    return true;
  };

  const handleViewShops = (districtId) => {
    setExpandedDistrict(expandedDistrict === districtId ? null : districtId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    if (!validateCreateForm()) return;

    setIsSubmitting(true);

    try {
      const districtData = {
        name: formData.name.trim(),
        is_active: formData.is_active,
        brand_id: user.brand_id
      };

      const districtResult = await dispatch(createDistrict(districtData)).unwrap();
      
      if (districtResult.success) {
        Swal.fire({
          icon: 'success',
          title: 'District Created Successfully!',
          html: `<div style="text-align: left;"><p><strong>District:</strong> ${formData.name.trim()}</p></div>`,
          confirmButtonText: 'OK',
          confirmButtonColor: '#4CAF50',
          width: '450px'
        });

        resetForm();
        dispatch(getDistrictsByBrand(user.brand_id));
        setTimeout(() => setShowCreateForm(false), 100);
      }
    } catch (err) {
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

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!validateEditForm()) return;

    try {
      const districtUpdateData = {
        name: editFormData.name.trim(),
        is_active: editFormData.is_active
      };

      const districtResult = await dispatch(updateDistrict({
        id: showEditModal,
        data: districtUpdateData
      })).unwrap();

      if (districtResult?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'District updated successfully!',
          confirmButtonText: 'OK',
          confirmButtonColor: '#4CAF50',
          timer: 2000
        });
        
        resetEditForm();
        await dispatch(getDistrictsByBrand(user.brand_id));
        setTimeout(() => setShowEditModal(null), 100);
      } else {
        throw new Error(districtResult?.error || 'Update failed');
      }
      
    } catch (err) {
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

  const handleToggleStatus = async (district) => {
    try {
      setIsSubmitting(true);

      const updateData = {
        name: district.name,
        is_active: !district.is_active
      };

      const result = await dispatch(updateDistrict({
        id: district.id,
        data: updateData
      })).unwrap();

      if (result?.success) {
        await dispatch(getDistrictsByBrand(user.brand_id));
        
        Swal.fire({
          icon: 'success',
          title: 'Status Updated',
          text: `${district.name} has been ${!district.is_active ? 'activated' : 'deactivated'} successfully.`,
          confirmButtonText: 'OK',
          confirmButtonColor: '#4CAF50',
          timer: 2000
        });
      } else {
        throw new Error(result?.error || 'Failed to update status');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.error || err?.message || 'Failed to update district status.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (district) => {
    setShowEditModal(district.id);
    setEditFormData({
      name: district.name,
      is_active: district.is_active
    });
    setEditFormErrors({ name: false });
    setEditValidationErrors({ name: '' });
    setFormError('');
  };

  const resetForm = () => {
    setFormData({ name: '', is_active: true });
    setFormErrors({ name: false });
    setValidationErrors({ name: '' });
  };

  const resetEditForm = () => {
    setEditFormData({});
    setEditFormErrors({ name: false });
    setEditValidationErrors({ name: '' });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'name') {
      const error = validateDistrictName(value);
      setValidationErrors(prev => ({ ...prev, [name]: error }));
      setFormErrors(prev => ({ ...prev, [name]: !!error }));
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'name') {
      const error = validateDistrictName(value);
      setEditValidationErrors(prev => ({ ...prev, [name]: error }));
      setEditFormErrors(prev => ({ ...prev, [name]: !!error }));
    }
  };

  const hasEditChanges = () => {
    const originalDistrict = displayDistricts.find(d => d.id === showEditModal);
    if (!originalDistrict) return false;
    
    return editFormData.name !== originalDistrict.name ||
           editFormData.is_active !== originalDistrict.is_active;
  };

  if (isInitialLoad && loading) {
    return (
      <div className="transition-opacity duration-300 ease-in-out" key={refreshKey}>
        <HeaderSkeleton />
        {showCreateForm && <FormSkeleton />}
        {displayDistricts.length > 0 ? <TableSkeleton /> : <EmptyStateSkeleton />}
      </div>
    );
  }

  return (
    <div className="transition-opacity duration-300 ease-in-out" key={refreshKey}>
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
            resetForm();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {showCreateForm ? 'Cancel' : 'New District'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-blue-600 mb-4">Create New District</h2>
          
          {(formError || formSuccess) && (
            <div className={`mb-4 p-3 rounded-lg ${formError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {formError || formSuccess}
            </div>
          )}
          
          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-6">
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
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter district name"
                    maxLength={100}
                    required
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.name}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.name.length}/100 characters
                  </p>
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
                disabled={isSubmitting || formErrors.name}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isSubmitting || formErrors.name
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

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading && !isInitialLoad ? (
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shops</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayDistricts.map((district) => {
                  const isExpanded = expandedDistrict === district.id;
                  const districtShops = getShopsForDistrict(district.id);
                  
                  return (
                    <React.Fragment key={district.id}>
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
                            district.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
                              disabled={isSubmitting}
                              className={`px-3 py-1 rounded text-sm ${
                                district.is_active 
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {district.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan="4" className="px-6 py-4">
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
                                          <div className="flex items-start flex-1">
                                            {/* Shop Image - Using logo_url or default */}
                                            <img
                                              src={getShopImageUrl(shop)}
                                              alt={shop.name}
                                              className="w-10 h-10 rounded-lg object-cover mr-3 border border-gray-200"
                                              onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = DEFAULT_SHOP_LOGO;
                                              }}
                                            />
                                            <div className="flex-1">
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
                                                  shop.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-blue-600 mb-4">Edit District</h2>
              
              {(formError || formSuccess) && (
                <div className={`mb-4 p-3 rounded-lg ${formError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {formError || formSuccess}
                </div>
              )}
              
              <form onSubmit={handleEditSubmit} noValidate>
                <div className="space-y-6">
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
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          editFormErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Enter district name"
                        maxLength={100}
                        required
                      />
                      {editFormErrors.name && (
                        <p className="mt-1 text-xs text-red-600">{editValidationErrors.name}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {(editFormData.name || '').length}/100 characters
                      </p>
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
                    disabled={editFormErrors.name || !hasEditChanges()}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      editFormErrors.name || !hasEditChanges()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
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