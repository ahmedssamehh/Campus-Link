// Campus Link - Main Application Component
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Home from './pages/home/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Chat from './pages/chat/Chat';
import Groups from './pages/groups/Groups';
import GroupChat from './pages/groups/GroupChat';
import Discussion from './pages/discussion/Discussion';
import QuestionDetails from './pages/discussion/QuestionDetails';
import AskQuestion from './pages/discussion/AskQuestion';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/groups" 
            element={
              <ProtectedRoute>
                <Groups />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/groups/:id" 
            element={
              <ProtectedRoute>
                <GroupChat />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/discussion" 
            element={
              <ProtectedRoute>
                <Discussion />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/discussion/ask" 
            element={
              <ProtectedRoute>
                <AskQuestion />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/discussion/:id" 
            element={
              <ProtectedRoute>
                <QuestionDetails />
              </ProtectedRoute>
            } 
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
