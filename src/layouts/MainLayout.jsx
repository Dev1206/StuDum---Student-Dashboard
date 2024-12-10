import Navbar from '../components/Navbar'
import Tools from '../components/Tools'
import { useToolbar } from '../contexts/ToolbarContext'
import { motion } from 'framer-motion'

function MainLayout({ children }) {
  const { isToolbarOpen } = useToolbar()

  return (
    <div className="min-h-screen bg-gray-50">
      <Tools />
      <div className={`flex flex-col min-h-screen transition-all duration-300 ease-out
        ${isToolbarOpen ? 'lg:mr-[45%] xl:mr-[40%] 2xl:mr-[35%]' : ''}`}
      >
        <Navbar />
        <motion.main 
          className="flex-1 px-4 py-8 lg:px-8 mt-[70px] pb-32"
          layout
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}

export default MainLayout 