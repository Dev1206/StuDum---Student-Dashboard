const API_URL = 'http://localhost:5001/api';

export const courseService = {
  async getCourses(userId) {
    try {
      console.log('Fetching courses for user:', userId);
      const response = await fetch(`${API_URL}/courses/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const data = await response.json();
      console.log('Received courses data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  },

  async getCourse(courseId) {
    try {
      console.log('Fetching course details for:', courseId);
      const response = await fetch(`${API_URL}/courses/details/${courseId}`);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.message || 'Failed to fetch course details');
      }
      const data = await response.json();
      console.log('Received course details:', data);
      return data;
    } catch (error) {
      console.error('Error fetching course details:', error);
      throw error;
    }
  },

  async createCourse(course) {
    try {
      console.log('Creating new course:', course);
      const response = await fetch(`${API_URL}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(course),
      });
      if (!response.ok) {
        throw new Error('Failed to create course');
      }
      const data = await response.json();
      console.log('Course created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  },

  async updateCourse(id, course) {
    try {
      console.log('Updating course:', { id, course });
      const response = await fetch(`${API_URL}/courses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(course),
      });
      if (!response.ok) {
        throw new Error('Failed to update course');
      }
      const data = await response.json();
      console.log('Course updated successfully:', data);
      return data;
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  },

  async deleteCourse(id) {
    try {
      console.log('Deleting course:', id);
      const response = await fetch(`${API_URL}/courses/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete course');
      }
      const data = await response.json();
      console.log('Course deleted successfully');
      return data;
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  },

  // Get course notes
  getCourseNotes: async (courseId, userId) => {
    try {
      const response = await fetch(`${API_URL}/courses/${courseId}/notes?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch notes');
      const data = await response.json();
      return data.notes;
    } catch (error) {
      console.error('Error fetching course notes:', error);
      throw error;
    }
  },

  // Update course notes
  updateCourseNotes: async (courseId, userId, notes) => {
    try {
      const response = await fetch(`${API_URL}/courses/${courseId}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, notes }),
      });
      if (!response.ok) throw new Error('Failed to update notes');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating course notes:', error);
      throw error;
    }
  },
}; 