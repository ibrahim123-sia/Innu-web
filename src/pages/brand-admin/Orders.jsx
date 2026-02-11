import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  getOrdersByBrand,
  selectOrderLoading,
  selectOrderError,
  selectOrdersByBrand, // Removed selectBrandOrderStats - it doesn't exist
} from '../../redux/slice/orderSlice';
import {
  selectDistrictsByBrand,
  getDistrictsByBrand
} from '../../redux/slice/districtSlice';
import {
  getShopsByBrand,
  selectShopsByBrand
} from '../../redux/slice/shopSlice';

const Orders = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user.currentUser);
  const brandId = user?.brand_id;
  
  // Correct selectors
  const orders = useSelector(selectOrdersByBrand) || [];
  const loading = useSelector(selectOrderLoading);
  const error = useSelector(selectOrderError);
  // Removed brandStats - selector doesn't exist
  const districts = useSelector(selectDistrictsByBrand) || [];
  const shops = useSelector(selectShopsByBrand) || [];
  
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [expandedDistrict, setExpandedDistrict] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);

  useEffect(() => {
    if (brandId) {
      fetchData();
    }
  }, [brandId]);

  useEffect(() => {
    let filtered = orders;
    
    // Apply date filter
    if (dateFilter !== 'all') {
      filtered = applyDateFilter(filtered, dateFilter);
    }
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(order => 
        (order.ro_number && order.ro_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.ro_number_original && order.ro_number_original.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredOrders(filtered);
  }, [orders, dateFilter, searchTerm]);

  // Store all orders separately for stats calculations
  useEffect(() => {
    if (orders.length > 0) {
      setAllOrders(orders);
    }
  }, [orders]);

  const fetchData = async () => {
    if (!brandId) return;
    
    try {
      await Promise.all([
        dispatch(getOrdersByBrand({ brandId })),
        dispatch(getDistrictsByBrand(brandId)),
        dispatch(getShopsByBrand(brandId))
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const applyDateFilter = (ordersToFilter, filter) => {
    if (filter === 'all') return ordersToFilter;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'today':
        const todayStart = new Date(today);
        const todayEnd = new Date(today);
        todayEnd.setDate(todayEnd.getDate() + 1);
        return ordersToFilter.filter(order => {
          if (!order?.created_at) return false;
          const orderDate = new Date(order.created_at);
          return orderDate >= todayStart && orderDate < todayEnd;
        });
        
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);
        return ordersToFilter.filter(order => {
          if (!order?.created_at) return false;
          const orderDate = new Date(order.created_at);
          return orderDate >= yesterday && orderDate < yesterdayEnd;
        });
        
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 7);
        return ordersToFilter.filter(order => {
          if (!order?.created_at) return false;
          const orderDate = new Date(order.created_at);
          return orderDate >= weekStart && orderDate < new Date(today.getTime() + 86400000);
        });
        
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        return ordersToFilter.filter(order => {
          if (!order?.created_at) return false;
          const orderDate = new Date(order.created_at);
          return orderDate >= monthStart && orderDate < monthEnd;
        });
        
      default:
        return ordersToFilter;
    }
  };

  // Daily orders calculation (last 24 hours)
  const getDailyOrders = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return allOrders.filter(order => {
      if (!order?.created_at) return false;
      const orderDate = new Date(order.created_at);
      return orderDate >= yesterday;
    }).length || 0;
  };

  // Today's orders calculation (today only)
  const getTodaysOrders = () => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return allOrders.filter(order => {
      if (!order?.created_at) return false;
      const orderDate = new Date(order.created_at);
      return orderDate >= todayStart && orderDate < todayEnd;
    }).length || 0;
  };

  const getCompletedOrders = () => {
    return allOrders.filter(order => {
      if (!order.status) return false;
      const status = order.status.toLowerCase();
      return status === 'posted' || status === 'completed' || status === 'done';
    }).length;
  };

  const getPendingOrders = () => {
    return allOrders.filter(order => {
      if (!order.status) return false;
      const status = order.status.toLowerCase();
      return status === 'estimate' || status === 'pending';
    }).length;
  };

  const getInProgressOrders = () => {
    return allOrders.filter(order => {
      if (!order.status) return false;
      const status = order.status.toLowerCase();
      return status === 'work-in-progress' || status === 'in_progress' || 
             status === 'processing' || status === 'in progress';
    }).length;
  };

  const getTotalOrders = () => {
    return allOrders.length;
  };

  const getDistrictOrders = (districtId) => {
    if (districtId === 'all') return filteredOrders;
    
    const districtShops = shops?.filter(shop => shop.district_id === districtId) || [];
    const shopIds = districtShops.map(shop => shop.id);
    
    return filteredOrders.filter(order => 
      shopIds.includes(order.shop_id)
    );
  };

  const getShopOrders = (shopId) => {
    return filteredOrders.filter(order => order.shop_id === shopId);
  };

  const getShopName = (shopId) => {
    const shop = shops?.find(s => s.id === shopId);
    return shop?.name || 'Unknown Shop';
  };

  const getDistrictNameByShopId = (shopId) => {
    const shop = shops?.find(s => s.id === shopId);
    if (!shop) return 'Unknown District';
    
    const district = districts?.find(d => d.id === shop.district_id);
    return district?.name || 'Unknown District';
  };

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

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'posted':
      case 'completed':
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'work-in-progress':
      case 'in_progress':
      case 'processing':
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'estimate':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDistricts = selectedDistrict === 'all' 
    ? (districts || []) 
    : (districts || []).filter(d => d.id === selectedDistrict);

  // Debug logging
  useEffect(() => {
    console.log('=== ORDERS DEBUG INFO ===');
    console.log('All orders:', allOrders.length);
    console.log('Filtered orders:', filteredOrders.length);
    console.log('Daily orders (last 24h):', getDailyOrders());
    console.log("Today's orders:", getTodaysOrders());
    console.log('Completed count:', getCompletedOrders());
    console.log('Pending count:', getPendingOrders());
    console.log('In Progress count:', getInProgressOrders());
  }, [allOrders, filteredOrders]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading orders data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <div className="text-red-600 text-lg font-medium mb-2">Error Loading Data</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Filter Controls */}
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-800">Orders</h2>
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
            {getTotalOrders()} Total
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* District Filter */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Districts</option>
            {districts.map(district => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
          
          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
          </select>
          
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
          <p className="text-sm text-blue-600 mt-3">Orders created in last 24 hours</p>
        </div>

        <div className="bg-green-50 rounded-lg p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-green-600 mb-2">Total Orders</h3>
              <p className="text-2xl font-bold text-green-700">{getTotalOrders()}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-green-600 mt-3">Across all districts</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-purple-600 mb-2">Completed</h3>
              <p className="text-2xl font-bold text-purple-700">{getCompletedOrders()}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-purple-600 mt-3">
            {getTotalOrders() > 0 
              ? `${((getCompletedOrders() / getTotalOrders()) * 100).toFixed(1)}% completion rate`
              : '0% completion rate'
            }
          </p>
        </div>

        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-600 mb-2">In Progress</h3>
              <p className="text-2xl font-bold text-yellow-700">{getInProgressOrders()}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-yellow-600 mt-3">
            {getTotalOrders() > 0 
              ? `${((getInProgressOrders() / getTotalOrders()) * 100).toFixed(1)}% in progress`
              : '0% in progress'
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
              
              const districtCompleted = districtOrders.filter(order => {
                if (!order.status) return false;
                const status = order.status.toLowerCase();
                return status === 'posted' || status === 'completed' || status === 'done';
              }).length;
              
              const districtPending = districtOrders.filter(order => {
                if (!order.status) return false;
                const status = order.status.toLowerCase();
                return status === 'estimate' || status === 'pending';
              }).length;
              
              const districtInProgress = districtOrders.filter(order => {
                if (!order.status) return false;
                const status = order.status.toLowerCase();
                return status === 'work-in-progress' || status === 'in_progress' || 
                       status === 'processing' || status === 'in progress';
              }).length;
              
              const districtTotal = districtOrders.length;
              
              return (
                <div key={district.id} className="p-6 hover:bg-gray-50 transition-colors">
                  {/* District Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center border bg-blue-50">
                        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{district.name}</h3>
                        <p className="text-sm text-gray-500">{district.description || 'No description'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{districtTotal}</div>
                        <div className="text-sm text-gray-500">Total Orders</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">{districtCompleted}</div>
                        <div className="text-sm text-green-500">Completed</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-semibold text-blue-600">{districtInProgress}</div>
                        <div className="text-sm text-blue-500">In Progress</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-semibold text-yellow-600">{districtPending}</div>
                        <div className="text-sm text-yellow-500">Pending</div>
                      </div>
                      
                      <button
                        onClick={() => setExpandedDistrict(isExpanded ? null : district.id)}
                        className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm flex items-center transition-colors"
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
                            const shopCompleted = shopOrders.filter(order => {
                              if (!order.status) return false;
                              const status = order.status.toLowerCase();
                              return status === 'posted' || status === 'completed' || status === 'done';
                            }).length;
                            
                            const shopPending = shopOrders.filter(order => {
                              if (!order.status) return false;
                              const status = order.status.toLowerCase();
                              return status === 'estimate' || status === 'pending';
                            }).length;
                            
                            const shopInProgress = shopOrders.filter(order => {
                              if (!order.status) return false;
                              const status = order.status.toLowerCase();
                              return status === 'work-in-progress' || status === 'in_progress' || 
                                     status === 'processing' || status === 'in progress';
                            }).length;
                            
                            const shopTotal = shopOrders.length;
                            
                            return (
                              <div key={shop.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center border bg-white">
                                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                    <div>
                                      <h5 className="font-medium text-gray-900">{shop.name}</h5>
                                      <p className="text-sm text-gray-500">
                                        {shop.city}{shop.state ? `, ${shop.state}` : ''}
                                      </p>
                                      {shop.tekmetric_shop_id && (
                                        <p className="text-xs text-blue-600 mt-1">
                                          Tekmetric ID: {shop.tekmetric_shop_id}
                                        </p>
                                      )}
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
                                      <div className="text-md font-semibold text-blue-600">{shopInProgress}</div>
                                      <div className="text-xs text-blue-500">In Progress</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-md font-semibold text-yellow-600">{shopPending}</div>
                                      <div className="text-xs text-yellow-500">Pending</div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Shop Orders List */}
                                {shopOrders.length > 0 ? (
                                  <div className="overflow-x-auto mt-3">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead>
                                        <tr className="bg-gray-100">
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">RO#</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200">
                                        {shopOrders.slice(0, 5).map(order => (
                                          <tr key={order.id} className="hover:bg-white">
                                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                              {order.ro_number || 'N/A'}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-500">
                                              {order.customer_name || 'N/A'}
                                            </td>
                                            <td className="px-4 py-2">
                                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                                {order.status || 'Unknown'}
                                              </span>
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-500">
                                              {formatDate(order.created_at)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                    {shopOrders.length > 5 && (
                                      <p className="text-xs text-gray-500 mt-2">
                                        Showing 5 of {shopOrders.length} orders
                                      </p>
                                    )}
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Refresh Data
            </button>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="mt-8 text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
        <div className="flex flex-wrap items-center justify-between">
          <div>
            <p>Data last updated: {new Date().toLocaleString()}</p>
            <p>Total orders: {allOrders.length} • Total districts: {districts?.length || 0} • Total shops: {shops?.length || 0}</p>
          </div>
          <div className="mt-2 md:mt-0">
            <p>Status Summary: 
              <span className="ml-2 text-green-600">Completed: {getCompletedOrders()}</span>
              <span className="ml-4 text-blue-600">In Progress: {getInProgressOrders()}</span>
              <span className="ml-4 text-yellow-600">Pending: {getPendingOrders()}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;