import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  getShopsByBrand,
  selectShopsForBrand,
  selectShopLoading,
  selectShopError,
  createShop,
  updateShop,
  deleteShop
} from '../../redux/slice/shopSlice';
import {
  selectDistrictsByBrand,
  getDistrictsByBrand
} from '../../redux/slice/districtSlice';

// Import SweetAlert for popup notifications
import Swal from 'sweetalert2';

// Default images
const DEFAULT_SHOP_IMAGE = 'https://cdn-icons-png.flaticon.com/512/3047/3047928.png';

// Skeleton Loader Components
const TableRowSkeleton = () => (
  <tr className="hover:bg-gray-50">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-lg bg-gray-200 animate-pulse mr-4"></div>
        <div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-24 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-28"></div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-40 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
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
            {['Shop Details', 'Location', 'District', 'Status', 'Actions'].map((header) => (
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
      <div className="h-8 bg-gray-200 rounded animate-pulse w-32"></div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full"></div>
          </div>
        </div>
        <div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full"></div>
          </div>
        </div>
        <div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full"></div>
        </div>
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

const Shops = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user.currentUser);
  const brandId = user?.brand_id;
  
  // Correct selectors
  const shops = useSelector(selectShopsForBrand(brandId));
  const districts = useSelector(selectDistrictsByBrand) || [];
  const loading = useSelector(selectShopLoading);
  const error = useSelector(selectShopError);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Updated formData to match backend requirements
  const [formData, setFormData] = useState({
    name: '',
    street_address: '',
    city: '',
    state: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    tekmetric_shop_id: '',
    district_id: '',
    is_active: true
  });
  
  const [editFormData, setEditFormData] = useState({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Validation states for create form
  const [formErrors, setFormErrors] = useState({
    name: false,
    street_address: false,
    city: false,
    state: false,
    timezone: false,
    tekmetric_shop_id: false
  });

  const [validationErrors, setValidationErrors] = useState({
    name: '',
    street_address: '',
    city: '',
    state: '',
    timezone: '',
    tekmetric_shop_id: ''
  });

  // Validation states for edit form
  const [editFormErrors, setEditFormErrors] = useState({
    name: false,
    street_address: false,
    city: false,
    state: false,
    timezone: false,
    tekmetric_shop_id: false
  });

  const [editValidationErrors, setEditValidationErrors] = useState({
    name: '',
    street_address: '',
    city: '',
    state: '',
    timezone: '',
    tekmetric_shop_id: ''
  });

  // Common US timezones for dropdown
  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Phoenix',
    'America/Los_Angeles',
    'America/Anchorage',
    'America/Honolulu',
    'America/Puerto_Rico',
    'America/Juneau',
    'America/Boise',
    'America/Indiana/Indianapolis',
    'America/Detroit',
    'America/Menominee',
    'America/North_Dakota/Center',
    'America/Kentucky/Louisville'
  ];

  // US States list for validation
  const usStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    'DC', 'PR', 'VI', 'GU', 'MP', 'AS'
  ];

  // ============================================
  // VALIDATION FUNCTIONS
  // ============================================

  const validateShopName = (name) => {
    if (!name || !name.trim()) {
      return 'Shop name is required';
    }
    if (name.trim().length < 2) {
      return 'Shop name must be at least 2 characters long';
    }
    if (name.trim().length > 100) {
      return 'Shop name must not exceed 100 characters';
    }
    // Allow letters, numbers, spaces, and common special characters
    const nameRegex = /^[a-zA-Z0-9\s\&\-\.\,]+$/;
    if (!nameRegex.test(name)) {
      return 'Shop name can only contain letters, numbers, spaces, and & - . ,';
    }
    return '';
  };

  const validateTekmetricId = (id) => {
    if (!id || !id.trim()) {
      return 'Tekmetric Shop ID is required';
    }
    if (id.trim().length < 1) {
      return 'Tekmetric Shop ID must be at least 1 character long';
    }
    if (id.trim().length > 50) {
      return 'Tekmetric Shop ID must not exceed 50 characters';
    }
    // Allow alphanumeric and hyphens
    const idRegex = /^[a-zA-Z0-9\-]+$/;
    if (!idRegex.test(id)) {
      return 'Tekmetric Shop ID can only contain letters, numbers, and hyphens';
    }
    return '';
  };

  const validateStreetAddress = (address) => {
    if (!address || !address.trim()) {
      return 'Street address is required';
    }
    if (address.trim().length < 5) {
      return 'Street address must be at least 5 characters long';
    }
    if (address.trim().length > 200) {
      return 'Street address must not exceed 200 characters';
    }
    return '';
  };

  const validateCity = (city) => {
    if (!city || !city.trim()) {
      return 'City is required';
    }
    if (city.trim().length < 2) {
      return 'City must be at least 2 characters long';
    }
    if (city.trim().length > 100) {
      return 'City must not exceed 100 characters';
    }
    // Allow letters, spaces, and hyphens for city names
    const cityRegex = /^[a-zA-Z\s\-\.]+$/;
    if (!cityRegex.test(city)) {
      return 'City can only contain letters, spaces, hyphens, and periods';
    }
    return '';
  };

  const validateState = (state) => {
    if (!state || !state.trim()) {
      return 'State is required';
    }
    const upperState = state.trim().toUpperCase();
    if (!usStates.includes(upperState)) {
      return 'Please enter a valid US state code (e.g., CA, NY, TX)';
    }
    return '';
  };

  const validateTimezone = (timezone) => {
    if (!timezone) {
      return 'Timezone is required';
    }
    if (!timezones.includes(timezone)) {
      return 'Please select a valid timezone';
    }
    return '';
  };

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (user?.brand_id) {
      fetchData();
    }
  }, [dispatch, user?.brand_id]);

  const fetchData = async () => {
    setIsInitialLoad(true);
    try {
      await Promise.all([
        dispatch(getShopsByBrand(user.brand_id)),
        dispatch(getDistrictsByBrand(user.brand_id))
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsInitialLoad(false);
    }
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const getDistrictName = (districtId) => {
    if (!districtId) return 'None';
    const district = districts.find(d => d.id === districtId);
    return district ? district.name : 'Unknown District';
  };

  // Check if shop name exists (for validation)
  const checkShopNameExists = (name, currentShopId = null) => {
    if (!name || !shops) return false;
    const exists = shops.some(shop => 
      shop.name.toLowerCase() === name.toLowerCase() && 
      (!currentShopId || shop.id !== currentShopId)
    );
    return exists;
  };

  // Check if Tekmetric ID exists (for validation)
  const checkTekmetricIdExists = (id, currentShopId = null) => {
    if (!id || !shops) return false;
    const exists = shops.some(shop => 
      shop.tekmetric_shop_id && 
      shop.tekmetric_shop_id.toLowerCase() === id.toLowerCase() && 
      (!currentShopId || shop.id !== currentShopId)
    );
    return exists;
  };

  // ============================================
  // CREATE SHOP VALIDATION
  // ============================================

  const validateCreateForm = () => {
    const nameError = validateShopName(formData.name);
    const tekmetricError = validateTekmetricId(formData.tekmetric_shop_id);
    const addressError = validateStreetAddress(formData.street_address);
    const cityError = validateCity(formData.city);
    const stateError = validateState(formData.state);
    const timezoneError = validateTimezone(formData.timezone);

    setValidationErrors({
      name: nameError,
      tekmetric_shop_id: tekmetricError,
      street_address: addressError,
      city: cityError,
      state: stateError,
      timezone: timezoneError
    });

    setFormErrors({
      name: !!nameError,
      tekmetric_shop_id: !!tekmetricError,
      street_address: !!addressError,
      city: !!cityError,
      state: !!stateError,
      timezone: !!timezoneError
    });

    // Check if any validation errors exist
    const hasErrors = nameError || tekmetricError || addressError || cityError || stateError || timezoneError;

    if (hasErrors) {
      const errorMessages = [];
      if (nameError) errorMessages.push(nameError);
      if (tekmetricError) errorMessages.push(tekmetricError);
      if (addressError) errorMessages.push(addressError);
      if (cityError) errorMessages.push(cityError);
      if (stateError) errorMessages.push(stateError);
      if (timezoneError) errorMessages.push(timezoneError);

      Swal.fire({
        icon: 'error',
        title: 'Validation Errors',
        html: `<ul style="text-align: left;">${errorMessages.map(msg => `<li>• ${msg}</li>`).join('')}</ul>`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      return false;
    }

    // Check for duplicates
    if (checkShopNameExists(formData.name)) {
      setFormError('A shop with this name already exists');
      Swal.fire({
        icon: 'error',
        title: 'Duplicate Shop Name',
        text: 'A shop with this name already exists. Please use a different name.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      return false;
    }

    if (checkTekmetricIdExists(formData.tekmetric_shop_id)) {
      setFormError('A shop with this Tekmetric ID already exists');
      Swal.fire({
        icon: 'error',
        title: 'Duplicate Tekmetric ID',
        text: 'A shop with this Tekmetric ID already exists. Please use a different ID.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      return false;
    }

    return true;
  };

  // ============================================
  // EDIT SHOP VALIDATION
  // ============================================

  const validateEditForm = () => {
    const nameError = validateShopName(editFormData.name);
    const tekmetricError = validateTekmetricId(editFormData.tekmetric_shop_id);
    const addressError = validateStreetAddress(editFormData.street_address);
    const cityError = validateCity(editFormData.city);
    const stateError = validateState(editFormData.state);
    const timezoneError = validateTimezone(editFormData.timezone);

    setEditValidationErrors({
      name: nameError,
      tekmetric_shop_id: tekmetricError,
      street_address: addressError,
      city: cityError,
      state: stateError,
      timezone: timezoneError
    });

    setEditFormErrors({
      name: !!nameError,
      tekmetric_shop_id: !!tekmetricError,
      street_address: !!addressError,
      city: !!cityError,
      state: !!stateError,
      timezone: !!timezoneError
    });

    // Check if any validation errors exist
    const hasErrors = nameError || tekmetricError || addressError || cityError || stateError || timezoneError;

    if (hasErrors) {
      const errorMessages = [];
      if (nameError) errorMessages.push(nameError);
      if (tekmetricError) errorMessages.push(tekmetricError);
      if (addressError) errorMessages.push(addressError);
      if (cityError) errorMessages.push(cityError);
      if (stateError) errorMessages.push(stateError);
      if (timezoneError) errorMessages.push(timezoneError);

      Swal.fire({
        icon: 'error',
        title: 'Validation Errors',
        html: `<ul style="text-align: left;">${errorMessages.map(msg => `<li>• ${msg}</li>`).join('')}</ul>`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      return false;
    }

    // Check for duplicates (excluding current shop)
    const originalShop = shops.find(s => s.id === showEditModal);
    
    if (editFormData.name !== originalShop?.name && checkShopNameExists(editFormData.name, showEditModal)) {
      setFormError('A shop with this name already exists');
      Swal.fire({
        icon: 'error',
        title: 'Duplicate Shop Name',
        text: 'A shop with this name already exists. Please use a different name.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      return false;
    }

    if (editFormData.tekmetric_shop_id !== originalShop?.tekmetric_shop_id && 
        checkTekmetricIdExists(editFormData.tekmetric_shop_id, showEditModal)) {
      setFormError('A shop with this Tekmetric ID already exists');
      Swal.fire({
        icon: 'error',
        title: 'Duplicate Tekmetric ID',
        text: 'A shop with this Tekmetric ID already exists. Please use a different ID.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
      return false;
    }

    return true;
  };

  // ============================================
  // CREATE SHOP
  // ============================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    // Validate all fields
    if (!validateCreateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create shop only - no manager creation
      const shopData = {
        name: formData.name.trim(),
        brand_id: user.brand_id,
        district_id: formData.district_id || null,
        tekmetric_shop_id: formData.tekmetric_shop_id.trim(),
        street_address: formData.street_address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim().toUpperCase(),
        timezone: formData.timezone,
        is_active: formData.is_active
      };

      const shopResult = await dispatch(createShop(shopData)).unwrap();
      
      if (shopResult.success) {
        // Show success popup
        Swal.fire({
          icon: 'success',
          title: 'Shop Created Successfully!',
          html: `
            <div style="text-align: left;">
              <p><strong>Shop:</strong> ${formData.name.trim()}</p>
              <p><strong>Tekmetric ID:</strong> ${formData.tekmetric_shop_id.trim()}</p>
              <p><strong>Location:</strong> ${formData.city.trim()}, ${formData.state.trim().toUpperCase()}</p>
              <p><strong>Timezone:</strong> ${formData.timezone}</p>
              <p><strong>District:</strong> ${formData.district_id ? getDistrictName(formData.district_id) : 'None'}</p>
            </div>
          `,
          confirmButtonText: 'OK',
          confirmButtonColor: '#4CAF50',
          width: '500px'
        });

        resetForm();
        dispatch(getShopsByBrand(user.brand_id));
        setTimeout(() => {
          setShowCreateForm(false);
        }, 100);
      }
    } catch (err) {
      console.error('Shop creation failed:', err);
      setFormError(err?.error || 'Failed to create shop. Please try again.');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.error || 'Failed to create shop. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // EDIT SHOP
  // ============================================

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Validate all fields
    if (!validateEditForm()) {
      return;
    }

    try {
      // Prepare update data
      const updateData = {
        name: editFormData.name.trim(),
        tekmetric_shop_id: editFormData.tekmetric_shop_id.trim(),
        street_address: editFormData.street_address.trim(),
        city: editFormData.city.trim(),
        state: editFormData.state.trim().toUpperCase(),
        timezone: editFormData.timezone,
        is_active: editFormData.is_active
      };

      // Handle district_id properly - send null for "None", otherwise send the ID
      if (editFormData.district_id && editFormData.district_id !== '') {
        updateData.district_id = editFormData.district_id;
      } else {
        updateData.district_id = null;
      }

      const result = await dispatch(updateShop({
        id: showEditModal,
        data: updateData
      })).unwrap();

      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Shop updated successfully!',
          confirmButtonText: 'OK',
          confirmButtonColor: '#4CAF50',
          timer: 2000
        });
        
        resetEditForm();
        await dispatch(getShopsByBrand(user.brand_id));
        
        setTimeout(() => {
          setShowEditModal(null);
        }, 100);
      }
      
    } catch (err) {
      console.error('Shop update failed:', err);
      setFormError(err?.error || 'Failed to update shop. Please try again.');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.error || 'Failed to update shop. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    }
  };

  // Toggle shop status
  const handleToggleStatus = async (shop) => {
    try {
      const updateData = {
        name: shop.name,
        district_id: shop.district_id,
        tekmetric_shop_id: shop.tekmetric_shop_id,
        street_address: shop.street_address,
        city: shop.city,
        state: shop.state,
        timezone: shop.timezone,
        is_active: !shop.is_active
      };

      await dispatch(updateShop({
        id: shop.id,
        data: updateData
      })).unwrap();

      dispatch(getShopsByBrand(user.brand_id));
      
      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: `${shop.name} has been ${!shop.is_active ? 'activated' : 'deactivated'} successfully.`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#4CAF50',
        timer: 2000
      });
    } catch (err) {
      console.error('Failed to toggle shop status:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update shop status.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    }
  };

  // ============================================
  // FORM HANDLERS
  // ============================================

  const resetForm = () => {
    setFormData({
      name: '',
      street_address: '',
      city: '',
      state: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      tekmetric_shop_id: '',
      district_id: '',
      is_active: true
    });
    setFormErrors({
      name: false,
      street_address: false,
      city: false,
      state: false,
      timezone: false,
      tekmetric_shop_id: false
    });
    setValidationErrors({
      name: '',
      street_address: '',
      city: '',
      state: '',
      timezone: '',
      tekmetric_shop_id: ''
    });
  };

  const resetEditForm = () => {
    setEditFormData({});
    setEditFormErrors({
      name: false,
      street_address: false,
      city: false,
      state: false,
      timezone: false,
      tekmetric_shop_id: false
    });
    setEditValidationErrors({
      name: '',
      street_address: '',
      city: '',
      state: '',
      timezone: '',
      tekmetric_shop_id: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Real-time validation
    let error = '';
    if (name === 'name') error = validateShopName(value);
    else if (name === 'tekmetric_shop_id') error = validateTekmetricId(value);
    else if (name === 'street_address') error = validateStreetAddress(value);
    else if (name === 'city') error = validateCity(value);
    else if (name === 'state') error = validateState(value);
    else if (name === 'timezone') error = validateTimezone(value);

    setValidationErrors(prev => ({ ...prev, [name]: error }));
    setFormErrors(prev => ({ ...prev, [name]: !!error }));
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Real-time validation
    let error = '';
    if (name === 'name') error = validateShopName(value);
    else if (name === 'tekmetric_shop_id') error = validateTekmetricId(value);
    else if (name === 'street_address') error = validateStreetAddress(value);
    else if (name === 'city') error = validateCity(value);
    else if (name === 'state') error = validateState(value);
    else if (name === 'timezone') error = validateTimezone(value);

    setEditValidationErrors(prev => ({ ...prev, [name]: error }));
    setEditFormErrors(prev => ({ ...prev, [name]: !!error }));
  };

  const handleEdit = (shop) => {
    setShowEditModal(shop.id);
    setEditFormData({
      name: shop.name,
      street_address: shop.street_address || '',
      city: shop.city || '',
      state: shop.state || '',
      timezone: shop.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      tekmetric_shop_id: shop.tekmetric_shop_id || '',
      district_id: shop.district_id || '',
      is_active: shop.is_active
    });
    setEditFormErrors({
      name: false,
      street_address: false,
      city: false,
      state: false,
      timezone: false,
      tekmetric_shop_id: false
    });
    setEditValidationErrors({
      name: '',
      street_address: '',
      city: '',
      state: '',
      timezone: '',
      tekmetric_shop_id: ''
    });
    setFormError('');
  };

  // Check if edit form has changes
  const hasEditChanges = () => {
    const originalShop = shops.find(s => s.id === showEditModal);
    if (!originalShop) return false;
    
    return (
      editFormData.name !== originalShop.name ||
      editFormData.street_address !== originalShop.street_address ||
      editFormData.city !== originalShop.city ||
      editFormData.state !== originalShop.state ||
      editFormData.timezone !== originalShop.timezone ||
      editFormData.tekmetric_shop_id !== originalShop.tekmetric_shop_id ||
      editFormData.district_id !== originalShop.district_id ||
      editFormData.is_active !== originalShop.is_active
    );
  };

  // Show skeleton during initial load
  if (isInitialLoad && loading) {
    return (
      <div className="transition-opacity duration-300 ease-in-out">
        <HeaderSkeleton />
        {showCreateForm && <FormSkeleton />}
        <TableSkeleton />
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="transition-opacity duration-300 ease-in-out">
      {/* Create Shop Button */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-800">All Shops</h2>
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
            {shops?.length || 0} Shops
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
          {showCreateForm ? 'Cancel' : 'New Shop'}
        </button>
      </div>

      {/* Create Shop Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-blue-600 mb-4">Create New Shop</h2>
          
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
            <div className="space-y-6">
              {/* Shop Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Shop Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shop Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter shop name"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tekmetric Shop ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="tekmetric_shop_id"
                      value={formData.tekmetric_shop_id}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.tekmetric_shop_id ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter Tekmetric Shop ID"
                      maxLength={50}
                      required
                    />
                    {formErrors.tekmetric_shop_id && (
                      <p className="mt-1 text-xs text-red-600">{validationErrors.tekmetric_shop_id}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="street_address"
                    value={formData.street_address}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.street_address ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Street address"
                    maxLength={200}
                    required
                  />
                  {formErrors.street_address && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.street_address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.city ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="City"
                      maxLength={100}
                      required
                    />
                    {formErrors.city && (
                      <p className="mt-1 text-xs text-red-600">{validationErrors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.state ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="State (e.g., CA, NY)"
                      maxLength={2}
                      required
                    />
                    {formErrors.state && (
                      <p className="mt-1 text-xs text-red-600">{validationErrors.state}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Enter 2-letter state code
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.timezone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                  >
                    {timezones.map(tz => (
                      <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                    ))}
                  </select>
                  {formErrors.timezone && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.timezone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <select
                    name="district_id"
                    value={formData.district_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None (Shop without district)</option>
                    {districts.map(district => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    District is optional for shops
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
                disabled={isSubmitting || Object.values(formErrors).some(error => error)}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isSubmitting || Object.values(formErrors).some(error => error)
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSubmitting ? 'Creating Shop...' : 'Create Shop'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Shops Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading && !isInitialLoad ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                    District
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
                {shops.map((shop) => {
                  return (
                    <tr key={shop.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center mr-4 border bg-gray-100">
                            <img 
                              src={DEFAULT_SHOP_IMAGE}
                              alt={shop.name}
                              className="w-8 h-8 opacity-50"
                            />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{shop.name}</div>
                            <div className="text-xs font-medium text-blue-600">
                              Tekmetric ID: {shop.tekmetric_shop_id || 'Not Set'}
                            </div>
                            <div className="text-xs text-gray-400">{shop.timezone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{shop.street_address}</div>
                        <div className="text-sm text-gray-500">{shop.city}, {shop.state}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getDistrictName(shop.district_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          shop.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {shop.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(shop)}
                            className="px-3 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(shop)}
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
            <img 
              src={DEFAULT_SHOP_IMAGE}
              alt="No shops" 
              className="w-16 h-16 mx-auto mb-4 opacity-50"
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Shops Found</h3>
            <p className="text-gray-500 mb-4">Create your first shop to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Create First Shop
            </button>
          </div>
        )}
      </div>

      {/* Edit Shop Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-blue-600 mb-4">Edit Shop</h2>
              
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
              
              <form onSubmit={handleEditSubmit} noValidate>
                <div className="space-y-6">
                  {/* Shop Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Shop Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Shop Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={editFormData.name || ''}
                          onChange={handleEditInputChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            editFormErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="Enter shop name"
                          maxLength={100}
                          required
                        />
                        {editFormErrors.name && (
                          <p className="mt-1 text-xs text-red-600">{editValidationErrors.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tekmetric Shop ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="tekmetric_shop_id"
                          value={editFormData.tekmetric_shop_id || ''}
                          onChange={handleEditInputChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            editFormErrors.tekmetric_shop_id ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="Enter Tekmetric Shop ID"
                          maxLength={50}
                          required
                        />
                        {editFormErrors.tekmetric_shop_id && (
                          <p className="mt-1 text-xs text-red-600">{editValidationErrors.tekmetric_shop_id}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="street_address"
                        value={editFormData.street_address || ''}
                        onChange={handleEditInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          editFormErrors.street_address ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Street address"
                        maxLength={200}
                        required
                      />
                      {editFormErrors.street_address && (
                        <p className="mt-1 text-xs text-red-600">{editValidationErrors.street_address}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={editFormData.city || ''}
                          onChange={handleEditInputChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            editFormErrors.city ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="City"
                          maxLength={100}
                          required
                        />
                        {editFormErrors.city && (
                          <p className="mt-1 text-xs text-red-600">{editValidationErrors.city}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={editFormData.state || ''}
                          onChange={handleEditInputChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            editFormErrors.state ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="State (e.g., CA, NY)"
                          maxLength={2}
                          required
                        />
                        {editFormErrors.state && (
                          <p className="mt-1 text-xs text-red-600">{editValidationErrors.state}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timezone <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="timezone"
                        value={editFormData.timezone || ''}
                        onChange={handleEditInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          editFormErrors.timezone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      >
                        {timezones.map(tz => (
                          <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                        ))}
                      </select>
                      {editFormErrors.timezone && (
                        <p className="mt-1 text-xs text-red-600">{editValidationErrors.timezone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        District
                      </label>
                      <select
                        name="district_id"
                        value={editFormData.district_id || ''}
                        onChange={handleEditInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">None (Shop without district)</option>
                        {districts.map(district => (
                          <option key={district.id} value={district.id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
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
                    disabled={Object.values(editFormErrors).some(error => error) || !hasEditChanges()}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      Object.values(editFormErrors).some(error => error) || !hasEditChanges()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
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