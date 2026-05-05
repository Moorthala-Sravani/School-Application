import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../index';
import api from '../../config/api';

export interface Message {
  id: number;
  sender_id?: number;
  sender_name: string;
  sender_type: string;
  receiver_id: number;
  title: string;
  content: string;
  is_read: boolean | number;
  created_at: string;
}

interface MessageState {
  messages: Message[];
  loading: boolean;
  error: string | null;
}

const initialState: MessageState = {
  messages: [],
  loading: false,
  error: null,
};

export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async (
    query: string | {
      classGroup?: string;
      receiverId?: number;
      teacherId?: number;
      parentId?: number;
    } | undefined,
    { getState, rejectWithValue }
  ) => {
    try {
      const { auth } = getState() as RootState;
      const params = typeof query === 'string'
        ? { class_group: query }
        : {
            class_group: query?.classGroup,
            receiver_id: query?.receiverId,
            teacher_id: query?.teacherId,
            parent_id: query?.parentId,
          };
      const response = await api.get('/messages', {
        params,
        headers: {
          'Authorization': `Bearer ${auth.token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch messages');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'messages/markAsRead',
  async (messageId: number, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      await api.put(`/messages/${messageId}/read`, undefined, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
        },
      });
      return messageId; // Return ID to update local state instantly
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to mark read');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async (
    messageData: {
      receiverId?: number;
      teacherId?: number;
      parentId?: number;
      content: string;
      class_group?: string;
      targetRole?: 'Parent' | 'Teacher' | 'Admin' | 'Management';
      title?: string;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const { auth } = getState() as RootState;
      const payload = {
        receiver_id: messageData.receiverId ?? null,
        teacher_id: messageData.teacherId,
        parent_id: messageData.parentId,
        content: messageData.content,
        class_group: messageData.class_group,
        title: messageData.title || 'Message',
        // Send multiple synonymous keys for backend compatibility.
        receiver_role: messageData.targetRole,
        receiver_type: messageData.targetRole,
        recipient_role: messageData.targetRole,
        target_role: messageData.targetRole,
      };

      const response = await api.post('/messages', payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to send message');
    }
  }
);

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = Array.isArray(action.payload) ? action.payload : (action.payload?.messages || []);
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const msg = state.messages.find(m => m.id === action.payload);
        if (msg) {
          msg.is_read = true;
        }
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const createdMessage = action.payload?.message || action.payload;
        if (createdMessage?.id && !state.messages.some(message => message.id === createdMessage.id)) {
          state.messages.push(createdMessage);
        }
      });
  },
});

export default messageSlice.reducer;
