// src/redux/slice/userSlice.js
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

// Helper function for file uploads
const createFormDataRequest = (url, data) => {
  const formData = new FormData();
  
  // Append all data to FormData
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null) {
      // Handle file separately
      if (key === 'profile_pic' && data[key] instanceof File) {
        formData.append(key, data[key]);
      } else {
        formData.append(key, data[key]);
      }
    }
  });
  
  return API.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Async Thunks - Updated for file uploads
export const login = createAsyncThunk(
  'user/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await API.post('/users/login', credentials);
      
      // Store token in localStorage
      if (response.data.data?.token) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Updated createUser to handle file uploads
export const createUser = createAsyncThunk(
  'user/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      // Check if it's FormData (for file upload) or regular data
      let response;
      if (userData instanceof FormData) {
        response = await API.post('/users/createUser', userData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        response = await API.post('/users/createUser', userData);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getUserById = createAsyncThunk(
  'user/getUserById',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/users/getUsers/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Updated updateUser to handle file uploads
export const updateUser = createAsyncThunk(
  'user/updateUser',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      // Check if it's FormData (for file upload) or regular data
      let response;
      if (data instanceof FormData) {
        data.append('id', id);
        response = await API.put(`/users/updateUser/${id}`, data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        response = await API.put(`/users/updateUser/${id}`, data);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// All other thunks remain the same...
export const deleteUser = createAsyncThunk(
  'user/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await API.delete(`/users/deleteUser/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getUserByEmail = createAsyncThunk(
  'user/getUserByEmail',
  async (email, { rejectWithValue }) => {
    try {
      const response = await API.get(`/users/getUserByEmail/${email}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getUsersByShopId = createAsyncThunk(
  'user/getUsersByShopId',
  async (shopId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/users/users/shop/${shopId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getUsersByRole = createAsyncThunk(
  'user/getUsersByRole',
  async (role, { rejectWithValue }) => {
    try {
      const response = await API.get(`/users/users/role/${role}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getAllUsers = createAsyncThunk(
  'user/getAllUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/users/users');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const toggleUserActiveStatus = createAsyncThunk(
  'user/toggleUserActiveStatus',
  async ({ userId, is_active }, { rejectWithValue }) => {
    try {
      const response = await API.patch(`/users/users/${userId}/toggle-status`, { is_active });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Alternative route thunks
export const getAdminUsers = createAsyncThunk(
  'user/getAdminUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/users/admin/users');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getBrandUsers = createAsyncThunk(
  'user/getBrandUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/users/brand/users');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getDistrictUsers = createAsyncThunk(
  'user/getDistrictUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/users/district/users');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// The rest of the file remains the same...
// ... [Keep all the reducer logic, selectors, etc. exactly as they are]

// Initialize state from localStorage if available
const getInitialState = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let user = null;
  let isAuthenticated = false;
  
  if (token && userStr) {
    try {
      user = JSON.parse(userStr);
      isAuthenticated = true;
    } catch (error) {
      console.error('Failed to parse stored user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
  
  return {
    currentUser: user,
    users: [],
    usersByShop: [],
    usersByRole: {},
    loading: false,
    error: null,
    success: false,
    message: '',
    isAuthenticated,
    token: token || null,
    filters: {
      role: '',
      brand_id: null,
      shop_id: null,
      district_id: null,
      is_active: true,
      search: '',
    },
    statistics: {
      total: 0,
      active: 0,
      inactive: 0,
      byRole: {},
      byShop: {},
      byBrand: {},
    },
  };
};

const userSlice = createSlice({
  name: 'user',
  initialState: getInitialState(),
  reducers: {
    resetUserState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = '';
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.token = null;
    },
    clearUsersByShop: (state) => {
      state.usersByShop = [];
    },
    clearUsersByRole: (state) => {
      state.usersByRole = {};
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        role: '',
        brand_id: null,
        shop_id: null,
        district_id: null,
        is_active: true,
        search: '',
      };
    },
    logout: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    updateCurrentUser: (state, action) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.currentUser));
      }
    },
    // Local filter for client-side filtering
    filterUsers: (state, action) => {
      const { role, brand_id, shop_id, district_id, is_active, search } = action.payload;
      
      state.filteredUsers = state.users.filter(user => {
        let matches = true;
        
        if (role && user.role !== role) matches = false;
        if (brand_id && user.brand_id !== brand_id) matches = false;
        if (shop_id && user.shop_id !== shop_id) matches = false;
        if (district_id && user.district_id !== district_id) matches = false;
        if (is_active !== undefined && user.is_active !== is_active) matches = false;
        if (search) {
          const searchLower = search.toLowerCase();
          const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
          const email = user.email.toLowerCase();
          if (!fullName.includes(searchLower) && !email.includes(searchLower)) {
            matches = false;
          }
        }
        
        return matches;
      });
    },
    sortUsers: (state, action) => {
      const { field, direction = 'asc' } = action.payload;
      const usersToSort = state.filteredUsers?.length > 0 ? state.filteredUsers : state.users;
      
      const sortedUsers = [...usersToSort].sort((a, b) => {
        if (field === 'created_at' || field === 'updated_at') {
          return direction === 'asc' 
            ? new Date(a[field]) - new Date(b[field])
            : new Date(b[field]) - new Date(a[field]);
        }
        
        if (field === 'name') {
          const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
          const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
          if (direction === 'asc') {
            return nameA > nameB ? 1 : -1;
          } else {
            return nameA < nameB ? 1 : -1;
          }
        }
        
        if (direction === 'asc') {
          return a[field] > b[field] ? 1 : -1;
        } else {
          return a[field] < b[field] ? 1 : -1;
        }
      });
      
      if (state.filteredUsers?.length > 0) {
        state.filteredUsers = sortedUsers;
      } else {
        state.users = sortedUsers;
      }
    },
    updateUserInList: (state, action) => {
      const updatedUser = action.payload;
      const index = state.users.findIndex(user => user.id === updatedUser.id);
      if (index !== -1) {
        state.users[index] = { ...state.users[index], ...updatedUser };
      }
      
      // Update in usersByShop
      if (state.usersByShop.length > 0) {
        const shopIndex = state.usersByShop.findIndex(user => user.id === updatedUser.id);
        if (shopIndex !== -1) {
          state.usersByShop[shopIndex] = { ...state.usersByShop[shopIndex], ...updatedUser };
        }
      }
      
      // Update in usersByRole
      if (state.usersByRole[updatedUser.role]) {
        const roleIndex = state.usersByRole[updatedUser.role].findIndex(user => user.id === updatedUser.id);
        if (roleIndex !== -1) {
          state.usersByRole[updatedUser.role][roleIndex] = { 
            ...state.usersByRole[updatedUser.role][roleIndex], 
            ...updatedUser 
          };
        }
      }
      
      // Update current user if it's the one being updated
      if (state.currentUser && state.currentUser.id === updatedUser.id) {
        state.currentUser = { ...state.currentUser, ...updatedUser };
        localStorage.setItem('user', JSON.stringify(state.currentUser));
      }
    },
    updateStatistics: (state) => {
      const users = state.users;
      const stats = {
        total: users.length,
        active: users.filter(user => user.is_active).length,
        inactive: users.filter(user => !user.is_active).length,
        byRole: {},
        byShop: {},
        byBrand: {},
      };
      
      // Calculate statistics by role
      users.forEach(user => {
        // By role
        if (!stats.byRole[user.role]) {
          stats.byRole[user.role] = {
            total: 0,
            active: 0,
            inactive: 0,
          };
        }
        stats.byRole[user.role].total++;
        if (user.is_active) {
          stats.byRole[user.role].active++;
        } else {
          stats.byRole[user.role].inactive++;
        }
        
        // By shop
        if (user.shop_id) {
          if (!stats.byShop[user.shop_id]) {
            stats.byShop[user.shop_id] = {
              name: user.shop_name || `Shop ${user.shop_id}`,
              total: 0,
              active: 0,
              inactive: 0,
            };
          }
          stats.byShop[user.shop_id].total++;
          if (user.is_active) {
            stats.byShop[user.shop_id].active++;
          } else {
            stats.byShop[user.shop_id].inactive++;
          }
        }
        
        // By brand
        if (user.brand_id) {
          if (!stats.byBrand[user.brand_id]) {
            stats.byBrand[user.brand_id] = {
              name: user.brand_name || `Brand ${user.brand_id}`,
              total: 0,
              active: 0,
              inactive: 0,
            };
          }
          stats.byBrand[user.brand_id].total++;
          if (user.is_active) {
            stats.byBrand[user.brand_id].active++;
          } else {
            stats.byBrand[user.brand_id].inactive++;
          }
        }
      });
      
      state.statistics = stats;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.currentUser = action.payload.data.user;
        state.isAuthenticated = true;
        state.token = action.payload.data.token;
        state.message = action.payload.message;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Login failed';
        state.isAuthenticated = false;
        state.currentUser = null;
        state.token = null;
      })
      
      // Create User
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const newUser = action.payload.data;
        state.users.unshift(newUser);
        state.message = action.payload.message;
        // Update statistics
        userSlice.caseReducers.updateStatistics(state);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to create user';
      })
      
      // Get User By ID
      .addCase(getUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserById.fulfilled, (state, action) => {
        state.loading = false;
        // If getting current user's data, update it
        if (state.currentUser && state.currentUser.id === action.payload.data?.id) {
          state.currentUser = action.payload.data;
          localStorage.setItem('user', JSON.stringify(action.payload.data));
        }
      })
      .addCase(getUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch user';
      })
      
      // Update User
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updatedUser = action.payload.data;
        userSlice.caseReducers.updateUserInList(state, { payload: updatedUser });
        state.message = action.payload.message;
        // Update statistics
        userSlice.caseReducers.updateStatistics(state);
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to update user';
      })
      
      // Delete User
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const deletedUserId = action.payload.data?.id;
        state.users = state.users.filter(user => user.id !== deletedUserId);
        
        // Remove from usersByShop
        state.usersByShop = state.usersByShop.filter(user => user.id !== deletedUserId);
        
        // Remove from usersByRole
        Object.keys(state.usersByRole).forEach(role => {
          state.usersByRole[role] = state.usersByRole[role].filter(user => user.id !== deletedUserId);
        });
        
        state.message = action.payload.message;
        // Update statistics
        userSlice.caseReducers.updateStatistics(state);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to delete user';
      })
      
      // Get User By Email
      .addCase(getUserByEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserByEmail.fulfilled, (state, action) => {
        state.loading = false;
        // Could be used for profile lookup
      })
      .addCase(getUserByEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch user by email';
      })
      
      // Get Users By Shop ID
      .addCase(getUsersByShopId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUsersByShopId.fulfilled, (state, action) => {
        state.loading = false;
        state.usersByShop = action.payload.data;
      })
      .addCase(getUsersByShopId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch users by shop';
      })
      
      // Get Users By Role
      .addCase(getUsersByRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUsersByRole.fulfilled, (state, action) => {
        state.loading = false;
        const role = action.meta.arg;
        state.usersByRole[role] = action.payload.data;
      })
      .addCase(getUsersByRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch users by role';
      })
      
      // Get All Users
      .addCase(getAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.data;
        // Update statistics
        userSlice.caseReducers.updateStatistics(state);
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch users';
      })
      
      // Toggle User Active Status
      .addCase(toggleUserActiveStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(toggleUserActiveStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updatedUser = action.payload.data;
        userSlice.caseReducers.updateUserInList(state, { payload: updatedUser });
        state.message = action.payload.message;
        // Update statistics
        userSlice.caseReducers.updateStatistics(state);
      })
      .addCase(toggleUserActiveStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to toggle user status';
      })
      
      // Get Admin Users
      .addCase(getAdminUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAdminUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.data;
        // Update statistics
        userSlice.caseReducers.updateStatistics(state);
      })
      .addCase(getAdminUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch admin users';
      })
      
      // Get Brand Users
      .addCase(getBrandUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBrandUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.data;
        // Update statistics
        userSlice.caseReducers.updateStatistics(state);
      })
      .addCase(getBrandUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch brand users';
      })
      
      // Get District Users
      .addCase(getDistrictUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDistrictUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.data;
        // Update statistics
        userSlice.caseReducers.updateStatistics(state);
      })
      .addCase(getDistrictUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch district users';
      });
  },
});

