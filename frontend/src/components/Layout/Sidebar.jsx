import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [incomingCount, setIncomingCount] = useState(0);
  const [outgoingCount, setOutgoingCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);

  useEffect(() => {
    loadCounts();
    
    const interval = setInterval(loadCounts, 5000);
    
    // Слушаем изменения в localStorage
    const handleStorageChange = () => {
      loadCounts();
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [location]);

  const loadCounts = async () => {
    try {
      const requests = await apiService.getFriendRequests();
      setIncomingCount(requests?.length || 0);
      
      const allOutgoingRequests = JSON.parse(localStorage.getItem('outgoingRequests') || '[]');
      // Считаем только заявки от текущего пользователя
      const userOutgoingRequests = allOutgoingRequests.filter(request => 
        request.sender === user?.username
      );
      setOutgoingCount(userOutgoingRequests.length);
      
      const friends = await apiService.getFriends();
      setFriendsCount(friends?.length || 0);
      
    } catch (error) {
      console.error('Failed to load counts:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="sidebar">
      <div className="logo">
        <span className="logo-icon">🤝</span>
        <span>Friends</span>
      </div>

      <div className="nav-section">
        <div className="nav-title">Основное</div>
        <Link 
          to="/dashboard" 
          className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
        >
          <div className="nav-icon">🏠</div>
          <span>Мои пары</span>
          {friendsCount > 0 && (
            <span className="notification-badge" style={{ background: 'var(--success)' }}>
              {friendsCount}
            </span>
          )}
        </Link>
        <Link 
          to="/challenges" 
          className={`nav-item ${isActive('/challenges') ? 'active' : ''}`}
        >
          <div className="nav-icon">🏆</div>
          <span>Челленджи</span>
        </Link>
        <Link 
          to="/archive" 
          className={`nav-item ${isActive('/archive') ? 'active' : ''}`}
        >
          <div className="nav-icon">📊</div>
          <span>Общий архив</span>
        </Link>
      </div>

      <div className="nav-section">
        <div className="nav-title">Заявки</div>
        <Link 
          to="/incoming" 
          className={`nav-item ${isActive('/incoming') ? 'active' : ''}`}
        >
          <div className="nav-icon">📥</div>
          <span>Входящие</span>
          {incomingCount > 0 && (
            <span className="notification-badge">
              {incomingCount}
            </span>
          )}
        </Link>
        <Link 
          to="/outgoing" 
          className={`nav-item ${isActive('/outgoing') ? 'active' : ''}`}
        >
          <div className="nav-icon">📤</div>
          <span>Исходящие</span>
          {outgoingCount > 0 && (
            <span className="notification-badge">
              {outgoingCount}
            </span>
          )}
        </Link>
      </div>

      <div className="nav-section">
        <Link 
          to="/login" 
          className="nav-item" 
          onClick={handleLogout}
        >
          <div className="nav-icon">🚪</div>
          <span>Выйти</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;