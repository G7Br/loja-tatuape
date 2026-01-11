import { useTheme } from '../contexts/ThemeContext';

export default function ModalProdutoAdicionado({ produto, isOpen, onContinuar, onFechar }) {
  const { darkMode } = useTheme();

  if (!isOpen || !produto) return null;

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
        {/* Ícone de sucesso */}
        <div style={{
          width: '80px',
          height: '80px',
          background: '#10b981',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem auto',
          fontSize: '2.5rem'
        }}>
          ✅
        </div>

        {/* Título */}
        <h3 style={{
          margin: '0 0 1rem 0',
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#10b981'
        }}>
          Produto Adicionado!
        </h3>

        {/* Info do produto */}
        <div style={{
          background: darkMode ? '#2a2a2a' : '#f8f9fa',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`
        }}>
          <div style={{
            fontSize: '1.1rem',
            fontWeight: '600',
            marginBottom: '0.5rem',
            color: darkMode ? '#ffffff' : '#000000'
          }}>
            📦 {produto.nome}
          </div>
          
          <div style={{
            fontSize: '0.9rem',
            color: darkMode ? '#888' : '#666',
            marginBottom: '0.5rem'
          }}>
            🏷️ Código: {produto.codigo}
          </div>
          
          {produto.tipo && (
            <div style={{
              fontSize: '0.9rem',
              color: darkMode ? '#888' : '#666',
              marginBottom: '0.5rem'
            }}>
              📋 Tipo: {produto.tipo}
            </div>
          )}
          
          {produto.tamanho && (
            <div style={{
              fontSize: '0.9rem',
              color: darkMode ? '#888' : '#666',
              marginBottom: '0.5rem'
            }}>
              📏 Tamanho: {produto.tamanho}
            </div>
          )}
          
          {produto.cor && (
            <div style={{
              fontSize: '0.9rem',
              color: darkMode ? '#888' : '#666',
              marginBottom: '0.5rem'
            }}>
              🎨 Cor: {produto.cor}
            </div>
          )}
          
          <div style={{
            fontSize: '1.3rem',
            fontWeight: '700',
            color: '#10b981',
            marginBottom: '0.5rem'
          }}>
            💰 R$ {parseFloat(produto.preco_venda).toFixed(2)}
          </div>
          
          <div style={{
            fontSize: '0.9rem',
            color: produto.estoque_atual < 5 ? '#f59e0b' : '#10b981',
            fontWeight: '600'
          }}>
            📊 Estoque: {produto.estoque_atual} unidades
          </div>
        </div>

        {/* Botões */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexDirection: 'column'
        }}>
          <button
            onClick={onContinuar}
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
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.background = '#2563eb'}
            onMouseOut={(e) => e.target.style.background = '#3b82f6'}
          >
            📱 Adicionar Mais Produtos
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
            Finalizar
          </button>
        </div>
      </div>
    </div>
  );
}