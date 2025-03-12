import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import rootReducer from './reducer';
import { injectStore } from './services/api';

// Configure persist options
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'cart', 'wishlist'], // Only persist these reducers
  blacklist: ['contractRequests'], // Don't persist these reducers
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Inject store into API service
injectStore(store);

// Create persistor
export const persistor = persistStore(store);

export default store;

// Export store utilities
export const dispatch = store.dispatch;
export const getState = store.getState; 