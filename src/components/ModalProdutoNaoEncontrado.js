import { useTheme } from '../contexts/ThemeContext';

export default function ModalProdutoNaoEncontrado({ isOpen, codigo, onTentarNovamente, onFechar }) {
  const { darkMode } = useTheme();

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      zIndex: 1001,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: darkMode ? '#1a1a1a' : '#ffffff',
        borderRadius: '16px',
        padding: '2rem',
        width: '100%',
        maxWidth: '350px',
        color: darkMode ? '#ffffff' : '#000000',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
        textAlign: 'center'
      }}>
        {/* Ícone de erro */}
        <div style={{
          width: '80px',
          height: '80px',
          background: '#ef4444',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem auto',
          fontSize: '2.5rem'
        }}>
          ❌
        </div>

        {/* Título */}
        <h3 style={{
          margin: '0 0 1rem 0',
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#ef4444'
        }}>
          Produto Não Encontrado
        </h3>

        {/* Mensagem */}
        <div style={{
          background: darkMode ? '#2a2a2a' : '#f8f9fa',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`
        }}>
          <div style={{
            fontSize: '1rem',
            marginBottom: '1rem',
            color: darkMode ? '#ffffff' : '#000000'
          }}>
            O produto não foi encontrado ou está sem estoque.
          </div>
          
          {codigo && (
            <div style={{
              fontSize: '0.9rem',
              color: darkMode ? '#888' : '#666',
              background: darkMode ? '#1a1a1a' : '#ffffff',
              padding: '8px 12px',
              borderRadius: '6px',
              border: `1px solid ${darkMode ? '#444' : '#d1d5db'}`,
              fontFamily: 'monospace'
            }}>
              📋 Código: {codigo}
            </div>
          )}
        </div>

        {/* Botões */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexDirection: 'column'
        }}>
          <button
            onClick={onTentarNovamente}
            style={{
              padding: '14px 24px',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            📱 Tentar Outro Código
          </button>
          
          <button
            onClick={onFechar}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              color: darkMode ? '#888' : '#666',
              border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}