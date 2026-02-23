// src/components/DistrictManager/Overview.jsx

// ... (all imports remain the same)

const Overview = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.user.currentUser);
  const districtId = currentUser?.district_id;
  
  // Get data from Redux with correct selectors
  // Now shopsByDistrict is ALWAYS an array of shops
  const shopsByDistrict = useSelector(selectShopsByDistrict);
  const districtOrders = useSelector(selectOrdersByDistrict) || []; 
  
  const videoLoading = useSelector(selectVideoLoading);
  const orderLoading = useSelector(selectOrderLoading);
  
  // Local state for videos (following Analytics pattern)
  const [districtVideos, setDistrictVideos] = useState([]);
  const [topShopVideos, setTopShopVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  
  // Debug: Log shopsByDistrict
  useEffect(() => {
    console.log('shopsByDistrict from selector:', shopsByDistrict);
    console.log('Is shopsByDistrict array?', Array.isArray(shopsByDistrict));
    console.log('shopsByDistrict length:', shopsByDistrict?.length);
  }, [shopsByDistrict]);
  
  // ✅ SIMPLIFIED: shopsByDistrict is now always an array of shops
  const filteredShops = useMemo(() => {
    // shopsByDistrict should now be a clean array from the reducer
    if (Array.isArray(shopsByDistrict)) {
      console.log('Using shopsByDistrict array with length:', shopsByDistrict.length);
      return shopsByDistrict;
    }
    
    // Fallback for any unexpected structure
    if (shopsByDistrict?.data && Array.isArray(shopsByDistrict.data)) {
      console.log('Fallback: found shops in shopsByDistrict.data');
      return shopsByDistrict.data;
    }
    
    console.log('No valid shops data found, returning empty array');
    return [];
  }, [shopsByDistrict]);

  // ✅ Calculate DAILY ORDERS (last 24 hours)
  const dailyOrders = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return districtOrders.filter(order => {
      if (!order?.created_at) return false;
      const orderDate = new Date(order.created_at);
      return orderDate >= yesterday;
    }).length;
  }, [districtOrders]);

  // Calculate video stats from district videos
  const totalVideos = districtVideos.length;
  const completedVideos = districtVideos.filter(v => v.status === 'completed').length;
  const processingVideos = districtVideos.filter(v => v.status === 'processing').length;
  const uploadedVideos = districtVideos.filter(v => v.status === 'uploaded' || v.status === 'uploading').length;
  const failedVideos = districtVideos.filter(v => v.status === 'failed').length;
  
  // Shop stats - now using filteredShops directly
  const totalShops = filteredShops.length;
  const activeShops = filteredShops.filter(shop => shop.is_active).length;

  // Videos created today
  const videosToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return districtVideos.filter(video => {
      if (!video.created_at) return false;
      const videoDate = new Date(video.created_at);
      return videoDate >= today;
    }).length;
  }, [districtVideos]);

  // Get top shop (first shop for now - you might want to sort by performance)
  const topShop = useMemo(() => {
    return filteredShops.length > 0 ? filteredShops[0] : null;
  }, [filteredShops]);

  // Fetch videos for top shop when it changes
  useEffect(() => {
    if (topShop?.id) {
      fetchTopShopVideos(topShop.id);
    }
  }, [topShop]);

  // Fetch initial data when districtId changes
  useEffect(() => {
    if (districtId) {
      fetchData();
    }
  }, [districtId]);

  // Fetch videos when shops are loaded (for refresh case)
  useEffect(() => {
    if (filteredShops && filteredShops.length > 0 && !dataFetched) {
      console.log('Shops loaded, fetching video data for district');
      fetchVideosForDistrict();
    }
  }, [filteredShops, dataFetched]);

  const fetchData = async () => {
    if (!districtId) return;
    
    setLoading(true);
    setIsInitialLoad(true);
    setDataFetched(false);
    
    try {
      console.log('Fetching base data for district:', districtId);
      
      const shopResult = await dispatch(getShopsByDistrict(districtId)).unwrap();
      console.log('Shop fetch result:', shopResult);
      
      await dispatch(getOrdersByDistrict(districtId)).unwrap();
      
    } catch (error) {
      console.error('Error fetching base data:', error);
      setIsInitialLoad(false);
      setLoading(false);
    }
  };

  // ✅ Fetch videos for district
  const fetchVideosForDistrict = async () => {
    if (!districtId) return;
    
    try {
      console.log(`Fetching videos for district: ${districtId}`);
      const result = await dispatch(getVideosByDistrict(districtId)).unwrap();
      console.log(`Videos response for district ${districtId}:`, result);
      
      let videosData = [];
      
      // Extract videos from data property first
      if (result?.data && Array.isArray(result.data)) {
        videosData = result.data;
      } else if (Array.isArray(result)) {
        videosData = result;
      }
      
      console.log(`Setting ${videosData.length} videos for district ${districtId}`);
      setDistrictVideos(videosData);
      setDataFetched(true);
      
    } catch (error) {
      console.error(`Error fetching videos for district ${districtId}:`, error);
      setDistrictVideos([]);
    } finally {
      setTimeout(() => {
        setIsInitialLoad(false);
        setIsDataReady(true);
        setLoading(false);
      }, 300);
    }
  };

  // ✅ Fetch videos for top shop
  const fetchTopShopVideos = async (shopId) => {
    try {
      console.log(`Fetching videos for top shop: ${shopId}`);
      const result = await dispatch(getVideosByShop(shopId)).unwrap();
      console.log(`Videos response for shop ${shopId}:`, result);
      
      let videosData = [];
      
      // Extract videos from data property first
      if (result?.data && Array.isArray(result.data)) {
        videosData = result.data;
      } else if (Array.isArray(result)) {
        videosData = result;
      }
      
      console.log(`Setting ${videosData.length} videos for top shop ${shopId}`);
      setTopShopVideos(videosData);
    } catch (error) {
      console.error('Error fetching top shop videos:', error);
      setTopShopVideos([]);
    }
  };

  // Show skeleton during initial load
  if (isInitialLoad || (loading && !isDataReady)) {
    return (
      <div className="p-6 transition-opacity duration-300 ease-in-out">
        <StatsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TopShopSkeleton />
          <QuickActionsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 transition-opacity duration-300 ease-in-out">
      {/* Stats Grid - All showing DAILY numbers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total Shops</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{totalShops}</p>
              <p className="text-xs text-gray-400 mt-1">
                {activeShops} active
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 00-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Video Requests</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">{totalVideos}</p>
              <p className="text-xs text-gray-400 mt-1">
                {videosToday} today
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Daily Orders</h3>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{dailyOrders}</p>
              <p className="text-xs text-gray-400 mt-1">
                Last 24 hours
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600 hover:shadow-lg transition-shadow duration-200">
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

      {/* Top Shop & Quick Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Top Performing Shop</h2>
          
          {topShop ? (
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors duration-150">
              <div className="flex items-center space-x-4 mb-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center">
                  {topShop.logo_url ? (
                    <img 
                      src={topShop.logo_url} 
                      alt={topShop.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://cdn-icons-png.flaticon.com/512/891/891419.png';
                      }}
                    />
                  ) : (
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm3 6a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  )}
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
                      <div className="text-xl font-bold text-blue-600">
                        {topShopVideos.length}
                      </div>
                      <div className="text-xs text-blue-500">Videos</div>
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
                        {topShop.is_active ? 'Active' : 'Inactive'}
                      </div>
                      <div className="text-xs text-green-500">Status</div>
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

        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
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
              to="/district-manager/users"
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
        </div>
      </div>
    </div>
  );
};

export default Overview;