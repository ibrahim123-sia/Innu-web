// src/redux/slice/districtSlice.js
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

// Async Thunks - 8 functions matching controller
export const createDistrict = createAsyncThunk(
  'district/createDistrict',
  async (districtData, { rejectWithValue }) => {
    try {
      const response = await API.post('/districts/createdistricts', districtData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: error.message });
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
      return rejectWithValue(error.response?.data || { error: error.message });
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
      return rejectWithValue(error.response?.data || { error: error.message });
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
      return rejectWithValue(error.response?.data || { error: error.message });
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
      return rejectWithValue(error.response?.data || { error: error.message });
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
      return rejectWithValue(error.response?.data || { error: error.message });
    }
  }
);

export const getActiveDistricts = createAsyncThunk(
  'district/getActiveDistricts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/districts/activedistricts');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: error.message });
    }
  }
);

export const getShopsByDistrict = createAsyncThunk(
  'district/getShopsByDistrict',
  async (districtId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/districts/${districtId}/shops`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: error.message });
    }
  }
);

const initialState = {
  districts: [],
  currentDistrict: null,
  districtsByBrand: [],
  activeDistricts: [],
  shopsByDistrict: [],
  loading: false,
  error: null,
  success: false,
  message: '',
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
    clearShopsByDistrict: (state) => {
      state.shopsByDistrict = [];
    },
    setDistricts: (state, action) => {
      state.districts = action.payload;
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
        // Handle response with data wrapper
        if (action.payload?.data) {
          state.districts.unshift(action.payload.data);
          state.districtsByBrand.unshift(action.payload.data);
        }
        state.message = action.payload?.message || 'District created successfully';
      })
      .addCase(createDistrict.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to create district';
        state.success = false;
      })
      
      // Get All Districts
      .addCase(getAllDistricts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllDistricts.fulfilled, (state, action) => {
        state.loading = false;
        // Handle response with data wrapper
        state.districts = action.payload?.data || action.payload || [];
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
        // Handle response with data wrapper
        state.currentDistrict = action.payload?.data || action.payload || null;
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
        
        // Handle response with data wrapper
        const updatedDistrict = action.payload?.data || action.payload;
        
        if (updatedDistrict) {
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
        }
        
        state.message = action.payload?.message || 'District updated successfully';
      })
      .addCase(updateDistrict.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to update district';
        state.success = false;
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
        
        // Handle response with data wrapper
        const deletedData = action.payload?.data || action.payload;
        const deletedId = deletedData?.id;
        
        if (deletedId) {
          // Remove from districts array
          state.districts = state.districts.filter(district => district.id !== deletedId);
          
          // Remove from districtsByBrand array
          state.districtsByBrand = state.districtsByBrand.filter(district => district.id !== deletedId);
          
          // Clear current district if it's the one being deleted
          if (state.currentDistrict && state.currentDistrict.id === deletedId) {
            state.currentDistrict = null;
          }
        }
        
        state.message = action.payload?.message || 'District deleted successfully';
      })
      .addCase(deleteDistrict.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to delete district';
        state.success = false;
      })
      
      // Get Districts By Brand - FIXED VERSION
      .addCase(getDistrictsByBrand.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDistrictsByBrand.fulfilled, (state, action) => {
        state.loading = false;
        
        // Handle different response structures
        if (action.payload?.data && Array.isArray(action.payload.data)) {
          // Standard response: { success: true, data: [...] }
          state.districtsByBrand = action.payload.data;
        } else if (Array.isArray(action.payload)) {
          // Direct array response
          state.districtsByBrand = action.payload;
        } else if (action.payload && typeof action.payload === 'object') {
          // Try to find array in response
          const possibleArray = Object.values(action.payload).find(val => Array.isArray(val));
          if (possibleArray) {
            state.districtsByBrand = possibleArray;
          } else {
            state.districtsByBrand = [];
          }
        } else {
          state.districtsByBrand = [];
        }
        
        // Log for debugging (remove in production)
        console.log('Districts stored in Redux:', state.districtsByBrand);
      })
      .addCase(getDistrictsByBrand.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch districts by brand';
        state.districtsByBrand = [];
      })
      
      // Get Active Districts
      .addCase(getActiveDistricts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getActiveDistricts.fulfilled, (state, action) => {
        state.loading = false;
        // Handle response with data wrapper
        state.activeDistricts = action.payload?.data || action.payload || [];
      })
      .addCase(getActiveDistricts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch active districts';
        state.activeDistricts = [];
      })
      
      // Get Shops By District
      .addCase(getShopsByDistrict.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getShopsByDistrict.fulfilled, (state, action) => {
        state.loading = false;
        // Handle response with data wrapper
        state.shopsByDistrict = action.payload?.data || action.payload || [];
      })
      .addCase(getShopsByDistrict.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch shops by district';
        state.shopsByDistrict = [];
      });
  },
});

export const {
  resetDistrictState,
  clearCurrentDistrict,
  clearDistrictsByBrand,
  clearShopsByDistrict,
  setDistricts,
} = districtSlice.actions;

// Selectors
export const selectAllDistricts = (state) => state.district.districts || [];
export const selectCurrentDistrict = (state) => state.district.currentDistrict;
export const selectDistrictsByBrand = (state) => {
  // Ensure we always return an array
  const districts = state.district.districtsByBrand;
  return Array.isArray(districts) ? districts : [];
};
export const selectActiveDistricts = (state) => state.district.activeDistricts || [];
export const selectShopsByDistrict = (state) => state.district.shopsByDistrict || [];
export const selectDistrictLoading = (state) => state.district.loading || false;
export const selectDistrictError = (state) => state.district.error;
export const selectDistrictSuccess = (state) => state.district.success || false;
export const selectDistrictMessage = (state) => state.district.message || '';

export default districtSlice.reducer;