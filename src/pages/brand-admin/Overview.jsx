import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

// Shop selectors
import {
  getShopsByBrand,
  selectShopsForBrand,
  selectShopLoading
} from '../../redux/slice/shopSlice';

// Order selectors
import {
  getOrdersByBrand,
  selectOrdersByBrand,
  selectOrderLoading
} from '../../redux/slice/orderSlice';

// ✅ CORRECT VIDEO SLICE IMPORTS
import {
  getVideosByBrand,
  selectVideos,
  selectVideoLoading,
  // These don't exist in your videoSlice - remove or create them
  // selectDashboardSummary,
  // selectDerivedVideoStats
} from '../../redux/slice/videoSlice';

// ✅ VIDEO EDIT SLICE IMPORTS - only use what actually exists
import {
  selectEditDetailsList,
  selectBrandEditDetails,
  getAllEditDetails,
  getEditDetailsByBrand,
  selectTotalEditCount  // This exists in videoEditSlice
} from '../../redux/slice/videoEditSlice';

const Overview = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user.currentUser);
  const brandId = user?.brand_id;

  // ✅ Shops from shopSlice
  const shops = useSelector(selectShopsForBrand(brandId));
  
  // ✅ Orders from orderSlice
  const brandOrders = useSelector(selectOrdersByBrand);
  
  // ✅ Videos from videoSlice
  const allVideos = useSelector(selectVideos);
  const brandVideos = useMemo(() => 
    allVideos?.filter(video => video.brand_id === brandId) || [],
    [allVideos, brandId]
  );
  
  // ✅ Video Edit stats - using what actually exists
  const allEditDetails = useSelector(selectEditDetailsList);
  const brandEditDetails = useSelector(selectBrandEditDetails);
  const totalEditCount = useSelector(selectTotalEditCount);
  
  // Calculate brand-specific edit stats
  const brandEditStats = useMemo(() => {
    if (!brandId) return null;
    
    // Filter edit details for this brand
    const brandEdits = allEditDetails?.filter(edit => edit.brand_id === brandId) || [];
    const brandSpecificEdits = brandEditDetails?.filter(edit => edit.brand_id === brandId) || [];
    
    const totalBrandEdits = brandEdits.length + brandSpecificEdits.length;
    
    // Calculate success/error rates
    const aiCorrect = brandEdits.filter(edit => edit.feedback_reason === 'correct').length;
    const aiErrors = brandEdits.filter(edit => edit.feedback_reason === 'incorrect').length;
    
    return {
      totalEdits: totalBrandEdits,
      aiCorrect,
      aiErrors,
      aiSuccessRate: totalBrandEdits > 0 ? ((aiCorrect / totalBrandEdits) * 100).toFixed(1) : '0.00',
      aiErrorRate: totalBrandEdits > 0 ? ((aiErrors / totalBrandEdits) * 100).toFixed(1) : '0.00',
      totalSegments: brandEdits.length + brandSpecificEdits.length
    };
  }, [brandId, allEditDetails, brandEditDetails]);

  // Calculate video stats manually
  const videoStats = useMemo(() => {
    if (!brandVideos?.length) {
      return {
        total: 0,
        byStatus: {},
        byStatusPercentage: {},
        recentUploads: 0,
        recentUploadsPercentage: 0
      };
    }
    
    const byStatus = {};
    brandVideos.forEach(video => {
      const status = video.status || 'unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });
    
    const byStatusPercentage = {};
    Object.entries(byStatus).forEach(([status, count]) => {
      byStatusPercentage[status] = ((count / brandVideos.length) * 100).toFixed(1);
    });
    
    // Recent uploads (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentUploads = brandVideos.filter(video => {
      if (!video.created_at) return false;
      const createdDate = new Date(video.created_at);
      return createdDate >= sevenDaysAgo;
    }).length;
    
    const recentUploadsPercentage = brandVideos.length > 0 
      ? ((recentUploads / brandVideos.length) * 100).toFixed(1)
      : 0;
    
    return {
      total: brandVideos.length,
      byStatus,
      byStatusPercentage,
      recentUploads,
      recentUploadsPercentage
    };
  }, [brandVideos]);

  // Calculate dashboard summary manually
  const dashboardSummary = useMemo(() => {
    if (!brandVideos?.length) {
      return {
        total: 0,
        uploaded: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        today: 0,
        yesterday: 0,
        lastWeek: 0
      };
    }
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const isToday = (date) => {
      if (!date) return false;
      const videoDate = new Date(date);
      return videoDate.toDateString() === today.toDateString();
    };
    
    const isYesterday = (date) => {
      if (!date) return false;
      const videoDate = new Date(date);
      return videoDate.toDateString() === yesterday.toDateString();
    };
    
    const isLastWeek = (date) => {
      if (!date) return false;
      const videoDate = new Date(date);
      return videoDate >= lastWeek && videoDate < today;
    };
    
    return {
      total: brandVideos.length,
      uploaded: brandVideos.filter(v => v.status === 'uploading').length,
      processing: brandVideos.filter(v => v.status === 'processing').length,
      completed: brandVideos.filter(v => ['completed', 'pending'].includes(v.status)).length,
      failed: brandVideos.filter(v => v.status === 'failed').length,
      today: brandVideos.filter(v => isToday(v.created_at)).length,
      yesterday: brandVideos.filter(v => isYesterday(v.created_at)).length,
      lastWeek: brandVideos.filter(v => isLastWeek(v.created_at)).length,
    };
  }, [brandVideos]);

  // Loading states
  const shopsLoading = useSelector(selectShopLoading);
  const ordersLoading = useSelector(selectOrderLoading);
  const videosLoading = useSelector(selectVideoLoading);
  
  const [loading, setLoading] = useState(true);
  const [dailyOrders, setDailyOrders] = useState(0);
  const [topShop, setTopShop] = useState(null);
  const [shopVideosMap, setShopVideosMap] = useState({});

  // Combined loading state
  const isLoading = loading || shopsLoading || ordersLoading || videosLoading;

  // Fetch all data
  useEffect(() => {
    if (brandId) {
      fetchData();
    }
  }, [brandId]);

  // Calculate shop videos map when shops and brandVideos are loaded
  useEffect(() => {
    if (shops?.length > 0 && brandVideos?.length > 0) {
      calculateShopVideosMap();
    }
  }, [shops, brandVideos]);

  // Calculate stats when data changes
  useEffect(() => {
    if (!isLoading && shops?.length > 0) {
      calculateStats();
    }
  }, [shops, brandOrders, shopVideosMap, brandVideos, isLoading]);

  const fetchData = async () => {
    if (!brandId) return;
    
    setLoading(true);
    console.log('🚀 Fetching brand data...');
    try {
      // ✅ 1. Fetch shops for this brand
      console.log('🏪 Fetching shops for brand:', brandId);
      await dispatch(getShopsByBrand(brandId));
      
      // ✅ 2. Fetch orders for this brand
      console.log('📦 Fetching orders for brand:', brandId);
      await dispatch(getOrdersByBrand(brandId));
      
      // ✅ 3. Fetch videos for this brand
      console.log('🎬 Fetching videos for brand:', brandId);
      await dispatch(getVideosByBrand(brandId));
      
      // ✅ 4. Fetch all edit details for video stats
      console.log('📊 Fetching video edit details...');
      await dispatch(getAllEditDetails());
      
      // ✅ 5. Fetch brand-specific edit details
      console.log('📊 Fetching brand edit details for:', brandId);
      await dispatch(getEditDetailsByBrand(brandId));
      
    } catch (error) {
      console.error('💥 Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateShopVideosMap = useCallback(() => {
    const videosByShop = {};
    
    shops.forEach(shop => {
      const shopVideos = brandVideos.filter(video => video.shop_id === shop.id);
      videosByShop[shop.id] = shopVideos || [];
    });
    
    console.log('🏪 Shop videos map:', Object.keys(videosByShop).length, 'shops with videos');
    setShopVideosMap(videosByShop);
  }, [shops, brandVideos]);

  const calculateStats = useCallback(() => {
    // Calculate daily orders (last 24 hours)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayOrders = brandOrders?.filter(order => {
      if (!order?.created_at) return false;
      const orderDate = new Date(order.created_at);
      return orderDate >= yesterday;
    }).length || 0;
    
    setDailyOrders(todayOrders);

    // Find top shop with most videos
    if (shops?.length > 0 && Object.keys(shopVideosMap).length > 0) {
      const shopsWithVideoCounts = shops.map(shop => {
        const shopVideos = shopVideosMap[shop.id] || [];
        
        const aiVideoRequests = shopVideos.filter(video => 
          ['completed', 'processing'].includes(video?.status)
        ).length;
        
        return {
          ...shop,
          aiVideoRequests,
          totalVideos: shopVideos.length
        };
      });
      
      const sortedShops = [...shopsWithVideoCounts].sort(
        (a, b) => (b.aiVideoRequests || 0) - (a.aiVideoRequests || 0)
      );

      setTopShop(sortedShops[0] || (shops[0] ? {
        ...shops[0],
        aiVideoRequests: 0,
        totalVideos: 0
      } : null));
    }
  }, [brandOrders, shops, shopVideosMap]);

  // ✅ Memoized derived values
  const brandVideoRequestsCount = brandVideos?.length || 0;

  const totalShops = shops?.length || 0;
  
  const activeShops = useMemo(() => 
    shops?.filter(shop => shop.is_active).length || 0,
    [shops]
  );

  const shopsWithAIRequests = useMemo(() => {
    if (Object.keys(shopVideosMap).length === 0) return 0;
    
    return Object.keys(shopVideosMap).filter(shopId => {
      const shopVideos = shopVideosMap[shopId] || [];
      return shopVideos.some(video => 
        ['completed', 'processing'].includes(video?.status)
      );
    }).length;
  }, [shopVideosMap]);

  const activeShopsPercentage = useMemo(() => 
    totalShops > 0 ? ((activeShops / totalShops) * 100).toFixed(1) : '0.0',
    [activeShops, totalShops]
  );

  const totalOrders = brandOrders?.length || 0;
  
  const completedOrders = useMemo(() => 
    brandOrders?.filter(order => {
      if (!order?.status) return false;
      const status = order.status.toLowerCase();
      return ['posted', 'completed', 'done'].includes(status);
    }).length || 0,
    [brandOrders]
  );

  const pendingOrders = useMemo(() => 
    brandOrders?.filter(order => {
      if (!order?.status) return false;
      const status = order.status.toLowerCase();
      return ['estimate', 'pending'].includes(status);
    }).length || 0,
    [brandOrders]
  );

  const inProgressOrders = useMemo(() => 
    brandOrders?.filter(order => {
      if (!order?.status) return false;
      const status = order.status.toLowerCase();
      return ['work-in-progress', 'in_progress', 'processing', 'in progress'].includes(status);
    }).length || 0,
    [brandOrders]
  );

  // Debug logging
  useEffect(() => {
    console.log('📊 Brand Overview State:', {
      brandId,
      totalShops,
      activeShops,
      totalOrders,
      brandVideos: brandVideos?.length,
      brandVideoRequests,
      shopsWithAIRequests,
      topShop: topShop?.name,
      dailyOrders,
      totalEditCount,
      brandEditStats
    });
  }, [brandId, totalShops, activeShops, totalOrders, brandVideos, brandVideoRequests, shopsWithAIRequests, topShop, dailyOrders, totalEditCount, brandEditStats]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Shops Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total Shops</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{totalShops}</p>
              <p className="text-xs text-gray-400 mt-1">
                {activeShops} active ({activeShopsPercentage}%)
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 00-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* AI Video Requests Card - USING ACTUAL VIDEO DATA */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">AI Video Requests</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">{brandVideoRequestsCount}</p>
              <p className="text-xs text-gray-400 mt-1">
                {shopsWithAIRequests} {shopsWithAIRequests === 1 ? 'shop' : 'shops'} with videos
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Daily Orders Card */}
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

        {/* Orders Summary Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total Orders</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{totalOrders}</p>
              <p className="text-xs text-gray-400 mt-1">
                {completedOrders} completed • {inProgressOrders} in progress
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Shops Summary Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Your Shops</h2>
          <Link 
            to="/brand-admin/shops" 
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
          >
            View All Shops
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shops && shops.length > 0 ? (
            shops.slice(0, 6).map(shop => {
              const shopVideos = shopVideosMap[shop.id] || [];
              const aiRequests = shopVideos.filter(v => 
                ['completed', 'processing'].includes(v?.status)
              ).length;
              
              return (
                <div key={shop.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border bg-gray-100 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 truncate">{shop.name}</h3>
                      <p className="text-xs text-gray-500 truncate">
                        {shop.city}{shop.state ? `, ${shop.state}` : ''}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      shop.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {shop.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <span className="text-gray-600">AI Video Requests:</span>
                    <span className="font-bold text-red-600">{aiRequests}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-sm">
                    <span className="text-gray-600">Total Videos:</span>
                    <span className="font-bold text-blue-600">{shopVideos.length}</span>
                  </div>
                  <Link 
                    to={`/brand-admin/shops/${shop.id}`}
                    className="mt-3 text-xs text-blue-600 hover:text-blue-800 flex items-center justify-end"
                  >
                    View Details
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-gray-500">No shops found for this brand</p>
              <Link 
                to="/brand-admin/shops/add"
                className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add your first shop
              </Link>
            </div>
          )}
        </div>
        
        {shops && shops.length > 6 && (
          <div className="mt-4 text-center">
            <Link 
              to="/brand-admin/shops" 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all {shops.length} shops →
            </Link>
          </div>
        )}
      </div>

      {/* Top Shop & Quick Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performing Shop */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Top Performing Shop</h2>
            {topShop?.aiVideoRequests > 0 && (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                #1 in AI Requests
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
                  {topShop.tekmetric_shop_id && (
                    <p className="text-xs text-blue-600 mt-1">
                      Tekmetric ID: {topShop.tekmetric_shop_id}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <div className="text-xl font-bold text-red-600">{topShop.aiVideoRequests}</div>
                      <div className="text-xs text-red-500">AI Video Requests</div>
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
                        {brandVideoRequestsCount > 0 
                          ? `${((topShop.aiVideoRequests / brandVideoRequestsCount) * 100).toFixed(1)}%`
                          : '0%'
                        }
                      </div>
                      <div className="text-xs text-green-500">of Total Requests</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                    </svg>
                    <div>
                      <div className="text-xl font-bold text-blue-600">{topShop.totalVideos || 0}</div>
                      <div className="text-xs text-blue-500">Total Videos</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <div className="text-xl font-bold text-purple-600">
                        {topShop.is_active ? 'Active' : 'Inactive'}
                      </div>
                      <div className="text-xs text-purple-500">Status</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">No AI video request data available</p>
              <p className="text-sm text-gray-400 mt-1">
                {totalShops === 0 
                  ? 'Add shops to start uploading videos' 
                  : 'Upload videos to see shop performance'}
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <Link
              to="/brand-admin/shops"
              className="flex items-center p-4 border rounded-lg hover:bg-blue-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-700 transition-colors">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">Manage Shops</h3>
                <p className="text-sm text-gray-500">View and manage all your shops</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            <Link
              to="/brand-admin/districts"
              className="flex items-center p-4 border rounded-lg hover:bg-green-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-4 group-hover:bg-green-700 transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">Manage Districts</h3>
                <p className="text-sm text-gray-500">Organize your shops by districts</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              to="/brand-admin/orders"
              className="flex items-center p-4 border rounded-lg hover:bg-indigo-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mr-4 group-hover:bg-indigo-700 transition-colors">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">View Orders</h3>
                <p className="text-sm text-gray-500">Check all orders across your shops</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              to="/brand-admin/analytics"
              className="flex items-center p-4 border rounded-lg hover:bg-purple-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-4 group-hover:bg-purple-700 transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">View Analytics</h3>
                <p className="text-sm text-gray-500">Check your brand performance analytics</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Brand Summary */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium text-gray-800 mb-3">Brand Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Total Orders</div>
                <div className="text-xl font-bold text-gray-800">{totalOrders}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Completion Rate</div>
                <div className="text-xl font-bold text-gray-800">
                  {totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : '0'}%
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Total Videos</div>
                <div className="text-xl font-bold text-gray-800">{brandVideos?.length || 0}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Shops with AI</div>
                <div className="text-xl font-bold text-gray-800">{shopsWithAIRequests}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Performance Summary - Using videoEditSlice data */}
      {brandEditStats && brandEditStats.totalEdits > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">AI Performance Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm text-blue-600 font-medium">Total AI Requests</h3>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {brandVideoRequestsCount}
              </p>
              <p className="text-xs text-blue-600">
                Videos processed by AI
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm text-green-600 font-medium">AI Success Rate</h3>
              <p className="text-2xl font-bold text-green-700 mt-1">
                {brandEditStats.aiSuccessRate}%
              </p>
              <p className="text-xs text-green-600">
                {brandEditStats.aiCorrect || 0} correct selections
              </p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-sm text-red-600 font-medium">AI Error Rate</h3>
              <p className="text-2xl font-bold text-red-700 mt-1">
                {brandEditStats.aiErrorRate}%
              </p>
              <p className="text-xs text-red-600">
                {brandEditStats.aiErrors || 0} manual corrections
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm text-purple-600 font-medium">Total Edits</h3>
              <p className="text-2xl font-bold text-purple-700 mt-1">
                {brandEditStats.totalEdits || 0}
              </p>
              <p className="text-xs text-purple-600">
                Feedback records
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Video Status Distribution */}
      {videoStats && Object.keys(videoStats.byStatus).length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Video Status Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(videoStats.byStatus).map(([status, count]) => (
              <div key={status} className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm text-gray-600 font-medium capitalize">
                  {status.replace('_', ' ')}
                </h3>
                <p className="text-2xl font-bold text-gray-700 mt-1">{count}</p>
                <p className="text-xs text-gray-500">
                  {videoStats.byStatusPercentage?.[status] || 0}% of total
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <span className="font-medium">Recent uploads (7 days):</span>{' '}
            {videoStats.recentUploads || 0} ({videoStats.recentUploadsPercentage || 0}%)
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;