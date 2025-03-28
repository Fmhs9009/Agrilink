import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-hot-toast";
import { api } from "../../services/api";

// Use sessionStorage instead of localStorage for better security
const getStoredRequests = () => {
  try {
    const storedRequests = sessionStorage.getItem('contractRequests');
    return storedRequests ? JSON.parse(storedRequests) : [];
  } catch (error) {
    console.error('Error retrieving contract requests from sessionStorage:', error);
    return [];
  }
};

// Async thunks with proper error handling
export const fetchContractRequests = createAsyncThunk(
  'contractRequests/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      console.log("Fetching contract requests from API...");
      const response = await api.get('/contracts');
      console.log("Contract API response:", response);
      
      // Handle different possible response formats
      if (response.data && response.data.contracts) {
        console.log("Found contracts array in response.data.contracts");
        return response.data.contracts;
      } else if (Array.isArray(response.data)) {
        console.log("Response data is an array");
        return response.data;
      } else if (response.data && response.data.success && !response.data.contracts) {
        console.log("Response has success but no contracts array, returning empty array");
        return [];
      } else {
        console.warn("Unexpected response format:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Error fetching contract requests:", error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch contract requests';
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const submitContractRequest = createAsyncThunk(
  'contractRequests/submit',
  async (contractRequest, { rejectWithValue }) => {
    try {
      const response = await api.post('/contracts/request', contractRequest);
      toast.success('Contract request submitted successfully');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to submit contract request';
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateContractRequest = createAsyncThunk(
  'contractRequests/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/contracts/${id}`, data);
      toast.success('Contract request updated successfully');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update contract request';
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const cancelContractRequest = createAsyncThunk(
  'contractRequests/cancel',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/contracts/${id}`);
      toast.success('Contract request cancelled successfully');
      return id;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to cancel contract request';
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Create the slice
const contractRequestsSlice = createSlice({
  name: "contractRequests",
  initialState: {
    contractRequests: getStoredRequests(),
    totalRequests: 0,
    loading: false,
    error: null,
    currentRequest: null
  },
  reducers: {
    // Local actions (not requiring API calls)
    addContractRequest(state, action) {
      const request = action.payload;
      const existingRequest = state.contractRequests.find((item) => item._id === request._id);
      
      if (existingRequest) {
        toast.error("Contract request already exists");
        return;
      }
      
      // Ensure request has required fields
      if (!request.quantity) {
        request.quantity = 1;
      }
      
      state.contractRequests.push(request);
      state.totalRequests += 1;
      sessionStorage.setItem('contractRequests', JSON.stringify(state.contractRequests));
    },
    
    removeContractRequest(state, action) {
      const id = action.payload;
      const existingRequest = state.contractRequests.find((item) => item._id === id || item.id === id);
      
      if (!existingRequest) {
        toast.error("Contract request not found");
        return;
      }
      
      state.totalRequests -= 1;
      state.contractRequests = state.contractRequests.filter((item) => item._id !== id && item.id !== id);
      sessionStorage.setItem('contractRequests', JSON.stringify(state.contractRequests));
    },
    
    updateContractRequest(state, action) {
      const { id, updates } = action.payload;
      const request = state.contractRequests.find((item) => item._id === id || item.id === id);
      
      if (!request) {
        toast.error("Contract request not found");
        return;
      }
      
      // Update request with new values
      Object.assign(request, updates);
      sessionStorage.setItem('contractRequests', JSON.stringify(state.contractRequests));
    },
    
    clearContractRequests(state) {
      state.contractRequests = [];
      state.totalRequests = 0;
      sessionStorage.removeItem('contractRequests');
    },
    
    setCurrentRequest(state, action) {
      state.currentRequest = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Handle async actions
    builder
      // Fetch contract requests
      .addCase(fetchContractRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContractRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.contractRequests = action.payload;
        state.totalRequests = action.payload.length;
        // Only store in sessionStorage if we have data
        if (action.payload.length > 0) {
          sessionStorage.setItem('contractRequests', JSON.stringify(action.payload));
        }
      })
      .addCase(fetchContractRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch contract requests';
      })
      
      // Submit contract request
      .addCase(submitContractRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitContractRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.contractRequests.push(action.payload);
        state.totalRequests += 1;
        sessionStorage.setItem('contractRequests', JSON.stringify(state.contractRequests));
      })
      .addCase(submitContractRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to submit contract request';
      })
      
      // Update contract request
      .addCase(updateContractRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateContractRequest.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.contractRequests.findIndex(request => request._id === action.payload._id);
        if (index !== -1) {
          state.contractRequests[index] = action.payload;
          sessionStorage.setItem('contractRequests', JSON.stringify(state.contractRequests));
        }
      })
      .addCase(updateContractRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update contract request';
      })
      
      // Cancel contract request
      .addCase(cancelContractRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelContractRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.contractRequests = state.contractRequests.filter(request => request._id !== action.payload);
        state.totalRequests -= 1;
        sessionStorage.setItem('contractRequests', JSON.stringify(state.contractRequests));
      })
      .addCase(cancelContractRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to cancel contract request';
      });
  }
});

// Export actions and reducer
export const { 
  addContractRequest, 
  removeContractRequest, 
  updateContractRequest: updateContractRequestAction, 
  clearContractRequests,
  setCurrentRequest
} = contractRequestsSlice.actions;

export default contractRequestsSlice.reducer; 