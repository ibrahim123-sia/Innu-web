import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  selectAllShops, 
  getShopsByDistrict,
  selectShopsByDistrict 
} from '../../redux/slice/shopSlice';
import { 
  selectOrdersByDistrict,
  getOrdersByDistrict,
  selectOrderLoading
} from '../../redux/slice/orderSlice';
import { 
  getVideosByDistrict,  
  getVideosByShop,     
  selectVideoLoading,
} from '../../redux/slice/videoSlice';
import {
  getUsersByDistrict,
  selectUsersByDistrict,
  selectUserLoading
} from '../../redux/slice/userSlice';
import { Link } from 'react-router-dom';

const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

const ShopManagerCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
    <div className="flex items-center space-x-3 mb-3">
      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-40"></div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded w-24"></div>
      <div className="h-3 bg-gray-200 rounded w-32"></div>
    </div>
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="h-8 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

const TopShopSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="h-6 bg-gray-200 rounded animate-pulse w-48 mb-4"></div>
    <div className="border rounded-lg p-4">
      <div className="flex items-center space-x-4 mb-3">
        <div className="w-16 h-16 rounded-lg bg-gray-200 animate-pulse"></div>
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded animate-pulse w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-40"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-gray-100 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-8 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-12"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-100 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-12 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-12"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
      </div>
    </div>
  </div>
);

const QuickActionsSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="h-6 bg-gray-200 rounded animate-pulse w-32 mb-4"></div>
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center p-4 border rounded-lg">
          <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse mr-4"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
          </div>
          <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  </div>
);

