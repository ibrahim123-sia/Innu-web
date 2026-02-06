import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  getMyShop,
  selectMyShop
} from '../../redux/slice/shopSlice';
import {
  getOrdersByShop,
  selectOrdersByShop
} from '../../redux/slice/orderSlice';
import {
  selectAllUsers,
  getUsersByShopId
} from '../../redux/slice/userSlice';
import {
  getAllVideos,
  selectVideos
} from '../../redux/slice/videoSlice';

const DEFAULT_PROFILE_PIC = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

const Analytics = () => {
  const dispatch = useDispatch();
  const myShop = useSelector(selectMyShop);
  const orders = useSelector(selectOrdersByShop);
  const shopUsers = useSelector(selectAllUsers);
  const videos = useSelector(selectVideos);
  
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userVideos, setUserVideos] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const shopResult = await dispatch(getMyShop()).unwrap();
      
      if (shopResult.data) {
        const shopId = shopResult.data.id;
        await Promise.all([
          dispatch(getOrdersByShop(shopId)),
          dispatch(getUsersByShopId(shopId)),
          dispatch(getAllVideos())
        ]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const getOrderStats = () => {
    if (!orders) return null;
    
    const stats = {
      total: orders.length,
      completed: orders.filter(o => o.status === 'completed').length,
      inProgress: orders.filter(o => o.status === 'in_progress').length,
      pending: orders.filter(o => o.status === 'pending').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
    
    stats.completedPercentage = stats.total > 0 
      ? ((stats.completed / stats.total) * 100).toFixed(1) 
      : '0';
    
    return stats;
  };

  // Calculate video statistics
  const getVideoStats = () => {
    if (!videos || !myShop) return null;
    
    const shopVideos = videos.filter(video => video.shop_id === myShop.id);
    
    const stats = {
      total: shopVideos.length,
      byStatus: {
        uploaded: shopVideos.filter(v => v.status === 'uploaded').length,
        processing: shopVideos.filter(v => v.status === 'processing').length,
        completed: shopVideos.filter(v => v.status === 'completed').length,
        failed: shopVideos.filter(v => v.status === 'failed').length,
      },
      byTechnician: {},
    };
    
    // Group videos by technician
    shopVideos.forEach(video => {
      if (video.user_id) {
        if (!stats.byTechnician[video.user_id]) {
          const technician = shopUsers.find(u => u.id === video.user_id);
          stats.byTechnician[video.user_id] = {
            name: technician ? `${technician.first_name} ${technician.last_name}` : 'Unknown',
            count: 0,
            email: technician?.email || 'N/A',
          };
        }
        stats.byTechnician[video.user_id].count++;
      }
    });
    
    return stats;
  };

  // Get user video counts
  const getUserVideoStats = () => {
    if (!shopUsers || !videos || !myShop) return [];
    
    const shopVideos = videos.filter(video => video.shop_id === myShop.id);
    const technicians = shopUsers.filter(user => user.role === 'technician');
    
    return technicians.map(technician => {
      const userVideos = shopVideos.filter(video => video.user_id === technician.id);
      return {
        id: technician.id,
        name: `${technician.first_name} ${technician.last_name}`,
        email: technician.email,
        is_active: technician.is_active,
        totalVideos: userVideos.length,
        completedVideos: userVideos.filter(v => v.status === 'completed').length,
        profilePic: technician.profile_pic_url || DEFAULT_PROFILE_PIC,
      };
    }).sort((a, b) => b.totalVideos - a.totalVideos);
  };

  // Handle view user videos
  const handleViewUserVideos = (user) => {
    setSelectedUser(user);
    if (videos && myShop) {
      const shopVideos = videos.filter(video => video.shop_id === myShop.id);
      const userVideos = shopVideos.filter(video => video.user_id === user.id);
      setUserVideos(userVideos);
    }
  };

  const orderStats = getOrderStats();
  const videoStats = getVideoStats();
  const userStats = getUserVideoStats();

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002868]"></div>
        <p className="mt-4 text-gray-600">Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Shop Analytics Dashboard</h1>
        <p className="text-gray-600">Performance metrics for {myShop?.name || 'your shop'}</p>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
          <h3 className="text-sm font-medium text-blue-600 mb-2">Total Orders</h3>
          <p className="text-2xl font-bold text-blue-700">{orderStats?.total || 0}</p>
          <p className="text-sm text-blue-600 mt-1">
            {orderStats?.completedPercentage || '0'}% completed
          </p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-6 border border-green-100">
          <h3 className="text-sm font-medium text-green-600 mb-2">AI Video Requests</h3>
          <p className="text-2xl font-bold text-green-700">{videoStats?.total || 0}</p>
          <p className="text-sm text-green-600 mt-1">Total videos processed by AI</p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
          <h3 className="text-sm font-medium text-purple-600 mb-2">Total Technicians</h3>
          <p className="text-2xl font-bold text-purple-700">
            {shopUsers?.filter(u => u.role === 'technician').length || 0}
          </p>
          <p className="text-sm text-purple-600 mt-1">Active technicians</p>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-100">
          <h3 className="text-sm font-medium text-yellow-600 mb-2">Total Employees</h3>
          <p className="text-2xl font-bold text-yellow-700">
            {shopUsers?.filter(u => u.is_active).length || 0}
          </p>
          <p className="text-sm text-yellow-600 mt-1">Active employees</p>
        </div>
      </div>

      {/* Video Statistics */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">AI Video Statistics</h2>
          <span className="text-sm text-gray-500">Video processing status</span>
        </div>
        
        {videoStats ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{videoStats.byStatus.uploaded}</div>
              <div className="text-sm text-blue-500">Uploaded</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{videoStats.byStatus.processing}</div>
              <div className="text-sm text-yellow-500">Processing</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{videoStats.byStatus.completed}</div>
              <div className="text-sm text-green-500">Completed</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{videoStats.byStatus.failed}</div>
              <div className="text-sm text-red-500">Failed</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No video data available</p>
          </div>
        )}
      </div>

      {/* Users with AI Video Requests */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Technician AI Video Performance</h2>
          <p className="text-gray-600">AI video requests by technician</p>
        </div>
        
        {userStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Technician Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Video Statistics
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion Rate
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
                {userStats.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full overflow-hidden mr-3 border bg-gray-100">
                          <img 
                            src={user.profilePic}
                            alt={user.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = DEFAULT_PROFILE_PIC;
                            }}
                          />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <div className="text-lg font-bold text-blue-600">{user.totalVideos}</div>
                            <div className="text-xs text-gray-500">Total Videos</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {user.completedVideos} completed
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ 
                              width: `${user.totalVideos > 0 ? (user.completedVideos / user.totalVideos) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {user.totalVideos > 0 
                            ? `${((user.completedVideos / user.totalVideos) * 100).toFixed(1)}%`
                            : '0%'
                          }
                        </div>
                      </div>
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
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewUserVideos(user)}
                        className="px-3 py-1 bg-[#002868] text-white hover:bg-blue-700 rounded text-sm"
                      >
                        View Videos
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Technician Data</h3>
            <p className="text-gray-500 mb-4">No technicians found or no AI video requests made</p>
          </div>
        )}
      </div>

      {/* Order Statistics */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Order Statistics</h2>
        
        {orderStats ? (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Order Completion Rate</span>
                <span className="text-sm font-bold text-green-600">{orderStats.completedPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full"
                  style={{ width: `${orderStats.completedPercentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{orderStats.completed}</div>
                <div className="text-sm text-blue-500">Completed Orders</div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{orderStats.inProgress}</div>
                <div className="text-sm text-yellow-500">In Progress</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{orderStats.pending}</div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{orderStats.cancelled}</div>
                <div className="text-sm text-red-500">Cancelled</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No order data available</p>
          </div>
        )}
      </div>

      {/* User Videos Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border bg-gray-100">
                  <img 
                    src={selectedUser.profilePic}
                    alt={selectedUser.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = DEFAULT_PROFILE_PIC;
                    }}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedUser.name}</h2>
                  <p className="text-gray-600">AI Video Request Details</p>
                  <div className="mt-1 text-sm text-gray-500">
                    Total Videos: {selectedUser.totalVideos} | Completed: {selectedUser.completedVideos}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setUserVideos([]);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Video Requests</h3>
              
              {userVideos.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Video ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {userVideos.map((video) => (
                        <tr key={video.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {video.id.slice(0, 8)}...
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            #{video.order_id?.slice(0, 8)}...
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              video.status === 'completed' ? 'bg-green-100 text-green-800' :
                              video.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                              video.status === 'uploaded' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {video.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(video.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {video.duration ? `${video.duration}s` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500">No video requests found for this technician</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setUserVideos([]);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-[#002868] hover:bg-blue-800 text-white rounded-lg transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default Analytics;