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

// Async Thunks
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

export const updateShop = createAsyncThunk(
  'shop/updateShop',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      console.log('Updating shop with ID:', id);
      console.log('Update data:', data);
      
      const response = await API.put(`/shops/updateshop/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update error:', error.response?.data || error.message);
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
      console.log('Shop API Response:', response.data);
      return { brandId, data: response.data };
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
  shopsByBrand: {},
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
      state.shopsByBrand = {};
    },
    clearShopsByDistrict: (state) => {
      state.shopsByDistrict = [];
    },
    setShopsData: (state, action) => {
      state.shops = action.payload;
    },
    setShopsByBrand: (state, action) => {
      const { brandId, shops } = action.payload;
      state.shopsByBrand[brandId] = shops;
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
        if (action.payload?.data) {
          state.shops.unshift(action.payload.data);
        }
        state.message = action.payload?.message || 'Shop created successfully';
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
        state.currentShop = action.payload?.data || null;
      })
      .addCase(getShopById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch shop';
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
        const updatedShop = action.payload?.data;
        
        if (updatedShop) {
          const index = state.shops.findIndex(shop => shop.id === updatedShop.id);
          if (index !== -1) {
            state.shops[index] = updatedShop;
          }
          
          Object.keys(state.shopsByBrand).forEach(brandId => {
            if (state.shopsByBrand[brandId]) {
              const brandIndex = state.shopsByBrand[brandId].findIndex(shop => shop.id === updatedShop.id);
              if (brandIndex !== -1) {
                state.shopsByBrand[brandId][brandIndex] = updatedShop;
              }
            }
          });
          
          if (state.currentShop && state.currentShop.id === updatedShop.id) {
            state.currentShop = updatedShop;
          }
        }
        
        state.message = action.payload?.message || 'Shop updated successfully';
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
        const deletedShopId = action.payload?.data?.id;
        
        if (deletedShopId) {
          state.shops = state.shops.filter(shop => shop.id !== deletedShopId);
          
          Object.keys(state.shopsByBrand).forEach(brandId => {
            if (state.shopsByBrand[brandId]) {
              state.shopsByBrand[brandId] = state.shopsByBrand[brandId].filter(shop => shop.id !== deletedShopId);
            }
          });
          
          if (state.currentShop && state.currentShop.id === deletedShopId) {
            state.currentShop = null;
          }
        }
        
        state.message = action.payload?.message || 'Shop deleted successfully';
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
        const { brandId, data } = action.payload;
        const shops = data?.data || [];
        
        console.log(`Setting ${shops.length} shops for brand ${brandId}`);
        
        state.shopsByBrand[brandId] = shops;
        
        shops.forEach(shop => {
          const exists = state.shops.some(s => s.id === shop.id);
          if (!exists) {
            state.shops.push(shop);
          }
        });
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
        state.shopsByDistrict = action.payload?.data || [];
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
  setShopsData,
  setShopsByBrand,
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

export const selectShopsForBrand = (brandId) => (state) => 
  state.shop.shopsByBrand[brandId] || [];

export const selectShopCountsByBrand = (state) => {
  const counts = {};
  Object.keys(state.shop.shopsByBrand).forEach(brandId => {
    counts[brandId] = state.shop.shopsByBrand[brandId]?.length || 0;
  });
  return counts;
};

export default shopSlice.reducer;