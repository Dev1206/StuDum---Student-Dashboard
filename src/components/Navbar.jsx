import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { auth } from '../config/firebase'
import { RiHome5Line, RiBookOpenLine, RiFileList3Line, RiTeamLine, RiLogoutBoxRLine, RiToolsLine, RiUserLine } from 'react-icons/ri'
import { useToolbar } from '../contexts/ToolbarContext'
import { motion } from 'framer-motion'

function Navbar() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { isToolbarOpen, setIsToolbarOpen } = useToolbar()

  const handleLogout = async () => {
    try {
      await auth.signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  // Calculate toolbar width based on screen size
  const getToolbarWidth = () => {
    if (window.innerWidth <= 768) return '100%'
    if (window.innerWidth <= 1024) return '45%'
    if (window.innerWidth <= 1200) return '40%'
    if (window.innerWidth <= 1440) return '35%'
    return '30%'
  }

  const navLinks = [
    {
      to: '/',
      icon: <RiHome5Line />,
      text: 'Home',
      gradient: 'from-blue-500 to-blue-600',
      hoverGradient: 'hover:from-blue-600 hover:to-blue-700'
    },
    {
      to: '/courses',
      icon: <RiBookOpenLine />,
      text: 'Courses',
      gradient: 'from-purple-500 to-purple-600',
      hoverGradient: 'hover:from-purple-600 hover:to-purple-700'
    },
    {
      to: '/assignments',
      icon: <RiFileList3Line />,
      text: 'Assignments',
      gradient: 'from-green-500 to-green-600',
      hoverGradient: 'hover:from-green-600 hover:to-green-700'
    },
    {
      to: '/connect',
      icon: <RiTeamLine />,
      text: 'Connect',
      gradient: 'from-yellow-500 to-yellow-600',
      hoverGradient: 'hover:from-yellow-600 hover:to-yellow-700'
    },
    {
      to: '/profile',
      icon: <RiUserLine />,
      text: 'Profile',
      gradient: 'from-pink-500 to-pink-600',
      hoverGradient: 'hover:from-pink-600 hover:to-pink-700'
    }
  ]

  return (
    <nav className="fixed top-0 right-0 left-0 h-[70px] bg-white/80 backdrop-blur-md border-b border-gray-200 z-40
      transition-all duration-300 ease-out shadow-lg
      ${isToolbarOpen ? `pr-[${getToolbarWidth()}]` : ''}"
    >
      <div className="h-full px-4 lg:px-8 mx-auto flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link to="/" className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 
            text-transparent bg-clip-text hover:from-primary-500 hover:to-primary-400 transition-all">
            StuDum
          </Link>
          
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                  ${location.pathname === link.to || 
                    (link.to !== '/' && location.pathname.includes(link.to))
                    ? `bg-gradient-to-r ${link.gradient} text-white shadow-md scale-105` 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                <span className="text-lg">{link.icon}</span>
                {link.text}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium 
              ${isToolbarOpen 
                ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
            onClick={() => setIsToolbarOpen(!isToolbarOpen)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RiToolsLine className={`text-lg transition-transform duration-300 ${isToolbarOpen ? 'rotate-180' : ''}`} />
            Tools
          </motion.button>
          <motion.button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white 
              bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 
              rounded-xl transition-all shadow-md hover:shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RiLogoutBoxRLine className="text-lg" />
            Logout
          </motion.button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 