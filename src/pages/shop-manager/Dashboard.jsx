// src/pages/shop-manager/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectCurrentUser,
  selectUsersByShopId,
  getUsersByShopId,
  selectUserLoading,
  createUser
} from '../../redux/slice/userSlice';
import { 
  selectShopById,
  getShopById
} from '../../redux/slice/shopSlice';
import { selectBrandById } from '../../redux/slice/brandSlice';
import LogoutButton from '../../components/common/LogoutButton';

const ShopManagerDashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const shop = useSelector((state) => selectShopById(user?.shop_id)(state));
  const brand = useSelector((state) => selectBrandById(user?.brand_id)(state));
  const technicians = useSelector((state) => selectUsersByShopId(user?.shop_id)(state));
  const loading = useSelector(selectUserLoading);
  
  // Technician creation form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [techFirstName, setTechFirstName] = useState('');
  const [techLastName, setTechLastName] = useState('');
  const [techEmail, setTechEmail] = useState('');
  const [techPassword, setTechPassword] = useState('');
  const [techContact, setTechContact] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user?.shop_id) {
      dispatch(getShopById(user.shop_id));
      dispatch(getUsersByShopId(user.shop_id));
    }
  }, [user?.shop_id, dispatch]);

  const getTechniciansCount = () => {
    if (!technicians || !Array.isArray(technicians)) return 0;
    return technicians.filter(tech => tech.role === 'technician').length;
  };

  const handleCreateTechnician = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setCreating(true);

    try {
      const techData = {
        first_name: techFirstName,
        last_name: techLastName,
        email: techEmail,
        password: techPassword,
        contact_no: techContact,
        role: 'technician',
        brand_id: user?.brand_id,
        shop_id: user?.shop_id,
        is_active: true
      };

      const result = await dispatch(createUser(techData)).unwrap();
      
      if (result.success) {
        setFormSuccess('Technician created successfully!');
        
        // Reset form
        setTechFirstName('');
        setTechLastName('');
        setTechEmail('');
        setTechPassword('');
        setTechContact('');
        
        // Refresh technicians list
        dispatch(getUsersByShopId(user.shop_id));
        
        // Hide form after 2 seconds
        setTimeout(() => {
          setShowCreateForm(false);
        }, 2000);
      }
    } catch (err) {
      setFormError(err?.error || 'Failed to create technician. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
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
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-blue-100">
              {shop ? shop.name : 'Loading shop...'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="bg-red-500 px-3 py-1 rounded-full text-sm">
              Shop Manager
            </span>
            <span className="hidden md:inline">{user?.first_name} {user?.last_name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto p-4 md:p-6">
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-blue-600 mb-2">
              Welcome, {user?.first_name}!
            </h2>
            <p className="text-gray-600">
              Managing <strong>{shop?.name || 'your shop'}</strong>
              {brand?.name && ` under ${brand.name}`}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Shop Status</h3>
              <p className={`text-lg font-medium ${shop?.is_active ? 'text-green-600' : 'text-red-600'}`}>
                {shop?.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Technicians</h3>
              <p className="text-2xl font-bold text-blue-600">{getTechniciansCount()}</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Brand</h3>
              <p className="text-lg font-medium text-gray-800">{brand?.name || 'N/A'}</p>
            </div>
          </div>

          {/* Shop Info */}
          {shop && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Shop Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shop.address && (
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-gray-800">{shop.address}</p>
                  </div>
                )}
                {shop.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-800">{shop.phone}</p>
                  </div>
                )}
                {shop.city && (
                  <div>
                    <p className="text-sm text-gray-500">City</p>
                    <p className="text-gray-800">{shop.city}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Manage Technicians Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Technicians</h3>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                {showCreateForm ? 'Cancel' : '+ New Technician'}
              </button>
            </div>

            {/* Create Technician Form */}
            {showCreateForm && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-700 mb-3">Add New Technician</h4>
                
                {formError && (
                  <div className="mb-3 p-2 bg-red-50 text-red-600 rounded-lg text-sm">
                    {formError}
                  </div>
                )}
                
                {formSuccess && (
                  <div className="mb-3 p-2 bg-green-50 text-green-600 rounded-lg text-sm">
                    {formSuccess}
                  </div>
                )}
                
                <form onSubmit={handleCreateTechnician}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={techFirstName}
                        onChange={(e) => setTechFirstName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="First name"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={techLastName}
                        onChange={(e) => setTechLastName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Last name"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={techEmail}
                      onChange={(e) => setTechEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="technician@example.com"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={techPassword}
                      onChange={(e) => setTechPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter password"
                      required
                      minLength="6"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      value={techContact}
                      onChange={(e) => setTechContact(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+1234567890"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={creating}
                    className={`w-full py-2 rounded-lg font-medium ${
                      creating ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    } text-white transition`}
                  >
                    {creating ? 'Creating...' : 'Create Technician'}
                  </button>
                </form>
              </div>
            )}

            {/* Technicians List */}
            {loading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading technicians...</p>
              </div>
            ) : technicians && technicians.filter(t => t.role === 'technician').length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {technicians
                      .filter(tech => tech.role === 'technician')
                      .map((tech) => (
                        <tr key={tech.id}>
                          <td className="px-4 py-3">
                            {tech.first_name} {tech.last_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {tech.email}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              tech.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {tech.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-2.5a5.5 5.5 0 01-8.9 4.5" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Technicians Yet</h4>
                <p className="text-gray-500 mb-4">Add your first technician to get started</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Add First Technician
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Simple Note */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-700 text-sm">
            You are responsible for managing technicians and daily operations in your shop.
          </p>
        </div>
      </main>
    </div>
  );
};

export default ShopManagerDashboard;