const API_URL = 'https://studum-student-dashboard.onrender.com/api';

export const assignmentService = {
  async getAssignments(userId) {
    try {
      const response = await fetch(`${API_URL}/assignments/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  },

  async createAssignment(assignment) {
    try {
      const response = await fetch(`${API_URL}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignment),
      });
      if (!response.ok) {
        throw new Error('Failed to create assignment');
      }
      return response.json();
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  },

  async updateAssignment(id, assignment) {
    try {
      const response = await fetch(`${API_URL}/assignments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignment),
      });
      if (!response.ok) {
        throw new Error('Failed to update assignment');
      }
      return response.json();
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
  },

  async deleteAssignment(id, userId) {
    try {
      const response = await fetch(`${API_URL}/assignments/${id}?userId=${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete assignment');
      }
      return response.json();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      throw error;
    }
  },
}; 
