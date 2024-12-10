import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToolbarProvider } from './contexts/ToolbarContext'
import { MusicPlayerProvider } from './contexts/MusicPlayerContext'
import MiniPlayer from './components/MiniPlayer'
import PrivateRoute from './components/PrivateRoute'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import HomePage from './pages/HomePage'
import AssignmentsPage from './pages/AssignmentsPage'
import CoursesPage from './pages/CoursesPage'
import CourseDetailsPage from './pages/CourseDetailsPage'
import ConnectPage from './pages/ConnectPage'
import ProfilePage from './pages/ProfilePage'
import { useAuth } from './contexts/AuthContext'

// Create a wrapper component for MiniPlayer
const MiniPlayerWrapper = () => {
  const { currentUser } = useAuth();
  
  if (!currentUser) return null;
  
  return <MiniPlayer />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToolbarProvider>
          <MusicPlayerProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
              <Route path="/assignments" element={<PrivateRoute><AssignmentsPage /></PrivateRoute>} />
              <Route path="/courses" element={<PrivateRoute><CoursesPage /></PrivateRoute>} />
              <Route path="/courses/:courseId" element={<PrivateRoute><CourseDetailsPage /></PrivateRoute>} />
              <Route path="/connect" element={<PrivateRoute><ConnectPage /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
              <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
            </Routes>
            <MiniPlayerWrapper />
          </MusicPlayerProvider>
        </ToolbarProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
