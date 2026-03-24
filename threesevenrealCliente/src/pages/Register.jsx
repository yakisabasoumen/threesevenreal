import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import AuthFormCard from '../components/ui/AuthFormCard';
import AuthInput from '../components/ui/AuthInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import { t } from '../styles/theme';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrarse');
    }
  };

  return (
    <AuthFormCard
      title="Crear cuenta"
      error={error}
      footer={<>¿Ya tienes cuenta? <Link to="/login" style={{ color: t.gold }}>Inicia sesión</Link></>}
    >
      <form onSubmit={handleSubmit} style={s.form}>
        <AuthInput
          placeholder="Usuario (3-20 caracteres)"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
        />
        <AuthInput
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
        <AuthInput
          type="password"
          placeholder="Contraseña (mínimo 6 caracteres)"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
        <PrimaryButton type="submit" fullWidth style={{ marginTop: '0.5rem' }}>
          Crear cuenta
        </PrimaryButton>
      </form>
    </AuthFormCard>
  );
}

const s = {
  form: { display: 'flex', flexDirection: 'column', gap: '0.75rem', fontFamily: t.fontBody },
};