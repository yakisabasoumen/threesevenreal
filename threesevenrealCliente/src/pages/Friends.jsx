import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import api from '../api/axios';
import PrimaryButton from '../components/ui/PrimaryButton';
import { t } from '../styles/theme';

const Friends = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('friends');
  const [statusMessage, setStatusMessage] = useState('');

  const [modalDelete, setModalDelete] = useState({ open: false, friend: null });

  const searchUsers = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await api.get(`/friends/search?query=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
      setStatusMessage('Hubo un problema con la búsqueda.');
    }
  }, [searchQuery]);

  const loadFriends = async () => {
    try {
      const response = await api.get('/friends');
      setFriends(response.data);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadRequests = async () => {
    try {
      const [receivedRes, sentRes] = await Promise.all([
        api.get('/friends/requests/received'),
        api.get('/friends/requests/sent')
      ]);
      setReceivedRequests(receivedRes.data);
      setSentRequests(sentRes.data);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await loadFriends();
      await loadRequests();
    };
    initialize();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      searchUsers();
    }, 400);

    return () => clearTimeout(delay);
  }, [searchUsers]);

  const getUserStatus = (userId) => {
    if (friends.some(f => f.id === userId)) return 'friend';
    if (sentRequests.some(r => r.receiverId === userId)) return 'sent';
    if (receivedRequests.some(r => r.senderId === userId)) return 'received';
    return 'none';
  };

  const sendFriendRequest = async (receiverId) => {
    try {
      await api.post('/friends/request', { receiverId });
      setStatusMessage('Solicitud enviada correctamente.');

      loadRequests();
      searchUsers();

      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      const message = error.response?.data || error.message;
      setStatusMessage(`Error: ${message}`);
    }
  };

  const acceptRequest = async (friendshipId) => {
    try {
      await api.post(`/friends/${friendshipId}/accept`);
      setStatusMessage('Solicitud aceptada.');
      loadFriends();
      loadRequests();
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      setStatusMessage(`Error: ${error.response?.data || error.message}`);
    }
  };

  const rejectRequest = async (friendshipId) => {
    try {
      await api.post(`/friends/${friendshipId}/reject`);
      setStatusMessage('Solicitud rechazada.');
      loadRequests();
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      setStatusMessage(`Error: ${error.response?.data || error.message}`);
    }
  };

  const cancelRequest = async (friendshipId) => {
    try {
      await api.delete(`/friends/request/${friendshipId}`);
      setStatusMessage('Solicitud cancelada.');
      loadRequests();
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      setStatusMessage(`Error: ${error.response?.data || error.message}`);
    }
  };

  const removeFriend = async () => {
    if (!modalDelete.friend) return;

    try {
      await api.delete(`/friends/${modalDelete.friend.id}`);
      setStatusMessage('Amigo eliminado.');
      loadFriends();
    } catch (error) {
      setStatusMessage(`Error: ${error.response?.data || error.message}`);
    }

    setModalDelete({ open: false, friend: null });
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const openUserProfile = (username) => {
    if (!username) return;
    navigate(`/profile/${encodeURIComponent(username)}`);
  };

  const renderUserCard = (user, actions) => (
    <div key={user.id} style={{
      backgroundColor: t.bg2,
      borderRadius: '10px',
      padding: '18px',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: t.shadowCard,
      transition: '0.25s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: '2rem', marginRight: '12px' }}>{user.avatarSymbol}</span>
        <div>
          <button
            onClick={() => openUserProfile(user.username)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              margin: 0,
              textAlign: 'left',
              color: t.textPrimary,
              fontFamily: t.fontDisplay,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            {user.username}
          </button>
          <div style={{ fontSize: '0.85rem', color: t.textMuted }}>
            Victorias: {user.wins} | Derrotas: {user.losses}
          </div>
        </div>
      </div>
      <div>{actions}</div>
    </div>
  );

  return (
    <div style={{
      padding: '30px 20px 60px',
      maxWidth: '1000px',
      margin: '0 auto',
      background: `radial-gradient(circle at top left, ${t.gold}15, transparent 24%), radial-gradient(circle at bottom right, ${t.gold}10, transparent 32%), ${t.bg0}`,
      minHeight: '100vh',
      color: t.textPrimary
    }}>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => window.location.href = '/lobby'}
          style={{
            background: 'transparent',
            border: `1px solid ${t.gold}`,
            color: t.gold,
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: t.fontDisplay,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: '0.2s',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = `${t.gold}22`}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          ← Volver al menú
        </button>
      </div>

      <h1 style={{
        fontFamily: t.fontDisplay,
        fontSize: '2.4rem',
        color: t.gold,
        marginBottom: '10px',
        textAlign: 'center',
        letterSpacing: '0.5px'
      }}>
        Sistema de amigos
      </h1>

      <p style={{
        maxWidth: '760px',
        margin: '0 auto 30px',
        color: t.textSecondary,
        textAlign: 'center',
        fontFamily: t.fontBody,
        lineHeight: 1.7,
        fontSize: '1rem'
      }}>
        Hola {user?.username}, administra tus amigos y solicitudes desde una misma pantalla.
      </p>

      <div style={{
        display: 'flex',
        marginBottom: '25px',
        borderBottom: `1px solid ${t.border}`,
        gap: '6px'
      }}>
        {[
          { key: 'friends', label: `Amigos (${friends.length})` },
          { key: 'received', label: `Solicitudes Recibidas`, count: receivedRequests.length },
          { key: 'sent', label: `Solicitudes Enviadas (${sentRequests.length})`},
          { key: 'search', label: 'Buscar Usuarios', count: null }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              position: 'relative',
              padding: '12px 20px',
              backgroundColor: activeTab === tab.key ? `${t.gold}22` : 'transparent',
              color: activeTab === tab.key ? t.gold : t.textPrimary,
              border: 'none',
              borderBottom: activeTab === tab.key ? `3px solid ${t.gold}` : '3px solid transparent',
              cursor: 'pointer',
              fontFamily: t.fontDisplay,
              fontSize: '1rem',
              transition: '0.25s',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.key) e.target.style.backgroundColor = `${t.gold}15`;
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.key) e.target.style.backgroundColor = 'transparent';
            }}
          >
            {tab.label}

            {tab.count > 0 && (
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                backgroundColor: t.gold,
                color: '#000',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                boxShadow: '0 0 6px rgba(255,215,0,0.6)'
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {statusMessage && (
        <div style={{
          margin: '0 auto 24px',
          maxWidth: '1000px',
          padding: '16px 18px',
          borderRadius: '14px',
          backgroundColor: t.bg2,
          border: `1px solid ${t.border}`,
          color: t.textSecondary,
          fontFamily: t.fontBody,
        }}>
          {statusMessage}
        </div>
      )}

      {/* Friends */}
      {activeTab === 'friends' && (
        <div>
          {friends.length === 0
            ? <p style={{ color: t.textMuted }}>No tienes amigos aún.</p>
            : friends.map(friend =>
                renderUserCard(friend,
                  <PrimaryButton onClick={() => setModalDelete({ open: true, friend })}>
                    Eliminar
                  </PrimaryButton>
                )
              )}
        </div>
      )}

      {/* Received */}
      {activeTab === 'received' && (
        <div>
          <h2 style={{ fontFamily: t.fontDisplay, marginBottom: '20px' }}>
            Solicitudes Recibidas ({receivedRequests.length})
          </h2>
          {receivedRequests.length === 0
            ? <p style={{ color: t.textMuted }}>No tienes solicitudes pendientes.</p>
            : receivedRequests.map(request =>
                renderUserCard(
                  { id: request.senderId, username: request.senderUsername, avatarSymbol: '👤', wins: 0, losses: 0 },
                  <>
                    <PrimaryButton
                      onClick={() => acceptRequest(request.id)}
                      style={{
                        fontSize: '0.8rem',
                        padding: '10px 18px',
                        marginRight: '10px',
                        borderRadius: '8px'
                      }}
                    >
                      Aceptar
                    </PrimaryButton>

                    <button
                      onClick={() => rejectRequest(request.id)}
                      style={{
                        padding: '10px 18px',
                        backgroundColor: t.loss,
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      Rechazar
                    </button>
                  </>
                )
              )}
        </div>
      )}

      {activeTab === 'sent' && (
        <div>
          <h2 style={{ fontFamily: t.fontDisplay, marginBottom: '20px' }}>
            Solicitudes Enviadas ({sentRequests.length})
          </h2>
          {sentRequests.length === 0
            ? <p style={{ color: t.textMuted }}>No has enviado solicitudes pendientes.</p>
            : sentRequests.map(request =>
                renderUserCard(
                  { id: request.receiverId, username: request.receiverUsername, avatarSymbol: '👤', wins: 0, losses: 0 },
                  <button
                    onClick={() => cancelRequest(request.id)}
                    style={{
                      padding: '10px 18px',
                      backgroundColor: t.loss,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    Cancelar
                  </button>
                )
              )}
        </div>
      )}

      {activeTab === 'search' && (
        <div>
          <h2 style={{ fontFamily: t.fontDisplay, marginBottom: '20px' }}>
            Buscar Usuarios
          </h2>

          <div style={{ display: 'flex', marginBottom: '20px', gap: '10px' }}>
            <input
              type="text"
              placeholder="Buscar por nombre o username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '14px 16px',
                border: `1px solid ${t.border}`,
                borderRadius: '10px',
                backgroundColor: t.bg1,
                color: t.textPrimary,
                fontFamily: t.fontBody
              }}
            />
          </div>

          {searchResults.map(user => {
            const status = getUserStatus(user.id);

            let actions;
            if (status === 'friend') {
              actions = <span style={{ color: t.gold }}>✔ Ya es tu amigo</span>;
            } else if (status === 'sent') {
              actions = <span style={{ color: t.textMuted }}>Solicitud enviada</span>;
            } else if (status === 'received') {
              actions = (
                <PrimaryButton onClick={() => acceptRequest(user.id)}>
                  Aceptar solicitud
                </PrimaryButton>
              );
            } else {
              actions = (
                <PrimaryButton onClick={() => sendFriendRequest(user.id)}>
                  Enviar Solicitud
                </PrimaryButton>
              );
            }

            return renderUserCard(user, actions);
          })}
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {modalDelete.open && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: t.bg1,
            padding: '30px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '380px',
            textAlign: 'center',
            boxShadow: t.shadowCard
          }}>
            <h3 style={{ color: t.textPrimary, marginBottom: '10px', fontFamily: t.fontDisplay }}>
              ¿Eliminar amigo?
            </h3>
            <p style={{ color: t.textSecondary, marginBottom: '20px' }}>
              ¿Seguro que quieres eliminar a <strong>{modalDelete.friend.username}</strong>?
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => setModalDelete({ open: false, friend: null })}
                style={{
                  padding: '10px 20px',
                  backgroundColor: t.bg2,
                  border: `1px solid ${t.border}`,
                  borderRadius: '8px',
                  color: t.textPrimary,
                  cursor: 'pointer',
                  width: '48%'
                }}
              >
                Cancelar
              </button>

              <button
                onClick={removeFriend}
                style={{
                  padding: '10px 20px',
                  backgroundColor: t.loss,
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  width: '48%'
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Friends;
