import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { courseService } from '../services/courseService.js';
import { FaChalkboardTeacher, FaCalendarAlt, FaInfoCircle, FaPlus, FaPencilAlt, FaTrashAlt, FaBook, FaCheckCircle, FaClock } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { H1, H2, Body1, Caption } from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Container from '../components/ui/Container';

function CoursesPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    courseName: '',
    courseCode: '',
    instructor: '',
    description: '',
    schedule: '',
    color: '#3B82F6'
  });

  useEffect(() => {
    loadCourses();
  }, [currentUser]);

  const loadCourses = async () => {
    try {
      if (currentUser) {
        console.log('Loading courses for user:', currentUser.uid);
        const data = await courseService.getCourses(currentUser.uid);
        console.log('Loaded courses:', data);
        setCourses(data);
      }
    } catch (err) {
      setError('Failed to load courses');
      console.error('Error loading courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const courseData = {
        ...formData,
        userId: currentUser.uid
      };

      let updatedCourse;
      if (editingCourse) {
        updatedCourse = await courseService.updateCourse(editingCourse._id, courseData);
        setCourses(prev => prev.map(course => 
          course._id === editingCourse._id ? updatedCourse : course
        ));
      } else {
        const newCourse = await courseService.createCourse(courseData);
        setCourses(prev => [...prev, newCourse]);
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving course:', err);
      alert('Failed to save course. Please try again.');
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      courseName: course.courseName,
      courseCode: course.courseCode,
      instructor: course.instructor,
      description: course.description || '',
      schedule: course.schedule || '',
      color: course.color
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      await courseService.deleteCourse(courseId);
      setCourses(prev => prev.filter(course => course._id !== courseId));
    } catch (err) {
      console.error('Error deleting course:', err);
      alert('Failed to delete course. Please try again.');
    }
  };

  const resetForm = () => {
    setEditingCourse(null);
    setFormData({
      courseName: '',
      courseCode: '',
      instructor: '',
      description: '',
      schedule: '',
      color: '#3B82F6'
    });
  };

  const handleAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleCardClick = (courseId, e) => {
    if (e.target.closest('.course-card-actions')) {
      e.stopPropagation();
      return;
    }
    console.log('Navigating to course details:', courseId);
    navigate(`/courses/${courseId}`);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[calc(100vh-70px)]">
          <div className="animate-pulse flex space-x-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-.3s]"></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-.5s]"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto p-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container>
        {/* Hero Section */}
        <div className="py-20">
          <div className="flex items-start justify-between gap-8">
            <div className="max-w-2xl">
              <H1 className="text-4xl font-bold mb-4">Your Courses</H1>
              <Body1 color="secondary" className="text-lg">
                Manage your academic journey, track progress, and access course materials all in one place.
              </Body1>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-primary-50 to-white border border-primary-100 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-100 rounded-xl">
                  <FaBook className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <H2 className="text-3xl font-bold text-primary-600">{courses.length}</H2>
                  <Caption className="text-primary-600">Total Courses</Caption>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Course Grid */}
        <div className="py-12 space-y-8">
          <div className="flex justify-between items-center">
            <H2 className="text-2xl font-bold">All Courses</H2>
            <Button
              variant="primary"
              onClick={() => setShowAddCourse(true)}
              className="bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <FaPlus className="mr-2" /> Add Course
            </Button>
          </div>

          {courses.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white rounded-2xl border border-gray-100/50 shadow-xl shadow-gray-100/50 backdrop-blur-sm"
            >
              <div className="max-w-sm mx-auto">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary-50 flex items-center justify-center">
                  <FaChalkboardTeacher className="h-10 w-10 text-primary-500" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">No courses yet</h3>
                <p className="mt-2 text-gray-500">Get started by adding your first course!</p>
                <button
                  onClick={handleAdd}
                  className="group relative mt-8 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 
                    text-white rounded-xl hover:shadow-lg hover:shadow-primary/30 
                    transition-all duration-300"
                >
                  <div className="relative flex items-center gap-2">
                    <FaPlus className="text-sm transition-transform duration-300 group-hover:rotate-90" />
                    <span className="font-medium">Add Course</span>
                  </div>
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {courses.map((course, index) => (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl 
                    transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100/50
                    hover:-translate-y-1"
                  onClick={(e) => handleCardClick(course._id, e)}
                  style={{ borderTop: `4px solid ${course.color}` }}
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ 
                      background: `linear-gradient(45deg, ${course.color}10, ${course.color}20)`
                    }}
                  />
                  
                  <div className="relative p-8">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                          {course.courseName}
                        </h3>
                        <span className="inline-block mt-3 px-4 py-1.5 bg-white rounded-full text-sm font-medium shadow-sm
                          border border-gray-100">
                          {course.courseCode}
                        </span>
                      </div>
                      <div className="course-card-actions flex items-center gap-2 opacity-0 group-hover:opacity-100 
                        transition-opacity duration-300">
                        <button 
                          className="p-2.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 
                            rounded-lg transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(course);
                          }}
                          title="Edit course"
                        >
                          <FaPencilAlt className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 
                            rounded-lg transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(course._id);
                          }}
                          title="Delete course"
                        >
                          <FaTrashAlt className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-8 space-y-5">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl" style={{ backgroundColor: `${course.color}20` }}>
                          <FaChalkboardTeacher className="w-5 h-5" style={{ color: course.color }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Instructor</p>
                          <p className="text-gray-900 mt-0.5">{course.instructor}</p>
                        </div>
                      </div>

                      {course.schedule && (
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl" style={{ backgroundColor: `${course.color}20` }}>
                            <FaCalendarAlt className="w-5 h-5" style={{ color: course.color }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Schedule</p>
                            <p className="text-gray-900 mt-0.5">{course.schedule}</p>
                          </div>
                        </div>
                      )}
                      
                      {course.description && (
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl" style={{ backgroundColor: `${course.color}20` }}>
                            <FaInfoCircle className="w-5 h-5" style={{ color: course.color }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Description</p>
                            <p className="text-gray-900 mt-0.5 line-clamp-2">{course.description}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <>
              <motion.div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
              />
              <motion.div 
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div 
                  className="w-full max-w-md bg-white rounded-2xl shadow-2xl"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-2xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 
                      bg-clip-text text-transparent">
                      {editingCourse ? 'Edit Course' : 'Add New Course'}
                    </h2>
                    <button 
                      className="w-8 h-8 flex items-center justify-center text-gray-400 
                        hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200
                        hover:rotate-90"
                      onClick={() => {
                        setIsModalOpen(false);
                        resetForm();
                      }}
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label 
                          htmlFor="courseName" 
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Course Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="courseName"
                          value={formData.courseName}
                          onChange={(e) => setFormData({
                            ...formData,
                            courseName: e.target.value
                          })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 
                            focus:ring-2 focus:ring-primary focus:border-primary 
                            transition-colors"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label 
                            htmlFor="courseCode" 
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Course Code <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="courseCode"
                            value={formData.courseCode}
                            onChange={(e) => setFormData({
                              ...formData,
                              courseCode: e.target.value
                            })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 
                              focus:ring-2 focus:ring-primary focus:border-primary 
                              transition-colors"
                            required
                          />
                        </div>

                        <div>
                          <label 
                            htmlFor="color" 
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Color Theme
                          </label>
                          <input
                            type="color"
                            id="color"
                            value={formData.color}
                            onChange={(e) => setFormData({
                              ...formData,
                              color: e.target.value
                            })}
                            className="w-full h-10 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>

                      <div>
                        <label 
                          htmlFor="instructor" 
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Instructor <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="instructor"
                          value={formData.instructor}
                          onChange={(e) => setFormData({
                            ...formData,
                            instructor: e.target.value
                          })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 
                            focus:ring-2 focus:ring-primary focus:border-primary 
                            transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label 
                          htmlFor="schedule" 
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Schedule
                        </label>
                        <input
                          type="text"
                          id="schedule"
                          value={formData.schedule}
                          onChange={(e) => setFormData({
                            ...formData,
                            schedule: e.target.value
                          })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 
                            focus:ring-2 focus:ring-primary focus:border-primary 
                            transition-colors"
                          placeholder="e.g., Mon/Wed 10:00 AM - 11:30 AM"
                        />
                      </div>

                      <div>
                        <label 
                          htmlFor="description" 
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Description
                        </label>
                        <textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({
                            ...formData,
                            description: e.target.value
                          })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 
                            focus:ring-2 focus:ring-primary focus:border-primary 
                            transition-colors"
                          rows="3"
                          placeholder="Enter course description..."
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6">
                      <button 
                        type="button"
                        onClick={() => {
                          setIsModalOpen(false);
                          resetForm();
                        }}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 
                          rounded-lg transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white 
                          rounded-lg hover:shadow-lg hover:shadow-primary/30 
                          transform hover:scale-105 transition-all duration-200"
                      >
                        {editingCourse ? 'Save Changes' : 'Add Course'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </Container>
    </MainLayout>
  );
}

export default CoursesPage; 