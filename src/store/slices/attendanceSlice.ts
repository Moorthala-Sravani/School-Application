import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../index';
import api from '../../config/api';

export interface AttendanceRecord {
  id: number;
  user_id?: number;
  date: string;
  status?: string;
  reason?: string;
  teacherStatus?: string;
  adminStatus?: string;
  leaveType?: string;
  totalDays?: number;
  fromDate?: string;
  toDate?: string;
  adminComment?: string;
  teacherComment?: string;
  documentUrl?: string;
  student_name?: string;
  child_name?: string;
  name?: string;
  class?: string;
  class_group?: string;
  child_class?: string;
}

interface AttendanceState {
  records: AttendanceRecord[];
  loading: boolean;
  error: string | null;
}

const initialState: AttendanceState = {
  records: [],
  loading: false,
  error: null,
};

export const fetchAttendance = createAsyncThunk(
  'attendance/fetchAttendance',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const params = auth.role === 'Parent'
        ? {
            parent_id: auth.id,
            user_id: auth.id,
            mobile: auth.mobile,
          }
        : undefined;
      const response = await api.get('/attendance', {
        params,
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance');
    }
  }
);

export const applyLeave = createAsyncThunk(
  'attendance/applyLeave',
  async (leaveData: any, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const response = await api.post('/attendance/leave', leaveData, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to apply leave');
    }
  }
);

export const saveBulkAttendance = createAsyncThunk(
  'attendance/saveBulkAttendance',
  async (payload: { date: string; class_group: string; records: { parent_id: number; status: string }[] }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as any;
      const response = await api.post('/attendance/bulk', payload, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save attendance');
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default attendanceSlice.reducer;
