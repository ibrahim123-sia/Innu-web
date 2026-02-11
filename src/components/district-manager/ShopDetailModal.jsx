import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAllShops } from '../../redux/slice/shopSlice';
import { selectAllOrders } from '../../redux/slice/orderSlice';
import { selectAllUsers } from '../../redux/slice/userSlice';
import { selectVideos } from '../../redux/slice/videoSlice';

const DEFAULT_PROFILE_PIC = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
const DEFAULT_SHOP_IMAGE = 'https://cdn-icons-png.flaticon.com/512/891/891419.png';

const ShopDetailModal = ({ shopId, onClose }) => {
  const shops = useSelector(selectAllShops);
  const orders = useSelector(selectAllOrders);
  const users = useSelector(selectAllUsers);
  const videos = useSelector(selectVideos);
  
  const [loading, setLoading] = useState(true);

  const shop = shops?.find(s => s.id === shopId);
  const shopOrders = orders?.filter(order => order.shop_id === shopId) || [];
  const shopUsers = users?.filter(user => user.shop_id === shopId) || [];
  const shopVideos = videos?.filter(video => video.shop_id === shopId) || [];
  
  // Find the shop manager
  const shopManager = shopUsers.find(user => user.role === 'shop_manager') || {};

  // Helper function to get manager profile pic with fallback
  const getManagerProfilePic = () => {
    if (shopManager?.profile_pic_url && shopManager.profile_pic_url.trim() !== '') {
      return shopManager.profile_pic_url;
    }
    return DEFAULT_PROFILE_PIC;
  };

  // Get shop stats
  const getShopStats = () => {
    const totalOrders = shopOrders.length;
    const totalVideos = shopVideos.length;
    const totalUsers = shopUsers.length;
    const activeUsers = shopUsers.filter(u => u.is_active).length;
    
    // Calculate video stats based on status
    const uploadedVideos = shopVideos.filter(v => v.status === 'uploaded').length;
    const processingVideos = shopVideos.filter(v => v.status === 'processing').length;
    const completedVideos = shopVideos.filter(v => v.status === 'completed').length;
    const failedVideos = shopVideos.filter(v => v.status === 'failed').length;
    
    return {
      totalOrders,
      totalVideos,
      totalUsers,
      activeUsers,
      uploadedVideos,
      processingVideos,
      completedVideos,
      failedVideos,
      completionRate: totalVideos > 0 ? ((completedVideos / totalVideos) * 100).toFixed(1) : 0
    };
  };

  useEffect(() => {
    if (shop) {
      setLoading(false);
    }
  }, [shop]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shop details...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
          <div className="text-primary-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Shop Not Found</h3>
          <p className="text-gray-500 mb-4">The shop you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-dark transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const managerProfilePic = getManagerProfilePic();
  const stats = getShopStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center">
              <img 
                src={DEFAULT_SHOP_IMAGE}
                alt={shop.name}
                className="w-12 h-12 opacity-50"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{shop.name}</h2>
              <p className="text-gray-600">Shop Details</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  shop.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {shop.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-gray-500">
                  Tekmetric ID: {shop.tekmetric_shop_id || 'N/A'}
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
            <div className="bg-primary-blue-50 p-4 rounded-lg">
              <h3 className="text-sm text-primary-blue-600 font-medium">Total Orders</h3>
              <p className="text-2xl font-bold text-primary-blue-700 mt-1">{stats.totalOrders}</p>
              <p className="text-xs text-primary-blue-600">All time orders</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm text-green-600 font-medium">Total Videos</h3>
              <p className="text-2xl font-bold text-green-700 mt-1">{stats.totalVideos}</p>
              <p className="text-xs text-green-600">
                {stats.completedVideos} completed
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm text-purple-600 font-medium">Users</h3>
              <p className="text-2xl font-bold text-purple-700 mt-1">{stats.totalUsers}</p>
              <p className="text-xs text-purple-600">
                {stats.activeUsers} Active
              </p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm text-yellow-600 font-medium">Location</h3>
              <p className="text-lg font-bold text-yellow-700 mt-1">
                {shop.city}{shop.state ? `, ${shop.state}` : ''}
              </p>
              <p className="text-xs text-yellow-600">{shop.address || 'No address'}</p>
            </div>
          </div>

          {/* Video Status Breakdown */}
          {stats.totalVideos > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Video Processing Status</h3>
                <span className="text-sm text-green-600 font-medium">
                  Completion Rate: {stats.completionRate}%
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-primary-blue-100 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-primary-blue-700 font-medium">Uploaded</p>
                      <p className="text-lg font-bold text-primary-blue-800">{stats.uploadedVideos}</p>
                    </div>
                    <svg className="w-8 h-8 text-primary-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-700 font-medium">Processing</p>
                      <p className="text-lg font-bold text-yellow-800">{stats.processingVideos}</p>
                    </div>
                    <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                <div className="bg-green-100 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700 font-medium">Completed</p>
                      <p className="text-lg font-bold text-green-800">{stats.completedVideos}</p>
                    </div>
                    <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                <div className="bg-primary-red-100 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-primary-red-700 font-medium">Failed</p>
                      <p className="text-lg font-bold text-primary-red-800">{stats.failedVideos}</p>
                    </div>
                    <svg className="w-8 h-8 text-primary-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Shop & Manager Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Shop Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800">Shop Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Shop Name</label>
                    <p className="text-gray-900">{shop.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="text-gray-900">{shop.address || 'Not specified'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">City</label>
                      <p className="text-gray-900">{shop.city || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">State</label>
                      <p className="text-gray-900">{shop.state || 'Not specified'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Zip Code</label>
                    <p className="text-gray-900">{shop.zip_code || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900">{shop.phone || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{shop.email || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tekmetric ID</label>
                    <p className="text-gray-900">{shop.tekmetric_shop_id || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Manager Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800">Shop Manager</h3>
              {shopManager.id ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden border bg-gray-100">
                      <img 
                        src={managerProfilePic}
                        alt={`${shopManager.first_name} ${shopManager.last_name}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = DEFAULT_PROFILE_PIC;
                        }}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-lg">
                        {shopManager.first_name} {shopManager.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{shopManager.email}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          shopManager.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {shopManager.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-xs text-gray-500">
                          Role: Shop Manager
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contact Number</label>
                      <p className="text-gray-900">{shopManager.contact_no || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Last Login</label>
                      <p className="text-gray-900">
                        {shopManager.last_login_at 
                          ? new Date(shopManager.last_login_at).toLocaleString() 
                          : 'Never logged in'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-8 rounded-lg text-center">
                  <div className="w-16 h-16 rounded-full overflow-hidden border bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                    <img 
                      src={DEFAULT_PROFILE_PIC}
                      alt="No manager"
                      className="w-12 h-12 opacity-50"
                    />
                  </div>
                  <p className="text-gray-500 italic">No manager assigned to this shop</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Assign a manager in the Shops page
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Recent Orders ({stats.totalOrders})</h3>
              {shopOrders.length > 0 && (
                <span className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleDateString()}
                </span>
              )}
            </div>
            {shopOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {shopOrders.slice(0, 5).map((order) => {
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
                          <td className="px-4 py-3 text-sm text-gray-500">
                            ${order.total_amount ? parseFloat(order.total_amount).toFixed(2) : '0.00'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {shopOrders.length > 5 && (
                  <p className="text-sm text-gray-500 mt-2 px-4">
                    Showing 5 of {shopOrders.length} orders
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500 italic">No orders found for this shop</p>
                <p className="text-sm text-gray-400 mt-1">Orders will appear here when created</p>
              </div>
            )}
          </div>

          {/* Recent Videos */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Recent Videos ({stats.totalVideos})</h3>
              {shopVideos.length > 0 && (
                <div className="flex space-x-2">
                  <span className="px-2 py-1 text-xs bg-primary-blue-100 text-primary-blue-800 rounded-full">
                    {stats.uploadedVideos} Uploaded
                  </span>
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                    {stats.processingVideos} Processing
                  </span>
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    {stats.completedVideos} Completed
                  </span>
                </div>
              )}
            </div>
            {shopVideos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Video ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {shopVideos.slice(0, 5).map((video) => {
                      const getStatusColor = (status) => {
                        switch(status) {
                          case 'uploaded': return 'bg-primary-blue-100 text-primary-blue-800';
                          case 'processing': return 'bg-yellow-100 text-yellow-800';
                          case 'completed': return 'bg-green-100 text-green-800';
                          case 'failed': return 'bg-primary-red-100 text-primary-red-800';
                          default: return 'bg-gray-100 text-gray-800';
                        }
                      };

                      const getStatusText = (status) => {
                        switch(status) {
                          case 'uploaded': return 'Uploaded';
                          case 'processing': return 'Processing';
                          case 'completed': return 'Completed';
                          case 'failed': return 'Failed';
                          default: return status || 'Unknown';
                        }
                      };

                      return (
                        <tr key={video.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {video.id?.slice(0, 8) || 'N/A'}...
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {video.order_id ? `#${video.order_id.slice(0, 8)}...` : 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(video.status)}`}>
                              {getStatusText(video.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {video.duration ? `${Math.round(video.duration)}s` : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {video.created_at ? new Date(video.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {shopVideos.length > 5 && (
                  <p className="text-sm text-gray-500 mt-2 px-4">
                    Showing 5 of {shopVideos.length} videos
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 italic">No videos found for this shop</p>
                <p className="text-sm text-gray-400 mt-1">Videos will appear here when created</p>
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

export default ShopDetailModal;