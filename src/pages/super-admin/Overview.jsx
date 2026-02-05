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
  selectAllOrders,
  getAllOrders
} from '../../redux/slice/orderSlice';
import { Link } from 'react-router-dom';

const Overview = () => {
  const dispatch = useDispatch();
  const brands = useSelector(selectAllBrands);
  const allShops = useSelector(selectAllShops);
  const allOrders = useSelector(selectAllOrders);
  
  const [loading, setLoading] = useState(true);
  const [dailyOrders, setDailyOrders] = useState(0);
  const [topShop, setTopShop] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [allOrders, allShops]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        dispatch(getAllBrands()),
        dispatch(getAllShops({ include_inactive: true })),
        dispatch(getAllOrders())
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
    
    const todayOrders = allOrders?.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= yesterday;
    }).length || 0;
    
    setDailyOrders(todayOrders);

    // Find shop with most video requests
    const shopRequestCount = {};
    allOrders?.forEach(order => {
      if (order.shop_id) {
        shopRequestCount[order.shop_id] = (shopRequestCount[order.shop_id] || 0) + 1;
      }
    });

    const maxShopId = Object.keys(shopRequestCount).reduce((a, b) => 
      shopRequestCount[a] > shopRequestCount[b] ? a : b, null
    );

    if (maxShopId) {
      const shop = allShops?.find(s => s.id === parseInt(maxShopId));
      setTopShop({
        ...shop,
        requestCount: shopRequestCount[maxShopId]
      });
    }
  };

  const getTotalVideoRequests = () => {
    return allOrders?.length || 0;
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome to your super admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#002868]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total Brands</h3>
              <p className="text-3xl font-bold text-[#002868] mt-2">{brands?.length || 0}</p>
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
              <h3 className="text-sm text-gray-500">Video Requests</h3>
              <p className="text-3xl font-bold text-[#BF0A30] mt-2">{getTotalVideoRequests()}</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#BF0A30]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Daily Orders</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{dailyOrders}</p>
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
                {allShops?.filter(shop => shop.is_active).length || 0}
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

      {/* Top Shop Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Top Performing Shop</h2>
          {topShop ? (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">{topShop.name}</h3>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  {topShop.requestCount} requests
                </span>
              </div>
              <div className="text-gray-600 mb-2">
                <span className="font-medium">Brand:</span> {brands?.find(b => b.id === topShop.brand_id)?.name || 'N/A'}
              </div>
              <div className="text-gray-600 mb-2">
                <span className="font-medium">Location:</span> {topShop.city}, {topShop.state}
              </div>
              <div className="text-gray-600">
                <span className="font-medium">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  topShop.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {topShop.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">No shop data available</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <Link
              to="/super-admin/brands"
              className="flex items-center p-4 border rounded-lg hover:bg-blue-50 transition-colors"
            >
              <div className="w-10 h-10 bg-[#002868] rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Manage Brands</h3>
                <p className="text-sm text-gray-500">View and manage all brands</p>
              </div>
            </Link>
            
            <Link
              to="/super-admin/analytics"
              className="flex items-center p-4 border rounded-lg hover:bg-blue-50 transition-colors"
            >
              <div className="w-10 h-10 bg-[#BF0A30] rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">View Analytics</h3>
                <p className="text-sm text-gray-500">Check platform analytics</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;