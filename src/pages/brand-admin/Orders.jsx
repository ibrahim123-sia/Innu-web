// src/pages/Orders.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  getOrdersByBrand,
  selectOrderLoading,
  selectOrderError,
  selectBrandOrderStats,
} from '../../redux/slice/orderSlice';
import {
  selectDistrictsByBrandFromState,
  getDistrictsByBrand
} from '../../redux/slice/districtSlice';
import {
  selectShopsByBrandId,
  getBrandShops
} from '../../redux/slice/shopSlice';

const Orders = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user.currentUser);
  
  // Get orders directly from state like in Overview.jsx
  const orders = useSelector(state => state.order.ordersByBrand || []);
  const loading = useSelector(selectOrderLoading);
  const error = useSelector(selectOrderError);
  const brandStats = useSelector(selectBrandOrderStats(user?.brand_id));
  
  // Districts and shops
  const districts = useSelector(selectDistrictsByBrandFromState);
  const shops = useSelector(state => selectShopsByBrandId(user?.brand_id)(state));
  
  // State for UI
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [expandedDistrict, setExpandedDistrict] = useState(null);
  const [dateFilter, setDateFilter] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Initialize data
  useEffect(() => {
    if (user?.brand_id) {
      fetchData();
    }
  }, [user?.brand_id, dateFilter]);

  const fetchData = async () => {
    try {
      const filters = getDateFilter();
      await Promise.all([
        dispatch(getOrdersByBrand({ brandId: user.brand_id, filters })),
        dispatch(getDistrictsByBrand(user.brand_id)),
        dispatch(getBrandShops(user.brand_id))
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const getDateFilter = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateFilter) {
      case 'today':
        return {
          date_from: today.toISOString().split('T')[0],
          date_to: today.toISOString().split('T')[0]
        };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          date_from: yesterday.toISOString().split('T')[0],
          date_to: yesterday.toISOString().split('T')[0]
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
        return {
          date_from: weekStart.toISOString().split('T')[0],
          date_to: today.toISOString().split('T')[0]
        };
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          date_from: monthStart.toISOString().split('T')[0],
          date_to: today.toISOString().split('T')[0]
        };
      default:
        return {};
    }
  };

  // Get orders for a specific district
  const getDistrictOrders = (districtId) => {
    if (districtId === 'all') return orders;
    
    // First, get all shops in this district
    const districtShops = shops?.filter(shop => shop.district_id === districtId) || [];
    const shopIds = districtShops.map(shop => shop.id);
    
    // Then filter orders by shop_id
    return orders.filter(order => 
      shopIds.includes(order.shop_id)
    );
  };

  // Get orders for a specific shop
  const getShopOrders = (shopId) => {
    return orders.filter(order => order.shop_id === shopId);
  };

  // Get shop name by ID
  const getShopName = (shopId) => {
    const shop = shops?.find(s => s.id === shopId);
    return shop?.name || 'Unknown Shop';
  };

  // Get district name by shop ID
  const getDistrictNameByShopId = (shopId) => {
    const shop = shops?.find(s => s.id === shopId);
    if (!shop) return 'Unknown District';
    
    const district = districts?.find(d => d.id === shop.district_id);
    return district?.name || 'Unknown District';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate daily orders
  const getDailyOrders = () => {
    const today = new Date().toISOString().split('T')[0];
    return orders.filter(order => {
      if (!order?.created_at) return false;
      try {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        return orderDate === today;
      } catch (error) {
        return false;
      }
    }).length;
  };

  // Filtered districts based on selection
  const filteredDistricts = selectedDistrict === 'all' 
    ? (districts || []) 
    : (districts || []).filter(d => d.id === selectedDistrict);

  // Debug logging
  useEffect(() => {
    console.log('Orders data:', orders);
    console.log('Districts data:', districts);
    console.log('Shops data:', shops);
    console.log('Brand ID:', user?.brand_id);
  }, [orders, districts, shops, user?.brand_id]);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002868]"></div>
        <p className="mt-4 text-gray-600">Loading orders data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <div className="text-red-600 text-lg font-medium mb-2">Error Loading Data</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="bg-[#002868] hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Orders Dashboard</h1>
        <p className="text-gray-600">Track and manage orders across your brand</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* District Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
            >
              <option value="all">All Districts</option>
              {districts && districts.map(district => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Orders</label>
            <input
              type="text"
              placeholder="Search by RO# or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
            />
          </div>

          {/* Refresh Button */}
          <div className="flex items-end">
            <button
              onClick={fetchData}
              className="w-full bg-[#002868] hover:bg-blue-800 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Daily Orders */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-600 mb-2">Daily Orders</h3>
              <p className="text-2xl font-bold text-blue-700">{getDailyOrders()}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-blue-600 mt-3">Orders created today</p>
        </div>

        {/* Total Orders */}
        <div className="bg-green-50 rounded-lg p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-green-600 mb-2">Total Orders</h3>
              <p className="text-2xl font-bold text-green-700">{orders.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-green-600 mt-3">Across all districts</p>
        </div>

        {/* Completed Orders */}
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-purple-600 mb-2">Completed</h3>
              <p className="text-2xl font-bold text-purple-700">
                {orders.filter(o => o.status === 'completed').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-purple-600 mt-3">
            {orders.length > 0 
              ? `${((orders.filter(o => o.status === 'completed').length / orders.length) * 100).toFixed(1)}% completion rate`
              : '0% completion rate'
            }
          </p>
        </div>

        {/* Pending Orders */}
        <div className="bg-red-50 rounded-lg p-6 border border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-600 mb-2">Pending</h3>
              <p className="text-2xl font-bold text-red-700">
                {orders.filter(o => o.status === 'pending').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-red-600 mt-3">
            {orders.length > 0 
              ? `${((orders.filter(o => o.status === 'pending').length / orders.length) * 100).toFixed(1)}% pending rate`
              : '0% pending rate'
            }
          </p>
        </div>
      </div>

      {/* District-wise Orders */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">District-wise Orders</h2>
              <p className="text-gray-600">Orders organized by district and shop</p>
            </div>
            <div className="text-sm text-gray-500">
              Showing {filteredDistricts.length} districts
            </div>
          </div>
        </div>

        {filteredDistricts.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredDistricts.map(district => {
              const districtOrders = getDistrictOrders(district.id);
              const districtShops = shops?.filter(shop => shop.district_id === district.id) || [];
              const isExpanded = expandedDistrict === district.id;
              
              // Calculate district stats
              const districtCompleted = districtOrders.filter(o => o.status === 'completed').length;
              const districtPending = districtOrders.filter(o => o.status === 'pending').length;
              const districtTotal = districtOrders.length;
              
              return (
                <div key={district.id} className="p-6 hover:bg-gray-50 transition-colors">
                  {/* District Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center border bg-gray-100">
                        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{district.name}</h3>
                        <p className="text-sm text-gray-500">{district.description || 'No description'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      {/* District Stats */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{districtTotal}</div>
                        <div className="text-sm text-gray-500">Total Orders</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">{districtCompleted}</div>
                        <div className="text-sm text-green-500">Completed</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-semibold text-red-600">{districtPending}</div>
                        <div className="text-sm text-red-500">Pending</div>
                      </div>
                      
                      {/* Expand/Collapse Button */}
                      <button
                        onClick={() => setExpandedDistrict(isExpanded ? null : district.id)}
                        className="px-4 py-2 bg-[#002868] text-white hover:bg-blue-700 rounded-lg text-sm flex items-center transition-colors"
                      >
                        <svg 
                          className={`w-4 h-4 mr-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {isExpanded ? 'Hide Shops' : 'View Shops'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Shops Section */}
                  {isExpanded && (
                    <div className="mt-6 border-t pt-6">
                      <h4 className="text-md font-medium text-gray-700 mb-4">
                        Shops in {district.name} ({districtShops.length} shops)
                      </h4>
                      
                      {districtShops.length > 0 ? (
                        <div className="space-y-4">
                          {districtShops.map(shop => {
                            const shopOrders = getShopOrders(shop.id);
                            const shopCompleted = shopOrders.filter(o => o.status === 'completed').length;
                            const shopPending = shopOrders.filter(o => o.status === 'pending').length;
                            const shopTotal = shopOrders.length;
                            
                            return (
                              <div key={shop.id} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center border bg-white">
                                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                    <div>
                                      <h5 className="font-medium text-gray-900">{shop.name}</h5>
                                      <p className="text-sm text-gray-500">
                                        {shop.city}{shop.state ? `, ${shop.state}` : ''}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-4">
                                    <div className="text-center">
                                      <div className="text-lg font-bold text-gray-900">{shopTotal}</div>
                                      <div className="text-xs text-gray-500">Orders</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-md font-semibold text-green-600">{shopCompleted}</div>
                                      <div className="text-xs text-green-500">Completed</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-md font-semibold text-red-600">{shopPending}</div>
                                      <div className="text-xs text-red-500">Pending</div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Shop Orders List */}
                                {shopOrders.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead>
                                        <tr className="bg-gray-100">
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">RO#</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200">
                                        {shopOrders.map(order => (
                                          <tr key={order.id} className="hover:bg-white">
                                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                              {order.ro_number || 'N/A'}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-600">
                                              {order.customer_name || 'N/A'}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-500">
                                              {formatDate(order.created_at)}
                                            </td>
                                            <td className="px-4 py-2">
                                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                                {order.status?.replace('_', ' ') || 'Unknown'}
                                              </span>
                                            </td>
                                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                              ${parseFloat(order.total_amount || 0).toFixed(2)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <p className="text-gray-500 text-sm">No orders found for this shop</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <p className="text-gray-500">No shops found in this district</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Districts Found</h3>
            <p className="text-gray-500 mb-4">No district data available for the selected filters</p>
            <button
              onClick={fetchData}
              className="bg-[#002868] hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Refresh Data
            </button>
          </div>
        )}
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
            <p className="text-gray-600">Latest orders across your brand</p>
          </div>
          <div className="text-sm text-gray-500">
            Showing {Math.min(orders.length, 10)} of {orders.length} orders
          </div>
        </div>

        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RO#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders
                  .slice(0, 10)
                  .map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {order.ro_number || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {order.customer_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {getShopName(order.shop_id)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {getDistrictNameByShopId(order.shop_id)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div>{formatDate(order.created_at)}</div>
                        <div className="text-xs text-gray-400">{formatTime(order.created_at)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status?.replace('_', ' ') || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        ${parseFloat(order.total_amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500">No orders found</p>
            <p className="text-sm text-gray-400 mt-1">Orders will appear when shops start creating them</p>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="mt-8 text-sm text-gray-500">
        <p>Data last updated: {new Date().toLocaleString()}</p>
        <p>Total orders: {orders.length} • Total districts: {districts?.length || 0} • Total shops: {shops?.length || 0}</p>
      </div>
    </div>
  );
};

export default Orders;