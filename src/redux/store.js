// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import brandReducer from './slice/brandSlice';
import districtReducer from './slice/districtSlice';
import orderReducer from './slice/orderSlice';
import shopReducer from './slice/shopSlice';
import userReducer from './slice/userSlice';
import videoEditReducer from './slice/videoEditSlice';
import videoReducer from './slice/videoSlice'; 

const rootReducer = combineReducers({
  brand: brandReducer,
  district: districtReducer,
  order: orderReducer,
  shop: shopReducer,
  user: userReducer,
  videoEdit: videoEditReducer,
  video: videoReducer,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;