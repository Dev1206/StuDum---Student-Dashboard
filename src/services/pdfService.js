const API_URL = 'https://studum-student-dashboard.onrender.com/api';

export const pdfService = {
  async mergePdfs(files) {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch(`${API_URL}/pdf/merge`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to merge PDFs');
      }

      const blob = await response.blob();
      return {
        blob,
        filename: 'merged.pdf'
      };
    } catch (error) {
      console.error('Error merging PDFs:', error);
      throw error;
    }
  },

  async compressPdf(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/pdf/compress`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to compress PDF');
      }

      const blob = await response.blob();
      return {
        blob,
        filename: `compressed_${file.name}`
      };
    } catch (error) {
      console.error('Error compressing PDF:', error);
      throw error;
    }
  },

  async convertToWord(file) {
    try {
      console.log('Starting PDF to Word conversion for file:', file.name);
      
      // Validate file type
      if (!file.type || !file.type.includes('pdf')) {
        throw new Error('Invalid file type. Please provide a PDF file.');
      }

      const formData = new FormData();
      formData.append('file', file);

      console.log('Sending request to server...');
      const response = await fetch(`${API_URL}/pdf/to-word`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to convert PDF to Word');
      }

      console.log('Conversion successful, getting blob...');
      const blob = await response.blob();
      return {
        blob,
        filename: file.name.replace('.pdf', '.docx')
      };
    } catch (error) {
      console.error('Error converting PDF to Word:', error);
      throw error;
    }
  }
}; 
