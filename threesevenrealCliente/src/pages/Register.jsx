import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

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
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>ThreeSevenReal</h1>
        <h2 style={styles.subtitle}>Crear cuenta</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Usuario (3-20 caracteres)"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
          />
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Contraseña (mínimo 6 caracteres)"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
          <button style={styles.button} type="submit">Registrarse</button>
        </form>
        <p style={styles.link}>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
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