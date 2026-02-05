import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectAllShops, getShopsByDistrict } from '../../redux/slice/shopSlice';
import { selectAllOrders, getOrdersByDistrict } from '../../redux/slice/orderSlice';
import { getTotalAIVideoRequestsByDistrict } from '../../redux/slice/videoEditSlice';
import { Link } from 'react-router-dom';

const Overview = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.user.currentUser);
  const districtId = currentUser?.district_id;
  
  const allShops = useSelector(selectAllShops);
  const allOrders = useSelector(selectAllOrders);
  
  const [loading, setLoading] = useState(true);
  const [totalShops, setTotalShops] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalAIVideoRequests, setTotalAIVideoRequests] = useState(0);
  const [dailyOrders, setDailyOrders] = useState(0);
  const [topShop, setTopShop] = useState(null);

  useEffect(() => {
    if (districtId) {
      fetchData();
    }
  }, [districtId]);

  useEffect(() => {
    calculateStats();
  }, [allOrders, allShops]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const results = await Promise.all([
        dispatch(getShopsByDistrict(districtId)),
        dispatch(getOrdersByDistrict(districtId)),
        dispatch(getTotalAIVideoRequestsByDistrict(districtId))
      ]);

      // Set AI video requests data
      if (results[2].payload?.data?.total_ai_video_requests) {
        setTotalAIVideoRequests(results[2].payload.data.total_ai_video_requests);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    // Filter shops by district
    const districtShops = allShops?.filter(shop => shop.district_id === districtId) || [];
    setTotalShops(districtShops.length);

    // Filter orders by district (through shop association)
    const districtShopIds = districtShops.map(shop => shop.id);
    const districtOrders = allOrders?.filter(order => 
      districtShopIds.includes(order.shop_id)
    ) || [];
    setTotalOrders(districtOrders.length);

    // Calculate daily orders (last 24 hours)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayOrders = districtOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= yesterday;
    }).length;
    
    setDailyOrders(todayOrders);

    // Find top shop with most orders
    if (districtShops.length > 0) {
      const shopOrdersCount = {};
      districtOrders.forEach(order => {
        shopOrdersCount[order.shop_id] = (shopOrdersCount[order.shop_id] || 0) + 1;
      });

      const sortedShops = districtShops.map(shop => ({
        ...shop,
        orderCount: shopOrdersCount[shop.id] || 0
      })).sort((a, b) => b.orderCount - a.orderCount);

      if (sortedShops.length > 0 && sortedShops[0].orderCount > 0) {
        setTopShop(sortedShops[0]);
      } else {
        setTopShop(districtShops[0]);
      }
    }
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">District Dashboard</h1>
        <p className="text-gray-600">Welcome to your district manager dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#002868]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total Shops</h3>
              <p className="text-3xl font-bold text-[#002868] mt-2">{totalShops}</p>
              <p className="text-xs text-gray-400 mt-1">
                {totalShops > 0 ? 'Shops in your district' : 'No shops assigned'}
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
              <p className="text-3xl font-bold text-[#BF0A30] mt-2">{totalAIVideoRequests}</p>
              <p className="text-xs text-gray-400 mt-1">
                {totalShops > 0 ? 'Total AI video requests' : 'No requests yet'}
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
              <h3 className="text-sm text-gray-500">Total Orders</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{totalOrders}</p>
              <p className="text-xs text-gray-400 mt-1">
                {dailyOrders > 0 ? `${dailyOrders} orders today` : 'No orders today'}
              </p>
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
                {allShops?.filter(shop => shop.district_id === districtId && shop.is_active).length || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
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
            {topShop && totalOrders > 0 && (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                #1 in Orders
              </span>
            )}
          </div>
          
          {topShop ? (
            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-4 mb-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 00-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V9z" clipRule="evenodd" />
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <div className="text-xl font-bold text-blue-600">
                        {topShop.orderCount || 0}
                      </div>
                      <div className="text-xs text-blue-500">Total Orders</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
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
                  <span className="font-medium">Contact:</span>
                  <span className="text-sm">{topShop.phone || 'No phone'}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Email:</span>{' '}
                  {topShop.email || 'No email'}
                </div>
              </div>
            </div>
          ) : totalShops === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-gray-500">No shops assigned to your district</p>
              <p className="text-sm text-gray-400 mt-1">Contact super admin to assign shops to your district</p>
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
              to="/district-manager/shops"
              className="flex items-center p-4 border rounded-lg hover:bg-blue-50 transition-colors"
            >
              <div className="w-10 h-10 bg-[#002868] rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Manage Shops</h3>
                <p className="text-sm text-gray-500">View and manage all shops in your district</p>
              </div>
            </Link>
            
            <Link
              to="/district-manager/analytics"
              className="flex items-center p-4 border rounded-lg hover:bg-blue-50 transition-colors"
            >
              <div className="w-10 h-10 bg-[#BF0A30] rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">View Analytics</h3>
                <p className="text-sm text-gray-500">Check AI video performance analytics</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;