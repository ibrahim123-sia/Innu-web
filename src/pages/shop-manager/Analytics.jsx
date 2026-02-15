import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  getShopById,
  selectCurrentShop
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
  selectVideos,
} from '../../redux/slice/videoSlice';

const DEFAULT_PROFILE_PIC = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

// Skeleton Loader Components - using neutral gray colors like Overview
const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
            <div className="h-8 bg-gray-300 rounded animate-pulse w-16 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </div>
    ))}
  </div>
);

const VideoStatsSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6 mb-8">
    <div className="flex items-center justify-between mb-6">
      <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-16 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-20 mx-auto"></div>
        </div>
      ))}
    </div>
  </div>
);

const TableSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
    <div className="p-6 border-b">
      <div className="h-6 bg-gray-200 rounded animate-pulse w-64 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[1, 2, 3, 4, 5].map((i) => (
              <th key={i} className="px-6 py-3 text-left">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[1, 2, 3, 4].map((row) => (
            <tr key={row} className="hover:bg-gray-50">
              {[1, 2, 3, 4, 5].map((col) => (
                <td key={col} className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {col === 1 && (
                      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse mr-3"></div>
                    )}
                    <div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-2"></div>
                      {col === 1 && (
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                      )}
                    </div>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const OrderStatsSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6 mb-8">
    <div className="h-6 bg-gray-200 rounded animate-pulse w-48 mb-6"></div>
    <div className="space-y-6">
      <div>
        <div className="flex justify-between mb-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-gray-300 h-3 rounded-full w-3/4"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-50 p-4 rounded-lg">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-16 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Analytics = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.user.currentUser);
  const shopId = currentUser?.shop_id;
  
  const myShop = useSelector(selectCurrentShop);
  const orders = useSelector(selectOrdersByShop) || [];
  const shopUsers = useSelector(selectAllUsers) || [];
  const videos = useSelector(selectVideos) || [];
  
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userVideos, setUserVideos] = useState([]);
  const [videoStats, setVideoStats] = useState(null);
  const [filteredShopUsers, setFilteredShopUsers] = useState([]);

  useEffect(() => {
    if (shopId) {
      Promise.all([dispatch(getShopById(shopId))]).then(() => {
        setTimeout(() => setIsInitialLoad(false), 300);
      });
    }
  }, [dispatch, shopId]);

  useEffect(() => {
    if (myShop?.id) {
      Promise.all([
        dispatch(getOrdersByShop(shopId)),
        dispatch(getUsersByShopId(shopId)),
        dispatch(getAllVideos())
      ]).then(() => {
        setIsDataReady(true);
        setLoading(false);
      });
    }
  }, [dispatch, myShop, shopId]);

  useEffect(() => {
    if (shopUsers && shopId) {
      const filtered = shopUsers.filter(user => user.shop_id === shopId);
      setFilteredShopUsers(filtered);
    }
  }, [shopUsers, shopId]);

  useEffect(() => {
    if (videos && myShop) {
      calculateVideoStats();
    }
  }, [videos, myShop, filteredShopUsers]);

  const fetchData = async () => {
    if (!shopId) return;
    
    setLoading(true);
    try {
      await Promise.all([
        dispatch(getShopById(shopId)),
        dispatch(getOrdersByShop(shopId)),
        dispatch(getUsersByShopId(shopId)),
        dispatch(getAllVideos())
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setIsDataReady(true);
    }
  };

  const calculateVideoStats = () => {
    if (!videos || !myShop) return;
    
    const shopVideos = videos.filter(video => video.shop_id === myShop.id);
    
    const stats = {
      total: shopVideos.length,
      byStatus: {
        uploaded: shopVideos.filter(v => v.status === 'uploading').length,
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
          const technician = filteredShopUsers?.find(u => u.id === video.user_id);
          stats.byTechnician[video.user_id] = {
            name: technician ? `${technician.first_name} ${technician.last_name}` : 'Unknown',
            count: 0,
            email: technician?.email || 'N/A',
          };
        }
        stats.byTechnician[video.user_id].count++;
      }
    });
    
    setVideoStats(stats);
  };

  // Calculate order statistics
  const getOrderStats = () => {
    if (!orders) return null;
    
    const stats = {
      total: orders.length,
      completed: orders.filter(o => ['completed', 'posted', 'done'].includes(o.status?.toLowerCase())).length,
      inProgress: orders.filter(o => ['in_progress', 'work-in-progress', 'processing'].includes(o.status?.toLowerCase())).length,
      pending: orders.filter(o => ['pending', 'estimate'].includes(o.status?.toLowerCase())).length,
      cancelled: orders.filter(o => ['cancelled', 'canceled'].includes(o.status?.toLowerCase())).length,
    };
    
    stats.completedPercentage = stats.total > 0 
      ? ((stats.completed / stats.total) * 100).toFixed(1) 
      : '0';
    
    return stats;
  };

  // Get user video counts
  const getUserVideoStats = () => {
    if (!filteredShopUsers || !videos || !myShop) return [];
    
    const shopVideos = videos.filter(video => video.shop_id === myShop.id);
    const technicians = filteredShopUsers.filter(user => user.role === 'technician');
    
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
  const userStats = getUserVideoStats();

  // Show skeleton during initial load
  if (isInitialLoad || (loading && !isDataReady)) {
    return (
      <div className="p-6 transition-opacity duration-300 ease-in-out">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-96"></div>
        </div>
        <StatsSkeleton />
        <VideoStatsSkeleton />
        <TableSkeleton />
        <OrderStatsSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 transition-opacity duration-300 ease-in-out">
     

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total Orders</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{orderStats?.total || 0}</p>
              <p className="text-xs text-gray-400 mt-1">{orderStats?.completedPercentage || '0'}% completed</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">AI Video Requests</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{videoStats?.total || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Total videos processed by AI</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total Technicians</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {filteredShopUsers?.filter(u => u.role === 'technician').length || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">Active technicians</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total Employees</h3>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {filteredShopUsers?.filter(u => u.is_active).length || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">Active employees</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Video Statistics */}
      {videoStats && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">AI Video Statistics</h2>
            <span className="text-sm text-gray-500">Video processing status</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{videoStats.byStatus.uploaded}</div>
              <div className="text-sm text-blue-500">Uploading</div>
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
        </div>
      )}

      {/* Users with AI Video Requests */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8 hover:shadow-lg transition-shadow duration-200">
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
                
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userStats.map((user) => {
                  const completionRate = user.totalVideos > 0 
                    ? ((user.completedVideos / user.totalVideos) * 100).toFixed(1) 
                    : 0;
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${completionRate}%` }}
                            ></div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {completionRate}%
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      
                    </tr>
                  );
                })}
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
      {orderStats && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 hover:shadow-lg transition-shadow duration-200">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Order Statistics</h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Order Completion Rate</span>
                <span className="text-sm font-bold text-green-600">{orderStats.completedPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
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
        </div>
      )}

      

     
    </div>
  );
};

export default Analytics;