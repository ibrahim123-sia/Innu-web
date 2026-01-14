// src/redux/slice/districtSlice.js
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
export const createDistrict = createAsyncThunk(
  'district/createDistrict',
  async (districtData, { rejectWithValue }) => {
    try {
      const response = await API.post('/districts/createdistricts', districtData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getAllDistricts = createAsyncThunk(
  'district/getAllDistricts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/districts/getdistricts');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getDistrictById = createAsyncThunk(
  'district/getDistrictById',
  async (districtId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/districts/getdistricts/${districtId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateDistrict = createAsyncThunk(
  'district/updateDistrict',
  async ({ id, ...updateData }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/districts/updatedistricts/${id}`, updateData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteDistrict = createAsyncThunk(
  'district/deleteDistrict',
  async (districtId, { rejectWithValue }) => {
    try {
      const response = await API.delete(`/districts/deletedistricts/${districtId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getDistrictsByBrand = createAsyncThunk(
  'district/getDistrictsByBrand',
  async (brandId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/districts/brand/${brandId}/districts`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const toggleDistrictStatus = createAsyncThunk(
  'district/toggleDistrictStatus',
  async (districtId, { rejectWithValue }) => {
    try {
      const response = await API.patch(`/districts/districts/${districtId}/toggle-status`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const searchDistricts = createAsyncThunk(
  'district/searchDistricts',
  async (searchParams, { rejectWithValue }) => {
    try {
      const { name, brand_id } = searchParams;
      const queryParams = new URLSearchParams();
      if (name) queryParams.append('name', name);
      if (brand_id) queryParams.append('brand_id', brand_id);
      
      const response = await API.get(`/districts/search?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  districts: [],
  currentDistrict: null,
  districtsByBrand: [],
  searchResults: [],
  loading: false,
  error: null,
  success: false,
  message: '',
  filters: {
    brand_id: null,
    is_active: true,
  },
};

const districtSlice = createSlice({
  name: 'district',
  initialState,
  reducers: {
    resetDistrictState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = '';
    },
    clearCurrentDistrict: (state) => {
      state.currentDistrict = null;
    },
    clearDistrictsByBrand: (state) => {
      state.districtsByBrand = [];
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        brand_id: null,
        is_active: true,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Create District
      .addCase(createDistrict.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createDistrict.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.districts.unshift(action.payload.data);
        state.districtsByBrand.unshift(action.payload.data);
        state.message = action.payload.message;
      })
      .addCase(createDistrict.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to create district';
      })
      
      // Get All Districts
      .addCase(getAllDistricts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllDistricts.fulfilled, (state, action) => {
        state.loading = false;
        state.districts = action.payload.data;
      })
      .addCase(getAllDistricts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch districts';
      })
      
      // Get District By ID
      .addCase(getDistrictById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDistrictById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDistrict = action.payload.data;
      })
      .addCase(getDistrictById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch district';
      })
      
      // Update District
      .addCase(updateDistrict.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateDistrict.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updatedDistrict = action.payload.data;
        
        // Update in districts array
        const index = state.districts.findIndex(district => district.id === updatedDistrict.id);
        if (index !== -1) {
          state.districts[index] = updatedDistrict;
        }
        
        // Update in districtsByBrand array
        const brandIndex = state.districtsByBrand.findIndex(district => district.id === updatedDistrict.id);
        if (brandIndex !== -1) {
          state.districtsByBrand[brandIndex] = updatedDistrict;
        }
        
        // Update current district if it's the one being updated
        if (state.currentDistrict && state.currentDistrict.id === updatedDistrict.id) {
          state.currentDistrict = updatedDistrict;
        }
        
        state.message = action.payload.message;
      })
      .addCase(updateDistrict.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to update district';
      })
      
      // Delete District
      .addCase(deleteDistrict.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteDistrict.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const deletedId = action.payload.data.id;
        
        // Remove from districts array
        state.districts = state.districts.filter(district => district.id !== deletedId);
        
        // Remove from districtsByBrand array
        state.districtsByBrand = state.districtsByBrand.filter(district => district.id !== deletedId);
        
        // Clear current district if it's the one being deleted
        if (state.currentDistrict && state.currentDistrict.id === deletedId) {
          state.currentDistrict = null;
        }
        
        state.message = action.payload.message;
      })
      .addCase(deleteDistrict.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to delete district';
      })
      
      // Get Districts By Brand
      .addCase(getDistrictsByBrand.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDistrictsByBrand.fulfilled, (state, action) => {
        state.loading = false;
        state.districtsByBrand = action.payload.data;
      })
      .addCase(getDistrictsByBrand.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch districts by brand';
      })
      
      // Toggle District Status
      .addCase(toggleDistrictStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(toggleDistrictStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updatedDistrict = action.payload.data;
        
        // Update in districts array
        const index = state.districts.findIndex(district => district.id === updatedDistrict.id);
        if (index !== -1) {
          state.districts[index] = updatedDistrict;
        }
        
        // Update in districtsByBrand array
        const brandIndex = state.districtsByBrand.findIndex(district => district.id === updatedDistrict.id);
        if (brandIndex !== -1) {
          state.districtsByBrand[brandIndex] = updatedDistrict;
        }
        
        // Update current district if it's the one being updated
        if (state.currentDistrict && state.currentDistrict.id === updatedDistrict.id) {
          state.currentDistrict = updatedDistrict;
        }
        
        state.message = action.payload.message;
      })
      .addCase(toggleDistrictStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to toggle district status';
      })
      
      // Search Districts
      .addCase(searchDistricts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchDistricts.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload.data;
      })
      .addCase(searchDistricts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to search districts';
      });
  },
});

export const {
  resetDistrictState,
  clearCurrentDistrict,
  clearDistrictsByBrand,
  clearSearchResults,
  setFilters,
  clearFilters,
} = districtSlice.actions;

// Selectors
export const selectAllDistricts = (state) => state.district.districts;
export const selectCurrentDistrict = (state) => state.district.currentDistrict;
export const selectDistrictsByBrand = (state) => state.district.districtsByBrand;
export const selectSearchResults = (state) => state.district.searchResults;
export const selectDistrictLoading = (state) => state.district.loading;
export const selectDistrictError = (state) => state.district.error;
export const selectDistrictSuccess = (state) => state.district.success;
export const selectDistrictMessage = (state) => state.district.message;
export const selectDistrictFilters = (state) => state.district.filters;

// Helper selectors
export const selectActiveDistricts = (state) => 
  state.district.districts.filter(district => district.is_active);

export const selectDistrictsByManager = (managerId) => (state) =>
  state.district.districts.filter(district => district.manager_id === managerId);

export const selectDistrictById = (districtId) => (state) =>
  state.district.districts.find(district => district.id === districtId);

export default districtSlice.reducer;