const Overview = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector(state => state.user.currentUser);
  const districtId = currentUser?.district_id;
  const districtName = currentUser?.district_name || 'Your District';
  
  // Get data from Redux
  const shopsByDistrict = useSelector(selectShopsByDistrict);
  const districtOrders = useSelector(selectOrdersByDistrict) || []; 
  const districtUsers = useSelector(selectUsersByDistrict) || [];
  
  const videoLoading = useSelector(selectVideoLoading);
  const orderLoading = useSelector(selectOrderLoading);
  const userLoading = useSelector(selectUserLoading);
  
  // Local state
  const [districtVideos, setDistrictVideos] = useState([]);
  const [topShopVideos, setTopShopVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [expandedShop, setExpandedShop] = useState(null);

  // Filter shop managers from district users
  const shopManagers = useMemo(() => {
    return districtUsers.filter(user => user.role === 'shop_manager');
  }, [districtUsers]);

  const filteredShops = useMemo(() => {
    if (!shopsByDistrict) return [];
    
    if (shopsByDistrict.data && Array.isArray(shopsByDistrict.data)) {
      return shopsByDistrict.data;
    }
    
    if (Array.isArray(shopsByDistrict)) {
      return shopsByDistrict;
    }
    
    if (shopsByDistrict.shops && Array.isArray(shopsByDistrict.shops)) {
      return shopsByDistrict.shops;
    }
    
    if (typeof shopsByDistrict === 'object') {
      const values = Object.values(shopsByDistrict);
      if (values.length > 0 && Array.isArray(values[0])) {
        return values[0];
      }
    }
    
    return [];
  }, [shopsByDistrict]);

  // Calculate DAILY ORDERS (last 24 hours)
  const dailyOrders = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return districtOrders.filter(order => {
      if (!order?.created_at) return false;
      const orderDate = new Date(order.created_at);
      return orderDate >= yesterday;
    }).length;
  }, [districtOrders]);

  // Calculate video stats
  const totalVideos = districtVideos.length;
  const completedVideos = districtVideos.filter(v => v.status === 'completed').length;
  const processingVideos = districtVideos.filter(v => v.status === 'processing').length;
  
  // Shop stats
  const totalShops = filteredShops.length;
  const activeShops = filteredShops.filter(shop => shop.is_active).length;

  // Get top shop
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

  // Fetch data when shops are loaded
  useEffect(() => {
    if (filteredShops && filteredShops.length > 0 && !dataFetched) {
      fetchVideosForDistrict();
    }
  }, [filteredShops, dataFetched]);

  const fetchData = async () => {
    if (!districtId) return;
    
    setLoading(true);
    setIsInitialLoad(true);
    setDataFetched(false);
    
    try {
      await dispatch(getShopsByDistrict(districtId)).unwrap();
      await dispatch(getOrdersByDistrict(districtId)).unwrap();
      await dispatch(getUsersByDistrict(districtId)).unwrap();
    } catch (error) {
      console.error('Error fetching base data:', error);
      setIsInitialLoad(false);
      setLoading(false);
    }
  };

  const fetchVideosForDistrict = async () => {
    if (!districtId) return;
    
    try {
      const result = await dispatch(getVideosByDistrict(districtId)).unwrap();
      
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

  const fetchTopShopVideos = async (shopId) => {
    try {
      const result = await dispatch(getVideosByShop(shopId)).unwrap();
      
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
      
      setTopShopVideos(videosData);
    } catch (error) {
      console.error('Error fetching top shop videos:', error);
      setTopShopVideos([]);
    }
  };

  // Handle open shop manager portal
  const handleOpenShopManager = (shopId) => {
    navigate(`/shop-manager`, { 
      state: { 
        shopId,
        fromDistrict: true
      } 
    });
  };

  // Toggle shop expansion
  const toggleShopExpansion = (shopId) => {
    setExpandedShop(expandedShop === shopId ? null : shopId);
  };

  // Get profile picture URL
  const getProfilePicUrl = (profilePicData) => {
    if (!profilePicData) return 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    
    if (typeof profilePicData === 'string') {
      if (profilePicData.startsWith('{')) {
        try {
          const parsed = JSON.parse(profilePicData);
          return parsed.publicUrl || parsed.signedUrl || parsed.filePath || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
        } catch (e) {
          return profilePicData;
        }
      }
      return profilePicData;
    }
    
    return 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  };

  // Show skeleton during initial load
  if (isInitialLoad || (loading && !isDataReady)) {
    return (
      <div className="p-6 transition-opacity duration-300 ease-in-out">
        <StatsSkeleton />
        
        {/* Shop Managers Section Skeleton */}
        <div className="mt-8 mb-8">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <ShopManagerCardSkeleton key={i} />)}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TopShopSkeleton />
          <QuickActionsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 transition-opacity duration-300 ease-in-out">
      {/* Stats Grid */}
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
              <h3 className="text-sm text-gray-500">AI Video Requests</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">{totalVideos}</p>
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
              <h3 className="text-sm text-gray-500">Daily Repair Orders</h3>
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
              <h3 className="text-sm text-gray-500">Shop Managers</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {shopManagers.length}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Managing {totalShops} shops
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* SHOP MANAGERS SECTION - NEW */}
      <div className="mt-8 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Shop Managers in {districtName}</h2>
          <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">
            {shopManagers.length} Managers
          </span>
        </div>

        {shopManagers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shopManagers.map((manager) => {
              // Find which shop this manager is assigned to
              const assignedShop = filteredShops.find(s => s.id === manager.shop_id);
              
              return (
                <div key={manager.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-white">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-200">
                        <img 
                          src={getProfilePicUrl(manager.profile_pic_url)} 
                          alt={manager.first_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">
                          {manager.first_name} {manager.last_name}
                        </h3>
                        <p className="text-sm text-gray-500">{manager.email}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {assignedShop ? assignedShop.name : 'No shop assigned'}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {manager.contact_no || 'No contact number'}
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => assignedShop && handleOpenShopManager(assignedShop.id)}
                        disabled={!assignedShop}
                        className={`px-4 py-2 text-sm rounded-lg flex items-center ${
                          assignedShop 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open Portal
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center border border-gray-200">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Shop Managers Found</h3>
            <p className="text-gray-500 mb-4">
              No shop managers are assigned to this district yet.
            </p>
            <Link
              to="/district-manager/users"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Shop Manager
            </Link>
          </div>
        )}
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
              className="flex items-center p-4 border rounded-lg hover:bg-green-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-4 group-hover:bg-green-700 transition-colors">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">Manage Users</h3>
                <p className="text-sm text-gray-500">View and manage shop managers</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              to="/district-manager/analytics"
              className="flex items-center p-4 border rounded-lg hover:bg-purple-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-4 group-hover:bg-purple-700 transition-colors">
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