export const {
  resetUserState,
  clearCurrentUser,
  clearUsersByShop,
  clearUsersByRole,
  setFilters,
  clearFilters,
  logout,
  setCurrentUser,
  updateCurrentUser,
  filterUsers,
  sortUsers,
  updateUserInList,
  updateStatistics,
} = userSlice.actions;

// Selectors
export const selectCurrentUser = (state) => state.user.currentUser;
export const selectAllUsers = (state) => state.user.users;
export const selectUsersByShop = (state) => state.user.usersByShop;
export const selectUsersByRole = (state) => state.user.usersByRole;
export const selectUserLoading = (state) => state.user.loading;
export const selectUserError = (state) => state.user.error;
export const selectUserSuccess = (state) => state.user.success;
export const selectUserMessage = (state) => state.user.message;
export const selectIsAuthenticated = (state) => state.user.isAuthenticated;
export const selectToken = (state) => state.user.token;
export const selectUserFilters = (state) => state.user.filters;
export const selectUserStatistics = (state) => state.user.statistics;

// Helper selectors
export const selectActiveUsers = (state) => 
  state.user.users.filter(user => user.is_active);

export const selectInactiveUsers = (state) => 
  state.user.users.filter(user => !user.is_active);

export const selectUserById = (userId) => (state) =>
  state.user.users.find(user => user.id === userId);

