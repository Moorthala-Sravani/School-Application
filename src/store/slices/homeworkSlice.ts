import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';
import api from '../../config/api';

export interface Homework {
  id: number;
  teacher_id: number;
  title: string;
  description: string;
  class_group: string;
  created_at: string;
  teacher_firstname?: string;
  teacher_lastname?: string;
}

interface HomeworkState {
  homeworkList: Homework[];
  loading: boolean;
  error: string | null;
}

const initialState: HomeworkState = {
  homeworkList: [],
  loading: false,
  error: null,
};

export const fetchHomework = createAsyncThunk(
  'homework/fetchHomework',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const { profile } = getState() as RootState;
      const response = await api.get('/homework', {
        params: auth.role === 'Parent' ? { class_group: profile.child_class, parent_id: profile.id ?? auth.id } : undefined,
        headers: {
          'Authorization': `Bearer ${auth.token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch homework');
    }
  }
);

export const uploadHomework = createAsyncThunk(
  'homework/uploadHomework',
  async (homeworkData: { title: string; description: string; class_group: string }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const response = await api.post('/homework', homeworkData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to upload homework');
    }
  }
);

const homeworkSlice = createSlice({
  name: 'homework',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomework.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHomework.fulfilled, (state, action) => {
        state.loading = false;
        state.homeworkList = Array.isArray(action.payload) ? action.payload : (action.payload?.homework || []);
      })
      .addCase(fetchHomework.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(uploadHomework.fulfilled, (state, action) => {
        // Just refetch or wait for next load. We'll leave it simple.
      });
  },
});

export default homeworkSlice.reducer;
