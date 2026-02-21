import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import store from '../../redux/store';
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
  getVideosByShop,
  getVideosByUser,
  selectVideos,
} from '../../redux/slice/videoSlice';
import {
  getEditDetailsByShop,
  getEditDetailsByUser,
  selectShopEditDetails,
  selectAllUserEdits,
  clearUserEditDetails,
} from '../../redux/slice/videoEditSlice';

const DEFAULT_PROFILE_PIC = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

// ========== FIXED SELECTORS FOR SHOP-SPECIFIC DATA ==========

// FIXED: Get videos by shop - extract data array from response
const selectVideosByShop = (state) => {
  const videos = state.video.videos;
  // If videos is an array with a 'data' property (API response structure)
  if (videos && videos.data && Array.isArray(videos.data)) {
    return videos.data;
  }
  // If videos is already an array
  if (Array.isArray(videos)) {
    return videos;
  }
  return [];
};

// FIXED: Get edit details by shop - extract data array from response
const selectEditDetailsByShop = (state) => {
  const edits = state.videoEdit.shopEditDetails;
  // If edits has a data property (API response structure)
  if (edits && edits.data && Array.isArray(edits.data)) {
    return edits.data;
  }
  // If edits is already an array
  if (Array.isArray(edits)) {
    return edits;
  }
  return [];
};

// Local selector for videos by user - filter from shop videos
const selectVideosByUser = (userId) => (state) => {
  if (!userId) return [];
  
  // Get all shop videos first
  const shopVideos = selectVideosByShop(state);
  
  // Filter videos where created_by matches the userId
  return shopVideos.filter(video => video.created_by === userId);
};

// Local selector for edit details by user ID - use the slice selector
const selectEditDetailsByUserId = (userId) => (state) => {
  if (!userId) return [];
  return selectAllUserEdits(userId)(state);
};

// Skeleton Loader Components (keep as is)
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