export const selectUsersByRoleName = (role) => (state) =>
  state.user.users.filter(user => user.role === role);

export const selectUsersByBrandId = (brandId) => (state) =>
  state.user.users.filter(user => user.brand_id === brandId);

export const selectUsersByShopId = (shopId) => (state) =>
  state.user.users.filter(user => user.shop_id === shopId);

export const selectUsersByDistrictId = (districtId) => (state) =>
  state.user.users.filter(user => user.district_id === districtId);

// Role-specific selectors
export const selectSuperAdmins = (state) =>
  state.user.users.filter(user => user.role === 'super_admin');

export const selectBrandAdmins = (state) =>
  state.user.users.filter(user => user.role === 'brand_admin');

export const selectDistrictManagers = (state) =>
  state.user.users.filter(user => user.role === 'district_manager');

export const selectShopManagers = (state) =>
  state.user.users.filter(user => user.role === 'shop_manager');

export const selectTechnicians = (state) =>
  state.user.users.filter(user => user.role === 'technician');

// Search selector
export const selectUsersBySearch = (searchTerm) => (state) => {
  if (!searchTerm) return state.user.users;
  
  const searchLower = searchTerm.toLowerCase();
  return state.user.users.filter(user => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const email = user.email.toLowerCase();
    return fullName.includes(searchLower) || email.includes(searchLower);
  });
};

// Role hierarchy helper
export const selectRolesUserCanCreate = (state) => {
  const currentUserRole = state.user.currentUser?.role;
  const creationHierarchy = {
    'super_admin': ['brand_admin'],
    'brand_admin': ['district_manager', 'shop_manager'],
    'district_manager': ['shop_manager'],
    'shop_manager': ['technician'],
    'technician': []
  };
  
  return creationHierarchy[currentUserRole] || [];
};

export default userSlice.reducer;