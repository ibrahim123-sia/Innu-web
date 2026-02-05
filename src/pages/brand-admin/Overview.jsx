import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  getBrandShops
} from '../../redux/slice/shopSlice';
import {
  getOrdersByBrand
} from '../../redux/slice/orderSlice';
import {
  getTotalAIVideoRequests,
  getAIVideoRequestsByBrand,
  getBrandAIErrorStats
} from '../../redux/slice/videoEditSlice';
import { Link } from 'react-router-dom';

const Overview = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user.currentUser);
  const brandId = user?.brand_id;
  
  // Get shops directly from Redux state
  const shops = useSelector(state => state.shop.shops || []);
  
  // Get orders specifically for this brand using the new method
  const brandOrders = useSelector(state => 
    state.order.ordersByBrand || []
  );
  
  const [loading, setLoading] = useState(true);
  const [dailyOrders, setDailyOrders] = useState(0);
  const [totalAIVideoRequests, setTotalAIVideoRequests] = useState(0);
  const [aiRequestsByBrand, setAiRequestsByBrand] = useState([]);
  const [brandAIStats, setBrandAIStats] = useState(null);
  const [topShop, setTopShop] = useState(null);

  // Fetch data only once
  useEffect(() => {
    if (brandId) {
      fetchData();
    }
  }, [brandId]);

  // Calculate stats when data changes
  useEffect(() => {
    if (!loading) {
      calculateStats();
    }
  }, [shops, brandOrders, aiRequestsByBrand, loading]);

  const fetchData = async () => {
    if (!brandId) return;
    
    setLoading(true);
    try {
      await Promise.all([
        dispatch(getBrandShops(brandId)),
        dispatch(getOrdersByBrand({ brandId })),
        dispatch(getTotalAIVideoRequests()),
        dispatch(getAIVideoRequestsByBrand()),
        dispatch(getBrandAIErrorStats())
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    // Calculate daily orders (last 24 hours)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Now brandOrders already contains only orders for this brand
    const todayOrders = brandOrders.filter(order => {
      if (!order?.created_at) return false;
      const orderDate = new Date(order.created_at);
      return orderDate >= yesterday;
    }).length || 0;
    
    setDailyOrders(todayOrders);

    // Find top shop with most AI video requests
    if (aiRequestsByBrand.length > 0 && shops.length > 0) {
      // Combine shop info with AI request data
      const shopsWithAIRequests = shops.map(shop => {
        const shopAIRequests = aiRequestsByBrand.find(item => 
          item.shop_id && shop.id && String(item.shop_id) === String(shop.id)
        );
        
        return {
          ...shop,
          aiVideoRequests: shopAIRequests?.total_ai_video_requests || 0
        };
      });

      // Sort shops by AI video requests (descending)
      const sortedShops = [...shopsWithAIRequests].sort((a, b) => 
        (b.aiVideoRequests || 0) - (a.aiVideoRequests || 0)
      );

      if (sortedShops.length > 0) {
        setTopShop(sortedShops[0]);
      }
    } else if (shops.length > 0) {
      // Set first shop as default if no AI data
      setTopShop({
        ...shops[0],
        aiVideoRequests: 0
      });
    }
  };

  const getTotalVideoRequests = () => {
    return totalAIVideoRequests || 0;
  };

  const getTotalShops = () => {
    return shops?.length || 0;
  };

  const getActiveShops = () => {
    return shops?.filter(shop => shop.is_active).length || 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002868]"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Brand Dashboard</h1>
        <p className="text-gray-600">
          Welcome to {user?.brand_name || 'your brand'} dashboard
        </p>
      </div>

      {/* Stats Grid - REMOVED TOTAL ORDERS CARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#002868]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total Shops</h3>
              <p className="text-3xl font-bold text-[#002868] mt-2">{getTotalShops()}</p>
              <p className="text-xs text-gray-400 mt-1">
                {getActiveShops()} active shops
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#002868]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 00-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#BF0A30]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">AI Video Requests</h3>
              <p className="text-3xl font-bold text-[#BF0A30] mt-2">{getTotalVideoRequests()}</p>
              <p className="text-xs text-gray-400 mt-1">
                {aiRequestsByBrand.length > 0 ? `${aiRequestsByBrand.length} shops with requests` : 'No AI requests yet'}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#BF0A30]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Daily Orders</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{dailyOrders}</p>
              <p className="text-xs text-gray-400 mt-1">Last 24 hours</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Active Shops</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {getActiveShops()}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {((getActiveShops() / (shops?.length || 1)) * 100).toFixed(1)}% of total
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Top Performing Shop</h2>
            {topShop && (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
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
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <div className="text-xl font-bold text-blue-600">{topShop.aiVideoRequests}</div>
                      <div className="text-xs text-blue-500">AI Video Requests</div>
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
                        {topShop.aiVideoRequests > 0 ? 
                          `${((topShop.aiVideoRequests / (totalAIVideoRequests || 1)) * 100).toFixed(1)}%` : 
                          '0%'
                        }
                      </div>
                      <div className="text-xs text-green-500">of Total Requests</div>
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
          ) : aiRequestsByBrand.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">No AI video request data available</p>
              <p className="text-sm text-gray-400 mt-1">Shops will appear here when they start making AI video requests</p>
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002868] mx-auto mb-3"></div>
              <p className="text-gray-500">Analyzing shop performance...</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <Link
              to="/brand-admin/shops"
              className="flex items-center p-4 border rounded-lg hover:bg-blue-50 transition-colors"
            >
              <div className="w-10 h-10 bg-[#002868] rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Manage Shops</h3>
                <p className="text-sm text-gray-500">View and manage all shops</p>
              </div>
            </Link>
            
            <Link
              to="/brand-admin/districts"
              className="flex items-center p-4 border rounded-lg hover:bg-blue-50 transition-colors"
            >
              <div className="w-10 h-10 bg-[#BF0A30] rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Manage Districts</h3>
                <p className="text-sm text-gray-500">Organize shops by districts</p>
              </div>
            </Link>

            <Link
              to="/brand-admin/analytics"
              className="flex items-center p-4 border rounded-lg hover:bg-blue-50 transition-colors"
            >
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">View Analytics</h3>
                <p className="text-sm text-gray-500">Check performance analytics</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* AI Performance Summary */}
      {brandAIStats && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">AI Performance Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm text-blue-600 font-medium">AI Success Rate</h3>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {brandAIStats.aiSuccessRate || '0.00'}%
              </p>
              <p className="text-xs text-blue-600">
                {brandAIStats.aiCorrect || 0} correct selections
              </p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-sm text-red-600 font-medium">AI Error Rate</h3>
              <p className="text-2xl font-bold text-red-700 mt-1">
                {brandAIStats.aiErrorRate || '0.00'}%
              </p>
              <p className="text-xs text-red-600">
                {brandAIStats.aiErrors || 0} manual corrections
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm text-green-600 font-medium">Total Segments</h3>
              <p className="text-2xl font-bold text-green-700 mt-1">
                {brandAIStats.totalSegments || 0}
              </p>
              <p className="text-xs text-green-600">
                Processed video segments
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm text-purple-600 font-medium">Daily Orders</h3>
              <p className="text-2xl font-bold text-purple-700 mt-1">
                {dailyOrders}
              </p>
              <p className="text-xs text-purple-600">
                Orders in last 24 hours
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;