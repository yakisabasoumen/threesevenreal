import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Lobby from './pages/Lobby';
import Blackjack from './pages/Blackjack';
import ThreeSeven from './pages/ThreeSeven';
import Poker from './pages/Poker';
import Profile from './pages/Profile';
import Ranking from './pages/Ranking';
import OnlineGame from './pages/OnlineGame';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/lobby" element={<PrivateRoute><Lobby /></PrivateRoute>} />
      <Route path="/blackjack" element={<PrivateRoute><Blackjack /></PrivateRoute>} />
      <Route path="/threeseven" element={<PrivateRoute><ThreeSeven /></PrivateRoute>} />
      <Route path="/poker" element={<PrivateRoute><Poker /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/ranking" element={<PrivateRoute><Ranking /></PrivateRoute>} />
      <Route path="/:gameType/online" element={<PrivateRoute><OnlineGame /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/lobby" />} />
    </Routes>
  );
}