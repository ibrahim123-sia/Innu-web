// src/redux/slice/shopSlice.js
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

// Async Thunks - 6 functions matching controller
export const createShop = createAsyncThunk(
  'shop/createShop',
  async (shopData, { rejectWithValue }) => {
    try {
      const response = await API.post('/shops/createshop', shopData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getShopById = createAsyncThunk(
  'shop/getShopById',
  async (shopId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/shops/getshops/${shopId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getAllShops = createAsyncThunk(
  'shop/getAllShops',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/shops/getAllshops');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateShop = createAsyncThunk(
  'shop/updateShop',
  async ({ id, ...updateData }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/shops/updateshop/${id}`, updateData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteShop = createAsyncThunk(
  'shop/deleteShop',
  async (shopId, { rejectWithValue }) => {
    try {
      const response = await API.delete(`/shops/deleteshop/${shopId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getShopsByBrand = createAsyncThunk(
  'shop/getShopsByBrand',
  async (brandId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/shops/brand/${brandId}/shops`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getShopsByDistrict = createAsyncThunk(
  'shop/getShopsByDistrict',
  async (districtId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/shops/district/${districtId}/shops`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  shops: [],
  currentShop: null,
  shopsByBrand: [],
  shopsByDistrict: [],
  loading: false,
  error: null,
  success: false,
  message: '',
};

const shopSlice = createSlice({
  name: 'shop',
  initialState,
  reducers: {
    resetShopState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = '';
    },
    clearCurrentShop: (state) => {
      state.currentShop = null;
    },
    clearShopsByBrand: (state) => {
      state.shopsByBrand = [];
    },
    clearShopsByDistrict: (state) => {
      state.shopsByDistrict = [];
    },
    setShops: (state, action) => {
      state.shops = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Shop
      .addCase(createShop.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createShop.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.shops.unshift(action.payload.data);
        state.message = action.payload.message;
      })
      .addCase(createShop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to create shop';
      })
      
      // Get Shop By ID
      .addCase(getShopById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getShopById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentShop = action.payload.data;
      })
      .addCase(getShopById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch shop';
      })
      
      // Get All Shops
      .addCase(getAllShops.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllShops.fulfilled, (state, action) => {
        state.loading = false;
        state.shops = action.payload.data;
      })
      .addCase(getAllShops.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch shops';
      })
      
      // Update Shop
      .addCase(updateShop.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateShop.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updatedShop = action.payload.data;
        
        // Update in shops array
        const index = state.shops.findIndex(shop => shop.id === updatedShop.id);
        if (index !== -1) {
          state.shops[index] = updatedShop;
        }
        
        // Update current shop if it's the one being updated
        if (state.currentShop && state.currentShop.id === updatedShop.id) {
          state.currentShop = updatedShop;
        }
        
        state.message = action.payload.message;
      })
      .addCase(updateShop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to update shop';
      })
      
      // Delete Shop
      .addCase(deleteShop.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteShop.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const deletedId = action.payload.data.id;
        
        // Remove from shops array
        state.shops = state.shops.filter(shop => shop.id !== deletedId);
        
        // Clear current shop if it's the one being deleted
        if (state.currentShop && state.currentShop.id === deletedId) {
          state.currentShop = null;
        }
        
        state.message = action.payload.message;
      })
      .addCase(deleteShop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to delete shop';
      })
      
      // Get Shops By Brand
      .addCase(getShopsByBrand.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getShopsByBrand.fulfilled, (state, action) => {
        state.loading = false;
        state.shopsByBrand = action.payload.data;
      })
      .addCase(getShopsByBrand.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch shops by brand';
      })
      
      // Get Shops By District
      .addCase(getShopsByDistrict.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getShopsByDistrict.fulfilled, (state, action) => {
        state.loading = false;
        state.shopsByDistrict = action.payload.data;
      })
      .addCase(getShopsByDistrict.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch shops by district';
      });
  },
});

export const {
  resetShopState,
  clearCurrentShop,
  clearShopsByBrand,
  clearShopsByDistrict,
  setShops,
} = shopSlice.actions;

// Selectors
export const selectAllShops = (state) => state.shop.shops;
export const selectCurrentShop = (state) => state.shop.currentShop;
export const selectShopsByBrand = (state) => state.shop.shopsByBrand;
export const selectShopsByDistrict = (state) => state.shop.shopsByDistrict;
export const selectShopLoading = (state) => state.shop.loading;
export const selectShopError = (state) => state.shop.error;
export const selectShopSuccess = (state) => state.shop.success;
export const selectShopMessage = (state) => state.shop.message;

export default shopSlice.reducer;