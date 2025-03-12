import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Provider } from "react-redux";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import { PersistGate } from "redux-persist/integration/react";
import storage from "redux-persist/lib/storage";
import rootReducer from "./reducer";
import {
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";

// Replace with your own publishable key
const stripePromise = loadStripe("your-publishable-key-here");

// Redux Persist Config
const persistConfig = {
  key: "root",
  storage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  devTools: true, // DevTools enable karne ke liye
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

const persistor = persistStore(store);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <Elements stripe={stripePromise}>
            <App />
          </Elements>
          <Toaster 
            position="top-right"
            toastOptions={{
              success: {
                style: {
                  background: '#10B981',
                  color: 'white',
                },
                iconTheme: {
                  primary: 'white',
                  secondary: '#10B981',
                },
              },
              error: {
                style: {
                  background: '#EF4444',
                  color: 'white',
                },
                iconTheme: {
                  primary: 'white',
                  secondary: '#EF4444',
                },
              },
              duration: 3000,
            }}
          />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
