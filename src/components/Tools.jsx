import React, { useState, useRef, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import '../styles/calendar.css'
import { taskService } from '../services/taskService'
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { useToolbar } from '../contexts/ToolbarContext'

const TOOLS_OPTIONS = [
  { id: 'calendar', name: 'Calendar', icon: '📅' },
  { id: 'calculator', name: 'Advanced Calculator', icon: '🔢' }
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
]

const getPriorityLabel = (priority) => {
  const option = PRIORITY_OPTIONS.find(opt => opt.value === priority)
  return option ? option.label : 'Low'
}

function Tools() {
  const { currentUser } = useAuth()
  const { isToolbarOpen, setIsToolbarOpen } = useToolbar()
  const [activeTool, setActiveTool] = useState('calendar')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Calendar and task states
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [tasks, setTasks] = useState({})
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [newTask, setNewTask] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedDateTasks, setSelectedDateTasks] = useState([])
  const [taskTime, setTaskTime] = useState('09:00')
  const [editingTask, setEditingTask] = useState(null)
  const [priority, setPriority] = useState('low')

  useEffect(() => {
    if (isToolbarOpen) {
      setActiveTool('calendar')
    }
  }, [isToolbarOpen])

  // Format date as key with timezone handling
  const formatDate = (date) => {
    const localDate = new Date(date)
    localDate.setHours(0, 0, 0, 0)
    return localDate.toISOString().split('T')[0]
  }

  // Format time
  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).toLowerCase()
  }

  // Load tasks when date changes or user logs in
  useEffect(() => {
    const loadTasks = async () => {
      if (currentUser && calendarDate) {
        try {
          const localDate = new Date(calendarDate)
          localDate.setHours(0, 0, 0, 0)
          const dateKey = formatDate(localDate)
          
          const tasks = await taskService.getTasks(currentUser.uid, dateKey)
          setTasks(prev => ({
            ...prev,
            [dateKey]: tasks
          }))
          setSelectedDateTasks(tasks)
        } catch (error) {
          console.error('Error loading tasks:', error)
        }
      } else {
        setTasks({})
        setSelectedDateTasks([])
      }
    }
    loadTasks()
  }, [calendarDate, currentUser])

  // Handle date change
  const handleDateChange = async (date) => {
    const localDate = new Date(date)
    localDate.setHours(0, 0, 0, 0)
    setCalendarDate(localDate)

    if (currentUser) {
      try {
        const dateKey = formatDate(localDate)
        const tasks = await taskService.getTasks(currentUser.uid, dateKey)
        setTasks(prev => ({
          ...prev,
          [dateKey]: tasks
        }))
        setSelectedDateTasks(tasks)
      } catch (error) {
        console.error('Error loading tasks:', error)
        setSelectedDateTasks([])
      }
    }
  }

  // Handle edit task
  const handleEditTask = (task) => {
    if (!task || !task._id) {
      console.error('Invalid task data:', task)
      return
    }

    const taskDate = new Date(task.date)
    setSelectedDate(taskDate)
    setCalendarDate(taskDate)
    
    setNewTask(task.title)
    setTaskTime(task.time)
    setPriority(task.priority || 'low')
    
    setEditingTask({
      _id: task._id,
      userId: task.userId,
      date: taskDate,
      title: task.title,
      time: task.time,
      priority: task.priority || 'low'
    })
    
    setIsTaskModalOpen(true)
  }

  // Handle add/update task
  const handleAddTask = async (e) => {
    e.preventDefault()
    if (newTask.trim() && selectedDate && currentUser) {
      const taskDate = new Date(selectedDate)
      taskDate.setHours(0, 0, 0, 0)
      const dateKey = formatDate(taskDate)
      
      try {
        if (editingTask && editingTask._id) {
          const updatedTask = {
            _id: editingTask._id,
            title: newTask.trim(),
            time: taskTime,
            priority: priority,
            date: taskDate,
            userId: currentUser.uid
          }
          
          const updated = await taskService.updateTask(editingTask._id, updatedTask)
          
          setTasks(prev => {
            const newTasks = { ...prev }
            Object.keys(newTasks).forEach(key => {
              newTasks[key] = newTasks[key].filter(t => t._id !== editingTask._id)
            })
            newTasks[dateKey] = [...(newTasks[dateKey] || []), updated]
            return newTasks
          })
          
          if (dateKey === formatDate(calendarDate)) {
            setSelectedDateTasks(prev => {
              const filtered = prev.filter(t => t._id !== editingTask._id)
              return [...filtered, updated]
            })
          }
        } else {
          const newTaskItem = {
            title: newTask.trim(),
            time: taskTime,
            priority: priority,
            date: taskDate,
            userId: currentUser.uid
          }
          
          const created = await taskService.createTask(newTaskItem)
          
          setTasks(prev => ({
            ...prev,
            [dateKey]: [...(prev[dateKey] || []), created]
          }))
          
          if (dateKey === formatDate(calendarDate)) {
            setSelectedDateTasks(prev => [...prev, created])
          }
        }
        
        setNewTask('')
        setTaskTime('09:00')
        setPriority('low')
        setEditingTask(null)
        setIsTaskModalOpen(false)
      } catch (error) {
        console.error('Error saving task:', error)
      }
    }
  }

  // Handle delete task
  const handleDeleteTask = async (taskId, dateKey) => {
    try {
      await taskService.deleteTask(taskId)
      
      setTasks(prev => ({
        ...prev,
        [dateKey]: prev[dateKey].filter(task => task._id !== taskId)
      }))
      setSelectedDateTasks(prev => prev.filter(task => task._id !== taskId))
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  // Custom tile content for calendar
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateKey = formatDate(date);
      const taskCount = tasks[dateKey]?.length || 0;
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      
      if (taskCount > 0) {
        // Get indicator style based on task count
        const getIndicatorStyle = (count) => {
          if (count >= 5) return 'bg-error-500';
          if (count >= 3) return 'bg-warning-500';
          return 'bg-success-500';
        };

        return (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
            {[...Array(Math.min(taskCount, 3))].map((_, index) => (
              <div
                key={index}
                className={`
                  h-1 w-1
                  rounded-full
                  ${isToday ? 'bg-white' : getIndicatorStyle(taskCount)}
                  ${taskCount >= 3 && index === 2 ? 'opacity-100' : 'opacity-80'}
                `}
              />
            ))}
          </div>
        );
      }
    }
    return null;
  };

  // Get modal title
  const getModalTitle = () => {
    return editingTask ? 'Edit Task' : 'Add New Task'
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToolSelect = (toolId) => {
    setActiveTool(toolId)
    setIsDropdownOpen(false)
  }

  const getCurrentTool = () => {
    return TOOLS_OPTIONS.find(tool => tool.id === activeTool)
  }

  return (
    <>
      <AnimatePresence>
        {isToolbarOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsToolbarOpen(false)}
            />

            {/* Toolbar */}
            <motion.div 
              className="fixed top-[70px] right-0 h-[calc(100vh-70px)] bg-white/95 
                backdrop-blur-md shadow-2xl border-l border-gray-100 z-40"
              style={{
                width: window.innerWidth <= 768 ? '100%' : 
                       window.innerWidth <= 1024 ? '45%' : 
                       window.innerWidth <= 1200 ? '40%' : 
                       window.innerWidth <= 1440 ? '35%' : '30%'
              }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {/* Tools Header - Positioned absolutely at the top */}
              <div className="absolute top-0 left-0 right-0 px-8 py-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🛠️</span>
                    <h3 className="text-2xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 text-transparent bg-clip-text">
                      Student Tools
                    </h3>
                  </div>
                  <motion.button 
                    className="lg:hidden w-10 h-10 flex items-center justify-center text-2xl text-gray-400 
                      hover:text-gray-600 hover:bg-gray-100/80 rounded-xl transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsToolbarOpen(false)}
                  >
                    ×
                  </motion.button>
                </div>
                <p className="text-sm text-gray-500">Manage your academic tasks and tools</p>
              </div>

              {/* Main Content Container */}
              <div className="flex flex-col h-full pt-[140px]"> {/* Increased padding to account for header height */}
                {/* Tools Navigation */}
                <div className="px-6 py-4 bg-gray-50/50" ref={dropdownRef}>
                  <div className="relative">
                    <motion.button 
                      className="w-full px-4 py-3 flex items-center justify-between bg-white 
                        hover:bg-gray-50/80 rounded-xl transition-all border border-gray-100/50
                        shadow-sm hover:shadow-md"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getCurrentTool().icon}</span>
                        <span className="font-medium text-gray-700">{getCurrentTool().name}</span>
                      </div>
                      <motion.span 
                        className="text-gray-400"
                        animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        ▼
                      </motion.span>
                    </motion.button>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div 
                          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl 
                            shadow-lg border border-gray-100/50 overflow-hidden backdrop-blur-sm z-10"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          {TOOLS_OPTIONS.map(tool => (
                            <motion.button
                              key={tool.id}
                              className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50/80 
                                transition-all ${tool.id === activeTool ? 'bg-primary/5 text-primary' : 'text-gray-700'}`}
                              onClick={() => handleToolSelect(tool.id)}
                              whileHover={{ x: 4 }}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{tool.icon}</span>
                                <span>{tool.name}</span>
                              </div>
                              {tool.id === activeTool && (
                                <motion.span 
                                  className="text-primary"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                >
                                  ✓
                                </motion.span>
                              )}
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Tool Content */}
                <div className="flex-1 overflow-auto px-6 pb-6 bg-gradient-to-b from-gray-50/50 to-white">
                  {activeTool === 'calendar' ? (
                    <div className="space-y-6">
                      {/* Add Task Button */}
                      <motion.button 
                        className="fixed right-8 top-[100px] w-14 h-14 bg-gradient-to-r from-primary-600 to-primary-500 
                          text-white rounded-full shadow-lg flex items-center justify-center text-2xl 
                          hover:shadow-primary/30 hover:shadow-xl transition-all duration-300 z-50"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setSelectedDate(calendarDate)
                          setEditingTask(null)
                          setIsTaskModalOpen(true)
                        }}
                        title="Add Task"
                      >
                        <span className="text-2xl font-light">+</span>
                      </motion.button>

                      {/* Calendar Section */}
                      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100/50 p-6 -mx-6">
                        <div className="w-full">
                          <Calendar
                            onChange={handleDateChange}
                            value={calendarDate}
                            className="custom-calendar"
                            tileContent={tileContent}
                          />
                        </div>
                      </div>

                      {/* Tasks List */}
                      <div className="space-y-3 mt-8 px-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Tasks for {calendarDate.toLocaleDateString('en-US', { 
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        <div className="space-y-2">
                          {selectedDateTasks.length > 0 ? (
                            selectedDateTasks.map(task => (
                              <motion.div
                                key={task._id}
                                className={`p-4 bg-white rounded-xl border border-gray-100 shadow-sm
                                  hover:shadow-md transition-all`}
                                whileHover={{ scale: 1.01 }}
                                layout
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                                    <p className="text-sm text-gray-500 mt-1">{formatTime(task.time)}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <motion.button 
                                      className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10
                                        rounded-lg transition-colors"
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => handleEditTask(task)}
                                    >
                                      ✏️
                                    </motion.button>
                                    <motion.button 
                                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50
                                        rounded-lg transition-colors"
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => handleDeleteTask(task._id, formatDate(calendarDate))}
                                    >
                                      🗑️
                                    </motion.button>
                                  </div>
                                </div>
                                <div className={`mt-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                                  ${task.priority === 'high' ? 'bg-red-50 text-red-700' :
                                    task.priority === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                                    'bg-green-50 text-green-700'}`}
                                >
                                  {getPriorityLabel(task.priority)} Priority
                                </div>
                              </motion.div>
                            ))
                          ) : (
                            <div className="text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                              <div className="flex flex-col items-center">
                                <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-2xl text-primary">📝</span>
                                </div>
                                <p className="text-gray-500 mb-6">No tasks scheduled for this day</p>
                                <motion.button 
                                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 
                                    text-white rounded-full hover:shadow-lg hover:shadow-primary/30 
                                    transition-all duration-300"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    setSelectedDate(calendarDate)
                                    setIsTaskModalOpen(true)
                                  }}
                                >
                                  <span className="flex items-center gap-2">
                                    <span className="text-lg font-light">+</span>
                                    <span>Add Your First Task</span>
                                  </span>
                                </motion.button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full rounded-xl overflow-hidden border border-gray-100/50 bg-white">
                      <iframe
                        src="https://www.mathway.com/algebra"
                        title="Mathway Calculator"
                        className="w-full h-full border-0"
                        loading="lazy"
                        allow="clipboard-write"
                        referrerPolicy="strict-origin-when-cross-origin"
                      />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Task Modal */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <motion.div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center 
              justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsTaskModalOpen(false)
              setEditingTask(null)
              setNewTask('')
              setTaskTime('09:00')
              setPriority('low')
            }}
          >
            <motion.div 
              className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100/50"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{getModalTitle()}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedDate?.toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <motion.button 
                    className="w-10 h-10 flex items-center justify-center text-2xl text-gray-400 
                      hover:text-gray-600 hover:bg-gray-100/80 rounded-lg transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setIsTaskModalOpen(false)
                      setEditingTask(null)
                      setNewTask('')
                      setTaskTime('09:00')
                      setPriority('low')
                    }}
                  >
                    ×
                  </motion.button>
                </div>
              </div>

              <form onSubmit={handleAddTask} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 
                      focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="Enter task title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={taskTime}
                    onChange={(e) => setTaskTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 
                      focus:ring-primary/20 focus:border-primary transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <div className="flex gap-3">
                    {PRIORITY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPriority(option.value)}
                        className={`flex-1 px-4 py-2.5 rounded-xl border transition-all
                          ${priority === option.value
                            ? option.value === 'high'
                              ? 'bg-error-50 border-error-200 text-error-700'
                              : option.value === 'medium'
                                ? 'bg-warning-50 border-warning-200 text-warning-700'
                                : 'bg-success-50 border-success-200 text-success-700'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }
                        `}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <motion.button 
                    type="button" 
                    className="px-6 py-2.5 text-gray-700 bg-gray-100/80 hover:bg-gray-200/80 
                      rounded-xl transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setIsTaskModalOpen(false)
                      setEditingTask(null)
                      setNewTask('')
                      setTaskTime('09:00')
                      setPriority('low')
                    }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button 
                    type="submit" 
                    className="px-8 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 
                      text-white rounded-xl hover:shadow-lg hover:shadow-primary/30 
                      transition-all duration-300 font-medium"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!newTask.trim()}
                  >
                    {editingTask ? (
                      <span className="flex items-center gap-2">
                        <span>Update Task</span>
                        <span className="text-lg">→</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>Save Task</span>
                        <span className="text-lg">→</span>
                      </span>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Tools