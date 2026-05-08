import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import PrivateRoute from './components/PrivateRoute'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Friends from './pages/Friends'
import FriendRequests from './pages/FriendRequests'
import Users from './pages/Users'
import Profile from './pages/Profile'
import Challenges from './pages/Challenges'
import ChallengeDetail from './pages/ChallengeDetail'
import CreateChallenge from './pages/CreateChallenge'
import Admin from './pages/Admin'
import IndexRedirect from './pages/IndexRedirect'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/" element={<IndexRedirect />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/friends" element={<PrivateRoute><Friends /></PrivateRoute>} />
            <Route path="/friend-requests" element={<PrivateRoute><FriendRequests /></PrivateRoute>} />
            <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/challenges" element={<PrivateRoute><Challenges /></PrivateRoute>} />
            <Route path="/challenges/create" element={<PrivateRoute><CreateChallenge /></PrivateRoute>} />
            <Route path="/challenges/:id" element={<PrivateRoute><ChallengeDetail /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
