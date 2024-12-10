import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

export const fileService = {
  async uploadFile(courseId, file, userId) {
    try {
      console.log('Starting file upload:', {
        courseId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await fetch(`${API_URL}/files/${courseId}/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Upload failed:', data);
        throw new Error(data.message || data.error || 'Failed to upload file');
      }

      console.log('Upload successful:', data);
      return data.file;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  async getFiles(courseId, userId) {
    try {
      const response = await fetch(`${API_URL}/files/${courseId}?userId=${userId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to fetch files');
      }

      return data;
    } catch (error) {
      console.error('Error fetching files:', error);
      throw error;
    }
  },

  async deleteFile(courseId, fileId, userId) {
    try {
      const response = await fetch(`${API_URL}/files/${courseId}/${fileId}?userId=${userId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to delete file');
      }

      return data;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  async convertDocxToHtml(file) {
    try {
      console.log('Converting DOCX file:', file.name);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/files/convert-docx`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Conversion failed:', errorData);
        throw new Error(errorData.message || 'Conversion failed');
      }

      const data = await response.json();
      console.log('Conversion successful');
      return data.html;
    } catch (error) {
      console.error('Error converting file:', error);
      throw error;
    }
  }
}; 