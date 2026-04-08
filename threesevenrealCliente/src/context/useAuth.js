import { useContext } from 'react';
import { AuthContext } from './AuthContextImpl.js';

export const useAuth = () => useContext(AuthContext);
