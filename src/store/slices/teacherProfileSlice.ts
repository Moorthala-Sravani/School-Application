import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { updateProfile } from './authSlice';
import { API_BASE_URL } from '../../config/api';

export interface TeacherProfileState {
  firstname: string;
  lastname: string;
  email: string;
  mobile_number: string;
  subject: string;
  assigned_classes: string[];
  class_teacher: string | null;
  profile_pic: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: TeacherProfileState = {
  firstname: '',
  lastname: '',
  email: '',
  mobile_number: '',
  subject: '',
  assigned_classes: [],
  class_teacher: null,
  profile_pic: null,
  loading: false,
  error: null,
};

export const fetchTeacherProfile = createAsyncThunk(
  'teacherProfile/fetchProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const response = await fetch(`${API_BASE_URL}/profile/teacher`, {
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

export const updateTeacherProfile = createAsyncThunk(
  'teacherProfile/updateProfile',
  async (profileData: any, { getState, rejectWithValue, dispatch }) => {
    try {
      const { auth } = getState() as RootState;
      const response = await fetch(`${API_BASE_URL}/profile/teacher`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify(profileData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update profile');
      
      // Keep auth slice in sync
      dispatch(updateProfile({ firstName: profileData.firstname, lastName: profileData.lastname }));
      
      return profileData;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const teacherProfileSlice = createSlice({
  name: 'teacherProfile',
  initialState,
  reducers: {
    clearTeacherProfile: (state) => {
      Object.assign(state, initialState);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeacherProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.firstname = action.payload.firstname;
        state.lastname = action.payload.lastname;
        state.email = action.payload.email;
        state.mobile_number = action.payload.mobile_number;
        state.subject = action.payload.subject;
        
        let assigned = action.payload.assigned_classes || [];
        if (typeof assigned === 'string') {
          try {
            assigned = JSON.parse(assigned);
          } catch (e) {
            assigned = [];
          }
        }
        state.assigned_classes = assigned;
        
        state.class_teacher = action.payload.class_teacher || null;
        state.profile_pic = action.payload.profile_pic;
      })
      .addCase(fetchTeacherProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateTeacherProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTeacherProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.firstname = action.payload.firstname;
        state.lastname = action.payload.lastname;
        state.email = action.payload.email;
        state.mobile_number = action.payload.mobile_number;
        state.subject = action.payload.subject;
        state.assigned_classes = action.payload.assigned_classes || [];
        state.class_teacher = action.payload.class_teacher || null;
        state.profile_pic = action.payload.profile_pic;
      })
      .addCase(updateTeacherProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearTeacherProfile } = teacherProfileSlice.actions;
export default teacherProfileSlice.reducer;
