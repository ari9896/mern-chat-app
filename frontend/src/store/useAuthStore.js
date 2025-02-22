import { create } from 'zustand'
import { axiosInstance } from '../lib/axios.js'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'

const BASE_URL = import.meta.env.MODE == "development" ? 
  'http://localhost:5001' : "/api"

export const useAuthStore = create((set, get) => ({
  authUser: null, // an object of the user that's logged in, je crois.
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,

  isCheckingAuth: true,
  onlineUsers: [],

  socket: null,
  
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get('/auth/check'); // axios uses baseURL already
      set({ authUser: res.data })
      get().connectSocket() // figure out what this does
    } catch (error) {
      console.log('Error in checkAuth: ', error);
      set({ authUser: null })
    } finally {
      set({ isCheckingAuth: false })
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post('/auth/signup', data);
      set({ authUser: res.data }) // So this will be local state?
      toast.success('Account created succesfully')

      get().connectSocket() // ??
    } catch (error) {
      toast.error(error.response.data.message)
    } finally {
      set({ isSigningUp: false})
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post('/auth/logout')
      set({ authUser: null });  // ??????????????????????
      toast.success('Logged out successfully');
      get().disconnectSocket()
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post('/auth/login', data);
      set({ authUser: res.data })
      toast.success('Logged in succesfully')

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false })
    }
  },

  updateProfile: async (data) => { // this is an image string
    set({ isUpdatingProfile: true })
    try {
      const res = await axiosInstance.put('/auth/update-profile', data);
      set({ authUser: res.data })
      toast.success('Profile updated succesfully')
    } catch(error) {
      console.log('error in update profile: ', error)
      toast.error(error.response.data.message)
    } finally {
      set({ isUpdatingProfile: false })
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id, // this comes from the handshake object
      },
    }); // add options

    socket.connect();

    set({ socket: socket });

    socket.on('getOnlineUsers', (userIds) => { // this all comes from the backend
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  }
}))