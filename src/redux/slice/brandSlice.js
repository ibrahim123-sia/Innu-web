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

// Async Thunks - Only 6 functions matching controller
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

const initialState = {
  brands: [],
  currentBrand: null,
  activeBrands: [],
  loading: false,
  error: null,
  success: false,
  message: '',
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
        
        // Update in brands array
        const index = state.brands.findIndex(brand => brand.id === updatedBrand.id);
        if (index !== -1) {
          state.brands[index] = updatedBrand;
        }
        
        // Update current brand if it's the one being updated
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
      });
  },
});

export const {
  resetBrandState,
  clearCurrentBrand,
  setBrands,
} = brandSlice.actions;

// Selectors - Only basic selectors
export const selectAllBrands = (state) => state.brand.brands;
export const selectCurrentBrand = (state) => state.brand.currentBrand;
export const selectActiveBrands = (state) => state.brand.activeBrands;
export const selectBrandLoading = (state) => state.brand.loading;
export const selectBrandError = (state) => state.brand.error;
export const selectBrandSuccess = (state) => state.brand.success;
export const selectBrandMessage = (state) => state.brand.message;

export default brandSlice.reducer;