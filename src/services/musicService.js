import axios from 'axios';

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryOperation = async (operation, retries = MAX_RETRIES) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) throw error;
      if (error.response?.status === 429) { // Rate limit error
        await sleep(RETRY_DELAY * Math.pow(2, i)); // Exponential backoff
        continue;
      }
      throw error;
    }
  }
};

export const musicService = {
  async searchSongs(query) {
    if (!query?.trim()) {
      return [];
    }

    try {
      const response = await retryOperation(async () => {
        return await axios.get(`${YOUTUBE_API_URL}/search`, {
          params: {
            part: 'snippet',
            maxResults: 10,
            q: query + ' music',
            type: 'video',
            videoCategoryId: '10',
            key: YOUTUBE_API_KEY
          }
        });
      });

      if (!response.data?.items?.length) {
        return [];
      }

      return response.data.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        duration: '',
        thumbnail: item.snippet.thumbnails.default.url
      }));
    } catch (error) {
      console.error('Error searching songs:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      if (error.response?.status === 403) {
        throw new Error('YouTube API quota exceeded. Please try again later.');
      }
      throw new Error('Failed to search songs. Please try again.');
    }
  },

  async getSuggestions(query) {
    if (!query || query.length < 2) return [];
    
    try {
      const response = await retryOperation(async () => {
        return await axios.get(`${YOUTUBE_API_URL}/search`, {
          params: {
            part: 'snippet',
            maxResults: 5,
            q: query + ' music',
            type: 'video',
            videoCategoryId: '10',
            key: YOUTUBE_API_KEY
          }
        });
      });

      if (!response.data?.items?.length) {
        return [];
      }

      return response.data.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle
      }));
    } catch (error) {
      console.error('Error fetching suggestions:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return []; // Fail silently for suggestions
    }
  },

  async getFeaturedPlaylists() {
    try {
      const response = await retryOperation(async () => {
        return await axios.get(`${YOUTUBE_API_URL}/playlists`, {
          params: {
            part: 'snippet',
            maxResults: 6,
            chart: 'mostPopular',
            videoCategoryId: '10',
            key: YOUTUBE_API_KEY
          }
        });
      });

      if (!response.data?.items?.length) {
        return [];
      }

      return response.data.items.map(item => ({
        id: item.id,
        title: item.snippet.title,
        artist: item.snippet.channelTitle
      }));
    } catch (error) {
      console.error('Error fetching featured playlists:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return []; // Return empty array instead of throwing
    }
  },

  async getRecommendedSongs() {
    try {
      const response = await retryOperation(async () => {
        return await axios.get(`${YOUTUBE_API_URL}/videos`, {
          params: {
            part: 'snippet',
            maxResults: 10,
            chart: 'mostPopular',
            videoCategoryId: '10',
            key: YOUTUBE_API_KEY
          }
        });
      });

      if (!response.data?.items?.length) {
        return [];
      }

      return response.data.items.map(item => ({
        id: item.id,
        title: item.snippet.title,
        artist: item.snippet.channelTitle
      }));
    } catch (error) {
      console.error('Error fetching recommended songs:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return []; // Return empty array instead of throwing
    }
  }
}; 