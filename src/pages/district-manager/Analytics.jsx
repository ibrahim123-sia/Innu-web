import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
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
import {
  getDistrictById,
  selectCurrentDistrict,
  selectDistrictLoading
} from '../../redux/slice/districtSlice';

const DEFAULT_SHOP_LOGO = 'https://cdn-icons-png.flaticon.com/512/891/891419.png';

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
          {[1, 2, 3].map((i) => (
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
  const { districtId } = useParams();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  
  const user = useSelector(state => state.user.currentUser);
  
  const targetDistrictId = useMemo(() => {
    if (districtId) return districtId;
    if (userId) return user?.district_id;
    return user?.district_id;
  }, [districtId, userId, user?.district_id]);
  
  const shopsByDistrict = useSelector(selectShopsByDistrict);
  const currentDistrict = useSelector(selectCurrentDistrict);
  const districtLoading = useSelector(selectDistrictLoading);
  
  const [videos, setVideos] = useState([]);
  const [edits, setEdits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  
  const [viewMode, setViewMode] = useState('shops');
  
  const [showDistrictAnalyticsModal, setShowDistrictAnalyticsModal] = useState(null);
  const [showShopAnalyticsModal, setShowShopAnalyticsModal] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showAllFeedbackModal, setShowAllFeedbackModal] = useState(false);
  const [selectedShopForFeedback, setSelectedShopForFeedback] = useState(null);

  const filteredShops = useMemo(() => {
    if (!shopsByDistrict) return [];
    if (shopsByDistrict.data && Array.isArray(shopsByDistrict.data)) return shopsByDistrict.data;
    if (Array.isArray(shopsByDistrict)) return shopsByDistrict;
    if (shopsByDistrict.shops && Array.isArray(shopsByDistrict.shops)) return shopsByDistrict.shops;
    return [];
  }, [shopsByDistrict]);

  const fetchCurrentDistrict = useCallback(async () => {
    if (!targetDistrictId) return null;
    try {
      return await dispatch(getDistrictById(targetDistrictId)).unwrap();
    } catch {
      return null;
    }
  }, [dispatch, targetDistrictId]);

  const fetchVideosForDistrict = useCallback(async () => {
    if (!targetDistrictId) return [];
    try {
      const result = await dispatch(getVideosByDistrict(targetDistrictId)).unwrap();
      return result?.data && Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
    } catch {
      return [];
    }
  }, [dispatch, targetDistrictId]);

  const fetchEditsForDistrict = useCallback(async () => {
    if (!targetDistrictId) return [];
    try {
      const result = await dispatch(getEditDetailsByDistrict(targetDistrictId)).unwrap();
      return result?.data && Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
    } catch {
      return [];
    }
  }, [dispatch, targetDistrictId]);

  useEffect(() => {
    if (targetDistrictId) {
      fetchAllData();
    }
  }, [targetDistrictId]);

  const fetchAllData = useCallback(async () => {
    if (!targetDistrictId) return;
    
    setLoading(true);
    setFetchError(null);
    
    try {
      const [videosData, editsData] = await Promise.all([
        fetchVideosForDistrict(),
        fetchEditsForDistrict(),
        fetchCurrentDistrict(),
        dispatch(getShopsByDistrict(targetDistrictId)).unwrap()
      ]);
      
      setVideos(videosData);
      setEdits(editsData);
      setDataFetched(true);
      
    } catch {
      setFetchError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [targetDistrictId, dispatch, fetchVideosForDistrict, fetchEditsForDistrict, fetchCurrentDistrict]);

  const districtStats = useMemo(() => {
    const totalVideos = videos.length;
    const manualCorrections = edits.length;
    const successCount = totalVideos > manualCorrections ? totalVideos - manualCorrections : 0;
    
    return {
      totalVideos,
      manualCorrections,
      successCount,
      successRate: totalVideos > 0 ? ((successCount / totalVideos) * 100).toFixed(2) : "0.00",
      errorRate: totalVideos > 0 ? ((manualCorrections / totalVideos) * 100).toFixed(2) : "0.00",
      totalShops: filteredShops.length,
      activeShops: filteredShops.filter(shop => shop.is_active).length,
      completedVideos: videos.filter(v => v.status === 'completed').length,
      processingVideos: videos.filter(v => v.status === 'processing').length,
      pendingVideos: videos.filter(v => v.status === 'pending').length,
      failedVideos: videos.filter(v => v.status === 'failed').length,
    };
  }, [videos, edits, filteredShops]);

  const getShopStats = useCallback((shopId) => {
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
    
    const shopVideos = videos.filter(v => 
      v.shop_name && v.shop_name.trim().toLowerCase() === shopName.trim().toLowerCase()
    );
    
    const shopEdits = edits.filter(e => {
      const editShopName = e.shop_name || e.shopName || e.shop?.name || e.shop;
      return editShopName && editShopName.trim().toLowerCase() === shopName.trim().toLowerCase();
    });
    
    const totalVideos = shopVideos.length;
    const manualCorrections = shopEdits.length;
    const successCount = totalVideos > manualCorrections ? totalVideos - manualCorrections : 0;
    
    return {
      totalVideos,
      manualCorrections,
      successCount,
      successRate: totalVideos > 0 ? ((successCount / totalVideos) * 100).toFixed(2) : "0.00",
      errorRate: totalVideos > 0 ? ((manualCorrections / totalVideos) * 100).toFixed(2) : "0.00",
      completedVideos: shopVideos.filter(v => v.status === 'completed').length,
      processingVideos: shopVideos.filter(v => v.status === 'processing').length,
      pendingVideos: shopVideos.filter(v => v.status === 'pending').length,
      failedVideos: shopVideos.filter(v => v.status === 'failed').length,
      isActive: shop?.is_active,
    };
  }, [videos, edits, filteredShops]);

  const getShopLogo = useCallback((shopId) => {
    if (!filteredShops?.length) return DEFAULT_SHOP_LOGO;
    const shop = filteredShops.find(s => String(s.id) === String(shopId));
    return shop?.logo_url?.trim() ? shop.logo_url : DEFAULT_SHOP_LOGO;
  }, [filteredShops]);

  const getShopName = useCallback((shopId) => {
    if (!filteredShops?.length) return 'Unknown Shop';
    const shop = filteredShops.find(s => String(s.id) === String(shopId));
    return shop?.name || 'Unknown Shop';
  }, [filteredShops]);

  const getDistrictName = useCallback(() => {
    return currentDistrict?.name || 'Your District';
  }, [currentDistrict]);

  const getDistrictDetailedStats = useCallback(() => ({
    ...districtStats,
    districtVideos: videos,
    districtEdits: edits,
    districtShops: filteredShops,
  }), [districtStats, videos, edits, filteredShops]);

  const getShopDetailedStats = useCallback((shopId) => {
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
    
    return {
      totalVideos,
      manualCorrections,
      successCount,
      successRate: totalVideos > 0 ? ((successCount / totalVideos) * 100).toFixed(2) : "0.00",
      errorRate: totalVideos > 0 ? ((manualCorrections / totalVideos) * 100).toFixed(2) : "0.00",
      completedVideos: shopVideosData.filter(v => v.status === 'completed').length,
      processingVideos: shopVideosData.filter(v => v.status === 'processing').length,
      pendingVideos: shopVideosData.filter(v => v.status === 'pending').length,
      failedVideos: shopVideosData.filter(v => v.status === 'failed').length,
      shopVideos: shopVideosData,
      shopEdits: shopEditsData,
      shop,
      districtName: getDistrictName(),
    };
  }, [videos, edits, filteredShops, getDistrictName]);

  const handleViewAllFeedback = useCallback((shopId) => {
    setSelectedShopForFeedback(shopId);
    setShowAllFeedbackModal(true);
  }, []);

  const handleViewFeedback = useCallback((edit) => {
    setSelectedFeedback(edit);
    setShowFeedbackModal(true);
  }, []);

  if (isInitialLoad && loading) {
    return (
      <div className="p-6 transition-opacity duration-300 ease-in-out">
        <StatsSkeleton />
        <TableSkeleton />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="text-center bg-red-50 p-8 rounded-lg border border-red-200">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Data</h3>
          <p className="text-red-600 mb-4">{fetchError}</p>
          <button
            onClick={fetchAllData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!targetDistrictId) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="text-center bg-yellow-50 p-8 rounded-lg border border-yellow-200">
          <svg className="w-16 h-16 text-yellow-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-xl font-bold text-yellow-800 mb-2">No District Selected</h3>
          <p className="text-yellow-600">You are not assigned to any district.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 transition-opacity duration-300 ease-in-out">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total AI Video Requests</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {districtStats.totalVideos}
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

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">AI Success Rate</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {districtStats.successRate}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {districtStats.successCount} videos without corrections
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">AI Error Rate</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {districtStats.errorRate}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {districtStats.manualCorrections} videos with corrections
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Manual Corrections</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {districtStats.manualCorrections}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Video Requests</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manual Corrections</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                      onClick={() => setShowDistrictAnalyticsModal(currentDistrict.id)}
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

      {viewMode === 'shops' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8 hover:shadow-lg transition-shadow duration-200">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Shops Performance in {getDistrictName()}</h2>
            <p className="text-gray-600">AI video requests and manual corrections by shop</p>
          </div>
          
          {filteredShops?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Video Requests</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manual Corrections</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                                onError={(e) => { e.target.src = DEFAULT_SHOP_LOGO; }}
                              />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{shop.name}</div>
                              <div className="text-sm text-gray-500">
                                {shop.city}{shop.state ? `, ${shop.state}` : ''}
                              </div>
                              <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                                shop.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
                            onClick={() => setShowShopAnalyticsModal(shop.id)}
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

      {showDistrictAnalyticsModal && currentDistrict && (
        <DistrictAnalyticsModal
          district={currentDistrict}
          stats={getDistrictDetailedStats()}
          shops={filteredShops}
          videos={videos}
          edits={edits}
          getShopLogo={getShopLogo}
          getShopName={getShopName}
          onClose={() => setShowDistrictAnalyticsModal(null)}
          onViewAllFeedback={handleViewAllFeedback}
          onViewFeedback={handleViewFeedback}
        />
      )}

      {showShopAnalyticsModal && (
        <ShopAnalyticsModal
          shopId={showShopAnalyticsModal}
          stats={getShopDetailedStats(showShopAnalyticsModal)}
          getShopLogo={getShopLogo}
          getShopName={getShopName}
          onClose={() => setShowShopAnalyticsModal(null)}
          onViewAllFeedback={handleViewAllFeedback}
          onViewFeedback={handleViewFeedback}
        />
      )}

      {showAllFeedbackModal && selectedShopForFeedback && (
        <AllFeedbackModal
          shopId={selectedShopForFeedback}
          edits={edits}
          shops={filteredShops}
          getShopName={getShopName}
          onClose={() => {
            setShowAllFeedbackModal(false);
            setSelectedShopForFeedback(null);
          }}
          onViewFeedback={handleViewFeedback}
        />
      )}

      {showFeedbackModal && selectedFeedback && (
        <FeedbackModal
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

const DistrictAnalyticsModal = ({ district, stats, shops, videos, edits, getShopLogo, getShopName, onClose, onViewAllFeedback, onViewFeedback }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden border bg-blue-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{district.name}</h2>
            <p className="text-gray-600">Complete district analytics</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-6">
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Video Processing Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600">Total Videos</div>
              <div className="text-2xl font-bold text-blue-700">{stats.totalVideos}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600">Completed</div>
              <div className="text-2xl font-bold text-green-700">{stats.completedVideos}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-yellow-600">Processing</div>
              <div className="text-2xl font-bold text-yellow-700">{stats.processingVideos}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-red-600">Failed</div>
              <div className="text-2xl font-bold text-red-700">{stats.failedVideos}</div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">AI Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-blue-600">AI Video Requests</h4>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{stats.totalVideos}</p>
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
                  <p className="text-2xl font-bold text-green-700 mt-1">{stats.successRate}%</p>
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
                  <p className="text-2xl font-bold text-red-700 mt-1">{stats.errorRate}%</p>
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
                  <p className="text-2xl font-bold text-purple-700 mt-1">{stats.manualCorrections}</p>
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

        {shops?.length > 0 ? (
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Shops in this District</h3>
            <div className="space-y-4">
              {shops.map((shop) => {
                const shopVideos = videos.filter(v => 
                  v.shop_name && v.shop_name.trim().toLowerCase() === shop.name.trim().toLowerCase()
                );
                const shopEdits = edits.filter(e => {
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
                            onError={(e) => { e.target.src = DEFAULT_SHOP_LOGO; }}
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
                        shop.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
                          onClick={() => onViewAllFeedback(shop.id)}
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
      </div>

      <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end">
        <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
          Close
        </button>
      </div>
    </div>
  </div>
);

const ShopAnalyticsModal = ({ shopId, stats, getShopLogo, getShopName, onClose, onViewAllFeedback, onViewFeedback }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden border bg-gray-100">
            <img 
              src={getShopLogo(shopId)}
              alt={getShopName(shopId)}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = DEFAULT_SHOP_LOGO; }}
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{getShopName(shopId)}</h2>
            <p className="text-gray-600">Complete shop analytics</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-6">
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

        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Video Processing Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600">Total Videos</div>
              <div className="text-2xl font-bold text-blue-700">{stats.totalVideos}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600">Completed</div>
              <div className="text-2xl font-bold text-green-700">{stats.completedVideos}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-yellow-600">Processing</div>
              <div className="text-2xl font-bold text-yellow-700">{stats.processingVideos}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-red-600">Failed</div>
              <div className="text-2xl font-bold text-red-700">{stats.failedVideos}</div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">AI Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-blue-600">AI Video Requests</h4>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{stats.totalVideos}</p>
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
                  <p className="text-2xl font-bold text-green-700 mt-1">{stats.successRate}%</p>
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
                  <p className="text-2xl font-bold text-red-700 mt-1">{stats.errorRate}%</p>
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
                  <p className="text-2xl font-bold text-purple-700 mt-1">{stats.manualCorrections}</p>
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

        {stats.shopEdits?.length > 0 ? (
          <div className="bg-white border rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Manual Correction Feedback</h3>
              <button
                onClick={() => onViewAllFeedback(shopId)}
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
                    onClick={() => onViewFeedback(edit)}
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
                  onClick={() => onViewAllFeedback(shopId)}
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
      </div>

      <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end">
        <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
          Close
        </button>
      </div>
    </div>
  </div>
);

const AllFeedbackModal = ({ shopId, edits, shops, getShopName, onClose, onViewFeedback }) => {
  const shop = shops.find(s => String(s.id) === String(shopId));
  const shopName = shop?.name;
  
  const shopEdits = edits.filter(e => {
    const editShopName = e.shop_name || e.shopName || e.shop?.name || e.shop;
    return editShopName && editShopName.trim().toLowerCase() === shopName?.trim().toLowerCase();
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Feedback - {getShopName(shopId)}</h3>
            <p className="text-sm text-gray-500 mt-1">Total {shopEdits.length} feedback items</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          {shopEdits.length > 0 ? (
            <div className="space-y-4">
              {shopEdits.map((edit, index) => (
                <div 
                  key={edit.edit_id || edit.id || index} 
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onViewFeedback(edit)}
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
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const FeedbackModal = ({ feedback, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
      <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">
          {feedback.segment_index !== undefined 
            ? `Feedback - Segment ${feedback.segment_index + 1}` 
            : 'Feedback'}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="p-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-800">{feedback.feedback_reason || 'No feedback provided'}</p>
        </div>
        {feedback.created_at && (
          <p className="text-xs text-gray-500 mt-2">
            Submitted: {new Date(feedback.created_at).toLocaleString()}
          </p>
        )}
      </div>

      <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end">
        <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Close
        </button>
      </div>
    </div>
  </div>
);

export default Analytics;