import { createContext, useContext, useState } from 'react'

const ToolbarContext = createContext()

export function useToolbar() {
  return useContext(ToolbarContext)
}

export function ToolbarProvider({ children }) {
  const [isToolbarOpen, setIsToolbarOpen] = useState(false)

  const value = {
    isToolbarOpen,
    setIsToolbarOpen
  }

  return (
    <ToolbarContext.Provider value={value}>
      {children}
    </ToolbarContext.Provider>
  )
}
