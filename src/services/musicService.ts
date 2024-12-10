// import axios from 'axios';

// interface Song {
//   id: string;
//   title: string;
//   artist: string;
//   album?: string;
//   duration: number;
//   url: string;
//   coverImage?: string;
// }

// interface Playlist {
//   id: string;
//   name: string;
//   userId: string;
//   songs: Song[];
// }

// const API_URL = 'https://studum-student-dashboard.onrender.com/api';

// export const getAllSongs = async (): Promise<Song[]> => {
//   try {
//     const response = await axios.get(`${API_URL}/songs`);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching songs:', error);
//     throw error;
//   }
// };

// export const getSongById = async (id: string): Promise<Song> => {
//   try {
//     const response = await axios.get(`${API_URL}/songs/${id}`);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching song:', error);
//     throw error;
//   }
// };

// export const getPlaylistsByUserId = async (userId: string): Promise<Playlist[]> => {
//   try {
//     const response = await axios.get(`${API_URL}/playlists/user/${userId}`);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching playlists:', error);
//     throw error;
//   }
// };

// export const createPlaylist = async (playlistData: Omit<Playlist, 'id'>): Promise<Playlist> => {
//   try {
//     const response = await axios.post(`${API_URL}/playlists`, playlistData);
//     return response.data;
//   } catch (error) {
//     console.error('Error creating playlist:', error);
//     throw error;
//   }
// };

// export const addSongToPlaylist = async (playlistId: string, songId: string): Promise<Playlist> => {
//   try {
//     const response = await axios.post(`${API_URL}/playlists/${playlistId}/songs`, { songId });
//     return response.data;
//   } catch (error) {
//     console.error('Error adding song to playlist:', error);
//     throw error;
//   }
// }; 