const Analytics = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.user?.currentUser);
  const shopId = currentUser?.shop_id;
  
  console.log('🔍 Current User:', currentUser);
  console.log('🔍 Shop ID:', shopId);
  
  const myShop = useSelector(selectCurrentShop);
  const orders = useSelector(selectOrdersByShop) || [];
  const shopUsers = useSelector(selectAllUsers) || [];
  
  // Get shop-level data using our fixed selectors
  const allVideos = useSelector(selectVideosByShop) || [];
  const shopEdits = useSelector(selectEditDetailsByShop) || [];
  
  console.log('🔍 All Videos (shop-specific):', allVideos.length);
  console.log('🔍 Shop Edits (shop-specific):', shopEdits.length);
  console.log('🔍 First video sample:', allVideos[0]);
  
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [videoStats, setVideoStats] = useState(null);
  const [filteredShopUsers, setFilteredShopUsers] = useState([]);
  const [loadingData, setLoadingData] = useState({});
  const [userPerformanceData, setUserPerformanceData] = useState([]);
  const [dataFetchComplete, setDataFetchComplete] = useState(false);
  
  // Modal states
  const [showUserAnalyticsModal, setShowUserAnalyticsModal] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showAllFeedbackModal, setShowAllFeedbackModal] = useState(false);
  const [selectedUserForFeedback, setSelectedUserForFeedback] = useState(null);

  const fetchData = useCallback(async () => {
    if (!shopId) return;
    
    setLoading(true);
    try {
      console.log('🚀 Fetching all data for shop:', shopId);
      
      // Clear previous user edit details to prevent stale data
      dispatch(clearUserEditDetails());
      
      await Promise.all([
        dispatch(getShopById(shopId)),
        dispatch(getOrdersByShop(shopId)),
        dispatch(getUsersByShopId(shopId)),
        dispatch(getVideosByShop(shopId)),  // This will store in state.video.videos
        dispatch(getEditDetailsByShop(shopId))  // This will store in state.videoEdit.shopEditDetails
      ]);
      
      console.log('✅ All shop-level data fetched successfully');
    } catch (error) {
      console.error('❌ Error fetching data:', error);
    } finally {
      setLoading(false);
      setIsDataReady(true);
    }
  }, [dispatch, shopId]);

  // Fetch user-specific data for each user (ONE BY ONE)
  const fetchUserData = useCallback(async (userId) => {
    setLoadingData(prev => ({ ...prev, [userId]: true }));
    try {
      console.log(`🚀 Fetching data for user: ${userId}`);
      
      // Fetch user-specific data
      await Promise.all([
        dispatch(getVideosByUser(userId)),  // This will update state.video.videos (overwrites!)
        dispatch(getEditDetailsByUser(userId))  // This will append to state.videoEdit.userEditDetails
      ]);
      
      console.log(`✅ User ${userId} data fetched successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Error fetching data for user ${userId}:`, error);
      return false;
    } finally {
      setLoadingData(prev => ({ ...prev, [userId]: false }));
    }
  }, [dispatch]);

  // IMPORTANT: After fetching user data, we need to refetch shop data
  // because getVideosByUser overwrites state.video.videos
  const refetchShopData = useCallback(async () => {
    if (!shopId) return;
    
    console.log('🔄 Refetching shop data after user fetches...');
    await dispatch(getVideosByShop(shopId));
    await dispatch(getEditDetailsByShop(shopId));
    console.log('✅ Shop data refreshed');
  }, [dispatch, shopId]);

  // Fetch all users data sequentially
  const fetchAllUsersData = useCallback(async (users) => {
    if (!users.length) return;
    
    console.log(`🚀 Fetching data for ${users.length} users one by one...`);
    
    // Fetch users one by one
    for (const user of users) {
      await fetchUserData(user.id);
    }
    
    // After all user data is fetched, refetch shop data to restore shop videos
    await refetchShopData();
    
    setDataFetchComplete(true);
    console.log('✅ All user data fetched and shop data restored');
  }, [fetchUserData, refetchShopData]);

  // Fetch shop data
  useEffect(() => {
    if (shopId) {
      console.log('🚀 Initial fetch for shop:', shopId);
      dispatch(getShopById(shopId)).then(() => {
        setTimeout(() => setIsInitialLoad(false), 300);
      });
    }
  }, [dispatch, shopId]);

  // Fetch all other data when shop is available
  useEffect(() => {
    if (myShop?.id) {
      fetchData();
    }
  }, [myShop?.id, fetchData]);

  // Filter shop users - EXCLUDE brand admin
  useEffect(() => {
    if (shopUsers?.length > 0 && shopId) {
      console.log('🔍 Filtering shop users...');
      const filtered = shopUsers.filter(user => 
        user.shop_id === shopId && user.role !== 'brand_admin'
      );
      console.log('🔍 Filtered Shop Users:', filtered);
      setFilteredShopUsers(filtered);
    }
  }, [shopUsers, shopId]);

  // Fetch data for all filtered users when we have them
  useEffect(() => {
    if (filteredShopUsers.length > 0 && !dataFetchComplete) {
      fetchAllUsersData(filteredShopUsers);
    }
  }, [filteredShopUsers, dataFetchComplete, fetchAllUsersData]);

  // Calculate video stats from shop-level data
  useEffect(() => {
    if (allVideos?.length > 0) {
      console.log('📊 Calculating video stats from', allVideos.length, 'videos');
      calculateVideoStats(allVideos);
    }
  }, [allVideos]);

  const calculateVideoStats = useCallback((videos) => {
    if (!videos || videos.length === 0) return;
    
    const stats = {
      total: videos.length,
      byStatus: {
        uploading: videos.filter(v => v.status === 'uploading').length,
        processing: videos.filter(v => v.status === 'processing').length,
        completed: videos.filter(v => v.status === 'completed').length,
        failed: videos.filter(v => v.status === 'failed').length,
      },
    };
    
    console.log('📊 Calculated Stats:', stats);
    setVideoStats(stats);
  }, []);

  // Process user performance data
  useEffect(() => {
    if (filteredShopUsers.length === 0) {
      setUserPerformanceData([]);
      return;
    }

    // Get current Redux state
    const state = store.getState();
    
    const processedData = filteredShopUsers.map(user => {
      // Get user videos by filtering from shop videos (since getVideosByUser overwrites)
      const userVideos = allVideos.filter(video => video.created_by === user.id) || [];
      
      // Get user edits using selector
      const userEdits = selectEditDetailsByUserId(user.id)(state) || [];
      
      console.log(`👤 Processing ${user.first_name} ${user.last_name} (${user.id}):`, {
        videos: userVideos.length,
        edits: userEdits.length
      });
      
      const totalVideos = userVideos.length;
      
      // Count unique videos with edits
      const uniqueVideoIdsWithEdits = new Set();
      userEdits.forEach(edit => {
        if (edit.video_id) {
          uniqueVideoIdsWithEdits.add(edit.video_id);
        }
      });
      
      const manualCorrections = uniqueVideoIdsWithEdits.size;
      const successCount = totalVideos - manualCorrections;
      
      // Ensure we don't go negative
      const adjustedSuccessCount = Math.max(0, successCount);
      const adjustedManualCorrections = Math.min(manualCorrections, totalVideos);
      
      const successRate = totalVideos > 0 
        ? ((adjustedSuccessCount / totalVideos) * 100).toFixed(1) 
        : 0;
      const errorRate = totalVideos > 0 
        ? ((adjustedManualCorrections / totalVideos) * 100).toFixed(1) 
        : 0;
      
      return {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        profilePic: user.profile_pic_url || DEFAULT_PROFILE_PIC,
        totalVideos,
        manualCorrections: adjustedManualCorrections,
        successCount: adjustedSuccessCount,
        successRate,
        errorRate,
        completedVideos: userVideos.filter(v => v.status === 'completed').length,
        processingVideos: userVideos.filter(v => v.status === 'processing').length,
        pendingVideos: userVideos.filter(v => v.status === 'pending').length,
        failedVideos: userVideos.filter(v => v.status === 'failed').length,
        loading: loadingData[user.id] || false,
        userEdits
      };
    }).sort((a, b) => b.totalVideos - a.totalVideos);
    
    console.log('📊 Processed User Data:', processedData.map(u => ({
      name: u.name,
      videos: u.totalVideos,
      corrections: u.manualCorrections,
      successRate: u.successRate
    })));
    
    setUserPerformanceData(processedData);
  }, [filteredShopUsers, loadingData, dataFetchComplete, allVideos]);

  // Calculate overall stats from shop-level data
  const stats = useMemo(() => {
    const totalAIVideoRequests = allVideos?.length || 0;
    
    // Count unique videos that have manual corrections
    const videosWithCorrections = new Set();
    shopEdits.forEach(edit => {
      if (edit.video_id) {
        videosWithCorrections.add(edit.video_id);
      }
    });
    
    const totalManualCorrections = videosWithCorrections.size;
    const aiSuccess = totalAIVideoRequests - totalManualCorrections;
    const adjustedAiSuccess = Math.max(0, aiSuccess);
    
    const aiSuccessRate = totalAIVideoRequests > 0 
      ? ((adjustedAiSuccess / totalAIVideoRequests) * 100).toFixed(1) 
      : 0;
    
    const aiErrorRate = totalAIVideoRequests > 0 
      ? ((totalManualCorrections / totalAIVideoRequests) * 100).toFixed(1) 
      : 0;

    return {
      totalAIVideoRequests,
      totalManualCorrections,
      aiSuccess: adjustedAiSuccess,
      aiSuccessRate,
      aiErrorRate,
    };
  }, [allVideos, shopEdits]);

  console.log('📊 Final Stats:', stats);

  // Handle view user analytics
  const handleViewUserAnalytics = useCallback(async (userId) => {
    setShowUserAnalyticsModal(userId);
    
    // Refresh user data if needed
    if (!loadingData[userId]) {
      await fetchUserData(userId);
    }
  }, [loadingData, fetchUserData]);

  // Handle view all feedback for user
  const handleViewAllFeedback = useCallback((userId) => {
    setSelectedUserForFeedback(userId);
    setShowAllFeedbackModal(true);
  }, []);

  // Handle view individual feedback
  const handleViewFeedback = useCallback((edit) => {
    setSelectedFeedback(edit);
    setShowFeedbackModal(true);
  }, []);

  // Handle refresh data
  const handleRefreshData = useCallback(() => {
    setDataFetchComplete(false);
    setUserPerformanceData([]);
    fetchData();
  }, [fetchData]);

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
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalAIVideoRequests}</p>
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
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.aiSuccessRate}%</p>
              <p className="text-xs text-gray-400 mt-1">{stats.aiSuccess} videos without corrections</p>
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
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.aiErrorRate}%</p>
              <p className="text-xs text-gray-400 mt-1">{stats.totalManualCorrections} videos with corrections</p>
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
      {videoStats && videoStats.total > 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">AI Video Statistics</h2>
            <span className="text-sm text-gray-500">Video processing status</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{videoStats.byStatus.uploading}</div>
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
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <p className="text-center text-gray-500">No video statistics available</p>
        </div>
      )}

      {/* User Performance Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8 hover:shadow-lg transition-shadow duration-200">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">User Performance</h2>
            <p className="text-gray-600">AI video requests and manual corrections by user</p>
          </div>
          <button
            onClick={handleRefreshData}
            className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm flex items-center transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
        
        {filteredShopUsers.length > 0 ? (
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
                {userPerformanceData.map((user) => (
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
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role || 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.loading ? (
                        <div className="animate-pulse h-6 w-12 bg-gray-200 rounded"></div>
                      ) : (
                        <div className="text-lg font-bold text-blue-600">{user.totalVideos}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.loading ? (
                        <div className="animate-pulse h-6 w-12 bg-gray-200 rounded"></div>
                      ) : (
                        <div className="text-lg font-bold text-purple-600">{user.manualCorrections}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.loading ? (
                        <div className="space-y-2">
                          <div className="animate-pulse h-4 w-20 bg-gray-200 rounded"></div>
                          <div className="animate-pulse h-2 w-32 bg-gray-200 rounded-full"></div>
                        </div>
                      ) : (
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
                      )}
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
                        disabled={loadingData[user.id] || user.loading}
                        className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm flex items-center transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {loadingData[user.id] || user.loading ? (
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
                ))}
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
              onClick={handleRefreshData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Refresh Data
            </button>
          </div>
        )}
      </div>

      {/* User Analytics Modal */}
      {showUserAnalyticsModal && (
        <UserAnalyticsModal
          userId={showUserAnalyticsModal}
          user={filteredShopUsers.find(u => u.id === showUserAnalyticsModal)}
          shopName={myShop?.name}
          loading={loadingData[showUserAnalyticsModal]}
          onClose={() => setShowUserAnalyticsModal(null)}
          onViewAllFeedback={handleViewAllFeedback}
          onViewFeedback={handleViewFeedback}
          allVideos={allVideos} // Pass shop videos to modal
        />
      )}

      {/* All Feedback Modal */}
      {showAllFeedbackModal && selectedUserForFeedback && (
        <AllFeedbackModal
          userId={selectedUserForFeedback}
          user={filteredShopUsers.find(u => u.id === selectedUserForFeedback)}
          onClose={() => {
            setShowAllFeedbackModal(false);
            setSelectedUserForFeedback(null);
          }}
          onViewFeedback={handleViewFeedback}
        />
      )}

      {/* Individual Feedback Detail Modal */}
      {showFeedbackModal && selectedFeedback && (
        <FeedbackDetailModal
          feedback={selectedFeedback}
          onClose={() => {
            setShowFeedbackModal(false);
            setSelectedFeedback(null);
          }}
        />
      )}
    </div>
  );
};

