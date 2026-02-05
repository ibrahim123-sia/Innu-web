import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAllShops } from '../../redux/slice/shopSlice';
import { selectAllOrders } from '../../redux/slice/orderSlice';
import { selectAllUsers } from '../../redux/slice/userSlice';
import { selectAllDistricts } from '../../redux/slice/districtSlice';

// Default images (should match the ones in Brands.jsx)
const DEFAULT_BRAND_LOGO = 'https://cdn-icons-png.flaticon.com/512/891/891419.png'; // Building icon
const DEFAULT_PROFILE_PIC = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; // User icon

const BrandDetailModal = ({ brandId, onClose }) => {
  const brands = useSelector(state => state.brand.brands);
  const shops = useSelector(selectAllShops);
  const orders = useSelector(selectAllOrders);
  const users = useSelector(selectAllUsers);
  const districts = useSelector(selectAllDistricts);

  const [loading, setLoading] = useState(true);

  const brand = brands?.find(b => b.id === brandId);
  const brandShops = shops?.filter(shop => shop.brand_id === brandId) || [];
  const brandOrders = orders?.filter(order => order.brand_id === brandId) || [];
  const brandUsers = users?.filter(user => user.brand_id === brandId) || [];
  const brandDistricts = districts?.filter(district => district.brand_id === brandId) || [];
  
  // Find the brand admin
  const brandAdmin = brandUsers.find(user => user.role === 'brand_admin') || {};

  // Helper function to get brand logo with fallback
  const getBrandLogo = () => {
    if (brand?.logo_url && brand.logo_url.trim() !== '') {
      return brand.logo_url;
    }
    return DEFAULT_BRAND_LOGO;
  };

  // Helper function to get admin profile pic with fallback
  const getAdminProfilePic = () => {
    if (brandAdmin?.profile_pic_url && brandAdmin.profile_pic_url.trim() !== '') {
      return brandAdmin.profile_pic_url;
    }
    return DEFAULT_PROFILE_PIC;
  };

  useEffect(() => {
    if (brand) {
      setLoading(false);
    }
  }, [brand]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002868] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading brand details...</p>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Brand Not Found</h3>
          <p className="text-gray-500 mb-4">The brand you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#002868] text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const brandLogo = getBrandLogo();
  const adminProfilePic = getAdminProfilePic();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden border bg-gray-100">
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
              <h2 className="text-2xl font-bold text-gray-800">{brand.name}</h2>
              <p className="text-gray-600">Brand Details</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  brand.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {brand.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-gray-500">
                  Created: {new Date(brand.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm text-blue-600 font-medium">Shops</h3>
              <p className="text-2xl font-bold text-blue-700 mt-1">{brandShops.length}</p>
              <p className="text-xs text-blue-600">
                {brandShops.filter(s => s.is_active).length} Active
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm text-green-600 font-medium">Users</h3>
              <p className="text-2xl font-bold text-green-700 mt-1">{brandUsers.length}</p>
              <p className="text-xs text-green-600">
                {brandUsers.filter(u => u.is_active).length} Active
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm text-purple-600 font-medium">Districts</h3>
              <p className="text-2xl font-bold text-purple-700 mt-1">{brandDistricts.length}</p>
              <p className="text-xs text-purple-600">
                {brandDistricts.filter(d => d.is_active).length} Active
              </p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm text-yellow-600 font-medium">Orders</h3>
              <p className="text-2xl font-bold text-yellow-700 mt-1">{brandOrders.length}</p>
              <p className="text-xs text-yellow-600">Total requests</p>
            </div>
          </div>

          {/* Brand & Admin Images Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Brand Logo Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800">Brand Logo</h3>
              <div className="flex items-center space-x-4">
                <div className="w-32 h-32 rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center">
                  <img 
                    src={brandLogo}
                    alt={brand.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.src = DEFAULT_BRAND_LOGO;
                    }}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900">Logo Status:</p>
                  <p className={brand.logo_url && brand.logo_url !== DEFAULT_BRAND_LOGO ? 'text-green-600' : 'text-yellow-600'}>
                    {brand.logo_url && brand.logo_url !== DEFAULT_BRAND_LOGO ? 'Custom logo uploaded' : 'Using default logo'}
                  </p>
                  {brand.logo_url && brand.logo_url !== DEFAULT_BRAND_LOGO && (
                    <a 
                      href={brand.logo_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#002868] hover:underline mt-2 inline-block text-sm"
                    >
                      View Logo
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Profile Picture Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800">Brand Admin</h3>
              {brandAdmin.id ? (
                <div className="flex items-center space-x-4">
                  <div className="w-32 h-32 rounded-full overflow-hidden border bg-gray-100">
                    <img 
                      src={adminProfilePic}
                      alt={`${brandAdmin.first_name} ${brandAdmin.last_name}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = DEFAULT_PROFILE_PIC;
                      }}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-lg">
                      {brandAdmin.first_name} {brandAdmin.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{brandAdmin.email}</p>
                    <p className="text-sm text-gray-600">{brandAdmin.contact_no || 'No contact number'}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        brandAdmin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {brandAdmin.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Role: {brandAdmin.role?.replace('_', ' ') || 'Brand Admin'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {brandAdmin.profile_pic_url && brandAdmin.profile_pic_url !== DEFAULT_PROFILE_PIC 
                        ? 'Custom profile picture' 
                        : 'Default profile picture'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <div className="w-32 h-32 rounded-full overflow-hidden border bg-gray-100 flex items-center justify-center">
                    <img 
                      src={DEFAULT_PROFILE_PIC}
                      alt="No admin"
                      className="w-20 h-20 opacity-50"
                    />
                  </div>
                  <div>
                    <p className="text-gray-500 italic">No admin assigned to this brand</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Assign an admin in the Brands page
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shops List */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Shops ({brandShops.length})</h3>
              {brandShops.length > 0 && (
                <span className="text-sm text-gray-500">
                  {brandShops.filter(s => s.is_active).length} active shops
                </span>
              )}
            </div>
            {brandShops.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tekmetric ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {brandShops.slice(0, 5).map((shop) => (
                      <tr key={shop.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{shop.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {shop.city}{shop.state ? `, ${shop.state}` : ''}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                          {shop.tekmetric_shop_id || 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            shop.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {shop.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {brandShops.length > 5 && (
                  <p className="text-sm text-gray-500 mt-2 px-4">
                    Showing 5 of {brandShops.length} shops
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-gray-500 italic">No shops found for this brand</p>
                <p className="text-sm text-gray-400 mt-1">Add shops in the Shops management section</p>
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Recent Orders</h3>
              {brandOrders.length > 0 && (
                <span className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleDateString()}
                </span>
              )}
            </div>
            {brandOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {brandOrders.slice(0, 5).map((order) => {
                      const vehicleInfo = order.vehicle_info || {};
                      return (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            #{order.tekmetric_ro_id || order.id.slice(0, 8)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {order.customer_name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {vehicleInfo.year ? `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}` : 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {order.status || 'in_progress'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {brandOrders.length > 5 && (
                  <p className="text-sm text-gray-500 mt-2 px-4">
                    Showing 5 of {brandOrders.length} orders
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500 italic">No orders found for this brand</p>
                <p className="text-sm text-gray-400 mt-1">Orders will appear here when shops start creating them</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandDetailModal;