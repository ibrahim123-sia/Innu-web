// src/redux/slice/orderSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Create axios instance with base URL
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
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

// Async Thunks - 6 functions total
export const getOrderById = createAsyncThunk(
  'order/getOrderById',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/orders/${orderId}`);
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

export const getOrdersByBrand = createAsyncThunk(
  'order/getOrdersByBrand',
  async (brandId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/orders/brand/${brandId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getOrdersByDistrict = createAsyncThunk(
  'order/getOrdersByDistrict',
  async (districtId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/orders/district/${districtId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getOrdersWithVideo = createAsyncThunk(
  'order/getOrdersWithVideo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/orders/with-videos');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getOrdersWithoutVideo = createAsyncThunk(
  'order/getOrdersWithoutVideo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/orders/without-videos');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  orders: [],
  currentOrder: null,
  ordersByShop: [],
  ordersByBrand: [],
  ordersByDistrict: [],
  ordersWithVideo: [],
  ordersWithoutVideo: [],
  loading: false,
  error: null,
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    resetOrderState: (state) => {
      state.loading = false;
      state.error = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    clearOrdersByShop: (state) => {
      state.ordersByShop = [];
    },
    clearOrdersByBrand: (state) => {
      state.ordersByBrand = [];
    },
    clearOrdersByDistrict: (state) => {
      state.ordersByDistrict = [];
    },
    clearOrdersWithVideo: (state) => {
      state.ordersWithVideo = [];
    },
    clearOrdersWithoutVideo: (state) => {
      state.ordersWithoutVideo = [];
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
      
      // Get Orders By Brand
      .addCase(getOrdersByBrand.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrdersByBrand.fulfilled, (state, action) => {
        state.loading = false;
        state.ordersByBrand = action.payload.data;
      })
      .addCase(getOrdersByBrand.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch brand orders';
      })
      
      // Get Orders By District
      .addCase(getOrdersByDistrict.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrdersByDistrict.fulfilled, (state, action) => {
        state.loading = false;
        state.ordersByDistrict = action.payload.data;
      })
      .addCase(getOrdersByDistrict.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch district orders';
      })
      
      // Get Orders With Video
      .addCase(getOrdersWithVideo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrdersWithVideo.fulfilled, (state, action) => {
        state.loading = false;
        state.ordersWithVideo = action.payload.data;
      })
      .addCase(getOrdersWithVideo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch orders with video';
      })
      
      // Get Orders Without Video
      .addCase(getOrdersWithoutVideo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrdersWithoutVideo.fulfilled, (state, action) => {
        state.loading = false;
        state.ordersWithoutVideo = action.payload.data;
      })
      .addCase(getOrdersWithoutVideo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch orders without video';
      });
  },
});

export const {
  resetOrderState,
  clearCurrentOrder,
  clearOrdersByShop,
  clearOrdersByBrand,
  clearOrdersByDistrict,
  clearOrdersWithVideo,
  clearOrdersWithoutVideo,
} = orderSlice.actions;

// Selectors
export const selectCurrentOrder = (state) => state.order.currentOrder;
export const selectOrdersByShop = (state) => state.order.ordersByShop;
export const selectOrdersByBrand = (state) => state.order.ordersByBrand;
export const selectOrdersByDistrict = (state) => state.order.ordersByDistrict;
export const selectOrdersWithVideo = (state) => state.order.ordersWithVideo;
export const selectOrdersWithoutVideo = (state) => state.order.ordersWithoutVideo;
export const selectOrderLoading = (state) => state.order.loading;
export const selectOrderError = (state) => state.order.error;

export default orderSlice.reducer;