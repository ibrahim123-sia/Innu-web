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
import {
  getAllEditDetails,
  getEditDetailsByBrand,
  selectEditDetailsList,
  selectBrandEditDetails
} from '../../redux/slice/videoEditSlice';

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
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <th key={i} className="px-6 py-3 text-left">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[1, 2, 3, 4].map((row) => (
            <tr key={row} className="hover:bg-gray-50">
              {[1, 2, 3, 4, 5, 6].map((col) => (
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
  const brandEdits = useSelector(selectBrandEditDetails) || [];
  
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userVideos, setUserVideos] = useState([]);
  const [videoStats, setVideoStats] = useState(null);
  const [filteredShopUsers, setFilteredShopUsers] = useState([]);
  const [loadingData, setLoadingData] = useState({});
  
  // Modal states
  const [showUserAnalyticsModal, setShowUserAnalyticsModal] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showAllFeedbackModal, setShowAllFeedbackModal] = useState(false);
  const [selectedUserForFeedback, setSelectedUserForFeedback] = useState(null);

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
        dispatch(getAllVideos()),
        dispatch(getAllEditDetails())
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
        dispatch(getAllVideos()),
        dispatch(getAllEditDetails())
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
      byUser: {},
    };
    
    // Group videos by user
    shopVideos.forEach(video => {
      if (video.user_id) {
        if (!stats.byUser[video.user_id]) {
          const user = filteredShopUsers?.find(u => u.id === video.user_id);
          stats.byUser[video.user_id] = {
            name: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
            count: 0,
            email: user?.email || 'N/A',
          };
        }
        stats.byUser[video.user_id].count++;
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

  // Get user video and edit stats
  const getUserPerformanceStats = () => {
    if (!filteredShopUsers || !videos || !myShop) return [];
    
    const shopVideos = videos.filter(video => video.shop_id === myShop.id);
    const shopEdits = brandEdits.filter(edit => edit.shop_id === myShop.id);
    
    return filteredShopUsers.map(user => {
      const userVideos = shopVideos.filter(video => video.user_id === user.id);
      const userEdits = shopEdits.filter(edit => edit.user_id === user.id);
      
      const totalVideos = userVideos.length;
      const manualCorrections = userEdits.length;
      const successCount = totalVideos > manualCorrections ? totalVideos - manualCorrections : 0;
      
      const successRate = totalVideos > 0 ? ((successCount / totalVideos) * 100).toFixed(1) : 0;
      const errorRate = totalVideos > 0 ? ((manualCorrections / totalVideos) * 100).toFixed(1) : 0;
      
      return {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        profilePic: user.profile_pic_url || DEFAULT_PROFILE_PIC,
        totalVideos,
        manualCorrections,
        successCount,
        successRate,
        errorRate,
        completedVideos: userVideos.filter(v => v.status === 'completed').length,
        processingVideos: userVideos.filter(v => v.status === 'processing').length,
        pendingVideos: userVideos.filter(v => v.status === 'pending').length,
        failedVideos: userVideos.filter(v => v.status === 'failed').length,
      };
    }).sort((a, b) => b.totalVideos - a.totalVideos);
  };

  // Handle view user analytics
  const handleViewUserAnalytics = async (userId) => {
    setShowUserAnalyticsModal(userId);
    
    if (!loadingData[`user_${userId}`]) {
      setLoadingData(prev => ({ ...prev, [`user_${userId}`]: true }));
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Error fetching data for user ${userId}:`, error);
      } finally {
        setLoadingData(prev => ({ ...prev, [`user_${userId}`]: false }));
      }
    }
  };

  // Handle view all feedback for user
  const handleViewAllFeedback = (userId) => {
    setSelectedUserForFeedback(userId);
    setShowAllFeedbackModal(true);
  };

  // Handle view individual feedback
  const handleViewFeedback = (edit) => {
    setSelectedFeedback(edit);
    setShowFeedbackModal(true);
  };

  // Get detailed user stats for modal
  const getUserDetailedStats = (userId) => {
    const user = filteredShopUsers.find(u => u.id === userId);
    const shopVideos = videos.filter(video => video.shop_id === myShop?.id);
    const shopEdits = brandEdits.filter(edit => edit.shop_id === myShop?.id);
    
    const userVideos = shopVideos.filter(video => video.user_id === userId);
    const userEdits = shopEdits.filter(edit => edit.user_id === userId);
    
    const totalVideos = userVideos.length;
    const manualCorrections = userEdits.length;
    const successCount = totalVideos > manualCorrections ? totalVideos - manualCorrections : 0;
    
    const successRate = totalVideos > 0 ? ((successCount / totalVideos) * 100).toFixed(1) : 0;
    const errorRate = totalVideos > 0 ? ((manualCorrections / totalVideos) * 100).toFixed(1) : 0;
    
    return {
      user,
      totalVideos,
      manualCorrections,
      successCount,
      successRate,
      errorRate,
      completedVideos: userVideos.filter(v => v.status === 'completed').length,
      processingVideos: userVideos.filter(v => v.status === 'processing').length,
      pendingVideos: userVideos.filter(v => v.status === 'pending').length,
      failedVideos: userVideos.filter(v => v.status === 'failed').length,
      userVideos,
      userEdits,
    };
  };

  const orderStats = getOrderStats();
  const userPerformanceStats = getUserPerformanceStats();

  // Calculate overall stats
  const totalAIVideoRequests = videos?.filter(v => v.shop_id === myShop?.id)?.length || 0;
  const totalManualCorrections = brandEdits?.filter(e => e.shop_id === myShop?.id)?.length || 0;
  
  const aiSuccess = totalAIVideoRequests > totalManualCorrections 
    ? totalAIVideoRequests - totalManualCorrections 
    : 0;
  
  const aiSuccessRate = totalAIVideoRequests > 0 
    ? ((aiSuccess / totalAIVideoRequests) * 100).toFixed(1) 
    : 0;
  
  const aiErrorRate = totalAIVideoRequests > 0 
    ? ((totalManualCorrections / totalAIVideoRequests) * 100).toFixed(1) 
    : 0;

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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total AI Video Requests Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total AI Video Requests</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{totalAIVideoRequests}</p>
              <p className="text-xs text-gray-400 mt-1">Total videos processed</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* AI Success Rate Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">AI Success Rate</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{aiSuccessRate}%</p>
              <p className="text-xs text-gray-400 mt-1">{aiSuccess} videos without corrections</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* AI Error Rate Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">AI Error Rate</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">{aiErrorRate}%</p>
              <p className="text-xs text-gray-400 mt-1">{totalManualCorrections} videos with corrections</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Total Users Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total Users</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">{filteredShopUsers?.length || 0}</p>
              <p className="text-xs text-gray-400 mt-1">{filteredShopUsers?.filter(u => u.is_active).length || 0} active</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
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

      {/* User Performance Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8 hover:shadow-lg transition-shadow duration-200">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">User Performance</h2>
          <p className="text-gray-600">AI video requests and manual corrections by user</p>
        </div>
        
        {userPerformanceStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Video Requests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manual Corrections
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
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
                {userPerformanceStats.map((user) => {
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
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          {user.role || 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-blue-600">{user.totalVideos}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-purple-600">{user.manualCorrections}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Success Rate:</span>
                            <span className="text-sm font-medium text-green-600">{user.successRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-green-500 h-1.5 rounded-full"
                              style={{ width: `${Math.min(parseFloat(user.successRate), 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Error Rate:</span>
                            <span className="text-sm font-medium text-red-600">{user.errorRate}%</span>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewUserAnalytics(user.id)}
                          disabled={loadingData[`user_${user.id}`]}
                          className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm flex items-center transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {loadingData[`user_${user.id}`] ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                              Loading...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Details
                            </>
                          )}
                        </button>
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
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
            <p className="text-gray-500 mb-4">No users are associated with this shop yet.</p>
            <button
              onClick={fetchData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Refresh Data
            </button>
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

      {/* User Analytics Modal */}
      {showUserAnalyticsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border bg-gray-100">
                  <img 
                    src={filteredShopUsers.find(u => u.id === showUserAnalyticsModal)?.profile_pic_url || DEFAULT_PROFILE_PIC}
                    alt="User"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = DEFAULT_PROFILE_PIC;
                    }}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {filteredShopUsers.find(u => u.id === showUserAnalyticsModal)?.first_name} {filteredShopUsers.find(u => u.id === showUserAnalyticsModal)?.last_name}
                  </h2>
                  <p className="text-gray-600">Complete user analytics</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowUserAnalyticsModal(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {loadingData[`user_${showUserAnalyticsModal}`] ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                (() => {
                  const stats = getUserDetailedStats(showUserAnalyticsModal);
                  
                  return (
                    <>
                      {/* User Info */}
                      <div className="mb-8 bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium text-gray-900">{stats.user?.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Role</p>
                            <p className="font-medium text-gray-900">{stats.user?.role || 'User'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <p className={`font-medium ${stats.user?.is_active ? 'text-green-600' : 'text-red-600'}`}>
                              {stats.user?.is_active ? 'Active' : 'Inactive'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Shop</p>
                            <p className="font-medium text-gray-900">{myShop?.name}</p>
                          </div>
                        </div>
                      </div>

                      {/* Video Processing Stats */}
                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Video Processing Stats</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="text-sm text-blue-600">Total Videos</div>
                            <div className="text-2xl font-bold text-blue-700">
                              {stats.totalVideos}
                            </div>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <div className="text-sm text-green-600">Completed</div>
                            <div className="text-2xl font-bold text-green-700">
                              {stats.completedVideos}
                            </div>
                          </div>
                          <div className="bg-yellow-50 p-4 rounded-lg">
                            <div className="text-sm text-yellow-600">Processing</div>
                            <div className="text-2xl font-bold text-yellow-700">
                              {stats.processingVideos}
                            </div>
                          </div>
                          <div className="bg-red-50 p-4 rounded-lg">
                            <div className="text-sm text-red-600">Failed</div>
                            <div className="text-2xl font-bold text-red-700">
                              {stats.failedVideos}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* AI Performance Stats */}
                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">AI Performance</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-blue-600">AI Video Requests</h4>
                                <p className="text-2xl font-bold text-blue-700 mt-1">
                                  {stats.totalVideos}
                                </p>
                              </div>
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-green-600">Success Rate</h4>
                                <p className="text-2xl font-bold text-green-700 mt-1">
                                  {stats.successRate}%
                                </p>
                              </div>
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-red-600">Error Rate</h4>
                                <p className="text-2xl font-bold text-red-700 mt-1">
                                  {stats.errorRate}%
                                </p>
                              </div>
                              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-purple-600">Manual Corrections</h4>
                                <p className="text-2xl font-bold text-purple-700 mt-1">
                                  {stats.manualCorrections}
                                </p>
                              </div>
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Manual Corrections List with Feedback */}
                      {stats.userEdits && stats.userEdits.length > 0 ? (
                        <div className="bg-white border rounded-lg p-6">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Manual Correction Feedback</h3>
                            <button
                              onClick={() => handleViewAllFeedback(showUserAnalyticsModal)}
                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              View All ({stats.userEdits.length})
                              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                          <div className="space-y-3">
                            {stats.userEdits.slice(0, 5).map((edit, index) => {
                              const hasFeedback = edit.feedback_reason;
                              
                              return (
                                <div 
                                  key={edit.edit_id || edit.id || index} 
                                  className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!hasFeedback ? 'opacity-60' : ''}`}
                                  onClick={() => handleViewFeedback(edit)}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      {edit.segment_index !== undefined && (
                                        <p className="text-xs text-gray-500 mb-1">Segment {edit.segment_index + 1}</p>
                                      )}
                                      {edit.feedback_reason ? (
                                        <div className="mt-2">
                                          <p className="text-sm text-gray-700 font-medium">Feedback:</p>
                                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded mt-1">
                                            {edit.feedback_reason}
                                          </p>
                                        </div>
                                      ) : (
                                        <p className="text-sm text-gray-400 italic">No feedback provided</p>
                                      )}
                                    </div>
                                    <button className="text-blue-600 hover:text-blue-800 ml-4">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {stats.userEdits.length > 5 && (
                            <div className="mt-4 text-center">
                              <button
                                onClick={() => handleViewAllFeedback(showUserAnalyticsModal)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                + {stats.userEdits.length - 5} more feedback items
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-white border rounded-lg p-6 text-center">
                          <p className="text-gray-500">No manual corrections for this user</p>
                        </div>
                      )}
                    </>
                  );
                })()
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end">
              <button
                onClick={() => setShowUserAnalyticsModal(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Feedback Modal */}
      {showAllFeedbackModal && selectedUserForFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Feedback - {filteredShopUsers.find(u => u.id === selectedUserForFeedback)?.first_name} {filteredShopUsers.find(u => u.id === selectedUserForFeedback)?.last_name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Total {brandEdits.filter(e => e.user_id === selectedUserForFeedback && e.shop_id === myShop?.id).length} feedback items
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAllFeedbackModal(false);
                  setSelectedUserForFeedback(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              {brandEdits.filter(e => e.user_id === selectedUserForFeedback && e.shop_id === myShop?.id).length > 0 ? (
                <div className="space-y-4">
                  {brandEdits
                    .filter(e => e.user_id === selectedUserForFeedback && e.shop_id === myShop?.id)
                    .map((edit, index) => (
                      <div 
                        key={edit.edit_id || edit.id || index} 
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedFeedback(edit);
                          setShowFeedbackModal(true);
                        }}
                      >
                        {edit.segment_index !== undefined && (
                          <p className="text-xs text-gray-500 mb-1">Segment {edit.segment_index + 1}</p>
                        )}
                        {edit.feedback_reason ? (
                          <p className="text-gray-700">{edit.feedback_reason}</p>
                        ) : (
                          <p className="text-gray-400 italic">No feedback provided</p>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No feedback available for this user</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end">
              <button
                onClick={() => {
                  setShowAllFeedbackModal(false);
                  setSelectedUserForFeedback(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Feedback Detail Modal */}
      {showFeedbackModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                {selectedFeedback.segment_index !== undefined 
                  ? `Feedback - Segment ${selectedFeedback.segment_index + 1}` 
                  : 'Feedback'}
              </h3>
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setSelectedFeedback(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-800">
                  {selectedFeedback.feedback_reason || 'No feedback provided'}
                </p>
              </div>
              {selectedFeedback.created_at && (
                <p className="text-xs text-gray-500 mt-2">
                  Submitted: {new Date(selectedFeedback.created_at).toLocaleString()}
                </p>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end">
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setSelectedFeedback(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;