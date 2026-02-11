import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  getOrdersByShop,
  selectOrdersByShop,
  selectOrderLoading
} from '../../redux/slice/orderSlice';
import {
  getMyShop,
  selectMyShop
} from '../../redux/slice/shopSlice';
import {
  getVideosByOrderId,
  selectVideos
} from '../../redux/slice/videoSlice';
import OrderDetailModal from '../../components/shop-manager/OrderDetailModal';

const Orders = () => {
  const dispatch = useDispatch();
  const orders = useSelector(selectOrdersByShop);
  const myShop = useSelector(selectMyShop);
  const loading = useSelector(selectOrderLoading);
  const videos = useSelector(selectVideos);
  
  const [showOrderDetail, setShowOrderDetail] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderVideos, setOrderVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (myShop) {
      dispatch(getOrdersByShop(myShop.id));
    }
  }, [dispatch, myShop]);

  const handleViewOrder = async (order) => {
    setSelectedOrder(order);
    try {
      const result = await dispatch(getVideosByOrderId(order.id)).unwrap();
      if (result.data) {
        setOrderVideos(result.data);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      setOrderVideos([]);
    }
    setShowOrderDetail(order.id);
  };

  const filteredOrders = orders?.filter(order => {
    let matches = true;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const customerName = order.customer_name?.toLowerCase() || '';
      const vehicleInfo = order.vehicle_info || {};
      const vehicleDesc = `${vehicleInfo.year || ''} ${vehicleInfo.make || ''} ${vehicleInfo.model || ''}`.toLowerCase();
      const roNumber = order.tekmetric_ro_id?.toLowerCase() || '';
      
      if (!customerName.includes(searchLower) && 
          !vehicleDesc.includes(searchLower) && 
          !roNumber.includes(searchLower)) {
        matches = false;
      }
    }
    
    if (statusFilter !== 'all') {
      const status = order.status?.toLowerCase() || '';
      const filter = statusFilter.toLowerCase();
      
      // Handle different status naming conventions
      if (filter === 'in_progress') {
        if (!['in_progress', 'work-in-progress', 'processing'].includes(status)) {
          matches = false;
        }
      } else if (filter === 'pending') {
        if (!['pending', 'estimate'].includes(status)) {
          matches = false;
        }
      } else if (filter === 'completed') {
        if (!['completed', 'posted', 'done'].includes(status)) {
          matches = false;
        }
      } else if (filter === 'cancelled') {
        if (!['cancelled', 'canceled'].includes(status)) {
          matches = false;
        }
      } else if (status !== filter) {
        matches = false;
      }
    }
    
    return matches;
  });

  // Get order counts for stats
  const getOrderCounts = () => {
    if (!orders) return { total: 0, completed: 0, inProgress: 0 };
    
    return {
      total: orders.length,
      completed: orders.filter(o => 
        ['completed', 'posted', 'done'].includes(o.status?.toLowerCase())
      ).length,
      inProgress: orders.filter(o => 
        ['in_progress', 'work-in-progress', 'processing'].includes(o.status?.toLowerCase())
      ).length,
    };
  };

  const orderCounts = getOrderCounts();

  if (loading && !orders) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Shop Orders</h1>
        <p className="text-gray-600">Manage and view all orders for {myShop?.name || 'your shop'}</p>
      </div>

      {/* Filters and Stats */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by customer, vehicle, or RO#"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-end h-full">
              <div className="flex space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-blue-600">{orderCounts.total}</div>
                  <div className="text-sm text-gray-500">Total Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{orderCounts.completed}</div>
                  <div className="text-sm text-gray-500">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{orderCounts.inProgress}</div>
                  <div className="text-sm text-gray-500">In Progress</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredOrders && filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const vehicleInfo = order.vehicle_info || {};
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            #{order.tekmetric_ro_id || order.id.slice(0, 8)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Total: ${order.total_amount?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{order.customer_name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{order.customer_phone || 'No phone'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {vehicleInfo.year ? `${vehicleInfo.year} ${vehicleInfo.make}` : 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">{vehicleInfo.model || ''}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          ['completed', 'posted', 'done'].includes(order.status?.toLowerCase()) 
                            ? 'bg-green-100 text-green-800' 
                            : ['pending', 'estimate'].includes(order.status?.toLowerCase())
                              ? 'bg-yellow-100 text-yellow-800'
                              : ['cancelled', 'canceled'].includes(order.status?.toLowerCase())
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                        }`}>
                          {order.status?.replace('_', ' ') || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="px-4 py-2 bg-primary-blue text-white hover:bg-primary-blue-dark rounded text-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try changing your search filters' 
                : 'No orders have been created for this shop yet'}
            </p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showOrderDetail && (
        <OrderDetailModal
          order={selectedOrder}
          videos={orderVideos}
          onClose={() => {
            setShowOrderDetail(null);
            setSelectedOrder(null);
            setOrderVideos([]);
          }}
        />
      )}
    </div>
  );
};

export default Orders;