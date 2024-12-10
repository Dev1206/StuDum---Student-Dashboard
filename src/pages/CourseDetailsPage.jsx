import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { courseService } from '../services/courseService.js';
import { fileService } from '../services/fileService.js';
import { assignmentService } from '../services/assignmentService.js';
import * as todoService from '../services/todoService.js';
import { FaChalkboardTeacher, FaCalendarAlt, FaInfoCircle, FaUpload, FaFileAlt, 
         FaTrashAlt, FaDownload, FaPencilAlt, FaFileUpload, FaTasks, FaPlus, 
         FaCheck, FaClock, FaExclamationTriangle, FaEdit, FaArrowLeft, FaSave } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import mammoth from 'mammoth';
import Button from '../components/ui/Button';
import { H1, H2, H3, Body1, Body2, Caption } from '../components/ui/Typography';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Container from '../components/ui/Container';

const formatDateForInput = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

const formatDisplayDate = (date) => {
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    timeZone: 'UTC'  // Force UTC to avoid timezone shifts
  };
  return new Date(date).toLocaleDateString('en-US', options);
};

const adjustColorBrightness = (color, percent) => {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return "#" + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1);
};

function CourseDetailsPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('files');
  const [editorContent, setEditorContent] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const editorRef = useRef(null);
  const [todos, setTodos] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [showTodoInput, setShowTodoInput] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState({
    assignmentName: '',
    dueDate: '',
    status: 'Pending',
    marks: 'N/A'
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    courseName: '',
    courseCode: '',
    instructor: '',
    description: '',
    schedule: '',
    color: '#3B82F6'
  });

  useEffect(() => {
    console.log('CourseDetailsPage mounted with courseId:', courseId);
    if (!courseId) {
      console.error('No courseId provided in URL parameters');
      setError('Course ID is required');
      setLoading(false);
      return;
    }
    if (!currentUser) {
      console.error('No authenticated user found');
      setError('Authentication required');
      setLoading(false);
      return;
    }
    loadCourse();
  }, [courseId, currentUser]);

  useEffect(() => {
    if (currentUser && course) {
      console.log('Loading course resources for course:', course.courseName);
      loadFiles();
      loadAssignments();
      loadTodos();
    }
  }, [currentUser, course]);

  const loadCourse = async () => {
    try {
      console.log('Starting to load course details for courseId:', courseId);
      const data = await courseService.getCourse(courseId);
      console.log('Received course data:', data);

      if (!data) {
        console.error('No course data received');
        setError('Course not found');
        setLoading(false);
        return;
      }

      if (data.userId !== currentUser.uid) {
        console.error('Course belongs to different user', { 
          courseUserId: data.userId, 
          currentUserId: currentUser.uid 
        });
        setError('Unauthorized to view this course');
        setLoading(false);
        return;
      }

      console.log('Setting course data:', data);
      setCourse(data);
    } catch (err) {
      console.error('Error in loadCourse:', err);
      setError(err.message || 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    try {
      const filesData = await fileService.getFiles(courseId, currentUser.uid);
      setFiles(filesData);
    } catch (err) {
      console.error('Error loading files:', err);
      // Don't set error state here to avoid blocking the whole page
    }
  };

  const loadAssignments = async () => {
    try {
      console.log('Loading assignments for course:', course?.courseName);
      const data = await assignmentService.getAssignments(currentUser.uid);
      const courseAssignments = data.filter(a => a.courseName === course?.courseName);
      console.log('Filtered assignments:', courseAssignments);
      setAssignments(courseAssignments);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const loadTodos = async () => {
    try {
      const data = await todoService.getTodos(courseId, currentUser.uid);
      setTodos(data);
    } catch (error) {
      console.error('Error loading todos:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    setUploading(true);

    try {
      // Check file size before upload
      for (const file of selectedFiles) {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
        }
      }

      for (const file of selectedFiles) {
        console.log(`Uploading file: ${file.name}`);
        await fileService.uploadFile(courseId, file, currentUser.uid);
      }

      // Reload files after successful upload
      await loadFiles();
      alert('Files uploaded successfully!');
    } catch (err) {
      console.error('Error uploading file:', err);
      alert(err.message || 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      await fileService.deleteFile(courseId, fileId, currentUser.uid);
      await loadFiles(); // Reload files after deletion
      // Show success message
      alert('File deleted successfully!');
    } catch (err) {
      console.error('Error deleting file:', err);
      alert(err.message || 'Failed to delete file. Please try again.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFilePreview = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      if (file.type === 'text/plain') {
        // Handle .txt files
        const text = await file.text();
        setEditorContent(text);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Handle .docx files
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setEditorContent(result.value);
      } else {
        alert('Please upload a .txt or .docx file');
      }
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error reading file. Please try again.');
    }

    // Clear the input
    e.target.value = '';
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;

    try {
      await todoService.createTodo(courseId, currentUser.uid, newTodo.trim());
      await loadTodos(); // Reload todos after adding
      setNewTodo('');
      setShowTodoInput(false);
    } catch (error) {
      console.error('Error adding todo:', error);
      alert(error.message || 'Failed to add todo. Please try again.');
    }
  };

  const handleToggleTodo = async (todoId, completed) => {
    try {
      await todoService.updateTodo(todoId, currentUser.uid, { completed: !completed });
      await loadTodos(); // Reload todos after updating
    } catch (error) {
      console.error('Error toggling todo:', error);
      alert(error.message || 'Failed to update todo. Please try again.');
    }
  };

  const handleDeleteTodo = async (todoId) => {
    if (!window.confirm('Are you sure you want to delete this todo?')) return;

    try {
      await todoService.deleteTodo(todoId, currentUser.uid);
      await loadTodos(); // Reload todos after deleting
    } catch (error) {
      console.error('Error deleting todo:', error);
      alert(error.message || 'Failed to delete todo. Please try again.');
    }
  };

  const handleAddAssignment = () => {
    setEditingAssignment(null);
    setAssignmentForm({
      assignmentName: '',
      dueDate: '',
      status: 'Pending',
      marks: 'N/A'
    });
    setShowAssignmentModal(true);
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setAssignmentForm({
      assignmentName: assignment.assignmentName,
      dueDate: formatDateForInput(assignment.dueDate),
      status: assignment.status,
      marks: assignment.marks
    });
    setShowAssignmentModal(true);
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;

    try {
      await assignmentService.deleteAssignment(assignmentId, currentUser.uid);
      setAssignments(assignments.filter(a => a._id !== assignmentId));
      alert('Assignment deleted successfully!');
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Failed to delete assignment. Please try again.');
    }
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();

    try {
      console.log('Course data:', course);
      
      // Create a UTC date at midnight
      const dueDateUTC = new Date(assignmentForm.dueDate);
      dueDateUTC.setUTCHours(0, 0, 0, 0);

      const assignmentData = {
        userId: currentUser.uid,
        courseName: course.courseName,
        ...assignmentForm,
        dueDate: dueDateUTC.toISOString()
      };

      console.log('Submitting assignment data:', assignmentData);

      if (editingAssignment) {
        console.log('Updating existing assignment:', editingAssignment._id);
        const updatedAssignment = await assignmentService.updateAssignment(
          editingAssignment._id,
          assignmentData
        );
        setAssignments(assignments.map(a => 
          a._id === editingAssignment._id ? updatedAssignment : a
        ));
      } else {
        console.log('Creating new assignment');
        const newAssignment = await assignmentService.createAssignment(assignmentData);
        console.log('New assignment created:', newAssignment);
        setAssignments([newAssignment, ...assignments]);
      }

      setShowAssignmentModal(false);
      setEditingAssignment(null);
      setAssignmentForm({
        assignmentName: '',
        dueDate: '',
        status: 'Pending',
        marks: 'N/A'
      });
    } catch (error) {
      console.error('Error saving assignment:', error);
      alert('Failed to save assignment. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'submitted':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'graded':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default: // pending
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const handleSaveNotes = async () => {
    if (!editorRef.current) return;
    
    setIsSaving(true);
    try {
      // Save notes to database (you'll need to implement this in your courseService)
      await courseService.updateCourseNotes(courseId, currentUser.uid, editorRef.current.getContent());
      // Show success message
      alert('Notes saved successfully!');
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      let content = '';
      
      if (file.type === 'text/plain') {
        // Handle .txt files
        content = await file.text();
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Handle .docx files
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        content = result.value;
      } else {
        alert('Please upload a .txt or .docx file');
        return;
      }

      // Set the editor content
      if (editorRef.current) {
        editorRef.current.setContent(content);
      }
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Failed to import file. Please try again.');
    }

    // Clear the input
    e.target.value = '';
  };

  const handleEditClick = () => {
    setEditFormData({
      courseName: course.courseName,
      courseCode: course.courseCode,
      instructor: course.instructor,
      description: course.description || '',
      schedule: course.schedule || '',
      color: course.color
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedCourse = await courseService.updateCourse(courseId, {
        ...editFormData,
        userId: currentUser.uid
      });
      setCourse(updatedCourse);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating course:', error);
      alert('Failed to update course. Please try again.');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Container>
          <div className="flex items-center justify-center h-[calc(100vh-70px)]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              <Body1 color="secondary">Loading course details...</Body1>
            </div>
          </div>
        </Container>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Container>
          <Card variant="outlined" className="bg-error-50">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center">
                  <FaExclamationTriangle className="text-error-500 mr-2" />
                  <Body1 color="error">{error}</Body1>
                </div>
                <Button
                  variant="primary"
                  onClick={() => navigate('/courses')}
                >
                  <FaArrowLeft className="mr-2" /> Back to Courses
                </Button>
              </div>
            </CardContent>
          </Card>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-70px)] bg-gradient-to-br from-gray-50 to-white">
        {/* Hero Section with Animated Gradient Background */}
        <div className={`relative overflow-hidden bg-gradient-to-br`} 
          style={{
            background: `linear-gradient(to bottom right, ${course.color}, ${adjustColorBrightness(course.color, -20)})`
          }}>
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-white rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] bg-white rounded-full blur-[100px] animate-pulse delay-1000"></div>
          </div>
          
          <Container className="relative py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex justify-between items-start mb-8">
                <Button
                  variant="ghost"
                  className="text-white/90 hover:text-white hover:bg-white/10 gap-2 backdrop-blur-sm"
                  onClick={() => navigate('/courses')}
                >
                  <FaArrowLeft /> Back to Courses
                </Button>
                <Button
                  variant="ghost"
                  className="text-white/90 hover:text-white hover:bg-white/10 gap-2 backdrop-blur-sm"
                  onClick={handleEditClick}
                >
                  <FaEdit /> Edit Course
                </Button>
              </div>

              <div className="space-y-6">
                <H1 className="text-4xl lg:text-5xl text-white font-bold tracking-tight">
                  {course.courseName}
                </H1>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-colors">
                    <FaChalkboardTeacher className="text-white/90" />
                    <span className="text-white/90">{course.instructor}</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-colors">
                    <FaCalendarAlt className="text-white/90" />
                    <span className="text-white/90">{course.schedule}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </Container>
        </div>

        <Container className="py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Course Info */}
            <div className="lg:col-span-1 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300"
                  style={{ boxShadow: `0 4px 24px -2px ${adjustColorBrightness(course.color, 40)}20` }}>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div>
                        <Caption className="font-medium mb-2 uppercase tracking-wider" style={{ color: course.color }}>
                          About Course
                        </Caption>
                        <Body1 className="text-gray-600 leading-relaxed">
                          {course.description}
                        </Body1>
                      </div>

                      <div className="pt-6 border-t border-gray-100">
                        <Caption className="font-medium mb-4 uppercase tracking-wider" style={{ color: course.color }}>
                          Quick Stats
                        </Caption>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl border transition-all duration-300 hover:shadow-md"
                            style={{ 
                              background: `linear-gradient(to bottom right, ${adjustColorBrightness(course.color, 95)}, white)`,
                              borderColor: `${adjustColorBrightness(course.color, 80)}50`
                            }}>
                            <div className="text-2xl font-bold mb-1" style={{ color: course.color }}>
                              {assignments.length}
                            </div>
                            <Caption style={{ color: adjustColorBrightness(course.color, -20) }}>Assignments</Caption>
                          </div>
                          <div className="p-4 rounded-xl border transition-all duration-300 hover:shadow-md"
                            style={{ 
                              background: `linear-gradient(to bottom right, ${adjustColorBrightness(course.color, 95)}, white)`,
                              borderColor: `${adjustColorBrightness(course.color, 80)}50`
                            }}>
                            <div className="text-2xl font-bold mb-1" style={{ color: course.color }}>
                              {files.length}
                            </div>
                            <Caption style={{ color: adjustColorBrightness(course.color, -20) }}>Resources</Caption>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Column - Tabs Content */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl"
                  style={{ boxShadow: `0 4px 24px -2px ${adjustColorBrightness(course.color, 40)}20` }}>
                  <div className="border-b border-gray-100">
                    <div className="flex gap-2 p-2">
                      {['files', 'assignments', 'todos', 'notes'].map((tab) => (
                        <Button
                          key={tab}
                          variant={activeTab === tab ? 'primary' : 'ghost'}
                          onClick={() => setActiveTab(tab)}
                          className={`px-6 py-2.5 rounded-xl capitalize transition-all duration-300 focus:outline-none focus:ring-0 active:outline-none ${
                            activeTab === tab 
                              ? 'text-white shadow-lg'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          style={activeTab === tab ? {
                            background: `linear-gradient(to right, ${course.color}, ${adjustColorBrightness(course.color, -20)})`,
                            boxShadow: `0 8px 24px -4px ${adjustColorBrightness(course.color, 40)}30`
                          } : {}}
                        >
                          <div className="flex items-center gap-2">
                            {tab === 'files' && <FaFileAlt />}
                            {tab === 'assignments' && <FaTasks />}
                            {tab === 'todos' && <FaCheck />}
                            {tab === 'notes' && <FaPencilAlt />}
                            {tab}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <CardContent className="p-6">
                    {/* Files Tab */}
                    {activeTab === 'files' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <H3 className="text-gray-900">Files & Resources</H3>
                          <Button 
                            variant="primary"
                            className="text-white shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-0 active:outline-none"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                              background: `linear-gradient(to right, ${course.color}, ${adjustColorBrightness(course.color, -20)})`,
                              boxShadow: `0 8px 24px -4px ${adjustColorBrightness(course.color, 40)}30`
                            }}
                          >
                            <FaUpload className="mr-2" /> Upload File
                          </Button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            multiple
                          />
                        </div>

                        <div className="space-y-3">
                          {files.map((file) => (
                            <motion.div
                              key={file._id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="group p-4 bg-gradient-to-br from-gray-50/50 to-white hover:from-white hover:to-white 
                                rounded-xl border border-gray-100 transition-all duration-300 hover:shadow-lg hover:border-primary-100"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="p-3 bg-gradient-to-br from-primary-100 to-primary-50 text-primary-600 rounded-xl
                                    group-hover:from-primary-500 group-hover:to-primary-400 group-hover:text-white transition-all duration-300">
                                    <FaFileAlt className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <Body1 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                                      {file.fileName}
                                    </Body1>
                                    <Caption className="text-gray-500">
                                      {formatFileSize(file.fileSize)} • Uploaded {formatDisplayDate(file.uploadDate)}
                                    </Caption>
                                  </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-0 active:outline-none"
                                    onClick={() => handleFileDownload(file)}
                                  >
                                    <FaDownload />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-error-600 hover:bg-error-50 focus:outline-none focus:ring-0 active:outline-none"
                                    onClick={() => handleFileDelete(file._id)}
                                  >
                                    <FaTrashAlt />
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          ))}

                          {files.length === 0 && (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-100 to-primary-50 
                                text-primary-600 rounded-full flex items-center justify-center transform hover:scale-110 transition-transform">
                                <FaFileUpload className="w-8 h-8" />
                              </div>
                              <Body1 className="text-gray-500 mb-4">No files uploaded yet</Body1>
                              <Button
                                variant="ghost"
                                className="text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-0 active:outline-none"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                Upload your first file
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Assignments Tab */}
                    {activeTab === 'assignments' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <H3 className="text-gray-900">Assignments</H3>
                          <Button 
                            variant="primary"
                            className="text-white shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-0 active:outline-none"
                            onClick={handleAddAssignment}
                            style={{
                              background: `linear-gradient(to right, ${course.color}, ${adjustColorBrightness(course.color, -20)})`,
                              boxShadow: `0 8px 24px -4px ${adjustColorBrightness(course.color, 40)}30`
                            }}
                          >
                            <FaPlus className="mr-2" /> Add Assignment
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {assignments.map((assignment) => (
                            <motion.div
                              key={assignment._id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="group p-6 bg-gradient-to-br from-gray-50/50 to-white hover:from-white hover:to-white 
                                rounded-xl border border-gray-100 hover:shadow-lg hover:border-primary-100 transition-all duration-300"
                            >
                              <div className="flex justify-between items-start">
                                <div className="space-y-3">
                                  <H3 className="text-gray-900 group-hover:text-primary-600 transition-colors">
                                    {assignment.assignmentName}
                                  </H3>
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <FaClock className="text-primary-400" />
                                      <Caption>Due: {formatDisplayDate(assignment.dueDate)}</Caption>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                                      {assignment.status}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-0 active:outline-none"
                                    onClick={() => handleEditAssignment(assignment)}
                                  >
                                    <FaEdit />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-error-600 hover:bg-error-50 focus:outline-none focus:ring-0 active:outline-none"
                                    onClick={() => handleDeleteAssignment(assignment._id)}
                                  >
                                    <FaTrashAlt />
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          ))}

                          {assignments.length === 0 && (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-100 to-primary-50 
                                text-primary-600 rounded-full flex items-center justify-center transform hover:scale-110 transition-transform">
                                <FaTasks className="w-8 h-8" />
                              </div>
                              <Body1 className="text-gray-500 mb-4">No assignments yet</Body1>
                              <Button
                                variant="ghost"
                                className="text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-0 active:outline-none"
                                onClick={handleAddAssignment}
                              >
                                Create your first assignment
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Todos Tab */}
                    {activeTab === 'todos' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <H3 className="text-gray-900">Todo List</H3>
                          <Button 
                            variant="primary"
                            className="text-white shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-0 active:outline-none"
                            onClick={() => setShowTodoInput(true)}
                            style={{
                              background: `linear-gradient(to right, ${course.color}, ${adjustColorBrightness(course.color, -20)})`,
                              boxShadow: `0 8px 24px -4px ${adjustColorBrightness(course.color, 40)}30`
                            }}
                          >
                            <FaPlus className="mr-2" /> Add Todo
                          </Button>
                        </div>

                        {showTodoInput && (
                          <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-2"
                          >
                            <input
                              type="text"
                              value={newTodo}
                              onChange={(e) => setNewTodo(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
                              placeholder="Enter a new todo"
                              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                                focus:ring-2 focus:border-transparent transition-all"
                              style={{
                                focusRing: `2px solid ${adjustColorBrightness(course.color, 20)}`,
                              }}
                            />
                            <Button 
                              variant="primary"
                              className="text-white shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-0 active:outline-none"
                              onClick={handleAddTodo}
                              style={{
                                background: `linear-gradient(to right, ${course.color}, ${adjustColorBrightness(course.color, -20)})`,
                                boxShadow: `0 8px 24px -4px ${adjustColorBrightness(course.color, 40)}30`
                              }}
                            >
                              Add
                            </Button>
                          </motion.div>
                        )}

                        <div className="space-y-2">
                          {todos.map((todo) => (
                            <motion.div
                              key={todo._id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="group flex items-center justify-between gap-4 p-4 bg-gradient-to-br 
                                from-gray-50/50 to-white hover:from-white hover:to-white rounded-xl border border-gray-100 
                                hover:border-primary-100 hover:shadow-lg transition-all duration-300"
                            >
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => handleToggleTodo(todo._id, todo.completed)}
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center 
                                    transition-all duration-300 ${
                                    todo.completed
                                      ? 'bg-gradient-to-r from-success-500 to-success-400 border-success-500 text-white'
                                      : 'border-gray-300 hover:border-primary-500'
                                  }`}
                                >
                                  {todo.completed && <FaCheck className="text-xs" />}
                                </button>
                                <Body1 className={`transition-all duration-300 ${
                                  todo.completed ? 'line-through text-gray-400' : 'text-gray-900'
                                }`}>
                                  {todo.text}
                                </Body1>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-error-600 hover:bg-error-50 focus:outline-none focus:ring-0 active:outline-none"
                                onClick={() => handleDeleteTodo(todo._id)}
                              >
                                <FaTrashAlt />
                              </Button>
                            </motion.div>
                          ))}

                          {todos.length === 0 && (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-100 to-primary-50 
                                text-primary-600 rounded-full flex items-center justify-center transform hover:scale-110 transition-transform">
                                <FaCheck className="w-8 h-8" />
                              </div>
                              <Body1 className="text-gray-500 mb-4">No todos yet</Body1>
                              <Button
                                variant="ghost"
                                className="text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-0 active:outline-none"
                                onClick={() => setShowTodoInput(true)}
                              >
                                Add your first todo
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notes Tab */}
                    {activeTab === 'notes' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <H3 className="text-gray-900">Course Notes</H3>
                          <div className="flex gap-2">
                            <input
                              type="file"
                              accept=".txt,.docx"
                              onChange={handleFileImport}
                              className="hidden"
                              id="noteFileInput"
                            />
                            <Button 
                              variant="primary"
                              className="text-white shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-0 active:outline-none"
                              onClick={() => document.getElementById('noteFileInput').click()}
                              style={{
                                background: `linear-gradient(to right, ${course.color}, ${adjustColorBrightness(course.color, -20)})`,
                                boxShadow: `0 8px 24px -4px ${adjustColorBrightness(course.color, 40)}30`
                              }}
                            >
                              <FaFileUpload className="mr-2" /> Import File
                            </Button>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-lg">
                          <Editor
                            apiKey='fd0vhkqkc0omtpc5wq3dx6m39a47uwh92wvjhvwvmnjjp1h1'
                            onInit={(evt, editor) => editorRef.current = editor}
                            value={editorContent}
                            onEditorChange={(content) => setEditorContent(content)}
                            init={{
                              height: 500,
                              menubar: false,
                              plugins: [
                                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                              ],
                              toolbar: 'undo redo | blocks | ' +
                                'bold italic forecolor | alignleft aligncenter ' +
                                'alignright alignjustify | bullist numlist outdent indent | ' +
                                'removeformat | help',
                              content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px }',
                              skin: 'oxide',
                              content_css: 'default'
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </Container>
      </div>

      {isEditModalOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl transform transition-all duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Course
              </h2>
              <button 
                className="w-8 h-8 flex items-center justify-center text-gray-400 
                  hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setIsEditModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.courseName}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      courseName: e.target.value
                    })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 
                      focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.courseCode}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      courseCode: e.target.value
                    })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 
                      focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instructor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.instructor}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      instructor: e.target.value
                    })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 
                      focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule
                  </label>
                  <input
                    type="text"
                    value={editFormData.schedule}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      schedule: e.target.value
                    })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 
                      focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    placeholder="e.g., Mon/Wed 10:00 AM - 11:30 AM"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      description: e.target.value
                    })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 
                      focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    rows="3"
                    placeholder="Enter course description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color Theme
                  </label>
                  <input
                    type="color"
                    value={editFormData.color}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      color: e.target.value
                    })}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button 
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 
                    rounded-lg transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  variant="primary"
                  className="px-4 py-2 text-white rounded-lg transition-all duration-200"
                  style={{
                    background: `linear-gradient(to right, ${course.color}, ${adjustColorBrightness(course.color, -20)})`,
                    boxShadow: `0 8px 24px -4px ${adjustColorBrightness(course.color, 40)}30`
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default CourseDetailsPage; 