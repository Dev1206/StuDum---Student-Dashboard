import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/taskService';
import MainLayout from '../layouts/MainLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaGraduationCap, FaBook, FaTasks, FaBell, 
  FaCalendarAlt, FaChartLine, FaStopwatch, FaRocket,
  FaRegClock, FaRegCalendarCheck, FaRegLightbulb,
  FaCheckCircle, FaHourglassHalf, FaExclamationCircle,
  FaChartBar, FaCalendarDay, FaSync, FaSearch, FaPlay, FaPause, FaMusic, FaPlus, FaHeart
} from 'react-icons/fa';
import { H1, H2, H3, Body1, Body2, Caption } from '../components/ui/Typography';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Container from '../components/ui/Container';
import Button from '../components/ui/Button';
import { useToolbar } from '../contexts/ToolbarContext';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { musicService } from '../services/musicService';

// New TimeDisplay component
const TimeDisplay = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="w-full lg:w-auto flex items-center justify-between lg:justify-start gap-4 bg-white/80 
        backdrop-blur-lg rounded-2xl p-4 shadow-lg"
    >
      <div className="text-center min-w-[100px]">
        <Caption className="text-gray-500 mb-1">Time</Caption>
        <H2 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </H2>
      </div>
      <div className="h-12 w-px bg-gray-200 shrink-0"></div>
      <div className="text-center min-w-[100px]">
        <Caption className="text-gray-500 mb-1">Date</Caption>
        <H2 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">
          {currentTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}
        </H2>
      </div>
    </motion.div>
  );
};

function HomePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [dailyGoal] = useState(3);
  const [completedToday, setCompletedToday] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [todayTasks, setTodayTasks] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { setIsToolbarOpen } = useToolbar();
  const [firstName, setFirstName] = useState('');
  const [recentActivity, setRecentActivity] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { 
    currentSong,
    isPlaying,
    playSong,
    togglePlayPause
  } = useMusicPlayer();
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        setError(null);

        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayKey = today.toISOString().split('T')[0];

        // Get tomorrow's date
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowKey = tomorrow.toISOString().split('T')[0];

        // Fetch tasks for today and tomorrow
        const todayResult = await taskService.getTasks(currentUser.uid, todayKey);
        const tomorrowResult = await taskService.getTasks(currentUser.uid, tomorrowKey);

        // Set today's tasks
        setTodayTasks(todayResult.sort((a, b) => a.time.localeCompare(b.time)));
        
        // Set upcoming (tomorrow's) tasks
        setUpcomingTasks(tomorrowResult.sort((a, b) => a.time.localeCompare(b.time)));

        // Count completed tasks for today
        const completed = todayResult.filter(task => task.status === 'completed').length;
        setCompletedToday(completed);

      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [currentUser, refreshKey]);

  // Timer functionality
  useEffect(() => {
    let interval;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  const startTimer = () => {
    setTimer(selectedDuration * 60);
    setIsTimerActive(true);
  };

  const stopTimer = () => {
    setIsTimerActive(false);
  };

  const resetTimer = () => {
    setTimer(selectedDuration * 60);
    setIsTimerActive(false);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = (completedToday / dailyGoal) * 100;

  const handleCompleteTask = async (taskId) => {
    try {
      // Update task status to completed
      await taskService.updateTask(taskId, { status: 'completed' });
      
      // Update local state
      setTodayTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId 
            ? { ...task, status: 'completed' }
            : task
        )
      );
      
      setUpcomingTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId 
            ? { ...task, status: 'completed' }
            : task
        )
      );

      // Update completed count
      setCompletedToday(prev => Math.min(prev + 1, dailyGoal));
    } catch (error) {
      console.error('Error completing task:', error);
      setError('Failed to complete task');
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  const LoadingState = () => (
    <div className="flex items-center justify-center p-6">
      <div className="flex space-x-2 animate-pulse">
        <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
        <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
        <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-6">
      <Caption className="text-gray-500">No tasks found</Caption>
    </div>
  );

  const formatTaskTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getPriorityColor = (priority) => {
    const priorityValue = priority?.toLowerCase() || 'low';
    switch (priorityValue) {
      case 'high':
        return 'bg-error-50 text-error-700';
      case 'medium':
        return 'bg-warning-50 text-warning-700';
      default:
        return 'bg-success-50 text-success-700';
    }
  };

  const handleViewCalendar = () => {
    setIsToolbarOpen(true);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setShowSuggestions(false);
    try {
      const results = await musicService.searchSongs(searchQuery);
      setSearchResults(results.slice(0, 5));
    } catch (error) {
      console.error('Error searching songs:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSearchInput = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.length >= 2) {
      // Set new timeout for suggestions
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await musicService.getSuggestions(value);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error getting suggestions:', error);
        }
      }, 300); // 300ms debounce
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const TaskList = ({ tasks, isToday }) => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="flex space-x-2 animate-pulse">
            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-6">
          <Caption className="text-error-500">{error}</Caption>
        </div>
      );
    }

    if (!tasks.length) {
      return (
        <div className="text-center py-6">
          <Caption className="text-gray-500">No tasks scheduled</Caption>
        </div>
      );
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <Caption className="text-gray-500">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} scheduled
          </Caption>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
          >
            <motion.div
              animate={{ rotate: refreshKey * 360 }}
              transition={{ duration: 0.5 }}
            >
              <FaSync className="w-4 h-4" />
            </motion.div>
          </Button>
        </div>
        
        <div className="space-y-3">
          {tasks.map(task => (
            <motion.div
              key={task._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 
                shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {task.status === 'completed' ? (
                      <FaCheckCircle className="w-5 h-5 text-success-500" />
                    ) : task.priority === 'high' ? (
                      <FaExclamationCircle className="w-5 h-5 text-error-500" />
                    ) : (
                      <FaHourglassHalf className="w-5 h-5 text-warning-500" />
                    )}
                    <span className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {task.title}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {formatTaskTime(task.time)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                      {(task.priority || 'low').charAt(0).toUpperCase() + (task.priority || 'low').slice(1)}
                    </span>
                  </div>
                </div>
                {isToday && task.status !== 'completed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-success-600 hover:text-success-700 hover:bg-success-50"
                    onClick={() => handleCompleteTask(task._id)}
                  >
                    Complete
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        <Button
          variant="ghost"
          className="w-full mt-4 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
          onClick={handleViewCalendar}
        >
          View Calendar →
        </Button>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-primary-50">
        {/* Existing background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-gradient-to-br from-primary-100/30 to-transparent rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] bg-gradient-to-tl from-success-100/30 to-transparent rounded-full blur-[120px] animate-pulse delay-1000"></div>
        </div>

        <Container className="py-8 relative">
          {/* Existing Welcome Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6 mb-8 lg:mb-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full lg:w-auto"
            >
              <H1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 lg:mb-3 bg-gradient-to-r from-gray-900 to-gray-700 text-transparent bg-clip-text">
                Welcome back, {currentUser?.displayName || 'Student'} 👋
              </H1>
              <Body1 className="text-gray-600">Let's make today extraordinary</Body1>
            </motion.div>
            
            <TimeDisplay />
          </div>

          {/* Existing Quick Stats Grid */}
          <motion.div 
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 lg:mb-12"
          >
            {[
              {
                icon: <FaGraduationCap className="w-6 h-6" />,
                title: "Courses",
                caption: "Active Courses",
                route: "/courses",
                gradient: "from-primary-500 to-primary-600",
                hoverGradient: "hover:from-primary-600 hover:to-primary-700",
                iconBg: "bg-primary-100",
                iconColor: "text-primary-600"
              },
              {
                icon: <FaTasks className="w-6 h-6" />,
                title: "Assignments",
                caption: "Tasks & Deadlines",
                route: "/assignments",
                gradient: "from-success-500 to-success-600",
                hoverGradient: "hover:from-success-600 hover:to-success-700",
                iconBg: "bg-success-100",
                iconColor: "text-success-600"
              },
              {
                icon: <FaBook className="w-6 h-6" />,
                title: "PDF Tools",
                caption: "Document Tools",
                route: "/assignments",
                gradient: "from-warning-500 to-warning-600",
                hoverGradient: "hover:from-warning-600 hover:to-warning-700",
                iconBg: "bg-warning-100",
                iconColor: "text-warning-600"
              },
              {
                icon: <FaRocket className="w-6 h-6" />,
                title: "Connect",
                caption: "Student Community",
                route: "/connect",
                gradient: "from-error-500 to-error-600",
                hoverGradient: "hover:from-error-600 hover:to-error-700",
                iconBg: "bg-error-100",
                iconColor: "text-error-600"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { y: 20, opacity: 0 },
                  visible: {
                    y: 0,
                    opacity: 1,
                    transition: {
                      type: "spring",
                      stiffness: 100
                    }
                  }
                }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <Link
                  to={item.route}
                  className="block h-full p-6 bg-white rounded-2xl border border-gray-100 
                    hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex flex-col h-full">
                    <div className={`w-12 h-12 ${item.iconBg} ${item.iconColor} rounded-xl 
                      flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">{item.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{item.caption}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Task Overview Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-8 lg:mb-12"
          >
            {/* Today's Tasks */}
            <Card className="bg-white/80 backdrop-blur-lg border border-gray-100 hover:border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning-100 text-warning-600 rounded-lg">
                    <FaCalendarDay className="w-5 h-5" />
                  </div>
                  <div>
                    <H3>Today's Tasks</H3>
                    <Caption className="text-gray-500">
                      {todayTasks.length} task{todayTasks.length !== 1 ? 's' : ''} scheduled
                    </Caption>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TaskList tasks={todayTasks} isToday={true} />
                
              </CardContent>
            </Card>

            {/* Upcoming Tasks */}
            <Card className="bg-white/80 backdrop-blur-lg border border-gray-100 hover:border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success-100 text-success-600 rounded-lg">
                    <FaCalendarAlt className="w-5 h-5" />
                  </div>
                  <div>
                    <H3>Upcoming Tasks</H3>
                    <Caption className="text-gray-500">
                      {upcomingTasks.length} task{upcomingTasks.length !== 1 ? 's' : ''} tomorrow
                    </Caption>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TaskList tasks={upcomingTasks} isToday={false} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Tools Section */}
          <motion.div 
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6"
          >
            {/* Study Timer */}
            <motion.div 
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: {
                  y: 0,
                  opacity: 1,
                  transition: {
                    type: "spring",
                    stiffness: 100
                  }
                }
              }}
              className="lg:col-span-1"
            >
              <Card className="bg-white/80 backdrop-blur-lg border border-gray-100 hover:border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                      <FaStopwatch className="w-5 h-5" />
                    </div>
                    <div>
                      <H3>Focus Timer</H3>
                      <Caption className="text-gray-500">Stay productive</Caption>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <motion.div 
                      className="text-4xl sm:text-5xl lg:text-6xl font-bold my-6 lg:my-8 font-mono bg-gradient-to-r from-primary-50 to-primary-100/50 py-6 lg:py-8 rounded-2xl text-gray-900"
                      animate={{ 
                        scale: isTimerActive ? [1, 1.02, 1] : 1,
                        opacity: isTimerActive ? [1, 0.8, 1] : 1
                      }}
                      transition={{ repeat: isTimerActive ? Infinity : 0, duration: 2 }}
                    >
                      {formatTime(timer)}
                    </motion.div>
                    <div className="flex justify-center gap-2 sm:gap-3 mb-4 lg:mb-6">
                      {[25, 45, 60].map((duration) => (
                        <motion.div key={duration} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant={selectedDuration === duration ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setSelectedDuration(duration)}
                            className={`transition-all duration-300 ${
                              selectedDuration === duration 
                                ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md' 
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {duration}m
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        {!isTimerActive ? (
                          <Button 
                            variant="primary" 
                            className="px-8 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
                            onClick={startTimer}
                          >
                            Start Focus
                          </Button>
                        ) : (
                          <Button 
                            variant="error" 
                            className="px-8 bg-gradient-to-r from-error-600 to-error-500 hover:from-error-700 hover:to-error-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
                            onClick={stopTimer}
                          >
                            Take Break
                          </Button>
                        )}
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          variant="secondary"
                          onClick={resetTimer}
                          className="bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all duration-300"
                        >
                          Reset
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Tools */}
            <motion.div 
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: {
                  y: 0,
                  opacity: 1,
                  transition: {
                    type: "spring",
                    stiffness: 100
                  }
                }
              }}
              className="lg:col-span-2"
            >
              <Card className="bg-white/80 backdrop-blur-lg border border-gray-100 hover:border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-success-100 text-success-600 rounded-lg">
                      <FaRegLightbulb className="w-5 h-5" />
                    </div>
                    <div>
                      <H3>Quick Access</H3>
                      <Caption className="text-gray-500">Frequently used tools</Caption>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 lg:gap-4">
                    {[
                      {
                        icon: <FaBook />,
                        title: "PDF Tools",
                        route: "/assignments",
                        gradient: "from-primary-50 to-primary-100",
                        iconColor: "text-primary-500",
                        description: "Convert & Edit PDFs"
                      },
                      {
                        icon: <FaRocket />,
                        title: "Connect",
                        route: "/connect",
                        gradient: "from-success-50 to-success-100",
                        iconColor: "text-success-500",
                        description: "Chat with Students"
                      },
                      {
                        icon: <FaTasks />,
                        title: "Assignments",
                        route: "/assignments",
                        gradient: "from-warning-50 to-warning-100",
                        iconColor: "text-warning-500",
                        description: "Manage Tasks"
                      }
                    ].map((tool, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="ghost"
                          className="w-full h-full flex flex-col items-center p-6 rounded-xl 
                            bg-white border border-gray-100 hover:border-gray-200 
                            hover:shadow-lg transition-all duration-300"
                          onClick={() => navigate(tool.route)}
                        >
                          <div className={`w-16 h-16 bg-gradient-to-br ${tool.gradient} rounded-xl 
                            flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                            <div className={`text-2xl ${tool.iconColor}`}>{tool.icon}</div>
                          </div>
                          <Body2 className="font-medium text-gray-900 mb-1 line-clamp-1 w-full text-center">
                            {tool.title}
                          </Body2>
                          <Caption className="text-gray-500 line-clamp-2 w-full text-center">
                            {tool.description}
                          </Caption>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Music Player Section */}
          <div className="py-12 space-y-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <H2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 text-transparent bg-clip-text">
                  Study Music
                </H2>
                <Body1 color="secondary">Find the perfect music to boost your focus</Body1>
              </div>
            </div>

            <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-xl">
              <CardContent className="space-y-8">
                {/* Search Bar */}
                <div className="relative">
                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Search for music..."
                        value={searchQuery}
                        onChange={handleSearchInput}
                        onKeyPress={handleKeyPress}
                        onBlur={() => {
                          if (searchResults.length === 0) {
                            setTimeout(() => setShowSuggestions(false), 200);
                          }
                        }}
                        className="w-full px-6 py-4 pr-12 rounded-2xl border border-gray-200 
                          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                          placeholder:text-gray-400 text-gray-600"
                      />
                      <FaSearch className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <Button
                      variant="primary"
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="px-8 bg-gradient-to-r from-primary-600 to-primary-500 text-white
                        rounded-2xl hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                    >
                      Search
                    </Button>
                  </div>

                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                      {suggestions.map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className="px-6 py-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0
                            transition-colors duration-200"
                          onClick={() => {
                            setSearchQuery(suggestion.title);
                            setShowSuggestions(false);
                            playSong(suggestion);
                          }}
                        >
                          <div className="font-medium text-gray-900">{suggestion.title}</div>
                          <div className="text-sm text-gray-500">{suggestion.artist}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <H2 className="text-xl font-semibold text-gray-900">Top Results</H2>
                        <Caption className="text-gray-500">
                          Top {Math.min(5, searchResults.length)} songs for "{searchQuery}"
                        </Caption>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSearchResults([]);
                          setSearchQuery('');
                        }}
                        className="text-sm px-4 py-2 text-gray-600 hover:text-gray-900"
                      >
                        Clear Results
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {searchResults.slice(0, 5).map((song, index) => (
                        <motion.div
                          key={song.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <div
                            onClick={() => playSong(song)}
                            className="group relative flex items-center gap-4 p-4 rounded-2xl bg-white hover:bg-gray-50 
                              border border-gray-100 hover:border-primary-100 cursor-pointer transition-all duration-300
                              hover:shadow-lg hover:-translate-y-1"
                          >
                            {/* Thumbnail or Play Button */}
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-primary-50 flex-shrink-0">
                              {song.thumbnail ? (
                                <img 
                                  src={song.thumbnail} 
                                  alt={song.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <FaMusic className="w-6 h-6 text-primary-400" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 
                                group-hover:opacity-100 transition-opacity duration-300">
                                {currentSong?.id === song.id && isPlaying ? (
                                  <FaPause className="w-6 h-6 text-white" />
                                ) : (
                                  <FaPlay className="w-6 h-6 text-white" />
                                )}
                              </div>
                            </div>

                            {/* Song Info */}
                            <div className="flex-grow min-w-0">
                              <h3 className="font-medium text-gray-900 truncate group-hover:text-primary-600 
                                transition-colors duration-200">
                                {song.title}
                              </h3>
                              <p className="text-sm text-gray-500 truncate">{song.artist}</p>
                            </div>

                            {/* Right Side Info */}
                            <div className="flex items-center gap-4 flex-shrink-0">
                              {/* Duration */}
                              {song.duration && (
                                <div className="text-sm text-gray-500 hidden sm:block">
                                  {song.duration}
                                </div>
                              )}

                              {/* Playing Indicator */}
                              {currentSong?.id === song.id && (
                                <div className="flex gap-1 items-center">
                                  <div className="w-1 h-4 bg-primary-500 rounded-full animate-pulse"></div>
                                  <div className="w-1 h-6 bg-primary-500 rounded-full animate-pulse delay-75"></div>
                                  <div className="w-1 h-4 bg-primary-500 rounded-full animate-pulse delay-150"></div>
                                </div>
                              )}
                            </div>

                            {/* Playing Status Indicator */}
                            {currentSong?.id === song.id && (
                              <div className="absolute -left-px top-0 bottom-0 w-1 bg-primary-500 rounded-l-full"></div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {searchResults.length === 0 && !isSearching && (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-6 bg-primary-50 rounded-full 
                      flex items-center justify-center">
                      <FaMusic className="w-10 h-10 text-primary-400" />
                    </div>
                    <H2 className="text-xl font-semibold text-gray-900 mb-2">
                      Find Your Study Rhythm
                    </H2>
                    <Body1 color="secondary">
                      Search for music to enhance your study session
                    </Body1>
                  </div>
                )}

                {/* Loading State */}
                {isSearching && (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-primary-100 
                      border-t-primary-600 animate-spin" />
                    <Body1 color="secondary">Searching for the perfect study music...</Body1>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </Container>
      </div>
    </MainLayout>
  );
}

export default HomePage;