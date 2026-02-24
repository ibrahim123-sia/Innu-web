import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  getShopsByDistrict,
  selectShopsByDistrict
} from '../../redux/slice/shopSlice';
import {
  getEditDetailsByDistrict
} from '../../redux/slice/videoEditSlice';
import {
  getVideosByDistrict
} from '../../redux/slice/videoSlice';
import axios from 'axios';

const DEFAULT_SHOP_LOGO = 'https://cdn-icons-png.flaticon.com/512/891/891419.png';

// Create axios instance
const API = axios.create({
  baseURL: 'https://innu-api-112488489004.us-central1.run.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Skeleton Components
const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    {[1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-200"
      >
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

const TableSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="p-6 border-b">
      <div className="h-6 bg-gray-200 rounded animate-pulse w-48 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-64"></div>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[1, 2, 3, 4, 5].map((i) => (
              <th key={i} className="px-6 py-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[1, 2, 3, 4, 5].map((i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse mr-4"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
              </td>
              <td className="px-6 py-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                  <div className="h-2 bg-gray-200 rounded-full animate-pulse w-32"></div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const Analytics = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user.currentUser);
  const districtId = user?.district_id;  // Get district_id from user
  
  // Shop data - only shops in current district
  const shopsByDistrict = useSelector(selectShopsByDistrict);
  
  // Current district data
  const [currentDistrict, setCurrentDistrict] = useState(null);
  
  // Video and Edit data - for current district only
  const [videos, setVideos] = useState([]);
  const [edits, setEdits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  
  // View toggle state
  const [viewMode, setViewMode] = useState('districts');
  
  // Modal states
  const [showDistrictAnalyticsModal, setShowDistrictAnalyticsModal] = useState(null);
  const [showShopAnalyticsModal, setShowShopAnalyticsModal] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showAllFeedbackModal, setShowAllFeedbackModal] = useState(false);
  const [selectedShopForFeedback, setSelectedShopForFeedback] = useState(null);

  // Extract shops from the data object structure
  const filteredShops = React.useMemo(() => {
    if (!shopsByDistrict) return [];
    
    // If shopsByDistrict has a data property that is an array (most common case)
    if (shopsByDistrict.data && Array.isArray(shopsByDistrict.data)) {
      console.log('Found shops in shopsByDistrict.data:', shopsByDistrict.data.length);
      return shopsByDistrict.data;
    }
    
    // If shopsByDistrict is already an array
    if (Array.isArray(shopsByDistrict)) {
      console.log('shopsByDistrict is array with length:', shopsByDistrict.length);
      return shopsByDistrict;
    }
    
    // If shopsByDistrict has a shops property that is an array
    if (shopsByDistrict.shops && Array.isArray(shopsByDistrict.shops)) {
      console.log('shopsByDistrict.shops is array with length:', shopsByDistrict.shops.length);
      return shopsByDistrict.shops;
    }
    
    // If it's an object with numeric keys (like a dictionary)
    if (typeof shopsByDistrict === 'object') {
      const values = Object.values(shopsByDistrict);
      if (values.length > 0 && Array.isArray(values[0])) {
        console.log('Found array in object values');
        return values[0];
      }
    }
    
    console.log('No valid shops data found, returning empty array');
    return [];
  }, [shopsByDistrict]);

  // ============================================
  // DIRECT API CALL TO GET CURRENT DISTRICT BY ID
  // ============================================
  const fetchCurrentDistrict = async () => {
    if (!districtId) return;
    
    try {
      const response = await API.get(`/districts/${districtId}`);
      console.log('Current district response:', response.data);
      
      if (response.data && response.data.data) {
        setCurrentDistrict(response.data.data);
      } else if (response.data) {
        setCurrentDistrict(response.data);
      }
    } catch (error) {
      console.error('Error fetching current district:', error);
    }
  };

  // Initial fetch when districtId changes
  useEffect(() => {
    if (districtId) {
      fetchAllData();
    }
  }, [districtId]);

  const fetchAllData = async () => {
    if (!districtId) return;
    
    setLoading(true);
    setIsInitialLoad(true);
    setDataFetched(false);
    
    try {
      console.log('Fetching data for district:', districtId);
      
      // Fetch current district details
      await fetchCurrentDistrict();
      
      // Fetch shops for this specific district
      await dispatch(getShopsByDistrict(districtId)).unwrap();
      
      // Fetch videos for this district
      await fetchVideosForDistrict(districtId);
      
      // Fetch edits for this district
      await fetchEditsForDistrict(districtId);
      
      setDataFetched(true);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setTimeout(() => {
        setIsInitialLoad(false);
        setIsDataReady(true);
        setLoading(false);
      }, 300);
    }
  };

  // Fetch videos for current district
  const fetchVideosForDistrict = async (districtId) => {
    try {
      console.log(`Fetching videos for district: ${districtId}`);
      const result = await dispatch(getVideosByDistrict(districtId)).unwrap();
      console.log(`Videos response for district ${districtId}:`, result);
      
      let videosData = [];
      
      if (result?.data && Array.isArray(result.data)) {
        videosData = result.data;
      } else if (Array.isArray(result)) {
        videosData = result;
      } else if (result && typeof result === 'object') {
        const possibleArray = Object.values(result).find(val => Array.isArray(val));
        if (possibleArray) {
          videosData = possibleArray;
        }
      }
      
      console.log(`Setting ${videosData.length} videos for district ${districtId}`);
      setVideos(videosData);
      
      return videosData;
    } catch (error) {
      console.error(`Error fetching videos for district ${districtId}:`, error);
      setVideos([]);
      return [];
    }
  };

  // Fetch edits for current district
  const fetchEditsForDistrict = async (districtId) => {
    try {
      console.log(`Fetching edits for district: ${districtId}`);
      const result = await dispatch(getEditDetailsByDistrict(districtId)).unwrap();
      console.log(`Edits response for district ${districtId}:`, result);
      
      let editsData = [];
      
      if (result?.data && Array.isArray(result.data)) {
        editsData = result.data;
      } else if (Array.isArray(result)) {
        editsData = result;
      } else if (result && typeof result === 'object') {
        const possibleArray = Object.values(result).find(val => Array.isArray(val));
        if (possibleArray) {
          editsData = possibleArray;
        }
      }
      
      console.log(`Setting ${editsData.length} edits for district ${districtId}`);
      setEdits(editsData);
      
      return editsData;
    } catch (error) {
      console.error(`Error fetching edits for district ${districtId}:`, error);
      setEdits([]);
      return [];
    }
  };

  // Handle view district analytics
  const handleViewDistrictAnalytics = (districtId) => {
    setShowDistrictAnalyticsModal(districtId);
  };

  // Handle view shop analytics
  const handleViewShopAnalytics = (shopId) => {
    setShowShopAnalyticsModal(shopId);
  };

  // Handle view all feedback for shop
  const handleViewAllFeedback = (shopId) => {
    setSelectedShopForFeedback(shopId);
    setShowAllFeedbackModal(true);
  };

  // Handle view individual feedback
  const handleViewFeedback = (edit) => {
    setSelectedFeedback(edit);
    setShowFeedbackModal(true);
  };

  // Helper function to get shop logo
  const getShopLogo = (shopId) => {
    if (!filteredShops || !Array.isArray(filteredShops)) return DEFAULT_SHOP_LOGO;
    const shop = filteredShops.find(s => String(s.id) === String(shopId));
    return shop?.logo_url?.trim() ? shop.logo_url : DEFAULT_SHOP_LOGO;
  };

  // Get shop name by ID
  const getShopName = (shopId) => {
    if (!filteredShops || !Array.isArray(filteredShops)) return 'Unknown Shop';
    const shop = filteredShops.find(s => String(s.id) === String(shopId));
    return shop?.name || 'Unknown Shop';
  };

  // Get district name (from currentDistrict)
  const getDistrictName = () => {
    return currentDistrict?.name || 'Your District';
  };

  // ✅ Get district stats for current district
  const getCurrentDistrictStats = () => {
    if (!districtId) return {
      totalVideos: 0,
      manualCorrections: 0,
      successCount: 0,
      successRate: "0.00",
      errorRate: "0.00",
      totalShops: filteredShops.length,
      activeShops: filteredShops.filter(shop => shop.is_active).length,
      completedVideos: videos.filter(v => v.status === 'completed').length,
      processingVideos: videos.filter(v => v.status === 'processing').length,
      pendingVideos: videos.filter(v => v.status === 'pending').length,
      failedVideos: videos.filter(v => v.status === 'failed').length,
    };
    
    const totalVideos = videos.length;
    const manualCorrections = edits.length;
    const successCount = totalVideos > manualCorrections ? totalVideos - manualCorrections : 0;
    
    const successRate = totalVideos > 0 ? ((successCount / totalVideos) * 100).toFixed(2) : "0.00";
    const errorRate = totalVideos > 0 ? ((manualCorrections / totalVideos) * 100).toFixed(2) : "0.00";

    return {
      totalVideos,
      manualCorrections,
      successCount,
      successRate,
      errorRate,
      totalShops: filteredShops.length,
      activeShops: filteredShops.filter(shop => shop.is_active).length,
      completedVideos: videos.filter(v => v.status === 'completed').length,
      processingVideos: videos.filter(v => v.status === 'processing').length,
      pendingVideos: videos.filter(v => v.status === 'pending').length,
      failedVideos: videos.filter(v => v.status === 'failed').length,
    };
  };

  // Get shop stats
  const getShopStats = (shopId) => {
    const shop = filteredShops.find(s => String(s.id) === String(shopId));
    const shopName = shop?.name;
    
    if (!shopName) {
      return {
        totalVideos: 0,
        manualCorrections: 0,
        successCount: 0,
        successRate: "0.00",
        errorRate: "0.00",
        completedVideos: 0,
        processingVideos: 0,
        pendingVideos: 0,
        failedVideos: 0,
        isActive: shop?.is_active,
      };
    }
    
    // Filter videos by shop_name
    const shopVideos = videos.filter(v => {
      const match = v.shop_name && v.shop_name.trim().toLowerCase() === shopName.trim().toLowerCase();
      return match;
    });
    
    // Filter edits by shop_name
    const shopEdits = edits.filter(e => {
      const editShopName = e.shop_name || e.shopName || e.shop?.name || e.shop;
      const match = editShopName && editShopName.trim().toLowerCase() === shopName.trim().toLowerCase();
      return match;
    });
    
    const totalVideos = shopVideos.length;
    const manualCorrections = shopEdits.length;
    const successCount = totalVideos > manualCorrections ? totalVideos - manualCorrections : 0;
    
    const successRate = totalVideos > 0 ? ((successCount / totalVideos) * 100).toFixed(2) : "0.00";
    const errorRate = totalVideos > 0 ? ((manualCorrections / totalVideos) * 100).toFixed(2) : "0.00";

    return {
      totalVideos,
      manualCorrections,
      successCount,
      successRate,
      errorRate,
      completedVideos: shopVideos.filter(v => v.status === 'completed').length,
      processingVideos: shopVideos.filter(v => v.status === 'processing').length,
      pendingVideos: shopVideos.filter(v => v.status === 'pending').length,
      failedVideos: shopVideos.filter(v => v.status === 'failed').length,
      isActive: shop?.is_active,
    };
  };

  // Get detailed district stats for modal
  const getDistrictDetailedStats = (districtId) => {
    const districtShops = filteredShops;
    
    const totalVideos = videos.length;
    const manualCorrections = edits.length;
    const successCount = totalVideos > manualCorrections ? totalVideos - manualCorrections : 0;
    
    const successRate = totalVideos > 0 ? ((successCount / totalVideos) * 100).toFixed(2) : "0.00";
    const errorRate = totalVideos > 0 ? ((manualCorrections / totalVideos) * 100).toFixed(2) : "0.00";
    
    return {
      totalVideos,
      manualCorrections,
      successCount,
      successRate,
      errorRate,
      completedVideos: videos.filter(v => v.status === 'completed').length,
      processingVideos: videos.filter(v => v.status === 'processing').length,
      pendingVideos: videos.filter(v => v.status === 'pending').length,
      failedVideos: videos.filter(v => v.status === 'failed').length,
      districtVideos: videos,
      districtEdits: edits,
      districtShops,
    };
  };

  // Get detailed shop stats for modal
  const getShopDetailedStats = (shopId) => {
    const shop = filteredShops.find(s => String(s.id) === String(shopId));
    const shopName = shop?.name;
    
    if (!shopName) {
      return {
        totalVideos: 0,
        manualCorrections: 0,
        successCount: 0,
        successRate: "0.00",
        errorRate: "0.00",
        completedVideos: 0,
        processingVideos: 0,
        pendingVideos: 0,
        failedVideos: 0,
        shopVideos: [],
        shopEdits: [],
        shop,
        districtName: getDistrictName(),
      };
    }
    
    // Filter videos and edits by shop_name
    const shopVideosData = videos.filter(v => 
      v.shop_name && v.shop_name.trim().toLowerCase() === shopName.trim().toLowerCase()
    );
    
    const shopEditsData = edits.filter(e => {
      const editShopName = e.shop_name || e.shopName || e.shop?.name || e.shop;
      return editShopName && editShopName.trim().toLowerCase() === shopName.trim().toLowerCase();
    });
    
    const totalVideos = shopVideosData.length;
    const manualCorrections = shopEditsData.length;
    const successCount = totalVideos > manualCorrections ? totalVideos - manualCorrections : 0;
    
    const successRate = totalVideos > 0 ? ((successCount / totalVideos) * 100).toFixed(2) : "0.00";
    const errorRate = totalVideos > 0 ? ((manualCorrections / totalVideos) * 100).toFixed(2) : "0.00";
    
    return {
      totalVideos,
      manualCorrections,
      successCount,
      successRate,
      errorRate,
      completedVideos: shopVideosData.filter(v => v.status === 'completed').length,
      processingVideos: shopVideosData.filter(v => v.status === 'processing').length,
      pendingVideos: shopVideosData.filter(v => v.status === 'pending').length,
      failedVideos: shopVideosData.filter(v => v.status === 'failed').length,
      shopVideos: shopVideosData,
      shopEdits: shopEditsData,
      shop,
      districtName: getDistrictName(),
    };
  };

  // Calculate overall stats for this district only
  const districtStats = getCurrentDistrictStats();
  
  const totalAIVideoRequests = districtStats.totalVideos;
  const totalManualCorrections = districtStats.manualCorrections;
  
  const aiSuccess = districtStats.successCount;
  const aiSuccessRate = districtStats.successRate;
  const aiErrorRate = districtStats.errorRate;

  // Show skeleton during initial load
  if (isInitialLoad || (loading && !isDataReady)) {
    return (
      <div className="p-6 transition-opacity duration-300 ease-in-out">
        <StatsSkeleton />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 transition-opacity duration-300 ease-in-out">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total AI Video Requests Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total AI Video Requests</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {totalAIVideoRequests}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                In {getDistrictName()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* AI Success Rate Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">AI Success Rate</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {aiSuccessRate}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {aiSuccess} videos without corrections
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* AI Error Rate Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">AI Error Rate</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {aiErrorRate}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {totalManualCorrections} videos with corrections
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Manual Corrections Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Manual Corrections</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {totalManualCorrections}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Total edits with feedback
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center space-x-4 mb-4">
        <button
          onClick={() => setViewMode('districts')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'districts'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          District Performance
        </button>
        <button
          onClick={() => setViewMode('shops')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'shops'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Shops Performance
        </button>
      </div>

      {/* District Performance Table - NOW SHOWING ONLY CURRENT DISTRICT */}
      {viewMode === 'districts' && currentDistrict && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8 hover:shadow-lg transition-shadow duration-200">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">District Performance</h2>
            <p className="text-gray-600">AI video requests and manual corrections for your district</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    District Details
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr key={currentDistrict.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center mr-4 border bg-blue-100">
                        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{currentDistrict.name}</div>
                        <div className="text-sm text-gray-500">{districtStats.totalShops} shops, {districtStats.activeShops} active</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-lg font-bold text-blue-600">{districtStats.totalVideos}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-lg font-bold text-purple-600">{districtStats.manualCorrections}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Success Rate:</span>
                        <span className="text-sm font-medium text-green-600">{districtStats.successRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-green-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(parseFloat(districtStats.successRate), 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Error Rate:</span>
                        <span className="text-sm font-medium text-red-600">{districtStats.errorRate}%</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewDistrictAnalytics(currentDistrict.id)}
                      className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm flex items-center transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shops Performance Table */}
      {viewMode === 'shops' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8 hover:shadow-lg transition-shadow duration-200">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Shops Performance in {getDistrictName()}</h2>
            <p className="text-gray-600">AI video requests and manual corrections by shop</p>
          </div>
          
          {filteredShops && filteredShops.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shop Details
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredShops.map((shop) => {
                    const stats = getShopStats(shop.id);
                    
                    return (
                      <tr key={shop.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center mr-4 border bg-gray-100">
                              <img 
                                src={getShopLogo(shop.id)}
                                alt={shop.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = DEFAULT_SHOP_LOGO;
                                }}
                              />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{shop.name}</div>
                              <div className="text-sm text-gray-500">
                                {shop.city}{shop.state ? `, ${shop.state}` : ''}
                              </div>
                              <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                                shop.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {shop.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-lg font-bold text-blue-600">{stats.totalVideos}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-lg font-bold text-purple-600">{stats.manualCorrections}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Success Rate:</span>
                              <span className="text-sm font-medium text-green-600">{stats.successRate}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-green-500 h-1.5 rounded-full"
                                style={{ width: `${Math.min(parseFloat(stats.successRate), 100)}%` }}
                              ></div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Error Rate:</span>
                              <span className="text-sm font-medium text-red-600">{stats.errorRate}%</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewShopAnalytics(shop.id)}
                            className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm flex items-center transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
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
              <img 
                src={DEFAULT_SHOP_LOGO}
                alt="No shops" 
                className="w-16 h-16 mx-auto mb-4 opacity-50"
              />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Shops Found in {getDistrictName()}</h3>
              <p className="text-gray-500 mb-4">No shops have been added to this district yet.</p>
              <button
                onClick={fetchAllData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Refresh Data
              </button>
            </div>
          )}
        </div>
      )}

      {/* District Analytics Modal */}
      {showDistrictAnalyticsModal && currentDistrict && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden border bg-blue-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{currentDistrict.name}</h2>
                  <p className="text-gray-600">Complete district analytics</p>
                </div>
              </div>
              <button
                onClick={() => setShowDistrictAnalyticsModal(null)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {(() => {
                const stats = getDistrictDetailedStats(showDistrictAnalyticsModal);
                
                return (
                  <>
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

                    {/* Shops List */}
                    {stats.districtShops && stats.districtShops.length > 0 ? (
                      <div className="bg-white border rounded-lg p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Shops in this District</h3>
                        <div className="space-y-4">
                          {stats.districtShops.map((shop) => {
                            const shopVideos = stats.districtVideos.filter(v => 
                              v.shop_name && v.shop_name.trim().toLowerCase() === shop.name.trim().toLowerCase()
                            );
                            const shopEdits = stats.districtEdits.filter(e => {
                              const editShopName = e.shop_name || e.shopName || e.shop?.name || e.shop;
                              return editShopName && editShopName.trim().toLowerCase() === shop.name.trim().toLowerCase();
                            });
                            
                            return (
                              <div key={shop.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center mr-3 border bg-gray-100">
                                      <img 
                                        src={getShopLogo(shop.id)}
                                        alt={shop.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.src = DEFAULT_SHOP_LOGO;
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-gray-900">{shop.name}</h4>
                                      <p className="text-sm text-gray-500">
                                        {shop.city}{shop.state ? `, ${shop.state}` : ''}
                                      </p>
                                    </div>
                                  </div>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    shop.is_active 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {shop.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                                  <div className="text-center p-2 bg-blue-50 rounded">
                                    <div className="font-bold text-blue-600">{shopVideos.length}</div>
                                    <div className="text-xs text-gray-500">Videos</div>
                                  </div>
                                  <div className="text-center p-2 bg-purple-50 rounded">
                                    <div className="font-bold text-purple-600">{shopEdits.length}</div>
                                    <div className="text-xs text-gray-500">Edits</div>
                                  </div>
                                  <div className="text-center p-2 bg-green-50 rounded">
                                    <div className="font-bold text-green-600">
                                      {shopEdits.filter(e => e.feedback_reason === 'correct').length}
                                    </div>
                                    <div className="text-xs text-gray-500">Correct</div>
                                  </div>
                                </div>

                                {shopEdits.length > 0 && (
                                  <div className="mt-3">
                                    <button
                                      onClick={() => handleViewAllFeedback(shop.id)}
                                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                                    >
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                      </svg>
                                      View {shopEdits.length} feedback items
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border rounded-lg p-6 text-center">
                        <p className="text-gray-500">No shops found in this district</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end">
              <button
                onClick={() => setShowDistrictAnalyticsModal(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shop Analytics Modal */}
      {showShopAnalyticsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden border bg-gray-100">
                  <img 
                    src={getShopLogo(showShopAnalyticsModal)}
                    alt={getShopName(showShopAnalyticsModal)}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = DEFAULT_SHOP_LOGO;
                    }}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {getShopName(showShopAnalyticsModal)}
                  </h2>
                  <p className="text-gray-600">Complete shop analytics</p>
                </div>
              </div>
              <button
                onClick={() => setShowShopAnalyticsModal(null)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {(() => {
                const stats = getShopDetailedStats(showShopAnalyticsModal);
                
                return (
                  <>
                    {/* Shop Info */}
                    <div className="mb-8 bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">District</p>
                          <p className="font-medium text-gray-900">{stats.districtName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <p className={`font-medium ${stats.shop?.is_active ? 'text-green-600' : 'text-red-600'}`}>
                            {stats.shop?.is_active ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                        {stats.shop?.city && (
                          <div>
                            <p className="text-sm text-gray-500">Location</p>
                            <p className="font-medium text-gray-900">
                              {stats.shop.city}{stats.shop.state ? `, ${stats.shop.state}` : ''}
                            </p>
                          </div>
                        )}
                        {stats.shop?.tekmetric_shop_id && (
                          <div>
                            <p className="text-sm text-gray-500">Tekmetric ID</p>
                            <p className="font-medium text-gray-900">{stats.shop.tekmetric_shop_id}</p>
                          </div>
                        )}
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
                    {stats.shopEdits && stats.shopEdits.length > 0 ? (
                      <div className="bg-white border rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold text-gray-800">Manual Correction Feedback</h3>
                          <button
                            onClick={() => handleViewAllFeedback(showShopAnalyticsModal)}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            View All ({stats.shopEdits.length})
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                        <div className="space-y-3">
                          {stats.shopEdits.slice(0, 5).map((edit, index) => {
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
                        {stats.shopEdits.length > 5 && (
                          <div className="mt-4 text-center">
                            <button
                              onClick={() => handleViewAllFeedback(showShopAnalyticsModal)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              + {stats.shopEdits.length - 5} more feedback items
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white border rounded-lg p-6 text-center">
                        <p className="text-gray-500">No manual corrections for this shop</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end">
              <button
                onClick={() => setShowShopAnalyticsModal(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Feedback Modal */}
      {showAllFeedbackModal && selectedShopForFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Feedback - {getShopName(selectedShopForFeedback)}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Total {edits.filter(e => {
                    const shop = filteredShops.find(s => String(s.id) === String(selectedShopForFeedback));
                    const shopName = shop?.name;
                    if (!shopName) return false;
                    const editShopName = e.shop_name || e.shopName || e.shop?.name || e.shop;
                    return editShopName && editShopName.trim().toLowerCase() === shopName.trim().toLowerCase();
                  }).length} feedback items
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAllFeedbackModal(false);
                  setSelectedShopForFeedback(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              {edits.filter(e => {
                const shop = filteredShops.find(s => String(s.id) === String(selectedShopForFeedback));
                const shopName = shop?.name;
                if (!shopName) return false;
                const editShopName = e.shop_name || e.shopName || e.shop?.name || e.shop;
                return editShopName && editShopName.trim().toLowerCase() === shopName.trim().toLowerCase();
              }).length > 0 ? (
                <div className="space-y-4">
                  {edits
                    .filter(e => {
                      const shop = filteredShops.find(s => String(s.id) === String(selectedShopForFeedback));
                      const shopName = shop?.name;
                      if (!shopName) return false;
                      const editShopName = e.shop_name || e.shopName || e.shop?.name || e.shop;
                      return editShopName && editShopName.trim().toLowerCase() === shopName.trim().toLowerCase();
                    })
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
                  <p className="text-gray-500">No feedback available for this shop</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end">
              <button
                onClick={() => {
                  setShowAllFeedbackModal(false);
                  setSelectedShopForFeedback(null);
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