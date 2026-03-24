import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';
import GlobalStyles from './components/ui/GlobalStyles';
import Login from './pages/Login';
import Register from './pages/Register';
import Lobby from './pages/Lobby';
import Blackjack from './pages/Blackjack';
import ThreeSeven from './pages/ThreeSeven';
import Poker from './pages/Poker';
import Profile from './pages/Profile';
import Ranking from './pages/Ranking';
import OnlineGame from './pages/OnlineGame';

export default function App() {
  return (
    <>
      <GlobalStyles />
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/lobby"    element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
        <Route path="/blackjack"  element={<ProtectedRoute><Blackjack /></ProtectedRoute>} />
        <Route path="/threeseven" element={<ProtectedRoute><ThreeSeven /></ProtectedRoute>} />
        <Route path="/poker"    element={<ProtectedRoute><Poker /></ProtectedRoute>} />
        <Route path="/profile"  element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/ranking"  element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
        <Route path="/:gameType/online" element={<ProtectedRoute><OnlineGame /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/lobby" />} />
      </Routes>
    </>
  );
}