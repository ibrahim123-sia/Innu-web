// src/redux/slice/shopSlice.js
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
  async (params = {}, { rejectWithValue }) => {
    try {
      const { include_inactive = false } = params;
      const queryParams = include_inactive ? '?include_inactive=true' : '';
      const response = await API.get(`/shops/getAllshops${queryParams}`);
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

export const getShopByDistrict = createAsyncThunk(
  'shop/getShopByDistrict',
  async (districtId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/shops/district/${districtId}/shops`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getShopByBrand = createAsyncThunk(
  'shop/getShopByBrand',
  async (brandId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/shops/brand/${brandId}/shops`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const toggleShopStatus = createAsyncThunk(
  'shop/toggleShopStatus',
  async (shopId, { rejectWithValue }) => {
    try {
      const response = await API.patch(`/shops/${shopId}/toggle-status`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const searchShops = createAsyncThunk(
  'shop/searchShops',
  async (searchParams, { rejectWithValue }) => {
    try {
      const { name, city, state } = searchParams;
      const queryParams = new URLSearchParams();
      if (name) queryParams.append('name', name);
      if (city) queryParams.append('city', city);
      if (state) queryParams.append('state', state);
      
      const response = await API.get(`/shops/search/all?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Alternative simplified route thunks
export const getAdminShops = createAsyncThunk(
  'shop/getAdminShops',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/shops/admin/shops');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getBrandShops = createAsyncThunk(
  'shop/getBrandShops',
  async (brandId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/shops/brand/${brandId}/shops`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getDistrictShops = createAsyncThunk(
  'shop/getDistrictShops',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/shops/district-shops');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getMyShop = createAsyncThunk(
  'shop/getMyShop',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/shops/my-shop');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  shops: [],
  currentShop: null,
  shopsByDistrict: [],
  shopsByBrand: [],
  searchResults: [],
  myShop: null,
  loading: false,
  error: null,
  success: false,
  message: '',
  filters: {
    brand_id: null,
    district_id: null,
    is_active: true,
    name: '',
    city: '',
    state: '',
  },
  statistics: {
    total: 0,
    active: 0,
    inactive: 0,
    byBrand: {},
    byDistrict: {},
  },
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
    clearShopsByDistrict: (state) => {
      state.shopsByDistrict = [];
    },
    clearShopsByBrand: (state) => {
      state.shopsByBrand = [];
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    clearMyShop: (state) => {
      state.myShop = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        brand_id: null,
        district_id: null,
        is_active: true,
        name: '',
        city: '',
        state: '',
      };
    },
    updateShopInList: (state, action) => {
      const updatedShop = action.payload;
      const index = state.shops.findIndex(shop => shop.id === updatedShop.id);
      if (index !== -1) {
        state.shops[index] = { ...state.shops[index], ...updatedShop };
      }
      
      // Update in other lists
      const districtIndex = state.shopsByDistrict.findIndex(shop => shop.id === updatedShop.id);
      if (districtIndex !== -1) {
        state.shopsByDistrict[districtIndex] = { ...state.shopsByDistrict[districtIndex], ...updatedShop };
      }
      
      const brandIndex = state.shopsByBrand.findIndex(shop => shop.id === updatedShop.id);
      if (brandIndex !== -1) {
        state.shopsByBrand[brandIndex] = { ...state.shopsByBrand[brandIndex], ...updatedShop };
      }
      
      if (state.currentShop && state.currentShop.id === updatedShop.id) {
        state.currentShop = { ...state.currentShop, ...updatedShop };
      }
      
      if (state.myShop && state.myShop.id === updatedShop.id) {
        state.myShop = { ...state.myShop, ...updatedShop };
      }
    },
    // Local filter for client-side filtering
    filterShops: (state, action) => {
      const { brand_id, district_id, is_active, name, city} = action.payload;
      
      state.searchResults = state.shops.filter(shop => {
        let matches = true;
        
        if (brand_id && shop.brand_id !== brand_id) matches = false;
        if (district_id && shop.district_id !== district_id) matches = false;
        if (is_active !== undefined && shop.is_active !== is_active) matches = false;
        if (name && !shop.name.toLowerCase().includes(name.toLowerCase())) matches = false;
        if (city && !shop.city.toLowerCase().includes(city.toLowerCase())) matches = false;
        if (state && !shop.state.toLowerCase().includes(state.toLowerCase())) matches = false;
        
        return matches;
      });
    },
    sortShops: (state, action) => {
      const { field, direction = 'asc' } = action.payload;
      const shopsToSort = state.searchResults.length > 0 ? state.searchResults : state.shops;
      
      const sortedShops = [...shopsToSort].sort((a, b) => {
        if (direction === 'asc') {
          return a[field] > b[field] ? 1 : -1;
        } else {
          return a[field] < b[field] ? 1 : -1;
        }
      });
      
      if (state.searchResults.length > 0) {
        state.searchResults = sortedShops;
      } else {
        state.shops = sortedShops;
      }
    },
    updateStatistics: (state) => {
      const shops = state.shops;
      const stats = {
        total: shops.length,
        active: shops.filter(shop => shop.is_active).length,
        inactive: shops.filter(shop => !shop.is_active).length,
        byBrand: {},
        byDistrict: {},
      };
      
      // Calculate statistics by brand
      shops.forEach(shop => {
        if (shop.brand_name) {
          if (!stats.byBrand[shop.brand_id]) {
            stats.byBrand[shop.brand_id] = {
              name: shop.brand_name,
              total: 0,
              active: 0,
              inactive: 0,
            };
          }
          stats.byBrand[shop.brand_id].total++;
          if (shop.is_active) {
            stats.byBrand[shop.brand_id].active++;
          } else {
            stats.byBrand[shop.brand_id].inactive++;
          }
        }
        
        // Calculate statistics by district
        if (shop.district_id) {
          if (!stats.byDistrict[shop.district_id]) {
            stats.byDistrict[shop.district_id] = {
              name: shop.district_name || `District ${shop.district_id}`,
              total: 0,
              active: 0,
              inactive: 0,
            };
          }
          stats.byDistrict[shop.district_id].total++;
          if (shop.is_active) {
            stats.byDistrict[shop.district_id].active++;
          } else {
            stats.byDistrict[shop.district_id].inactive++;
          }
        }
      });
      
      state.statistics = stats;
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
        const newShop = action.payload.data;
        state.shops.unshift(newShop);
        state.message = action.payload.message;
        // Update statistics
        shopSlice.caseReducers.updateStatistics(state);
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
        state.searchResults = [];
        // Update statistics
        shopSlice.caseReducers.updateStatistics(state);
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
        
        // Update in all arrays
        shopSlice.caseReducers.updateShopInList(state, { payload: updatedShop });
        state.message = action.payload.message;
        // Update statistics
        shopSlice.caseReducers.updateStatistics(state);
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
        const deletedShop = action.payload.data;
        
        // Update shop status to inactive
        shopSlice.caseReducers.updateShopInList(state, { 
          payload: { id: deletedShop.id, is_active: false } 
        });
        state.message = action.payload.message;
        // Update statistics
        shopSlice.caseReducers.updateStatistics(state);
      })
      .addCase(deleteShop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to delete shop';
      })
      
      // Get Shop By District
      .addCase(getShopByDistrict.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getShopByDistrict.fulfilled, (state, action) => {
        state.loading = false;
        state.shopsByDistrict = action.payload.data;
      })
      .addCase(getShopByDistrict.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch shops by district';
      })
      
      // Get Shop By Brand
      .addCase(getShopByBrand.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getShopByBrand.fulfilled, (state, action) => {
        state.loading = false;
        state.shopsByBrand = action.payload.data;
      })
      .addCase(getShopByBrand.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch shops by brand';
      })
      
      // Toggle Shop Status
      .addCase(toggleShopStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(toggleShopStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updatedShop = action.payload.data;
        shopSlice.caseReducers.updateShopInList(state, { payload: updatedShop });
        state.message = action.payload.message;
        // Update statistics
        shopSlice.caseReducers.updateStatistics(state);
      })
      .addCase(toggleShopStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to toggle shop status';
      })
      
      // Search Shops
      .addCase(searchShops.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchShops.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload.data;
      })
      .addCase(searchShops.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to search shops';
      })
      
      // Get Admin Shops
      .addCase(getAdminShops.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAdminShops.fulfilled, (state, action) => {
        state.loading = false;
        state.shops = action.payload.data;
        state.searchResults = [];
        // Update statistics
        shopSlice.caseReducers.updateStatistics(state);
      })
      .addCase(getAdminShops.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch admin shops';
      })
      
      // Get Brand Shops
      .addCase(getBrandShops.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBrandShops.fulfilled, (state, action) => {
        state.loading = false;
        state.shops = action.payload.data;
        state.shopsByBrand = action.payload.data;
        state.searchResults = [];
        // Update statistics
        shopSlice.caseReducers.updateStatistics(state);
      })
      .addCase(getBrandShops.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch brand shops';
      })
      
      // Get District Shops
      .addCase(getDistrictShops.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDistrictShops.fulfilled, (state, action) => {
        state.loading = false;
        state.shops = action.payload.data;
        state.shopsByDistrict = action.payload.data;
        state.searchResults = [];
        // Update statistics
        shopSlice.caseReducers.updateStatistics(state);
      })
      .addCase(getDistrictShops.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch district shops';
      })
      
      // Get My Shop
      .addCase(getMyShop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyShop.fulfilled, (state, action) => {
        state.loading = false;
        state.myShop = action.payload.data;
        state.currentShop = action.payload.data;
      })
      .addCase(getMyShop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch my shop';
      });
  },
});

