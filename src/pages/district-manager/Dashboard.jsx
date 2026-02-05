import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '../../redux/slice/userSlice';
import { 
  createShop,
  toggleShopStatus,
  selectShopLoading,
  selectShopError,
  getShopByDistrict,
  getDistrictShops
} from '../../redux/slice/shopSlice';
import { 
  createUser,
  getUsersByRole
} from '../../redux/slice/userSlice';
import { 
  getDistrictById 
} from '../../redux/slice/districtSlice';
import LogoutButton from '../../components/common/LogoutButton';

const DistrictManagerDashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  
  // Get district details from Redux state
  const districts = useSelector((state) => state.district.districts || []);
  const currentDistrict = useSelector((state) => state.district.currentDistrict);
  
  // Find user's district from districts array
  const userDistrict = user?.district_id 
    ? districts.find(district => district.id === user.district_id) || currentDistrict
    : null;
  
  // Get shops
  const allShops = useSelector((state) => state.shop.shops || []);
  const shopsByDistrict = useSelector((state) => state.shop.shopsByDistrict || []);
  
  // Filter shops by user's district_id
  const shops = user?.district_id 
    ? allShops.filter(shop => shop.district_id === user.district_id)
    : shopsByDistrict;
  
  const loading = useSelector(selectShopLoading);
  const error = useSelector(selectShopError);
  
  // Shop creation form with manager
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Shop details
  const [shopName, setShopName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [shopCity, setShopCity] = useState('');
  const [shopState, setShopState] = useState('');
  const [timezone, setTimezone] = useState('');
  const [tekmetricShopId, setTekmetricShopId] = useState('');
  
  // Manager details
  const [managerFirstName, setManagerFirstName] = useState('');
  const [managerLastName, setManagerLastName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPassword, setManagerPassword] = useState('');
  const [managerContact, setManagerContact] = useState('');
  
  // Form states
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [creating, setCreating] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(null);
  const [apiErrors, setApiErrors] = useState([]);

  // Get brand name from user or district
  const getBrandName = () => {
    if (userDistrict?.brand_name) return userDistrict.brand_name;
    if (user?.brand_name) return user.brand_name;
    return 'Your Brand';
  };

  // Get district name
  const getDistrictName = () => {
    if (userDistrict?.name) return userDistrict.name;
    if (user?.district_name) return user.district_name;
    return 'Your District';
  };

  // Timezone options
  const timezoneOptions = [
    { value: '', label: 'Select Timezone' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' }
  ];

  // State options
  const stateOptions = [
    { value: '', label: 'Select State' },
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.district_id) {
        setApiErrors(['No district assigned to your account.']);
        return;
      }

      console.log('Fetching data for District Manager with district_id:', user.district_id);
      setApiErrors([]);
      
      try {
        // Try to get district details - but note: District Managers may not have permission
        if (user.district_id) {
          try {
            await dispatch(getDistrictById(user.district_id)).unwrap();
          } catch (districtError) {
            console.warn('Failed to fetch district details:', districtError);
            // Don't add to errors - this is expected for District Managers
          }
        }
        
        // Try to get shops using different approaches
        if (user.district_id) {
          try {
            // Try the district-specific endpoint first
            await dispatch(getShopByDistrict(user.district_id)).unwrap();
          } catch (shopError1) {
            console.warn('Failed with district-specific shops:', shopError1);
            try {
              // Fallback to general district shops endpoint
              await dispatch(getDistrictShops()).unwrap();
            } catch (shopError2) {
              console.warn('Failed with general shops endpoint:', shopError2);
              setApiErrors(prev => [...prev, 'Failed to load shops. You can still create new shops.']);
            }
          }
        }
        
        // Try to get shop managers (optional)
        try {
          await dispatch(getUsersByRole('shop_manager')).unwrap();
        } catch (managerError) {
          console.warn('Failed to fetch shop managers:', managerError);
          // This is optional, so don't add to errors
        }
        
      } catch (error) {
        console.error('Error in data fetching:', error);
        setApiErrors(prev => [...prev, 'Data loading failed.']);
      }
    };

    fetchData();
  }, [user?.district_id, dispatch]);

  const getActiveShopsCount = () => {
    if (!shops || !Array.isArray(shops)) return 0;
    return shops.filter(shop => shop.is_active).length;
  };

  const getInactiveShopsCount = () => {
    if (!shops || !Array.isArray(shops)) return 0;
    return shops.filter(shop => !shop.is_active).length;
  };

  const handleCreateShopAndManager = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setCreating(true);
    setApiErrors([]);

    try {
      // Step 1: Create Shop
      const shopData = {
        name: shopName,
        street_address: streetAddress,
        city: shopCity,
        state: shopState,
        timezone: timezone,
        tekmetric_shop_id: tekmetricShopId || null,
        brand_id: user?.brand_id,
        district_id: user?.district_id,
        is_active: true
      };

      console.log('Creating shop with data:', shopData);

      const shopResult = await dispatch(createShop(shopData)).unwrap();
      
      if (shopResult.success) {
        const shopId = shopResult.data.id;
        
        // Step 2: Create Shop Manager
        const managerData = {
          first_name: managerFirstName,
          last_name: managerLastName,
          email: managerEmail,
          password: managerPassword,
          contact_no: managerContact,
          role: 'shop_manager',
          brand_id: user?.brand_id,
          district_id: user?.district_id,
          shop_id: shopId,  // Assign to the newly created shop
          is_active: true
        };

        console.log('Creating shop manager with data:', managerData);

        const managerResult = await dispatch(createUser(managerData)).unwrap();
        
        if (managerResult.success) {
          setFormSuccess('Shop and Manager created successfully!');
          
          // Reset form
          setShopName('');
          setStreetAddress('');
          setShopCity('');
          setShopState('');
          setTimezone('');
          setTekmetricShopId('');
          setManagerFirstName('');
          setManagerLastName('');
          setManagerEmail('');
          setManagerPassword('');
          setManagerContact('');
          
          // Refresh data
          try {
            await dispatch(getShopByDistrict(user.district_id)).unwrap();
          } catch (error) {
            console.warn('Failed to refresh shops:', error);
            try {
              await dispatch(getDistrictShops()).unwrap();
            } catch (error2) {
              console.error('Failed to refresh shops with fallback:', error2);
            }
          }
          
          // Get shop managers
          dispatch(getUsersByRole('shop_manager'));
          
          // Hide form after 2 seconds
          setTimeout(() => {
            setShowCreateForm(false);
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Create shop error:', err);
      setFormError(err?.error || err?.message || 'Failed to create shop and manager. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (shopId) => {
    setTogglingStatus(shopId);
    setApiErrors([]);
    try {
      const result = await dispatch(toggleShopStatus(shopId)).unwrap();
      if (result.success) {
        // Refresh shops
        try {
          await dispatch(getShopByDistrict(user.district_id)).unwrap();
        } catch (error) {
          console.warn('Failed to refresh shops:', error);
          try {
            await dispatch(getDistrictShops()).unwrap();
          } catch (error2) {
            console.error('Failed to refresh shops with fallback:', error2);
          }
        }
      }
    } catch (err) {
      console.error('Failed to toggle shop status:', err);
      setApiErrors(prev => [...prev, `Failed to toggle shop status: ${err?.error || err.message}`]);
    } finally {
      setTogglingStatus(null);
    }
  };

  // Display API errors
  const renderApiErrors = () => {
    if (apiErrors.length === 0) return null;
    
    return (
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Some data couldn't be loaded:</h3>
        <ul className="list-disc pl-5 text-yellow-700">
          {apiErrors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
        <p className="text-sm text-yellow-600 mt-2">
          You can still create new shops, but some information may be incomplete.
        </p>
      </div>
    );
  };

  // If user has no district assigned
  if (!user?.district_id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No District Assigned</h1>
          <p className="text-gray-600 mb-4">
            You are not assigned to any district. Please contact your Brand Admin.
          </p>
          <p className="text-sm text-gray-500">
            User ID: {user?.id} | Email: {user?.email} | Role: {user?.role}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">District Manager Dashboard</h1>
            <p className="text-blue-100">
              {getDistrictName()}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="bg-red-500 px-3 py-1 rounded-full text-sm">
              District Manager
            </span>
            <span className="hidden md:inline">{user?.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto p-4 md:p-6">
        {/* API Errors */}
        {renderApiErrors()}
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Total Shops</h3>
            <p className="text-2xl font-bold text-blue-600">{shops?.length || 0}</p>
            <p className="text-xs text-gray-500 mt-1">In your district</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Active Shops</h3>
            <p className="text-2xl font-bold text-green-600">{getActiveShopsCount()}</p>
            <p className="text-xs text-gray-500 mt-1">Currently operating</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Inactive Shops</h3>
            <p className="text-2xl font-bold text-red-600">{getInactiveShopsCount()}</p>
            <p className="text-xs text-gray-500 mt-1">Temporarily closed</p>
          </div>
        </div>

        {/* District Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-blue-600 mb-2">
              Welcome, {user?.first_name} {user?.last_name}!
            </h2>
            <p className="text-gray-600">
              You are managing <strong className="text-blue-700">{getDistrictName()}</strong>
              {getBrandName() && ` under ${getBrandName()}`}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Your Permissions</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Create shops in your district</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Assign shop managers</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Activate/deactivate shops</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>View district reports</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Manage technicians</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Account Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm text-gray-500">District ID:</span>
                  <span className="font-medium text-gray-800">{user?.district_id}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm text-gray-500">Brand ID:</span>
                  <span className="font-medium text-gray-800">{user?.brand_id}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm text-gray-500">Brand:</span>
                  <span className="font-medium text-gray-800">{getBrandName()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Status:</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    userDistrict?.is_active !== false
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {userDistrict?.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Manage Shops Section */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Shops Management</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Managing shops in <strong>{getDistrictName()}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                {showCreateForm ? 'Cancel' : '+ New Shop with Manager'}
              </button>
            </div>
          </div>

          {/* Create Shop with Manager Form */}
          {showCreateForm && (
            <div className="px-6 py-4 border-b bg-blue-50">
              <h3 className="font-semibold text-blue-700 mb-3">Create New Shop with Manager</h3>
              
              {formError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {formError}
                </div>
              )}
              
              {formSuccess && (
                <div className="mb-3 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">
                  {formSuccess}
                </div>
              )}
              
              <form onSubmit={handleCreateShopAndManager}>
                <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                  <p className="text-sm text-blue-800">
                    This shop will be created in <strong>{getDistrictName()}</strong> 
                    under <strong>{getBrandName()}</strong> brand. A shop manager will be assigned automatically.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Shop Section */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700 border-b pb-2">Shop Details</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Shop Name *
                      </label>
                      <input
                        type="text"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter shop name"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          value={shopCity}
                          onChange={(e) => setShopCity(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="City"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State *
                        </label>
                        <select
                          value={shopState}
                          onChange={(e) => setShopState(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          {stateOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timezone *
                      </label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        {timezoneOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address *
                      </label>
                      <textarea
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="123 Main St, Apt 4B"
                        rows="2"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tekmetric Shop ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={tekmetricShopId}
                        onChange={(e) => setTekmetricShopId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter Tekmetric Shop ID"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Only if integrated with Tekmetric system
                      </p>
                    </div>
                  </div>
                  
                  {/* Manager Section */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700 border-b pb-2">Shop Manager Details</h4>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={managerFirstName}
                          onChange={(e) => setManagerFirstName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          value={managerLastName}
                          onChange={(e) => setManagerLastName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        value={managerEmail}
                        onChange={(e) => setManagerEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="manager@example.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        value={managerPassword}
                        onChange={(e) => setManagerPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter password"
                        required
                        minLength="6"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum 6 characters
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        value={managerContact}
                        onChange={(e) => setManagerContact(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex space-x-3">
                  <button
                    type="submit"
                    disabled={creating}
                    className={`px-6 py-2 rounded-lg font-medium ${
                      creating ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    } text-white transition`}
                  >
                    {creating ? 'Creating...' : 'Create Shop & Manager'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-2 rounded-lg font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Shops List */}
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading shops...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium">Error loading shops</p>
              <p className="text-gray-600 text-sm mt-1">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry Loading
              </button>
            </div>
          ) : shops && shops.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shop Name
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shops.map((shop) => (
                    <tr key={shop.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{shop.name}</div>
                        {shop.tekmetric_shop_id && (
                          <div className="text-xs text-blue-600 mt-1">
                            Tekmetric ID: {shop.tekmetric_shop_id}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {shop.street_address || shop.address || 'No address provided'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {shop.city}, {shop.state}
                        </div>
                        {shop.timezone && (
                          <div className="text-xs text-gray-500">
                            {shop.timezone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {shop.manager_name ? (
                            <div>
                              <div className="font-medium text-gray-800">{shop.manager_name}</div>
                              <div className="text-xs text-gray-500">{shop.manager_email}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No manager assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          shop.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {shop.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleToggleStatus(shop.id)}
                          disabled={togglingStatus === shop.id}
                          className={`px-3 py-1 rounded text-sm ${
                            shop.is_active 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          } ${togglingStatus === shop.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {togglingStatus === shop.id ? (
                            <span className="flex items-center">
                              <svg className="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </span>
                          ) : shop.is_active ? (
                            'Deactivate'
                          ) : (
                            'Activate'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-3">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Shops Found</h3>
              <p className="text-gray-500 mb-4">
                {apiErrors.length > 0 
                  ? "Couldn't load shops from server. You can still create new shops."
                  : `Create your first shop in ${getDistrictName()}`
                }
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Create First Shop with Manager
              </button>
            </div>
          )}
        </div>

        {/* Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-700">
            You are managing shops in <strong>{getDistrictName()}</strong>.
            As a District Manager, you can create shops and assign shop managers in one step.
            {getBrandName() && ` All shops belong to ${getBrandName()} brand.`}
          </p>
        </div>
      </main>
    </div>
  );
};

export default DistrictManagerDashboard;