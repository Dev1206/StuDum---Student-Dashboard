import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { assignmentService } from '../services/assignmentService';
import AssignmentEditor from '../components/AssignmentEditor';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import { H1, H2, Body1, Body2, Caption } from '../components/ui/Typography';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Container from '../components/ui/Container';
import { FaPlus, FaEdit, FaTrashAlt, FaTasks, FaClock, FaCheckCircle } from 'react-icons/fa';

function AssignmentsPage() {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formData, setFormData] = useState({
    courseName: '',
    assignmentName: '',
    dueDate: '',
    status: 'Pending',
    marks: 'N/A'
  });

  useEffect(() => {
    loadAssignments();
  }, [currentUser]);

  const loadAssignments = async () => {
    try {
      if (currentUser) {
        const data = await assignmentService.getAssignments(currentUser.uid);
        setAssignments(data);
      }
    } catch (err) {
      setError('Failed to load assignments');
      console.error('Error loading assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const assignment = assignments.find(a => a._id === id);
      if (!assignment) return;

      const updatedAssignment = {
        ...assignment,
        userId: currentUser.uid,
        status: newStatus,
        courseName: assignment.courseName,
        assignmentName: assignment.assignmentName,
        dueDate: assignment.dueDate,
        marks: assignment.marks || 'N/A'
      };

      const updated = await assignmentService.updateAssignment(id, updatedAssignment);
      setAssignments(prev => prev.map(a => a._id === id ? updated : a));
    } catch (err) {
      console.error('Error updating assignment status:', err);
      alert('Failed to update assignment status. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    
    try {
      await assignmentService.deleteAssignment(id, currentUser.uid);
      setAssignments(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      console.error('Error deleting assignment:', err);
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      courseName: assignment.courseName,
      assignmentName: assignment.assignmentName,
      dueDate: new Date(assignment.dueDate).toISOString().split('T')[0],
      status: assignment.status,
      marks: assignment.marks
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingAssignment(null);
    setFormData({
      courseName: '',
      assignmentName: '',
      dueDate: '',
      status: 'Pending',
      marks: 'N/A'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const assignmentData = {
        ...formData,
        userId: currentUser.uid
      };

      if (editingAssignment) {
        const updated = await assignmentService.updateAssignment(
          editingAssignment._id,
          assignmentData
        );
        setAssignments(prev =>
          prev.map(a => a._id === editingAssignment._id ? updated : a)
        );
      } else {
        const created = await assignmentService.createAssignment(assignmentData);
        setAssignments(prev => [...prev, created]);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving assignment:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-success-100 text-success-700 border-success-200';
      case 'submitted':
        return 'bg-primary-100 text-primary-700 border-primary-200';
      case 'graded':
        return 'bg-secondary-100 text-secondary-700 border-secondary-200';
      default:
        return 'bg-warning-100 text-warning-700 border-warning-200';
    }
  };

  const getStatusBg = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'from-success-50 to-success-100';
      case 'submitted':
        return 'from-primary-50 to-primary-100';
      case 'graded':
        return 'from-secondary-50 to-secondary-100';
      default:
        return 'from-warning-50 to-warning-100';
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Container>
          <div className="flex items-center justify-center h-[calc(100vh-70px)]">
            <Body1 color="secondary">Loading assignments...</Body1>
          </div>
        </Container>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Container>
          <Card variant="outlined" className="bg-error-50 border-error-200">
            <CardContent>
              <Body1 color="error">{error}</Body1>
            </CardContent>
          </Card>
        </Container>
      </MainLayout>
    );
  }

  const completedAssignments = assignments.filter(a => a.status.toLowerCase() === 'completed' || a.status.toLowerCase() === 'graded').length;
  const pendingAssignments = assignments.filter(a => a.status.toLowerCase() === 'pending').length;
  const submittedAssignments = assignments.filter(a => a.status.toLowerCase() === 'submitted').length;

  return (
    <MainLayout>
      <Container>
        {/* Hero Section */}
        <div className="py-20 space-y-8">
          <div className="max-w-2xl">
            <H1 className="text-4xl font-bold mb-4">Assignments</H1>
            <Body1 color="secondary" className="text-lg">
              Track and manage your course assignments, deadlines, and progress all in one place.
            </Body1>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-primary-50 to-white border border-primary-100 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-100 rounded-xl">
                  <FaTasks className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <H2 className="text-3xl font-bold text-primary-600">{assignments.length}</H2>
                  <Caption className="text-primary-600">Total Assignments</Caption>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-success-50 to-white border border-success-100 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success-100 rounded-xl">
                  <FaCheckCircle className="w-6 h-6 text-success-600" />
                </div>
                <div>
                  <H2 className="text-3xl font-bold text-success-600">{completedAssignments}</H2>
                  <Caption className="text-success-600">Completed</Caption>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-warning-50 to-white border border-warning-100 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-warning-100 rounded-xl">
                  <FaClock className="w-6 h-6 text-warning-600" />
                </div>
                <div>
                  <H2 className="text-3xl font-bold text-warning-600">{pendingAssignments}</H2>
                  <Caption className="text-warning-600">Pending</Caption>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Assignments Section */}
        <div className="py-12 space-y-8">
          <div className="flex justify-between items-center mb-8">
            <H2 className="text-2xl font-bold">Your Assignments</H2>
            <Button
              variant="primary"
              onClick={handleAdd}
              className="bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <FaPlus className="mr-2" /> Add Assignment
            </Button>
          </div>

          {assignments.length > 0 ? (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary-50 border-b border-secondary-100">
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-secondary-700">Course Name</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-secondary-700">Assignment Name</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center gap-2">
                          <FaClock className="text-secondary-400" />
                          <span className="text-sm font-semibold text-secondary-700">Due Date</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-secondary-700">Status</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-secondary-700">Marks</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <span className="text-sm font-semibold text-secondary-700">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100">
                    {assignments.map((assignment) => (
                      <motion.tr
                        key={assignment._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group hover:bg-secondary-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <Body2 className="font-medium text-secondary-900">
                            {assignment.courseName}
                          </Body2>
                        </td>
                        <td className="px-6 py-4">
                          <Body2 className="font-medium text-secondary-900">
                            {assignment.assignmentName}
                          </Body2>
                        </td>
                        <td className="px-6 py-4">
                          <Body2 className="text-secondary-600">
                            {new Date(assignment.dueDate).toLocaleDateString()}
                          </Body2>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={assignment.status}
                            onChange={(e) => handleStatusChange(assignment._id, e.target.value)}
                            className={`px-3 py-1 rounded-full text-sm font-medium border cursor-pointer
                              focus:outline-none focus:ring-2 focus:ring-primary/20 ${getStatusColor(assignment.status)}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Submitted">Submitted</option>
                            <option value="Completed">Completed</option>
                            <option value="Graded">Graded</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <Body2 className="text-secondary-600">
                            {assignment.marks}
                          </Body2>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary-600 hover:bg-primary-50"
                              onClick={() => handleEdit(assignment)}
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-error-600 hover:bg-error-50"
                              onClick={() => handleDelete(assignment._id)}
                            >
                              <FaTrashAlt />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-primary-50 
                text-primary-600 rounded-full flex items-center justify-center">
                <FaTasks className="w-10 h-10" />
              </div>
              <H2 className="text-2xl font-bold mb-2">No Assignments Yet</H2>
              <Body1 color="secondary" className="mb-6">
                Start by adding your first assignment to track your progress.
              </Body1>
              <Button
                variant="primary"
                onClick={handleAdd}
                className="bg-gradient-to-r from-primary-600 to-primary-500 text-white"
              >
                <FaPlus className="mr-2" /> Add Your First Assignment
              </Button>
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {isModalOpen && (
            <div 
              className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setIsModalOpen(false)}
            >
              <motion.div 
                className="w-full max-w-md"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <Card variant="elevated" className="shadow-2xl">
                  <CardHeader className="p-6 flex items-center justify-between border-b border-secondary-100">
                    <H2 className="text-2xl font-bold">
                      {editingAssignment ? 'Edit Assignment' : 'Add Assignment'}
                    </H2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsModalOpen(false)}
                      className="text-secondary-400 hover:text-secondary-600"
                    >
                      ×
                    </Button>
                  </CardHeader>

                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Course Name <span className="text-error-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.courseName}
                          onChange={(e) => setFormData({
                            ...formData,
                            courseName: e.target.value
                          })}
                          className="w-full px-4 py-2 rounded-lg border border-secondary-200 focus:ring-2 
                            focus:ring-primary focus:border-primary transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Assignment Name <span className="text-error-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.assignmentName}
                          onChange={(e) => setFormData({
                            ...formData,
                            assignmentName: e.target.value
                          })}
                          className="w-full px-4 py-2 rounded-lg border border-secondary-200 focus:ring-2 
                            focus:ring-primary focus:border-primary transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Due Date <span className="text-error-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) => setFormData({
                            ...formData,
                            dueDate: e.target.value
                          })}
                          className="w-full px-4 py-2 rounded-lg border border-secondary-200 focus:ring-2 
                            focus:ring-primary focus:border-primary transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({
                            ...formData,
                            status: e.target.value
                          })}
                          className="w-full px-4 py-2 rounded-lg border border-secondary-200 focus:ring-2 
                            focus:ring-primary focus:border-primary transition-colors"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Submitted">Submitted</option>
                          <option value="Completed">Completed</option>
                          <option value="Graded">Graded</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Marks
                        </label>
                        <input
                          type="text"
                          value={formData.marks}
                          onChange={(e) => setFormData({
                            ...formData,
                            marks: e.target.value
                          })}
                          className="w-full px-4 py-2 rounded-lg border border-secondary-200 focus:ring-2 
                            focus:ring-primary focus:border-primary transition-colors"
                          placeholder="Enter marks or N/A"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-4">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setIsModalOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          className="bg-gradient-to-r from-primary-600 to-primary-500 text-white"
                        >
                          {editingAssignment ? 'Save Changes' : 'Add Assignment'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AssignmentEditor />
      </Container>
    </MainLayout>
  );
}

export default AssignmentsPage; 