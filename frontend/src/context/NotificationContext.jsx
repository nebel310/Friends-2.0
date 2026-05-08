import { createContext, useContext, useState, useCallback } from 'react'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const showNotification = useCallback((message, type = 'info') => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }, [])

  const dismiss = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div id="notifications">
        {notifications.map(n => (
          <div key={n.id} className={`notification ${n.type}`} onClick={() => dismiss(n.id)}>
            <div className="notification-progress" />
            <button className="notification-close" onClick={(e) => { e.stopPropagation(); dismiss(n.id) }}>&times;</button>
            <div style={{ paddingRight: '30px' }}>{n.message}</div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export const useNotification = () => useContext(NotificationContext)
