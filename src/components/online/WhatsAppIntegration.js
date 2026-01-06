import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export default function WhatsAppIntegration({ user }) {
  const { darkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');

  const openWhatsApp = () => {
    if (!phoneNumber) {
      alert('Digite um número de telefone!');
      return;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const defaultMessage = message || `Olá! Sou ${user.nome} da VH Alfaiataria. Como posso ajudá-lo?`;
    const encodedMessage = encodeURIComponent(defaultMessage);
    
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const openWhatsAppWeb = () => {
    window.open('https://web.whatsapp.com', '_blank', 'width=1200,height=800');
  };

  return (
    <>
      {/* Botão WhatsApp Flutuante */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          background: '#25D366',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)',
          zIndex: 1000,
          transition: 'all 0.3s ease'
        }}
      >
        <span style={{ fontSize: '24px', color: 'white' }}>📱</span>
      </div>

      {/* WhatsApp Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          width: '320px',
          background: darkMode ? '#1a1a1a' : '#ffffff',
          border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            background: '#25D366',
            color: 'white',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem' }}>WhatsApp</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>Ferramentas de Vendas</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '1.2rem',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '1rem' }}>
            {/* WhatsApp Web */}
            <button
              onClick={openWhatsAppWeb}
              style={{
                width: '100%',
                padding: '1rem',
                background: '#25D366',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '1rem',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              🌐 Abrir WhatsApp Web
            </button>

            <div style={{
              borderTop: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
              paddingTop: '1rem',
              marginTop: '1rem'
            }}>
              <h5 style={{ margin: '0 0 0.5rem 0' }}>Enviar mensagem direta:</h5>
              
              <input
                type="tel"
                placeholder="Número do cliente (11999999999)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  background: darkMode ? '#2a2a2a' : '#f8f9fa',
                  color: darkMode ? '#ffffff' : '#000000',
                  marginBottom: '0.5rem',
                  fontSize: '16px'
                }}
              />

              <textarea
                placeholder="Mensagem (opcional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  background: darkMode ? '#2a2a2a' : '#f8f9fa',
                  color: darkMode ? '#ffffff' : '#000000',
                  marginBottom: '0.5rem',
                  resize: 'vertical',
                  fontSize: '14px'
                }}
              />

              <button
                onClick={openWhatsApp}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#25D366',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}
              >
                💬 Enviar WhatsApp
              </button>
            </div>

            {/* Mensagens Prontas */}
            <div style={{
              borderTop: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
              paddingTop: '1rem',
              marginTop: '1rem'
            }}>
              <h5 style={{ margin: '0 0 0.5rem 0' }}>Mensagens prontas:</h5>
              
              {[
                'Olá! Temos novidades na VH Alfaiataria. Gostaria de ver?',
                'Oi! Vi que você tem interesse em nossas peças. Posso ajudar?',
                'Olá! Temos uma promoção especial hoje. Quer saber mais?'
              ].map((msg, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(msg)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: darkMode ? '#2a2a2a' : '#f8f9fa',
                    border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    marginBottom: '0.25rem',
                    fontSize: '0.8rem',
                    textAlign: 'left',
                    color: darkMode ? '#ffffff' : '#000000'
                  }}
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}