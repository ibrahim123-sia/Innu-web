// src/components/DistrictManager/Overview.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
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
import { Link } from 'react-router-dom';

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
  const currentUser = useSelector(state => state.user.currentUser);
  
  // Get district_id directly from currentUser
  const districtId = currentUser?.district_id;
  
  // Log user info for debugging
  useEffect(() => {
    console.log('Current User:', currentUser);
    console.log('District ID:', districtId);
  }, [currentUser, districtId]);
  
  // Local state for shops (direct API)
  const [shops, setShops] = useState([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [shopsError, setShopsError] = useState(null);
  
  // Get data from Redux
  const districtOrders = useSelector(selectOrdersByDistrict) || []; 
  
  const videoLoading = useSelector(selectVideoLoading);
  const orderLoading = useSelector(selectOrderLoading);
  
  // Local state for videos
  const [districtVideos, setDistrictVideos] = useState([]);
  const [topShopVideos, setTopShopVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [videosFetched, setVideosFetched] = useState(false);
  
  // Fetch shops directly from API
  const fetchShops = async () => {
    if (!districtId) {
      console.log('No district ID available');
      setShopsLoading(false);
      return;
    }
    
    setShopsLoading(true);
    
    try {
      console.log(`Fetching shops for district: ${districtId}`);
      const response = await API.get(`/shops/district/${districtId}/shops`);
      console.log('Shops API response:', response.data);
      
      // Extract shops from response
      if (response.data?.data && Array.isArray(response.data.data)) {
        setShops(response.data.data);
      } else if (Array.isArray(response.data)) {
        setShops(response.data);
      } else {
        setShops([]);
      }
      
      setShopsError(null);
    } catch (error) {
      console.error('Error fetching shops:', error);
      setShopsError(error.response?.data?.message || error.message);
      setShops([]);
    } finally {
      setShopsLoading(false);
    }
  };

  // Fetch orders from Redux
  const fetchOrders = async () => {
    if (!districtId) return;
    
    try {
      await dispatch(getOrdersByDistrict(districtId)).unwrap();
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  // Fetch videos for district
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
      setVideosFetched(true);
      
    } catch (error) {
      console.error(`Error fetching videos for district ${districtId}:`, error);
      setDistrictVideos([]);
    }
  };

  // Fetch videos for top shop
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

  // Fetch all data on mount or when districtId changes
  useEffect(() => {
    if (districtId) {
      const fetchAllData = async () => {
        setLoading(true);
        setIsInitialLoad(true);
        setVideosFetched(false);
        
        await fetchShops();
        await fetchOrders();
        
        setLoading(false);
      };
      
      fetchAllData();
    } else {
      // If no district ID, still need to stop loading
      setShopsLoading(false);
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [districtId]);

  // Fetch videos when shops are loaded
  useEffect(() => {
    if (shops.length > 0 && !videosFetched) {
      fetchVideosForDistrict();
    }
  }, [shops, videosFetched]);

  // Fetch videos for top shop when it changes
  useEffect(() => {
    if (topShop?.id) {
      fetchTopShopVideos(topShop.id);
    }
  }, [topShop]);

  // Update data ready state
  useEffect(() => {
    if (!shopsLoading && !loading && shops.length > 0) {
      setTimeout(() => {
        setIsInitialLoad(false);
        setIsDataReady(true);
      }, 300);
    } else if (!districtId) {
      // If no district ID, mark as ready with empty state
      setIsInitialLoad(false);
      setIsDataReady(true);
    }
  }, [shopsLoading, loading, shops, districtId]);

  // Shop stats
  const totalShops = shops.length;
  const activeShops = shops.filter(shop => shop.is_active).length;

  // Get top shop (first shop for now - you might want to sort by performance)
  const topShop = useMemo(() => {
    return shops.length > 0 ? shops[0] : null;
  }, [shops]);

  // Calculate video stats from district videos
  const totalVideos = districtVideos.length;
  const videosToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return districtVideos.filter(video => {
      if (!video.created_at) return false;
      const videoDate = new Date(video.created_at);
      return videoDate >= today;
    }).length;
  }, [districtVideos]);

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

  // If no district ID, show message
  if (!districtId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                No district assigned to this user. Please contact an administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show skeleton during initial load
  if (isInitialLoad || shopsLoading || (loading && !isDataReady)) {
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

  // Show error state
  if (shopsError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">Error loading shops: {shopsError}</p>
              <button 
                onClick={fetchShops}
                className="mt-2 text-sm text-red-700 underline hover:text-red-900"
              >
                Try again
              </button>
            </div>
          </div>
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
        </div>
      </div>
    </div>
  );
};

export default Overview;