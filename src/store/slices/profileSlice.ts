import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { API_BASE_URL } from '../../config/api';

export interface ProfileState {
  id: number | null;
  firstname: string;
  lastname: string;
  email: string;
  mobile_number: string;
  occupation: string | null;
  child_name: string | null;
  child_class: string | null;
  address: string | null;
  profile_pic: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  id: null,
  firstname: '',
  lastname: '',
  email: '',
  mobile_number: '',
  occupation: null,
  child_name: null,
  child_class: null,
  address: null,
  profile_pic: null,
  loading: false,
  error: null,
};

export const fetchParentProfile = createAsyncThunk(
  'profile/fetchParentProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const response = await fetch(`${API_BASE_URL}/profile/parent`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch profile');
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateParentProfile = createAsyncThunk(
  'profile/updateParentProfile',
  async (profileData: any, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const response = await fetch(`${API_BASE_URL}/profile/parent`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify(profileData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update profile');
      // We return the updated data so the local state updates instantly
      return profileData;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfileError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchParentProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParentProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.id = action.payload.id;
        state.firstname = action.payload.firstname;
        state.lastname = action.payload.lastname;
        state.email = action.payload.email;
        state.mobile_number = action.payload.mobile_number;
        state.occupation = action.payload.occupation;
        state.child_name = action.payload.child_name;
        state.child_class = action.payload.child_class;
        state.address = action.payload.address;
        state.profile_pic = action.payload.profile_pic;
      })
      .addCase(fetchParentProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update
      .addCase(updateParentProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateParentProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.occupation = action.payload.occupation;
        state.child_name = action.payload.child_name;
        state.child_class = action.payload.child_class;
        state.address = action.payload.address;
        if (action.payload.profile_pic !== undefined) {
          state.profile_pic = action.payload.profile_pic;
        }
      })
      .addCase(updateParentProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearProfileError } = profileSlice.actions;
export default profileSlice.reducer;
