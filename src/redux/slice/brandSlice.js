// src/redux/slice/brandSlice.js
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

// Async Thunks - Updated for file uploads
export const createBrand = createAsyncThunk(
  'brand/createBrand',
  async (brandData, { rejectWithValue }) => {
    try {
      // Check if it's FormData (for file upload) or regular data
      let response;
      if (brandData instanceof FormData) {
        response = await API.post('/brands/createbrands', brandData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        response = await API.post('/brands/createbrands', brandData);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getAllBrands = createAsyncThunk(
  'brand/getAllBrands',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/brands/getbrands');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getBrandById = createAsyncThunk(
  'brand/getBrandById',
  async (brandId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/brands/getbrands/${brandId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Updated updateBrand to handle file uploads
export const updateBrand = createAsyncThunk(
  'brand/updateBrand',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      // Check if it's FormData (for file upload) or regular data
      let response;
      if (data instanceof FormData) {
        data.append('id', id);
        response = await API.put(`/brands/updatebrands/${id}`, data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        response = await API.put(`/brands/updatebrands/${id}`, data);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// All other thunks remain the same...
export const deleteBrand = createAsyncThunk(
  'brand/deleteBrand',
  async (brandId, { rejectWithValue }) => {
    try {
      const response = await API.delete(`/brands/deletebrand/${brandId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getActiveBrands = createAsyncThunk(
  'brand/getActiveBrands',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/brands/activebrands');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const toggleBrandStatus = createAsyncThunk(
  'brand/toggleBrandStatus',
  async (brandId, { rejectWithValue }) => {
    try {
      const response = await API.patch(`/brands/toggle-status/${brandId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const searchBrands = createAsyncThunk(
  'brand/searchBrands',
  async (searchQuery, { rejectWithValue }) => {
    try {
      const response = await API.get(`/brands/search?name=${searchQuery}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// The rest of the file remains the same...
// ... [Keep all the reducer logic, selectors, etc. exactly as they are]

const initialState = {
  brands: [],
  currentBrand: null,
  activeBrands: [],
  searchResults: [],
  loading: false,
  error: null,
  success: false,
  message: '',
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
};

const brandSlice = createSlice({
  name: 'brand',
  initialState,
  reducers: {
    resetBrandState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = '';
    },
    clearCurrentBrand: (state) => {
      state.currentBrand = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    setBrands: (state, action) => {
      state.brands = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Brand
      .addCase(createBrand.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createBrand.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.brands.unshift(action.payload.data);
        state.message = action.payload.message;
      })
      .addCase(createBrand.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to create brand';
      })
      
      // Get All Brands
      .addCase(getAllBrands.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllBrands.fulfilled, (state, action) => {
        state.loading = false;
        state.brands = action.payload.data;
        state.pagination.count = action.payload.count;
      })
      .addCase(getAllBrands.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch brands';
      })
      
      // Get Brand By ID
      .addCase(getBrandById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBrandById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBrand = action.payload.data;
      })
      .addCase(getBrandById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch brand';
      })
      
      // Update Brand
      .addCase(updateBrand.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateBrand.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updatedBrand = action.payload.data;
        const index = state.brands.findIndex(brand => brand.id === updatedBrand.id);
        if (index !== -1) {
          state.brands[index] = updatedBrand;
        }
        if (state.currentBrand && state.currentBrand.id === updatedBrand.id) {
          state.currentBrand = updatedBrand;
        }
        state.message = action.payload.message;
      })
      .addCase(updateBrand.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to update brand';
      })
      
      // Delete Brand
      .addCase(deleteBrand.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteBrand.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.brands = state.brands.filter(brand => brand.id !== action.payload.data.id);
        if (state.currentBrand && state.currentBrand.id === action.payload.data.id) {
          state.currentBrand = null;
        }
        state.message = action.payload.message;
      })
      .addCase(deleteBrand.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to delete brand';
      })
      
      // Get Active Brands
      .addCase(getActiveBrands.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getActiveBrands.fulfilled, (state, action) => {
        state.loading = false;
        state.activeBrands = action.payload.data;
      })
      .addCase(getActiveBrands.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch active brands';
      })
      
      // Toggle Brand Status
      .addCase(toggleBrandStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(toggleBrandStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updatedBrand = action.payload.data;
        const index = state.brands.findIndex(brand => brand.id === updatedBrand.id);
        if (index !== -1) {
          state.brands[index] = updatedBrand;
        }
        if (state.currentBrand && state.currentBrand.id === updatedBrand.id) {
          state.currentBrand = updatedBrand;
        }
        state.message = action.payload.message;
      })
      .addCase(toggleBrandStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to toggle brand status';
      })
      
      // Search Brands
      .addCase(searchBrands.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchBrands.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload.data;
      })
      .addCase(searchBrands.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to search brands';
      });
  },
});

export const {
  resetBrandState,
  clearCurrentBrand,
  clearSearchResults,
  setBrands,
} = brandSlice.actions;

// Selectors
export const selectBrandById = (brandId) => (state) => 
  state.brand.brands.find(brand => brand.id === brandId);
export const selectAllBrands = (state) => state.brand.brands;
export const selectCurrentBrand = (state) => state.brand.currentBrand;
export const selectActiveBrands = (state) => state.brand.activeBrands;
export const selectSearchResults = (state) => state.brand.searchResults;
export const selectBrandLoading = (state) => state.brand.loading;
export const selectBrandError = (state) => state.brand.error;
export const selectBrandSuccess = (state) => state.brand.success;
export const selectBrandMessage = (state) => state.brand.message;
export const selectBrandPagination = (state) => state.brand.pagination;

export default brandSlice.reducer;