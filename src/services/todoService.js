import axios from 'axios';

const API_URL = 'http://localhost:5001/api/todos';

// Create axios instance with default config
const todoApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false
});

// Request interceptor for logging
todoApi.interceptors.request.use(
  config => {
    console.log('Making request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      data: config.data,
      params: config.params,
      headers: config.headers
    });
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
todoApi.interceptors.response.use(
  response => {
    console.log('Response received:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  error => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Server error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
        config: error.config
      });
      throw new Error(error.response.data?.message || 'Server error');
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network error - no response received:', {
        request: error.request,
        config: error.config
      });
      throw new Error('Could not connect to server');
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', {
        message: error.message,
        config: error.config
      });
      throw new Error('Error setting up request');
    }
  }
);

export const getTodos = async (courseId, userId) => {
  try {
    const response = await todoApi.get(`/${courseId}`, {
      params: { userId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching todos:', error);
    throw error;
  }
};

export const createTodo = async (courseId, userId, text) => {
  try {
    const response = await todoApi.post('/', {
      courseId,
      userId,
      text
    });
    return response.data;
  } catch (error) {
    console.error('Error creating todo:', error);
    throw error;
  }
};

export const updateTodo = async (todoId, userId, updates) => {
  try {
    const response = await todoApi.put(`/${todoId}`, {
      userId,
      ...updates
    });
    return response.data;
  } catch (error) {
    console.error('Error updating todo:', error);
    throw error;
  }
};

export const deleteTodo = async (todoId, userId) => {
  try {
    const response = await todoApi.delete(`/${todoId}`, {
      params: { userId }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting todo:', error);
    throw error;
  }
}; 