import { create } from 'zustand'
import toast from 'react-hot-toast'
import { axiosInstance } from '../lib/axios'
import { useAuthStore } from './useAuthStore'

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true })
    try {
      const res = await axiosInstance.get('messages/users')
      set({ users: res.data })
    } catch (error) {
      toast.error(error.response.data.message)
    } finally {
      set({ isUsersLoading: false })
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get() // destructures the state above
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data ]})
    } catch (error) {
      toast.error(error.response.data.message)
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket; // ?

    socket.on('newMessage', (newMessage) => {
      const isMessageSendFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSendFromSelectedUser) return; // this prevents us from sending messages to the wrong person
      set({
        messages: [...get().messages, newMessage], // we're adding the new message at the end
      })
    })
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket; // this is the name of the 'socket' variable we created in AuthStore
    socket.off("newMessage"); // tells it to stop listening to this event
  },
  setSelectedUser: (selectedUser) => set({ selectedUser }),
}))