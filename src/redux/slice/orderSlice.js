// src/redux/slice/orderSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Create axios instance with base URL
const API = axios.create({
  baseURL: 'http://localhost:5000/api', // Update with your backend URL
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

// Async Thunks
export const getOrderById = createAsyncThunk(
  'order/getOrderById',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/orders/getorder/${orderId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getAllOrders = createAsyncThunk(
  'order/getAllOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/orders/getallorders');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getOrdersByShop = createAsyncThunk(
  'order/getOrdersByShop',
  async (shopId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/orders/shop/${shopId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateOrder = createAsyncThunk(
  'order/updateOrder',
  async ({ id, ...updateData }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/orders/updateOrder/${id}`, updateData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Note: Create and Delete order endpoints are not provided in the route file
// If they exist in your backend, you can add them similarly

const initialState = {
  orders: [],
  currentOrder: null,
  ordersByShop: [],
  filteredOrders: [],
  loading: false,
  error: null,
  success: false,
  message: '',
  filters: {
    shop_id: null,
    brand_id: null,
    district_id: null,
    status: '',
    customer_name: '',
    date_from: '',
    date_to: '',
    ro_number: '',
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    resetOrderState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = '';
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    clearOrdersByShop: (state) => {
      state.ordersByShop = [];
    },
    clearFilteredOrders: (state) => {
      state.filteredOrders = [];
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        shop_id: null,
        brand_id: null,
        district_id: null,
        status: '',
        customer_name: '',
        date_from: '',
        date_to: '',
        ro_number: '',
      };
    },
    // Local filter for client-side filtering
    filterOrders: (state, action) => {
      const { 
        shop_id, 
        brand_id, 
        status, 
        customer_name, 
        date_from, 
        date_to 
      } = action.payload;
      
      state.filteredOrders = state.orders.filter(order => {
        let matches = true;
        
        if (shop_id && order.shop_id !== shop_id) matches = false;
        if (brand_id && order.brand_id !== brand_id) matches = false;
        if (status && order.status !== status) matches = false;
        if (customer_name && !order.customer_name.toLowerCase().includes(customer_name.toLowerCase())) {
          matches = false;
        }
        if (date_from && new Date(order.created_at) < new Date(date_from)) matches = false;
        if (date_to && new Date(order.created_at) > new Date(date_to)) matches = false;
        
        return matches;
      });
    },
    sortOrders: (state, action) => {
      const { field, direction = 'asc' } = action.payload;
      const ordersToSort = state.filteredOrders.length > 0 ? state.filteredOrders : state.orders;
      
      const sortedOrders = [...ordersToSort].sort((a, b) => {
        if (field === 'created_at') {
          return direction === 'asc' 
            ? new Date(a[field]) - new Date(b[field])
            : new Date(b[field]) - new Date(a[field]);
        }
        
        if (direction === 'asc') {
          return a[field] > b[field] ? 1 : -1;
        } else {
          return a[field] < b[field] ? 1 : -1;
        }
      });
      
      if (state.filteredOrders.length > 0) {
        state.filteredOrders = sortedOrders;
      } else {
        state.orders = sortedOrders;
      }
    },
    updateOrderStatus: (state, action) => {
      const { orderId, status } = action.payload;
      const orderIndex = state.orders.findIndex(order => order.id === orderId);
      if (orderIndex !== -1) {
        state.orders[orderIndex].status = status;
      }
      if (state.currentOrder && state.currentOrder.id === orderId) {
        state.currentOrder.status = status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Order By ID
      .addCase(getOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload.data;
      })
      .addCase(getOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch order';
      })
      
      // Get All Orders
      .addCase(getAllOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.data;
        state.filteredOrders = [];
        // Reset pagination if you have server-side pagination
        if (action.payload.count) {
          state.pagination.total = action.payload.count;
        }
      })
      .addCase(getAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch orders';
      })
      
      // Get Orders By Shop
      .addCase(getOrdersByShop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrdersByShop.fulfilled, (state, action) => {
        state.loading = false;
        state.ordersByShop = action.payload.data;
      })
      .addCase(getOrdersByShop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch shop orders';
      })
      
      // Update Order
      .addCase(updateOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updatedOrder = action.payload.data;
        
        // Update in orders array
        const index = state.orders.findIndex(order => order.id === updatedOrder.id);
        if (index !== -1) {
          state.orders[index] = updatedOrder;
        }
        
        // Update in ordersByShop array
        const shopIndex = state.ordersByShop.findIndex(order => order.id === updatedOrder.id);
        if (shopIndex !== -1) {
          state.ordersByShop[shopIndex] = updatedOrder;
        }
        
        // Update current order if it's the one being updated
        if (state.currentOrder && state.currentOrder.id === updatedOrder.id) {
          state.currentOrder = updatedOrder;
        }
        
        // Update in filteredOrders array if exists
        const filteredIndex = state.filteredOrders.findIndex(order => order.id === updatedOrder.id);
        if (filteredIndex !== -1) {
          state.filteredOrders[filteredIndex] = updatedOrder;
        }
        
        state.message = action.payload.message;
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to update order';
      });
  },
});

export const {
  resetOrderState,
  clearCurrentOrder,
  clearOrdersByShop,
  clearFilteredOrders,
  setFilters,
  clearFilters,
  filterOrders,
  sortOrders,
  updateOrderStatus,
} = orderSlice.actions;

// Selectors
export const selectAllOrders = (state) => state.order.orders;
export const selectCurrentOrder = (state) => state.order.currentOrder;
export const selectOrdersByShop = (state) => state.order.ordersByShop;
export const selectFilteredOrders = (state) => state.order.filteredOrders;
export const selectOrderLoading = (state) => state.order.loading;
export const selectOrderError = (state) => state.order.error;
export const selectOrderSuccess = (state) => state.order.success;
export const selectOrderMessage = (state) => state.order.message;
export const selectOrderFilters = (state) => state.order.filters;
export const selectOrderPagination = (state) => state.order.pagination;

// Helper selectors
export const selectOrdersByStatus = (status) => (state) =>
  state.order.orders.filter(order => order.status === status);

export const selectOrdersByDistrict = (districtId) => (state) =>
  state.order.orders.filter(order => order.district_id === districtId);

export const selectOrdersByBrand = (brandId) => (state) =>
  state.order.orders.filter(order => order.brand_id === brandId);

export const selectOrderById = (orderId) => (state) =>
  state.order.orders.find(order => order.id === orderId);

export const selectOrdersByDateRange = (startDate, endDate) => (state) =>
  state.order.orders.filter(order => {
    const orderDate = new Date(order.created_at);
    return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
  });

// Statistics selectors
export const selectOrderStats = (state) => {
  const orders = state.order.orders;
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    in_progress: orders.filter(o => o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };
  
  // Calculate percentages
  if (stats.total > 0) {
    stats.pending_percentage = ((stats.pending / stats.total) * 100).toFixed(1);
    stats.in_progress_percentage = ((stats.in_progress / stats.total) * 100).toFixed(1);
    stats.completed_percentage = ((stats.completed / stats.total) * 100).toFixed(1);
    stats.cancelled_percentage = ((stats.cancelled / stats.total) * 100).toFixed(1);
  }
  
  return stats;
};

export const selectShopOrderStats = (shopId) => (state) => {
  const shopOrders = state.order.orders.filter(order => order.shop_id === shopId);
  const stats = {
    total: shopOrders.length,
    pending: shopOrders.filter(o => o.status === 'pending').length,
    in_progress: shopOrders.filter(o => o.status === 'in_progress').length,
    completed: shopOrders.filter(o => o.status === 'completed').length,
    cancelled: shopOrders.filter(o => o.status === 'cancelled').length,
  };
  
  if (stats.total > 0) {
    stats.pending_percentage = ((stats.pending / stats.total) * 100).toFixed(1);
    stats.in_progress_percentage = ((stats.in_progress / stats.total) * 100).toFixed(1);
    stats.completed_percentage = ((stats.completed / stats.total) * 100).toFixed(1);
    stats.cancelled_percentage = ((stats.cancelled / stats.total) * 100).toFixed(1);
  }
  
  return stats;
};

export default orderSlice.reducer;