// ========== MODAL COMPONENTS ==========

const UserAnalyticsModal = ({ userId, user, shopName, loading, onClose, onViewAllFeedback, onViewFeedback, allVideos }) => {
  const state = useSelector(state => state);
  // For user videos, filter from the passed allVideos prop (shop videos)
  const userVideos = allVideos?.filter(video => video.created_by === userId) || [];
  const userEdits = selectEditDetailsByUserId(userId)(state) || [];
  
  console.log(`📊 Modal for user ${userId}:`, {
    videos: userVideos.length,
    edits: userEdits.length
  });
  
  // Count unique videos with edits
  const uniqueVideoIdsWithEdits = new Set();
  userEdits.forEach(edit => {
    if (edit.video_id) {
      uniqueVideoIdsWithEdits.add(edit.video_id);
    }
  });
  
  const totalVideos = userVideos.length;
  const manualCorrections = uniqueVideoIdsWithEdits.size;
  const successCount = totalVideos - manualCorrections;
  const adjustedSuccessCount = Math.max(0, successCount);
  const adjustedManualCorrections = Math.min(manualCorrections, totalVideos);
  
  const successRate = totalVideos > 0 
    ? ((adjustedSuccessCount / totalVideos) * 100).toFixed(1) 
    : 0;
  const errorRate = totalVideos > 0 
    ? ((adjustedManualCorrections / totalVideos) * 100).toFixed(1) 
    : 0;
  
  const completedVideos = userVideos.filter(v => v.status === 'completed').length;
  const processingVideos = userVideos.filter(v => v.status === 'processing').length;
  const pendingVideos = userVideos.filter(v => v.status === 'pending').length;
  const failedVideos = userVideos.filter(v => v.status === 'failed').length;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border bg-gray-100">
              <img 
                src={user?.profile_pic_url || DEFAULT_PROFILE_PIC}
                alt={user?.first_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = DEFAULT_PROFILE_PIC;
                }}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {user?.first_name} {user?.last_name}
              </h2>
              <p className="text-gray-600">Complete user analytics</p>
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
          {/* User Info */}
          <div className="mb-8 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium text-gray-900">{user?.role || 'User'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className={`font-medium ${user?.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {user?.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Shop</p>
                <p className="font-medium text-gray-900">{shopName}</p>
              </div>
            </div>
          </div>

          {/* Video Processing Stats */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Video Processing Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600">Total Videos</div>
                <div className="text-2xl font-bold text-blue-700">{totalVideos}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600">Completed</div>
                <div className="text-2xl font-bold text-green-700">{completedVideos}</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm text-yellow-600">Processing</div>
                <div className="text-2xl font-bold text-yellow-700">{processingVideos}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-red-600">Failed</div>
                <div className="text-2xl font-bold text-red-700">{failedVideos}</div>
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
                    <p className="text-2xl font-bold text-blue-700 mt-1">{totalVideos}</p>
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
                    <p className="text-2xl font-bold text-green-700 mt-1">{successRate}%</p>
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
                    <p className="text-2xl font-bold text-red-700 mt-1">{errorRate}%</p>
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
                    <p className="text-2xl font-bold text-purple-700 mt-1">{adjustedManualCorrections}</p>
                    <p className="text-xs text-purple-500">({userEdits.length} total edits)</p>
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
          {userEdits && userEdits.length > 0 ? (
            <div className="bg-white border rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Manual Correction Feedback</h3>
                <button
                  onClick={() => onViewAllFeedback(userId)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  View All ({userEdits.length})
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                {userEdits.slice(0, 5).map((edit, index) => (
                  <div 
                    key={edit.edit_id || edit.id || index} 
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onViewFeedback(edit)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {edit.segment_index !== undefined && (
                          <p className="text-xs text-gray-500 mb-1">Segment {edit.segment_index + 1}</p>
                        )}
                        <p className="text-xs text-gray-400 mb-1">Video ID: {edit.video_id?.substring(0, 8)}...</p>
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
                ))}
              </div>
              {userEdits.length > 5 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => onViewAllFeedback(userId)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + {userEdits.length - 5} more feedback items
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border rounded-lg p-6 text-center">
              <p className="text-gray-500">No manual corrections for this user</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end">
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

const AllFeedbackModal = ({ userId, user, onClose, onViewFeedback }) => {
  const state = useSelector(state => state);
  const userEdits = selectEditDetailsByUserId(userId)(state) || [];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              Feedback - {user?.first_name} {user?.last_name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Total {userEdits.length} feedback items
            </p>
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
        
        <div className="p-6">
          {userEdits.length > 0 ? (
            <div className="space-y-4">
              {userEdits.map((edit, index) => (
                <div 
                  key={edit.edit_id || edit.id || index} 
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onViewFeedback(edit)}
                >
                  {edit.segment_index !== undefined && (
                    <p className="text-xs text-gray-500 mb-1">Segment {edit.segment_index + 1}</p>
                  )}
                  <p className="text-xs text-gray-400 mb-2">Video ID: {edit.video_id?.substring(0, 8)}...</p>
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
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const FeedbackDetailModal = ({ feedback, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">
            {feedback.segment_index !== undefined 
              ? `Feedback - Segment ${feedback.segment_index + 1}` 
              : 'Feedback'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-500">Video ID</p>
            <p className="text-sm font-mono bg-gray-50 p-2 rounded">{feedback.video_id}</p>
          </div>
          {feedback.segment_index !== undefined && (
            <div className="mb-4">
              <p className="text-sm text-gray-500">Segment</p>
              <p className="font-medium">{feedback.segment_index + 1}</p>
            </div>
          )}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Feedback</p>
            <p className="text-gray-800">
              {feedback.feedback_reason || 'No feedback provided'}
            </p>
          </div>
          {feedback.created_at && (
            <p className="text-xs text-gray-500 mt-4">
              Submitted: {new Date(feedback.created_at).toLocaleString()}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;