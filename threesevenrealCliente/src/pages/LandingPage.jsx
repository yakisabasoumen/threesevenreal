import React from 'react';
import { useNavigate } from 'react-router-dom';
import PrimaryButton from '../components/ui/PrimaryButton';
import { t } from '../styles/theme';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleLogin = () => navigate('/login');
  const handleRegister = () => navigate('/register');
  const handleStartFree = () => navigate('/register');
  const handleHowItWorks = () => {
    document.getElementById('how').scrollIntoView({ behavior: 'smooth' });
  };
  const handlePlayNow = () => navigate('/login');

  return (
    <div style={{ fontFamily: t.fontBody, color: t.textPrimary, backgroundColor: t.bg0, minHeight: '100vh', scrollBehavior: 'smooth' }}>
      <style>
        {`
          @keyframes fadeUp {
            from {
              opacity: 0;
              transform: translateY(12px);
            }
            to {
              opacity: 0;
              transform: translateY(0);
            }
          }
          .fadeUp {
            animation: fadeUp 0.6s ease both;
          }
          .cardHover {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .cardHover:hover {
            transform: translateY(-4px);
            box-shadow: ${t.shadowGold};
          }
        `}
      </style>

      {/* Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: t.bg0,
        borderBottom: `1px solid ${t.border}`,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        boxShadow: t.shadowCard
      }}>
        <div style={{ display: 'flex', alignItems: 'center', fontFamily: t.fontDisplay, fontSize: '1.5rem', color: t.gold, fontWeight: 'bold' }}>
          ♠ ThreeSevenReal
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleLogin}
            style={{
              padding: '8px 16px',
              border: `2px solid ${t.gold}`,
              backgroundColor: 'transparent',
              color: t.gold,
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: t.fontBody,
              fontSize: '0.9rem',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = t.goldLight}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            Iniciar sesión
          </button>
          <PrimaryButton onClick={handleRegister} style={{ fontSize: '0.9rem' }}>
            Registrarse
          </PrimaryButton>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        height: '100vh',
        backgroundColor: t.bg0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        paddingTop: '60px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Orbs */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '200px',
          height: '200px',
          background: `radial-gradient(circle, ${t.gold}20 0%, transparent 70%)`,
          borderRadius: '50%',
          zIndex: 1
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: '150px',
          height: '150px',
          background: `radial-gradient(circle, ${t.gold}15 0%, transparent 70%)`,
          borderRadius: '50%',
          zIndex: 1
        }}></div>

        <div style={{ zIndex: 2, maxWidth: '800px', padding: '0 20px' }}>
          <p style={{
            fontSize: '0.9rem',
            color: t.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '20px'
          }}>
            La experiencia de casino definitiva
          </p>
          <h1 style={{
            fontFamily: t.fontDisplay,
            fontSize: '4rem',
            fontWeight: 'bold',
            color: t.textPrimary,
            marginBottom: '20px',
            lineHeight: 1.2,
            animation: 'fadeUp 0.6s ease both'
          }}>
            Juega. Apuesta. <span style={{ color: t.gold }}>Gana.</span>
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: t.textSecondary,
            marginBottom: '40px',
            maxWidth: '600px',
            margin: '0 auto 40px'
          }}>
            Sumérgete en el emocionante mundo del casino online con nuestros juegos de blackjack, dominó, tres y siete, y Texas Hold'em. Compite en tiempo real y gana premios exclusivos.
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap' }}>
            <PrimaryButton onClick={handleStartFree} style={{ fontSize: '1.1rem', padding: '12px 24px' }}>
              Empezar gratis
            </PrimaryButton>
            <button
              onClick={handleHowItWorks}
              style={{
                padding: '12px 24px',
                border: `2px solid ${t.gold}`,
                backgroundColor: 'transparent',
                color: t.gold,
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: t.fontBody,
                fontSize: '1.1rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = t.goldLight}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              Ver cómo funciona
            </button>
          </div>
          <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.9rem', color: t.textMuted }}>✓ Sin depósito inicial</span>
            <span style={{ fontSize: '0.9rem', color: t.textMuted }}>✓ 4 juegos disponibles</span>
            <span style={{ fontSize: '0.9rem', color: t.textMuted }}>✓ Chat en tiempo real</span>
          </div>
        </div>
      </section>

      {/* Juegos Section */}
      <section id="games" style={{
        backgroundColor: t.bg1,
        padding: '80px 20px',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontFamily: t.fontDisplay,
          fontSize: '2.5rem',
          color: t.textPrimary,
          marginBottom: '60px'
        }}>
          Nuestros Juegos
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {[
            { icon: '♣', name: 'Blackjack', desc: 'El clásico juego de cartas. Acércate a 21 sin pasarte.', difficulty: 'Fácil', color: t.textPrimary },
            { icon: '♦', name: 'Tres y Siete', desc: 'Un juego único con dados y estrategia.', difficulty: 'Medio', color: t.textPrimary },
            { icon: '♠', name: 'Texas Hold\'em', desc: 'El rey del póker. Compite contra otros jugadores.', difficulty: 'Difícil', color: t.textPrimary },
            { icon: '☰', name: 'Dominó', desc: 'Un juego de fichas estratégico.', difficulty: 'Medio', color: t.textPrimary }
          ].map((game, index) => (
            <div key={index} className="cardHover" style={{
              backgroundColor: t.bg2,
              borderRadius: '8px',
              padding: '30px',
              boxShadow: t.shadowCard,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                fontSize: '4rem',
                color: `${t.gold}40`,
                position: 'absolute',
                top: '10px',
                right: '10px',
                opacity: 0.5
              }}>
                {game.icon}
              </div>
              <h3 style={{
                fontFamily: t.fontDisplay,
                fontSize: '1.8rem',
                color: game.color,
                marginBottom: '10px'
              }}>
                {game.name}
              </h3>
              <p style={{
                color: t.textSecondary,
                marginBottom: '20px',
                fontSize: '1rem'
              }}>
                {game.desc}
              </p>
              <span style={{
                display: 'inline-block',
                backgroundColor: t.goldLight,
                color: t.bg0,
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                marginBottom: '20px'
              }}>
                {game.difficulty}
              </span>
              <PrimaryButton onClick={handlePlayNow} style={{ width: '100%' }}>
                Jugar ahora
              </PrimaryButton>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo Funciona Section */}
      <section id="how" style={{
        backgroundColor: t.bg0,
        padding: '80px 20px',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontFamily: t.fontDisplay,
          fontSize: '2.5rem',
          color: t.textPrimary,
          marginBottom: '60px'
        }}>
          Cómo Funciona
        </h2>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '40px',
          flexWrap: 'wrap',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {[
            { number: '1', title: 'Regístrate', desc: 'Crea tu cuenta gratuita en minutos.' },
            { number: '2', title: 'Elige tu juego', desc: 'Selecciona entre nuestros juegos disponibles.' },
            { number: '3', title: 'Compite', desc: 'Juega y gana contra otros jugadores.' }
          ].map((step, index) => (
            <React.Fragment key={index}>
              <div style={{ textAlign: 'center', maxWidth: '250px' }}>
                <div style={{
                  fontSize: '3rem',
                  color: t.gold,
                  fontWeight: 'bold',
                  marginBottom: '20px'
                }}>
                  {step.number}
                </div>
                <h3 style={{
                  fontFamily: t.fontDisplay,
                  fontSize: '1.5rem',
                  color: t.textPrimary,
                  marginBottom: '10px'
                }}>
                  {step.title}
                </h3>
                <p style={{ color: t.textSecondary, fontSize: '1rem' }}>
                  {step.desc}
                </p>
              </div>
              {index < 2 && (
                <div style={{
                  width: '2px',
                  height: '100px',
                  background: `repeating-linear-gradient(to bottom, ${t.gold} 0px, ${t.gold} 4px, transparent 4px, transparent 8px)`,
                  flexShrink: 0
                }}></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: t.bg2,
        borderTop: `1px solid ${t.border}`,
        padding: '40px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', fontFamily: t.fontDisplay, fontSize: '1.2rem', color: t.gold }}>
          ♠ ThreeSevenReal
        </div>
        <p style={{ color: t.textMuted, fontSize: '0.9rem', margin: 0 }}>
          © 2026 ThreeSevenReal. Todos los derechos reservados.
        </p>
        <div style={{ display: 'flex', gap: '20px' }}>
          <a href="#" style={{ color: t.textMuted, textDecoration: 'none', fontSize: '0.9rem' }}>Ranking</a>
          <a href="#" style={{ color: t.textMuted, textDecoration: 'none', fontSize: '0.9rem' }}>Sobre nosotros</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;