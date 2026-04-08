import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import PrimaryButton from '../components/ui/PrimaryButton';
import { t } from '../styles/theme';

const Friends = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('friends');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    loadFriends();
    loadRequests();
  }, []);

  const loadFriends = async () => {
    try {
      const response = await axios.get('/api/friends');
      setFriends(response.data);
    } catch (error) {
      console.error('Error loading friends:', error);
      setStatusMessage('No se pudieron cargar tus amigos. Intenta de nuevo.');
    }
  };

  const loadRequests = async () => {
    try {
      const [receivedRes, sentRes] = await Promise.all([
        axios.get('/api/friends/requests/received'),
        axios.get('/api/friends/requests/sent')
      ]);
      setReceivedRequests(receivedRes.data);
      setSentRequests(sentRes.data);
    } catch (error) {
      console.error('Error loading requests:', error);
      setStatusMessage('No se pudieron cargar las solicitudes. Intenta de nuevo.');
    }
  };

  const searchUsers = async () => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setStatusMessage('Escribe un nombre o usuario para buscar.');
      return;
    }

    try {
      const response = await axios.get(`/api/friends/search?query=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
      setStatusMessage(response.data.length === 0 ? 'No se encontraron usuarios con ese término.' : '');
    } catch (error) {
      console.error('Error searching users:', error);
      setStatusMessage('Hubo un problema con la búsqueda. Intenta de nuevo.');
    }
  };

  const sendFriendRequest = async (receiverId) => {
    try {
      await axios.post('/api/friends/request', { receiverId });
      setStatusMessage('Solicitud enviada correctamente.');
      searchUsers();
      loadRequests();
    } catch (error) {
      const message = error.response?.data || error.message;
      setStatusMessage(`Error: ${message}`);
    }
  };

  const acceptRequest = async (friendshipId) => {
    try {
      await axios.post(`/api/friends/${friendshipId}/accept`);
      setStatusMessage('Solicitud aceptada.');
      loadFriends();
      loadRequests();
    } catch (error) {
      const message = error.response?.data || error.message;
      setStatusMessage(`Error: ${message}`);
    }
  };

  const rejectRequest = async (friendshipId) => {
    try {
      await axios.post(`/api/friends/${friendshipId}/reject`);
      setStatusMessage('Solicitud rechazada.');
      loadRequests();
    } catch (error) {
      const message = error.response?.data || error.message;
      setStatusMessage(`Error: ${message}`);
    }
  };

  const cancelRequest = async (friendshipId) => {
    try {
      await axios.delete(`/api/friends/request/${friendshipId}`);
      setStatusMessage('Solicitud cancelada.');
      loadRequests();
    } catch (error) {
      const message = error.response?.data || error.message;
      setStatusMessage(`Error: ${message}`);
    }
  };

  const removeFriend = async (friendId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar a este amigo?')) return;
    try {
      await axios.delete(`/api/friends/${friendId}`);
      setStatusMessage('Amigo eliminado.');
      loadFriends();
    } catch (error) {
      const message = error.response?.data || error.message;
      setStatusMessage(`Error: ${message}`);
    }
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter') {
      searchUsers();
    }
  };

  const renderUserCard = (user, actions) => (
    <div key={user.id} style={s.card}>
      <div style={s.cardLeft}>
        <div style={s.avatar}>{user.avatarSymbol || '👤'}</div>
        <div>
          <div style={s.cardTitle}>{user.username}</div>
          <div style={s.cardMeta}>Victorias: {user.wins ?? 0} · Derrotas: {user.losses ?? 0}</div>
        </div>
      </div>
      <div style={s.cardActions}>{actions}</div>
    </div>
  );

  return (
    <div style={s.root}>
      <div style={s.heroBar}>
        <div>
          <div style={s.label}>Sistema de Amigos</div>
          <div style={s.subtitle}>Gestiona tus relaciones, encuentra nuevos jugadores y mantén tu sala social activa.</div>
        </div>
        {user?.username && <span style={s.userBadge}>@{user.username}</span>}
      </div>

      <div style={s.tabs}>
        {[
          { key: 'friends', label: 'Amigos' },
          { key: 'received', label: 'Solicitudes Recibidas' },
          { key: 'sent', label: 'Solicitudes Enviadas' },
          { key: 'search', label: 'Buscar Usuarios' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              ...s.tabButton,
              ...(activeTab === tab.key ? s.tabButtonActive : {})
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {statusMessage && <div style={s.statusMessage}>{statusMessage}</div>}

      {activeTab === 'friends' && (
        <section>
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>Amigos</h2>
            <span style={s.countBadge}>{friends.length}</span>
          </div>
          {friends.length === 0 ? (
            <p style={s.emptyText}>Aún no tienes amigos. Busca jugadores y envía una solicitud.</p>
          ) : (
            <div style={s.gridList}>
              {friends.map((friend) => renderUserCard(friend, (
                <PrimaryButton onClick={() => removeFriend(friend.id)} style={s.actionButton}>
                  Eliminar
                </PrimaryButton>
              )))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'received' && (
        <section>
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>Solicitudes Recibidas</h2>
            <span style={s.countBadge}>{receivedRequests.length}</span>
          </div>
          {receivedRequests.length === 0 ? (
            <p style={s.emptyText}>No tienes solicitudes pendientes.</p>
          ) : (
            <div style={s.gridList}>
              {receivedRequests.map((request) => renderUserCard(
                { id: request.senderId, username: request.senderUsername, avatarSymbol: '👤', wins: 0, losses: 0 },
                <div style={s.requestActions}>
                  <PrimaryButton onClick={() => acceptRequest(request.id)} style={s.actionButton}>
                    Aceptar
                  </PrimaryButton>
                  <button onClick={() => rejectRequest(request.id)} style={s.secondaryButton}>
                    Rechazar
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'sent' && (
        <section>
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>Solicitudes Enviadas</h2>
            <span style={s.countBadge}>{sentRequests.length}</span>
          </div>
          {sentRequests.length === 0 ? (
            <p style={s.emptyText}>No tienes solicitudes enviadas pendientes.</p>
          ) : (
            <div style={s.gridList}>
              {sentRequests.map((request) => renderUserCard(
                { id: request.receiverId, username: request.receiverUsername, avatarSymbol: '👤', wins: 0, losses: 0 },
                <button onClick={() => cancelRequest(request.id)} style={s.secondaryButton}>
                  Cancelar
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'search' && (
        <section>
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>Buscar Usuarios</h2>
            <span style={s.countBadge}>{searchResults.length}</span>
          </div>
          <div style={s.searchRow}>
            <input
              type="text"
              placeholder="Buscar por nombre o username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              style={s.searchInput}
            />
            <PrimaryButton onClick={searchUsers} style={s.searchButton}>
              Buscar
            </PrimaryButton>
          </div>
          {searchQuery.trim() && searchResults.length === 0 ? (
            <p style={s.emptyText}>No se encontró ningún usuario con ese término.</p>
          ) : (
            <div style={s.gridList}>
              {searchResults.map((user) => renderUserCard(user, (
                <PrimaryButton onClick={() => sendFriendRequest(user.id)} style={s.actionButton}>
                  Enviar Solicitud
                </PrimaryButton>
              )))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

const s = {
  root: {
    minHeight: '100vh',
    background: `radial-gradient(circle at top left, ${t.gold}15, transparent 28%), radial-gradient(circle at bottom right, ${t.gold}10, transparent 34%), ${t.bg0}`,
    padding: '30px 20px 60px',
    color: t.textPrimary,
  },
  heroBar: {
    maxWidth: '1000px',
    margin: '0 auto 30px',
    padding: '28px 32px',
    borderRadius: '18px',
    backgroundColor: t.bg1,
    border: `1px solid ${t.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    boxShadow: t.shadowGold,
  },
  label: {
    fontFamily: t.fontDisplay,
    fontSize: '1.8rem',
    color: t.gold,
    marginBottom: '6px',
  },
  subtitle: {
    color: t.textSecondary,
    fontSize: '1rem',
    lineHeight: 1.6,
    maxWidth: '680px',
  },
  userBadge: {
    padding: '10px 18px',
    borderRadius: '999px',
    backgroundColor: t.bg2,
    color: t.gold,
    border: `1px solid ${t.goldDark}`,
    fontFamily: t.fontBody,
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    margin: '0 auto 24px',
    maxWidth: '1000px',
  },
  tabButton: {
    padding: '12px 18px',
    borderRadius: '10px',
    border: `1px solid ${t.border}`,
    backgroundColor: t.bg1,
    color: t.textPrimary,
    cursor: 'pointer',
    fontFamily: t.fontBody,
    transition: 'all 0.2s ease',
  },
  tabButtonActive: {
    borderColor: t.gold,
    backgroundColor: t.bg0,
    color: t.gold,
    boxShadow: t.shadowCard,
  },
  statusMessage: {
    margin: '0 auto 26px',
    maxWidth: '1000px',
    padding: '14px 18px',
    borderRadius: '12px',
    backgroundColor: t.bg2,
    color: t.textSecondary,
    border: `1px solid ${t.border}`,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '15px',
    marginBottom: '18px',
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontFamily: t.fontDisplay,
    fontSize: '1.7rem',
    margin: 0,
  },
  countBadge: {
    padding: '8px 16px',
    borderRadius: '999px',
    backgroundColor: t.goldLight,
    color: t.bg0,
    fontWeight: '700',
    fontSize: '0.95rem',
  },
  emptyText: {
    color: t.textMuted,
    fontSize: '0.98rem',
  },
  gridList: {
    display: 'grid',
    gap: '18px',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    padding: '18px 22px',
    borderRadius: '16px',
    backgroundColor: t.bg2,
    border: `1px solid ${t.border}`,
    boxShadow: t.shadowCard,
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
  },
  cardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '18px',
    display: 'grid',
    placeItems: 'center',
    fontSize: '2rem',
    backgroundColor: t.goldLight,
    color: t.bg0,
  },
  cardTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: t.textPrimary,
  },
  cardMeta: {
    color: t.textMuted,
    fontSize: '0.9rem',
    marginTop: '4px',
  },
  cardActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  actionButton: {
    fontSize: '0.85rem',
    padding: '10px 18px',
    minWidth: '140px',
  },
  secondaryButton: {
    padding: '10px 18px',
    borderRadius: '10px',
    border: `1px solid ${t.border}`,
    backgroundColor: t.bg1,
    color: t.textPrimary,
    cursor: 'pointer',
    fontFamily: t.fontBody,
    fontWeight: '700',
  },
  requestActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  searchRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '14px',
    marginBottom: '24px',
  },
  searchInput: {
    width: '100%',
    padding: '14px 18px',
    borderRadius: '14px',
    border: `1px solid ${t.border}`,
    backgroundColor: t.bg1,
    color: t.textPrimary,
    fontFamily: t.fontBody,
    fontSize: '1rem',
  },
  searchButton: {
    minWidth: '170px',
  },
};

export default Friends;
