import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-hot-toast";
import authService from "../../services/auth/authService";
import { AUTH_CONSTANTS } from "../../config/constants";

// Initial state is loaded from auth service
const initialState = {
  signupData: null,
  loginData: authService.getUser(),
  loading: false,
  error: null,
  isAuthenticated: authService.isAuthenticated(),
  rememberMe: localStorage.getItem('rememberMe') === 'true',
  lastActivity: Date.now()
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSignupData: (state, action) => {
      state.signupData = action.payload;
    },
    
    clearSignupData: (state) => {
      state.signupData = null;
    },
    
    setUser: (state, action) => {
      state.loginData = action.payload;
      state.isAuthenticated = true;
      state.lastActivity = Date.now();
      // Auth service handles storage
      authService.setUser(action.payload);
    },
    
    updateUserData: (state, action) => {
      state.loginData = { ...state.loginData, ...action.payload };
      state.lastActivity = Date.now();
      // Auth service handles storage
      authService.setUser(state.loginData);
    },
    
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    
    setError: (state, action) => {
      state.error = action.payload;
      if (action.payload) {
        toast.error(action.payload);
      }
    },
    
    setAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
      state.lastActivity = Date.now();
    },
    
    setRememberMe: (state, action) => {
      state.rememberMe = action.payload;
      localStorage.setItem('rememberMe', action.payload.toString());
    },
    
    logout: (state) => {
      // Reset state
      Object.assign(state, {
        signupData: null,
        loginData: null,
        isAuthenticated: false,
        error: null,
        lastActivity: null
      });
      
      // Auth service handles token and user removal
      authService.removeToken();
      authService.removeUser();
      
      toast.success("Logged out successfully");
    },
    
    refreshActivity: (state) => {
      state.lastActivity = Date.now();
    },
    
    checkSession: (state) => {
      // Use different session timeout based on remember me setting
      const inactivityLimit = state.rememberMe 
        ? AUTH_CONSTANTS.EXTENDED_SESSION_TIMEOUT  // 7 days for remembered sessions
        : AUTH_CONSTANTS.SESSION_TIMEOUT;          // 2 hours for normal sessions
      
      const currentTime = Date.now();
      
      if (state.isAuthenticated && (currentTime - state.lastActivity > inactivityLimit)) {
        // Reset state
        Object.assign(state, {
          signupData: null,
          loginData: null,
          isAuthenticated: false,
          error: "Session expired due to inactivity"
        });
        
        // Auth service handles token and user removal
        authService.removeToken();
        authService.removeUser();
        
        toast.error("Session expired. Please login again.");
      }
    }
  }
});

export const { 
  setSignupData, 
  setLoading, 
  setUser,
  setAuthenticated,
  updateUserData, 
  logout,
  setError,
  refreshActivity,
  checkSession,
  setRememberMe,
  clearSignupData
} = authSlice.actions;

export default authSlice.reducer;