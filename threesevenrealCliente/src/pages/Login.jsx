import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import AuthFormCard from '../components/ui/AuthFormCard';
import AuthInput from '../components/ui/AuthInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import { t } from '../styles/theme';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', form);
      login({ token: res.data.token, username: res.data.username, playerId: res.data.playerId });
      navigate('/lobby');
    } catch {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <AuthFormCard
      title="Iniciar sesión"
      error={error}
      footer={<>¿No tienes cuenta? <Link to="/register" style={{ color: t.gold }}>Regístrate</Link></>}
    >
      <form onSubmit={handleSubmit} style={s.form}>
        <AuthInput
          placeholder="Usuario"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
        />
        <AuthInput
          type="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
        <PrimaryButton type="submit" fullWidth style={{ marginTop: '0.5rem' }}>
          Entrar
        </PrimaryButton>
      </form>
    </AuthFormCard>
  );
}

const s = {
  form: { display: 'flex', flexDirection: 'column', gap: '0.75rem', fontFamily: t.fontBody },
};