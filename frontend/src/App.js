import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Archive from './components/Archive';
import IncomingRequests from './components/IncomingRequests';
import OutgoingRequests from './components/OutgoingRequests';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import './App.css';
import Challenges from './components/Challenges/Challenges';
import ChallengeDetail from './components/Challenges/ChallengeDetail';
import ProofsViewer from './components/Challenges/ProofsViewer';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/incoming" element={<IncomingRequests />} />
              <Route path="/outgoing" element={<OutgoingRequests />} />
              <Route path="/challenges" element={<Challenges />} />
              <Route path="/challenge/:id" element={<ChallengeDetail />} />
              <Route path="/challenge/:id/proofs" element={<ProofsViewer />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;