import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';

interface UniformState {
  loading: boolean;
  error: string | null;
  success: boolean;
  requests: any[];
  requestsLoading: boolean;
  requestsError: string | null;
  catalog: string[];
  catalogLoading: boolean;
  catalogError: string | null;
}

const initialState: UniformState = {
  loading: false,
  error: null,
  success: false,
  requests: [],
  requestsLoading: false,
  requestsError: null,
  catalog: ['Shirt', 'Pants', 'Skirt', 'Tie', 'Belt', 'Sweater', 'Shoes'],
  catalogLoading: false,
  catalogError: null,
};

export const submitUniform = createAsyncThunk(
  'uniform/submitUniform',
  async (uniformData: any, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as any;
      const response = await api.post('/uniform', uniformData, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Submission failed');
    }
  }
);

export const fetchUniformRequests = createAsyncThunk(
  'uniform/fetchUniformRequests',
  async (_: void, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as any;
      const { profile } = getState() as any;
      const response = await api.get('/uniform', {
        params: auth.role === 'Parent' ? { parent_id: profile.id ?? auth.id, child_name: profile.child_name } : undefined,
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load uniform requests');
    }
  }
);

export const fetchUniformCatalog = createAsyncThunk(
  'uniform/fetchUniformCatalog',
  async (_: void, { getState }) => {
    try {
      const { auth } = getState() as any;
      const response = await api.get('/uniform/catalog', {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      if (Array.isArray(response.data) && response.data.length > 0) {
        // If data is an array of strings, use it directly. If it is an array of objects, map the name properly.
        if (typeof response.data[0] === 'string') {
          return response.data;
        } else if (response.data[0]?.name) {
          return response.data.map((item: any) => item.name);
        }
      }
      return ['Shirt', 'Pants', 'Skirt', 'Tie', 'Belt', 'Sweater', 'Shoes'];
    } catch (error: any) {
      // Endpoint may not exist yet on backend, fallback to defaults
      return ['Shirt', 'Pants', 'Skirt', 'Tie', 'Belt', 'Sweater', 'Shoes'];
    }
  }
);

const uniformSlice = createSlice({
  name: 'uniform',
  initialState,
  reducers: {
    resetUniformState(state) {
      state.success = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitUniform.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(submitUniform.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(submitUniform.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUniformRequests.pending, (state) => {
        state.requestsLoading = true;
        state.requestsError = null;
      })
      .addCase(fetchUniformRequests.fulfilled, (state, action) => {
        state.requestsLoading = false;
        state.requests = action.payload;
      })
      .addCase(fetchUniformRequests.rejected, (state, action) => {
        state.requestsLoading = false;
        state.requestsError = action.payload as string;
      })
      .addCase(fetchUniformCatalog.pending, (state) => {
        state.catalogLoading = true;
        state.catalogError = null;
      })
      .addCase(fetchUniformCatalog.fulfilled, (state, action) => {
        state.catalogLoading = false;
        state.catalog = action.payload;
      })
      .addCase(fetchUniformCatalog.rejected, (state, action) => {
        state.catalogLoading = false;
        state.catalogError = action.payload as string;
      });
  },
});

export const { resetUniformState } = uniformSlice.actions;
export default uniformSlice.reducer;
