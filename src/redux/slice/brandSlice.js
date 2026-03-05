import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = axios.create({
  baseURL: 'https://innu-api-112488489004.us-central1.run.app/api',
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const createBrand = createAsyncThunk(
  'brand/createBrand',
  async (brandData, { rejectWithValue }) => {
    try {
      let response;
      if (brandData instanceof FormData) {
        response = await API.post('/brands/createbrands', brandData, {
          headers: { 'Content-Type': 'multipart/form-data' },
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
      return response.data.success && response.data.data ? response.data.data : [];
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
      let response;
      if (data instanceof FormData) {
        response = await API.put(`/brands/updatebrands/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
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
      .addCase(createBrand.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createBrand.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        if (action.payload?.data) state.brands.unshift(action.payload.data);
        state.message = action.payload?.message || 'Brand created successfully';
      })
      .addCase(createBrand.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to create brand';
      })
      
      .addCase(getAllBrands.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllBrands.fulfilled, (state, action) => {
        state.loading = false;
        state.brands = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(getAllBrands.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch brands';
        state.brands = [];
      })
      
      .addCase(getBrandById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBrandById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBrand = action.payload?.data || null;
      })
      .addCase(getBrandById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch brand';
      })
      
      .addCase(updateBrand.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateBrand.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updatedBrand = action.payload?.data;
        
        if (updatedBrand) {
          const index = state.brands.findIndex(brand => brand.id === updatedBrand.id);
          if (index !== -1) state.brands[index] = updatedBrand;
          if (state.currentBrand?.id === updatedBrand.id) state.currentBrand = updatedBrand;
        }
        
        state.message = action.payload?.message || 'Brand updated successfully';
      })
      .addCase(updateBrand.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to update brand';
      })
      
      .addCase(deleteBrand.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteBrand.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const deletedBrandId = action.payload?.data?.id;
        
        if (deletedBrandId) {
          state.brands = state.brands.filter(brand => brand.id !== deletedBrandId);
          if (state.currentBrand?.id === deletedBrandId) state.currentBrand = null;
        }
        
        state.message = action.payload?.message || 'Brand deleted successfully';
      })
      .addCase(deleteBrand.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to delete brand';
      })
      
      .addCase(getActiveBrands.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getActiveBrands.fulfilled, (state, action) => {
        state.loading = false;
        state.activeBrands = action.payload?.data || [];
      })
      .addCase(getActiveBrands.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch active brands';
      });
  },
});

export const { resetBrandState, clearCurrentBrand, setBrands } = brandSlice.actions;

export const selectAllBrands = (state) => state.brand.brands;
export const selectCurrentBrand = (state) => state.brand.currentBrand;
export const selectActiveBrands = (state) => state.brand.activeBrands;
export const selectBrandLoading = (state) => state.brand.loading;
export const selectBrandError = (state) => state.brand.error;
export const selectBrandSuccess = (state) => state.brand.success;
export const selectBrandMessage = (state) => state.brand.message;

export default brandSlice.reducer;