export const {
  resetShopState,
  clearCurrentShop,
  clearShopsByDistrict,
  clearShopsByBrand,
  clearSearchResults,
  clearMyShop,
  setFilters,
  clearFilters,
  updateShopInList,
  filterShops,
  sortShops,
  updateStatistics,
} = shopSlice.actions;

// Selectors
export const selectAllShops = (state) => state.shop.shops;
export const selectCurrentShop = (state) => state.shop.currentShop;
export const selectShopsByDistrict = (state) => state.shop.shopsByDistrict;
export const selectShopsByBrand = (state) => state.shop.shopsByBrand;
export const selectSearchResults = (state) => state.shop.searchResults;
export const selectMyShop = (state) => state.shop.myShop;
export const selectShopLoading = (state) => state.shop.loading;
export const selectShopError = (state) => state.shop.error;
export const selectShopSuccess = (state) => state.shop.success;
export const selectShopMessage = (state) => state.shop.message;
export const selectShopFilters = (state) => state.shop.filters;
export const selectShopStatistics = (state) => state.shop.statistics;

// Helper selectors
export const selectActiveShops = (state) => 
  state.shop.shops.filter(shop => shop.is_active);

export const selectInactiveShops = (state) => 
  state.shop.shops.filter(shop => !shop.is_active);

export const selectShopById = (shopId) => (state) =>
  state.shop.shops.find(shop => shop.id === shopId);

export const selectShopsByDistrictId = (districtId) => (state) =>
  state.shop.shops.filter(shop => shop.district_id === districtId);

export const selectShopsByBrandId = (brandId) => (state) =>
  state.shop.shops.filter(shop => shop.brand_id === brandId);

// Geography-based selectors
export const selectShopsByState = (stateName) => (state) =>
  state.shop.shops.filter(shop => shop.state === stateName);

export const selectShopsByCity = (cityName) => (state) =>
  state.shop.shops.filter(shop => shop.city === cityName);

// Search-related selectors
export const selectShopsWithEmployeeCount = (state) =>
  state.shop.shops.filter(shop => shop.employee_count > 0);

export const selectShopsWithoutManager = (state) =>
  state.shop.shops.filter(shop => !shop.manager_name);

export default shopSlice.reducer;