import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

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
      login({
        token: res.data.token,
        username: res.data.username,
        playerId: res.data.playerId
      });
      navigate('/lobby');
    } catch (err) {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>ThreeSevenReal</h1>
        <h2 style={styles.subtitle}>Iniciar sesión</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Usuario"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
          <button style={styles.button} type="submit">Entrar</button>
        </form>
        <p style={styles.link}>
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e' },
  card: { background: '#16213e', padding: '2rem', borderRadius: '12px', width: '360px', textAlign: 'center' },
  title: { color: '#4fc3f7', marginBottom: '0.25rem' },
  subtitle: { color: '#aaa', fontWeight: 'normal', marginBottom: '1.5rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  input: { padding: '0.75rem', borderRadius: '8px', border: '1px solid #333', background: '#0f3460', color: '#fff', fontSize: '1rem' },
  button: { padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#4fc3f7', color: '#000', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
  error: { color: '#e74c3c', marginBottom: '1rem' },
  link: { color: '#aaa', marginTop: '1rem' }
};