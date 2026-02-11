import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectAllShops, 
  getShopsByDistrict
} from '../../redux/slice/shopSlice';
import { 
  selectOrdersByDistrict, // Changed from selectAllOrders to selectOrdersByDistrict
  getOrdersByDistrict 
} from '../../redux/slice/orderSlice';
import { 
  selectDashboardSummary,
  getVideoStats,
  selectVideos,
  getAllVideos
} from '../../redux/slice/videoSlice';
import { Link } from 'react-router-dom';

const Overview = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.user.currentUser);
  const districtId = currentUser?.district_id;
  
  // Get data from Redux with correct selectors
  const allShops = useSelector(selectAllShops);
  const districtOrders = useSelector(selectOrdersByDistrict) || []; // Changed from selectAllOrders
  const videoDashboardSummary = useSelector(selectDashboardSummary);
  const allVideos = useSelector(selectVideos);
  
  // Local state
  const [loading, setLoading] = useState(true);
  
  // Memoized calculations
  const filteredShops = useMemo(() => {
    if (allShops && districtId) {
      return allShops.filter(shop => shop.district_id === districtId);
    }
    return [];
  }, [allShops, districtId]);

  const filteredOrders = useMemo(() => {
    if (districtOrders && filteredShops.length > 0) {
      const shopIds = filteredShops.map(shop => shop.id);
      return districtOrders.filter(order => shopIds.includes(order.shop_id));
    }
    return [];
  }, [districtOrders, filteredShops]);

  const dailyOrders = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return filteredOrders.filter(order => {
      if (!order?.created_at) return false;
      const orderDate = new Date(order.created_at);
      return orderDate >= yesterday;
    }).length || 0;
  }, [filteredOrders]);

  const topShop = useMemo(() => {
    if (filteredShops.length > 0) {
      const shopsWithVideoCounts = filteredShops.map(shop => {
        // Filter videos for this shop
        const shopVideos = allVideos.filter(video => video.shop_id === shop.id);
        
        // Count video requests by status
        const totalVideos = shopVideos.length;
        const uploadedVideos = shopVideos.filter(v => v.status === 'uploaded').length;
        const processingVideos = shopVideos.filter(v => v.status === 'processing').length;
        const completedVideos = shopVideos.filter(v => v.status === 'completed').length;
        const failedVideos = shopVideos.filter(v => v.status === 'failed').length;
        
        return {
          ...shop,
          totalVideos,
          uploadedVideos,
          processingVideos,
          completedVideos,
          failedVideos,
          completionRate: totalVideos > 0 ? ((completedVideos / totalVideos) * 100) : 0
        };
      });
      
      // Sort shops by total videos (descending)
      const sortedShops = [...shopsWithVideoCounts].sort((a, b) => 
        (b.totalVideos || 0) - (a.totalVideos || 0)
      );

      if (sortedShops.length > 0 && sortedShops[0].totalVideos > 0) {
        return sortedShops[0];
      } else if (filteredShops.length > 0) {
        // Set first shop as default with 0 videos
        return {
          ...filteredShops[0],
          totalVideos: 0,
          uploadedVideos: 0,
          processingVideos: 0,
          completedVideos: 0,
          failedVideos: 0,
          completionRate: 0
        };
      }
    }
    return null;
  }, [filteredShops, allVideos]);

  const totalShops = useMemo(() => filteredShops.length || 0, [filteredShops]);
  const activeShops = useMemo(() => filteredShops.filter(shop => shop.is_active).length || 0, [filteredShops]);
  const totalVideos = useMemo(() => videoDashboardSummary?.total || 0, [videoDashboardSummary]);
  const completedVideos = useMemo(() => videoDashboardSummary?.completed || 0, [videoDashboardSummary]);
  const completionRate = useMemo(() => {
    const total = totalVideos;
    const completed = completedVideos;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [totalVideos, completedVideos]);

  // Fetch initial data
  useEffect(() => {
    if (districtId) {
      fetchData();
    }
  }, [districtId]);

  const fetchData = async () => {
    if (!districtId) return;
    
    setLoading(true);
    try {
      await Promise.all([
        dispatch(getShopsByDistrict(districtId)),
        dispatch(getOrdersByDistrict({ districtId })),
        dispatch(getAllVideos()),
        dispatch(getVideoStats())
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">District Dashboard</h1>
        <p className="text-gray-600">Welcome to your district manager dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total Shops</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{totalShops}</p>
              <p className="text-xs text-gray-400 mt-1">
                {activeShops} active shops
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 00-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Video Requests</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">{totalVideos}</p>
              <p className="text-xs text-gray-400 mt-1">
                {completedVideos} completed ({completionRate}%)
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Daily Orders</h3>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{dailyOrders}</p>
              <p className="text-xs text-gray-400 mt-1">Last 24 hours</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Active Shops</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {activeShops}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {((activeShops / (totalShops || 1)) * 100).toFixed(1)}% of total
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Video Status Overview */}
      {totalVideos > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Video Status Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Uploaded</p>
                  <p className="text-2xl font-bold text-blue-700">{videoDashboardSummary?.uploaded || 0}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Processing</p>
                  <p className="text-2xl font-bold text-yellow-700">{videoDashboardSummary?.processing || 0}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Completed</p>
                  <p className="text-2xl font-bold text-green-700">{videoDashboardSummary?.completed || 0}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Failed</p>
                  <p className="text-2xl font-bold text-red-700">{videoDashboardSummary?.failed || 0}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Shop & Quick Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Top Performing Shop</h2>
            {topShop && topShop.totalVideos > 0 && (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                #1 in Video Requests
              </span>
            )}
          </div>
          
          {topShop ? (
            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-4 mb-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm3 6a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg">{topShop.name}</h3>
                  <p className="text-sm text-gray-500">
                    {topShop.city}{topShop.state ? `, ${topShop.state}` : ''}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <div className="text-xl font-bold text-blue-600">{topShop.totalVideos || 0}</div>
                      <div className="text-xs text-blue-500">Video Requests</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <div className="text-xl font-bold text-green-600">
                        {topShop.completionRate > 0 ? 
                          `${topShop.completionRate.toFixed(1)}%` : 
                          '0%'
                        }
                      </div>
                      <div className="text-xs text-green-500">Completion Rate</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-gray-600">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Status:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    topShop.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {topShop.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Completed Videos:</span>
                  <span className="text-sm">{topShop.completedVideos || 0}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Tekmetric ID:</span>{' '}
                  {topShop.tekmetric_shop_id || 'Not set'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">No shop data available</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <Link
              to="/district-manager/shops"
              className="flex items-center p-4 border rounded-lg hover:bg-blue-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-700 transition-colors">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">Manage Shops</h3>
                <p className="text-sm text-gray-500">View and manage all shops</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            <Link
              to="/district-manager/videos"
              className="flex items-center p-4 border rounded-lg hover:bg-blue-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mr-4 group-hover:bg-red-700 transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">View Videos</h3>
                <p className="text-sm text-gray-500">Manage and monitor videos</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              to="/district-manager/analytics"
              className="flex items-center p-4 border rounded-lg hover:bg-blue-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-4 group-hover:bg-green-700 transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">View Analytics</h3>
                <p className="text-sm text-gray-500">Check performance analytics</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* District Summary */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium text-gray-800 mb-3">District Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Total Orders</div>
                <div className="text-xl font-bold text-gray-800">{filteredOrders.length}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Shops with Videos</div>
                <div className="text-xl font-bold text-gray-800">
                  {filteredShops.filter(shop => 
                    allVideos.some(video => video.shop_id === shop.id)
                  ).length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm text-gray-600 font-medium">Today's Orders</h3>
            <p className="text-2xl font-bold text-gray-800 mt-1">{dailyOrders}</p>
            <p className="text-xs text-gray-500">New orders in the last 24 hours</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm text-blue-600 font-medium">Processing Videos</h3>
            <p className="text-2xl font-bold text-blue-700 mt-1">{videoDashboardSummary?.processing || 0}</p>
            <p className="text-xs text-blue-600">Videos currently being processed</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm text-green-600 font-medium">Video Completion</h3>
            <p className="text-2xl font-bold text-green-700 mt-1">{completionRate}%</p>
            <p className="text-xs text-green-600">Successfully completed videos</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;