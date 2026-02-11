import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectAllBrands,
  getAllBrands
} from '../../redux/slice/brandSlice';
import {
  selectAllShops,
  getAllShops
} from '../../redux/slice/shopSlice';
import {
  getOrdersByBrand
} from '../../redux/slice/orderSlice';
import {
  getTotalAIVideoRequests,
  getAIVideoRequestsByBrand
} from '../../redux/slice/videoEditSlice';
import { Link } from 'react-router-dom';

const Overview = () => {
  const dispatch = useDispatch();
  const brands = useSelector(selectAllBrands);
  const allShops = useSelector(selectAllShops);
  
  const [loading, setLoading] = useState(true);
  const [dailyOrders, setDailyOrders] = useState(0);
  const [totalAIVideoRequests, setTotalAIVideoRequests] = useState(0);
  const [aiRequestsByBrand, setAiRequestsByBrand] = useState([]);
  const [topBrand, setTopBrand] = useState(null);
  const [allOrders, setAllOrders] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [allOrders, allShops, aiRequestsByBrand, brands]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // First fetch all brands
      const brandsResult = await dispatch(getAllBrands());
      const brandsData = brandsResult.payload?.data || [];
      
      // Fetch shops and AI requests
      const [shopsResult, totalAIResult, aiByBrandResult] = await Promise.all([
        dispatch(getAllShops({ include_inactive: true })),
        dispatch(getTotalAIVideoRequests()),
        dispatch(getAIVideoRequestsByBrand())
      ]);

      // Fetch orders for each brand to get all orders
      if (brandsData.length > 0) {
        const allOrdersPromises = brandsData.map(brand => 
          dispatch(getOrdersByBrand(brand.id))
        );
        
        const ordersResults = await Promise.all(allOrdersPromises);
        
        // Combine all orders from all brands
        const combinedOrders = ordersResults.reduce((acc, result) => {
          const orders = result.payload?.data || [];
          return [...acc, ...orders];
        }, []);
        
        setAllOrders(combinedOrders);
      }

      // Set AI video requests data
      if (totalAIResult.payload?.data?.total_ai_video_requests !== undefined) {
        setTotalAIVideoRequests(totalAIResult.payload.data.total_ai_video_requests);
      }
      
      // Set AI requests by brand data
      if (aiByBrandResult.payload?.data) {
        setAiRequestsByBrand(aiByBrandResult.payload.data);
      }
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
    
    const todayOrders = allOrders?.filter(order => {
      if (!order.created_at) return false;
      const orderDate = new Date(order.created_at);
      return orderDate >= yesterday;
    }).length || 0;
    
    setDailyOrders(todayOrders);

    // Find top brand with most AI video requests
    if (aiRequestsByBrand.length > 0 && brands.length > 0) {
      // Sort brands by AI video requests (descending)
      const sortedBrands = [...aiRequestsByBrand].sort((a, b) => 
        (b.total_ai_video_requests || 0) - (a.total_ai_video_requests || 0)
      );

      if (sortedBrands.length > 0) {
        const topBrandData = sortedBrands[0];
        const brandInfo = brands?.find(b => b.id === topBrandData.brand_id);
        
        if (brandInfo) {
          setTopBrand({
            ...brandInfo,
            aiVideoRequests: topBrandData.total_ai_video_requests || 0
          });
        }
      }
    }
  };

  const getTotalVideoRequests = () => {
    return totalAIVideoRequests || 0;
  };

  const getActiveShopsCount = () => {
    return allShops?.filter(shop => shop.is_active).length || 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Brands Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-primary-blue">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total Brands</h3>
              <p className="text-3xl font-bold text-primary-blue mt-2">{brands?.length || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-blue" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 00-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* AI Video Requests Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">AI Video Requests</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">{getTotalVideoRequests()}</p>
              <p className="text-xs text-gray-400 mt-1">
                {aiRequestsByBrand.length > 0 ? `${aiRequestsByBrand.length} brands with requests` : 'No AI requests yet'}
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
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Daily Orders</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{dailyOrders}</p>
              <p className="text-xs text-gray-400 mt-1">
                Last 24 hours
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Shops Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Active Shops</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{getActiveShopsCount()}</p>
              <p className="text-xs text-gray-400 mt-1">
                Total: {allShops?.length || 0} shops
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Top Brand & Quick Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performing Brand */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Top Performing Brand</h2>
            {topBrand && (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                #1 in AI Requests
              </span>
            )}
          </div>
          
          {topBrand ? (
            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-4 mb-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden border bg-gray-100">
                  {topBrand.logo_url ? (
                    <img 
                      src={topBrand.logo_url} 
                      alt={topBrand.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://cdn-icons-png.flaticon.com/512/891/891419.png';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50">
                      <svg className="w-8 h-8 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 00-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V9z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{topBrand.name}</h3>
                  <p className="text-sm text-gray-500">{topBrand.email || 'No email provided'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <div className="text-xl font-bold text-red-600">{topBrand.aiVideoRequests}</div>
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
                        {totalAIVideoRequests > 0 ? 
                          `${((topBrand.aiVideoRequests / totalAIVideoRequests) * 100).toFixed(1)}%` : 
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
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    topBrand.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {topBrand.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {topBrand.created_at && (
                  <div className="text-sm">
                    <span className="font-medium">Created:</span>{' '}
                    {new Date(topBrand.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : aiRequestsByBrand.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">No AI video request data available</p>
              <p className="text-sm text-gray-400 mt-1">
                Brands will appear here when they start making AI video requests
              </p>
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto mb-3"></div>
              <p className="text-gray-500">Analyzing brand performance...</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <Link
              to="/super-admin/brands"
              className="flex items-center p-4 border rounded-lg hover:bg-blue-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-700 transition-colors">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">Manage Brands</h3>
                <p className="text-sm text-gray-500">View and manage all brands</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            <Link
              to="/super-admin/shops"
              className="flex items-center p-4 border rounded-lg hover:bg-green-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-4 group-hover:bg-green-700 transition-colors">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
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
              to="/super-admin/analytics"
              className="flex items-center p-4 border rounded-lg hover:bg-red-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mr-4 group-hover:bg-red-700 transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">View AI Analytics</h3>
                <p className="text-sm text-gray-500">Check AI video performance analytics</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Recent Activity Summary */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium text-gray-800 mb-3">System Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Total Orders</div>
                <div className="text-xl font-bold text-gray-800">{allOrders.length}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Brands with AI</div>
                <div className="text-xl font-bold text-gray-800">{aiRequestsByBrand.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;