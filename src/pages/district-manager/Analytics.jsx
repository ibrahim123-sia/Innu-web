import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectAllShops,
  getShopsByDistrict // Changed from getDistrictShops to getShopsByDistrict
} from '../../redux/slice/shopSlice';
import { 
  selectVideos,
  getAllVideos,
  selectDashboardSummary,
  getVideoStats
} from '../../redux/slice/videoSlice';
import {
  getOrdersByDistrict,
  selectOrdersByDistrict // Changed from selectAllOrders to selectOrdersByDistrict
} from '../../redux/slice/orderSlice';

const Analytics = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.user.currentUser);
  const districtId = currentUser?.district_id;
  
  // Get data from Redux with correct selectors
  const allShops = useSelector(selectAllShops);
  const allVideos = useSelector(selectVideos);
  const districtOrders = useSelector(selectOrdersByDistrict) || []; // Changed from selectAllOrders
  const videoDashboardSummary = useSelector(selectDashboardSummary);
  
  // Local state
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState('all');
  const [showShopAnalyticsModal, setShowShopAnalyticsModal] = useState(null);
  const [shopAnalyticsData, setShopAnalyticsData] = useState(null);
  const [filteredShops, setFilteredShops] = useState([]);
  const [shopVideoData, setShopVideoData] = useState({});
  const [filteredOrders, setFilteredOrders] = useState([]);

  // Initial data fetch
  useEffect(() => {
    if (districtId) {
      fetchData();
    }
  }, [districtId]);

  // Filter shops by district
  useEffect(() => {
    if (allShops && districtId) {
      const districtShops = allShops.filter(shop => shop.district_id === districtId);
      setFilteredShops(districtShops);
      
      // Initialize shop video data
      const shopVideoMap = {};
      districtShops.forEach(shop => {
        shopVideoMap[shop.id] = {
          shopInfo: shop,
          videos: [],
          stats: {}
        };
      });
      setShopVideoData(shopVideoMap);
    }
  }, [allShops, districtId]);

  // Filter orders by district
  useEffect(() => {
    if (districtOrders && filteredShops.length > 0) {
      const shopIds = filteredShops.map(shop => shop.id);
      const districtOrdersFiltered = districtOrders.filter(order => shopIds.includes(order.shop_id));
      setFilteredOrders(districtOrdersFiltered);
    }
  }, [districtOrders, filteredShops]);

  // Calculate shop video data
  useEffect(() => {
    if (!loading && allVideos.length > 0 && filteredShops.length > 0) {
      calculateShopVideoData();
    }
  }, [allVideos, filteredShops, loading]);

  const fetchData = async () => {
    if (!districtId) return;
    
    setLoading(true);
    try {
      await Promise.all([
        dispatch(getShopsByDistrict(districtId)), // Changed from getDistrictShops
        dispatch(getAllVideos()),
        dispatch(getOrdersByDistrict({ districtId })),
        dispatch(getVideoStats())
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateShopVideoData = () => {
    const updatedShopVideoData = { ...shopVideoData };
    
    filteredShops.forEach(shop => {
      // Filter videos for this shop
      const shopVideos = allVideos.filter(video => video.shop_id === shop.id);
      
      // Calculate stats
      const totalVideos = shopVideos.length;
      const uploadedVideos = shopVideos.filter(v => v.status === 'uploaded').length;
      const processingVideos = shopVideos.filter(v => v.status === 'processing').length;
      const completedVideos = shopVideos.filter(v => v.status === 'completed').length;
      const failedVideos = shopVideos.filter(v => v.status === 'failed').length;
      
      const completionRate = totalVideos > 0 
        ? ((completedVideos / totalVideos) * 100).toFixed(1)
        : 0;
      
      const errorRate = totalVideos > 0 
        ? ((failedVideos / totalVideos) * 100).toFixed(1)
        : 0;
      
      // Filter orders for this shop
      const shopOrders = filteredOrders.filter(order => order.shop_id === shop.id);
      
      updatedShopVideoData[shop.id] = {
        shopInfo: shop,
        videos: shopVideos,
        orders: shopOrders,
        stats: {
          totalVideos,
          uploadedVideos,
          processingVideos,
          completedVideos,
          failedVideos,
          completionRate: parseFloat(completionRate),
          errorRate: parseFloat(errorRate),
          totalOrders: shopOrders.length,
          lastVideoDate: shopVideos.length > 0 
            ? new Date(Math.max(...shopVideos.map(v => new Date(v.created_at)))) 
            : null
        }
      };
    });
    
    setShopVideoData(updatedShopVideoData);
  };

  const getShopVideoStats = (shopId) => {
    const shopData = shopVideoData[shopId];
    if (!shopData) return null;
    
    const { shopInfo, stats } = shopData;
    
    return {
      shopId,
      shopName: shopInfo?.name || 'Unknown Shop',
      shopLocation: shopInfo ? `${shopInfo.city || ''}${shopInfo.state ? `, ${shopInfo.state}` : ''}` : '',
      totalVideoRequests: stats.totalVideos || 0,
      uploadedVideos: stats.uploadedVideos || 0,
      processingVideos: stats.processingVideos || 0,
      completedVideos: stats.completedVideos || 0,
      failedVideos: stats.failedVideos || 0,
      completionRate: stats.completionRate || 0,
      errorRate: stats.errorRate || 0,
      totalOrders: stats.totalOrders || 0,
      shopActive: shopInfo?.is_active || false,
      lastVideoDate: stats.lastVideoDate
    };
  };

  // Get all shops with their video stats
  const getAllShopsWithVideoStats = () => {
    return filteredShops.map(shop => {
      const stats = getShopVideoStats(shop.id) || {};
      return {
        ...shop,
        ...stats,
        uploadDate: shop.created_at
      };
    });
  };

  // Handle view shop analytics
  const handleViewShopAnalytics = (shopId) => {
    const stats = getShopVideoStats(shopId);
    if (stats) {
      setShopAnalyticsData(stats);
      setShowShopAnalyticsModal(shopId);
    }
  };

  // Filter data based on selected shop
  const filteredShopsWithStats = selectedShop === 'all' 
    ? getAllShopsWithVideoStats()
    : getAllShopsWithVideoStats().filter(shop => shop.id === selectedShop);

  // Calculate district totals
  const calculateDistrictTotals = () => {
    let totalVideosInDistrict = 0;
    let totalCompletedVideos = 0;
    let totalFailedVideos = 0;
    let totalProcessingVideos = 0;
    let totalUploadedVideos = 0;
    let totalOrdersInDistrict = 0;
    
    Object.values(shopVideoData).forEach(shopData => {
      const stats = shopData.stats || {};
      totalVideosInDistrict += stats.totalVideos || 0;
      totalCompletedVideos += stats.completedVideos || 0;
      totalFailedVideos += stats.failedVideos || 0;
      totalProcessingVideos += stats.processingVideos || 0;
      totalUploadedVideos += stats.uploadedVideos || 0;
      totalOrdersInDistrict += stats.totalOrders || 0;
    });
    
    const overallCompletionRate = totalVideosInDistrict > 0 
      ? ((totalCompletedVideos / totalVideosInDistrict) * 100).toFixed(1)
      : "0.0";
    
    const overallProcessingRate = totalVideosInDistrict > 0 
      ? ((totalProcessingVideos / totalVideosInDistrict) * 100).toFixed(1)
      : "0.0";
    
    return {
      totalVideosInDistrict,
      totalCompletedVideos,
      totalFailedVideos,
      totalProcessingVideos,
      totalUploadedVideos,
      totalOrdersInDistrict,
      overallCompletionRate,
      overallProcessingRate
    };
  };

  const districtTotals = calculateDistrictTotals();

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Video Analytics Dashboard</h1>
        <p className="text-gray-600">Track video processing and performance across shops in your district</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shop Filter</label>
            <select
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Shops ({filteredShops.length})</option>
              {filteredShops?.map(shop => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchData}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
          <h3 className="text-sm font-medium text-blue-600 mb-2">Total Video Requests</h3>
          <p className="text-2xl font-bold text-blue-700">{districtTotals.totalVideosInDistrict}</p>
          <p className="text-sm text-blue-600 mt-1">Videos processed in district</p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-6 border border-green-100">
          <h3 className="text-sm font-medium text-green-600 mb-2">Overall Completion Rate</h3>
          <p className="text-2xl font-bold text-green-700">{districtTotals.overallCompletionRate}%</p>
          <p className="text-sm text-green-600 mt-1">Videos successfully completed</p>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-100">
          <h3 className="text-sm font-medium text-yellow-600 mb-2">Processing Rate</h3>
          <p className="text-2xl font-bold text-yellow-700">{districtTotals.overallProcessingRate}%</p>
          <p className="text-sm text-yellow-600 mt-1">Videos currently processing</p>
        </div>
        
        <div className="bg-red-50 rounded-lg p-6 border border-red-100">
          <h3 className="text-sm font-medium text-red-600 mb-2">Failed Videos</h3>
          <p className="text-2xl font-bold text-red-700">{districtTotals.totalFailedVideos}</p>
          <p className="text-sm text-red-600 mt-1">Videos that failed to process</p>
        </div>
      </div>

      {/* Video Status Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Video Status Distribution</h2>
          <span className="text-sm text-gray-500">Across all videos in your district</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-100 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{districtTotals.totalUploadedVideos || 0}</div>
            <div className="text-sm text-blue-500">Uploaded</div>
          </div>
          
          <div className="text-center p-4 bg-yellow-100 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{districtTotals.totalProcessingVideos || 0}</div>
            <div className="text-sm text-yellow-500">Processing</div>
          </div>
          
          <div className="text-center p-4 bg-green-100 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{districtTotals.totalCompletedVideos || 0}</div>
            <div className="text-sm text-green-500">Completed</div>
          </div>
          
          <div className="text-center p-4 bg-red-100 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{districtTotals.totalFailedVideos || 0}</div>
            <div className="text-sm text-red-500">Failed</div>
          </div>
        </div>
      </div>

      {/* Shops Table with Video Stats */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Shop Video Performance</h2>
          <p className="text-gray-600">Video requests and processing status by shop ({filteredShops.length} shops)</p>
        </div>
        
        {filteredShopsWithStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shop Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Video Requests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
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
                {filteredShopsWithStats.map((shop) => (
                  <tr key={shop.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center mr-4 border bg-gray-100">
                          <svg className="w-8 h-8 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 00-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{shop.name}</div>
                          <div className="text-sm text-gray-500">
                            {shop.city}{shop.state ? `, ${shop.state}` : ''}
                          </div>
                          {shop.lastVideoDate && (
                            <div className="text-xs text-gray-400">
                              Last video: {new Date(shop.lastVideoDate).toLocaleDateString()}
                            </div>
                          )}
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
                            <div className="text-lg font-bold text-blue-600">{shop.totalVideoRequests || 0}</div>
                            <div className="text-xs text-gray-500">Total Video Requests</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Completed:</span>
                          <span className="text-sm font-medium text-green-600">{shop.completedVideos || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Failed:</span>
                          <span className="text-sm font-medium text-red-600">{shop.failedVideos || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Rate:</span>
                          <span className="text-sm font-medium text-green-600">{shop.completionRate || "0.0"}%</span>
                        </div>
                        <div className="w-32 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-green-500 h-1.5 rounded-full"
                            style={{ width: `${shop.completionRate || 0}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Error Rate:</span>
                          <span className="text-sm font-medium text-red-600">{shop.errorRate || "0.0"}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        shop.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {shop.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewShopAnalytics(shop.id)}
                          className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Analytics
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Shops Found</h3>
            <p className="text-gray-500 mb-4">No shops available in your district or no video data available</p>
            <button
              onClick={fetchData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Refresh Data
            </button>
          </div>
        )}
      </div>

      {/* Data Summary */}
      <div className="mt-8 text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2">Data Summary</h4>
        <p>Data last updated: {new Date().toLocaleString()}</p>
        <p>Total video requests in district: {districtTotals.totalVideosInDistrict}</p>
        <p>Total shops in district: {filteredShops.length}</p>
        <p>Overall completion rate: {districtTotals.overallCompletionRate}%</p>
        <p>Active shops: {filteredShops.filter(s => s.is_active).length}</p>
      </div>

      {/* Shop Analytics Modal */}
      {showShopAnalyticsModal && shopAnalyticsData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 00-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{shopAnalyticsData.shopName}</h2>
                  <p className="text-gray-600">Video Analytics</p>
                  <div className="mt-1">
                    <span className="text-xs text-gray-500">
                      {shopAnalyticsData.shopLocation}
                    </span>
                  </div>
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
              {/* Video Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-blue-600">Total Video Requests</h4>
                      <p className="text-2xl font-bold text-blue-700 mt-1">{shopAnalyticsData.totalVideoRequests}</p>
                      <p className="text-xs text-blue-500">Total videos for this shop</p>
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
                      <h4 className="text-sm font-medium text-green-600">Completion Rate</h4>
                      <p className="text-2xl font-bold text-green-700 mt-1">{shopAnalyticsData.completionRate}%</p>
                      <p className="text-xs text-green-500">Successfully completed videos</p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-yellow-600">Processing Videos</h4>
                      <p className="text-2xl font-bold text-yellow-700 mt-1">{shopAnalyticsData.processingVideos}</p>
                      <p className="text-xs text-yellow-500">Videos currently processing</p>
                    </div>
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-red-600">Failed Videos</h4>
                      <p className="text-2xl font-bold text-red-700 mt-1">{shopAnalyticsData.failedVideos}</p>
                      <p className="text-xs text-red-500">Videos that failed to process</p>
                    </div>
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="bg-white border rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Detailed Video Performance</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Total Video Requests</span>
                        <span className="text-lg font-bold text-gray-800">{shopAnalyticsData.totalVideoRequests}</span>
                      </div>
                      <p className="text-xs text-gray-500">All video requests for this shop</p>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-green-700">Completed Videos</span>
                        <span className="text-lg font-bold text-green-700">{shopAnalyticsData.completedVideos}</span>
                      </div>
                      <p className="text-xs text-green-500">Successfully processed videos</p>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-blue-700">Uploaded Videos</span>
                        <span className="text-lg font-bold text-blue-700">{shopAnalyticsData.uploadedVideos}</span>
                      </div>
                      <p className="text-xs text-blue-500">Videos uploaded but not yet processed</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-white border rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-3">Status Breakdown</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Completion Rate</span>
                            <span>{shopAnalyticsData.completionRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${shopAnalyticsData.completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Processing Videos</span>
                            <span>{shopAnalyticsData.processingVideos}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-500 h-2 rounded-full"
                              style={{ width: `${shopAnalyticsData.totalVideoRequests > 0 
                                ? ((shopAnalyticsData.processingVideos / shopAnalyticsData.totalVideoRequests) * 100).toFixed(1) 
                                : 0}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Failed Videos</span>
                            <span>{shopAnalyticsData.failedVideos}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full"
                              style={{ width: `${shopAnalyticsData.totalVideoRequests > 0 
                                ? ((shopAnalyticsData.failedVideos / shopAnalyticsData.totalVideoRequests) * 100).toFixed(1) 
                                : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-gray-600">Completed</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                          <span className="text-gray-600">Processing</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                          <span className="text-gray-600">Failed</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-yellow-700">Shop Status</span>
                        <span className={`text-lg font-bold ${shopAnalyticsData.shopActive ? 'text-green-700' : 'text-red-700'}`}>
                          {shopAnalyticsData.shopActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-yellow-500">Current status of this shop</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end space-x-3">
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
    </div>
  );
};

export default Analytics;