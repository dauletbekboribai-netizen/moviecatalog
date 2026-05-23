import { configureStore, createSlice } from '@reduxjs/toolkit';

const moviesSlice = createSlice({
  name: 'movies',
  initialState: [],
  reducers: {
    setMovies: (state, action) => action.payload,
    addMovie: (state, action) => {
      state.push(action.payload);
    },
    removeMovie: (state, action) => {
      return state.filter(movie => movie.id !== action.payload);
    },
    updateMovie: (state, action) => {
      const index = state.findIndex(m => m.id === action.payload.id);
      if (index !== -1) {
        state[index] = action.payload;
      }
    }
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: JSON.parse(localStorage.getItem('user')) || null },
  reducers: { setUser: (state, action) => { state.user = action.payload; } }
});

export const { setMovies, addMovie, removeMovie, updateMovie } = moviesSlice.actions;
export const { setUser } = authSlice.actions;

export const store = configureStore({
  reducer: { movies: moviesSlice.reducer, auth: authSlice.reducer }
});