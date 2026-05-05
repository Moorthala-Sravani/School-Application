import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';

interface TimetableState {
  timetable: any[];
  loading: boolean;
  error: string | null;
}

const initialState: TimetableState = {
  timetable: [],
  loading: false,
  error: null,
};

export const fetchTimetable = createAsyncThunk(
  'timetable/fetchTimetable',
  async (day: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/timetable?day=${day}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch timetable');
    }
  }
);

const timetableSlice = createSlice({
  name: 'timetable',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTimetable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimetable.fulfilled, (state, action) => {
        state.loading = false;
        state.timetable = action.payload;
      })
      .addCase(fetchTimetable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default timetableSlice.reducer;
