import React, { useState, useEffect } from 'react';
import { supabase } from '../src/utils/supabase';
import { supabase as supabaseMogi } from '../src/utils/supabaseMogi';

const TrocarSenhaUsuarios = ({ loja = 'tatuape' }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Selecionar o supabase correto baseado na loja
  const supabaseClient = loja === 'mogi' ? supabaseMogi : supabase;
  const tabela = loja === 'mogi' ? 'usuarios_mogi' : 'usuarios_tatuape';

  useEffect(() => {
    carregarUsuarios();
  }, [loja]);

  const carregarUsuarios = async () => {
    try {
      const { data, error } = await supabaseClient
        .from(tabela)
        .select('id, nome, email, tipo')
        .order('nome');

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      setMessage(`❌ Erro ao carregar usuários: ${error.message}`);
    }
  };

  const trocarSenha = async (e) => {
    e.preventDefault();
    
    if (!usuarioSelecionado) {
      setMessage('❌ Selecione um usuário');
      return;
    }

    if (!novaSenha || novaSenha.length < 4) {
      setMessage('❌ A senha deve ter pelo menos 4 caracteres');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setMessage('❌ As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabaseClient
        .from(tabela)
        .update({ senha: novaSenha })
        .eq('id', usuarioSelecionado);

      if (error) throw error;

      const usuario = usuarios.find(u => u.id === usuarioSelecionado);
      setMessage(`✅ Senha alterada com sucesso para ${usuario.nome}`);
      
      // Limpar campos
      setUsuarioSelecionado('');
      setNovaSenha('');
      setConfirmarSenha('');
      
    } catch (error) {
      setMessage(`❌ Erro ao alterar senha: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getNomeLoja = () => {
    return loja === 'mogi' ? 'Mogi das Cruzes' : 'Tatuapé';
  };

  const getCorLoja = () => {
    return loja === 'mogi' ? '#10b981' : '#3b82f6';
  };

  return (
    <div style={{
      maxWidth: '500px',
      margin: '2rem auto',
      padding: '2rem',
      background: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem',
        padding: '1rem',
        background: `linear-gradient(135deg, ${getCorLoja()} 0%, ${loja === 'mogi' ? '#059669' : '#1d4ed8'} 100%)`,
        borderRadius: '8px',
        color: 'white'
      }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
          🔐 Trocar Senha de Usuários
        </h2>
        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
          Loja: {getNomeLoja()}
        </p>
      </div>

      {message && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          borderRadius: '8px',
          background: message.includes('✅') ? '#f0f9ff' : '#fef2f2',
          border: `1px solid ${message.includes('✅') ? getCorLoja() : '#ef4444'}`,
          color: message.includes('✅') ? '#1e40af' : '#dc2626',
          fontWeight: '600'
        }}>
          {message}
        </div>
      )}

      <form onSubmit={trocarSenha}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '600',
            color: '#374151'
          }}>
            Selecionar Usuário:
          </label>
          <select
            value={usuarioSelecionado}
            onChange={(e) => setUsuarioSelecionado(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '1rem',
              background: '#ffffff'
            }}
            required
          >
            <option value="">Escolha um usuário...</option>
            {usuarios.map(usuario => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nome} ({usuario.email}) - {usuario.tipo}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '600',
            color: '#374151'
          }}>
            Nova Senha:
          </label>
          <input
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
            placeholder="Digite a nova senha (mín. 4 caracteres)"
            required
            minLength={4}
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '600',
            color: '#374151'
          }}>
            Confirmar Nova Senha:
          </label>
          <input
            type="password"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
            placeholder="Digite novamente a nova senha"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '1rem',
            background: loading ? '#9ca3af' : getCorLoja(),
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1.1rem',
            fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          {loading ? '🔄 Alterando...' : '🔐 Alterar Senha'}
        </button>
      </form>

      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>ℹ️ Instruções:</h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
          <li>Selecione o usuário na lista (vendedores, gerentes, etc.)</li>
          <li>Digite a nova senha (mínimo 4 caracteres)</li>
          <li>Confirme a nova senha</li>
          <li>A alteração é imediata</li>
          <li>O usuário poderá fazer login com a nova senha</li>
        </ul>
      </div>

      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: '#fef3c7',
        borderRadius: '6px',
        border: '1px solid #f59e0b',
        fontSize: '0.85rem',
        color: '#92400e'
      }}>
        <strong>⚠️ Atenção:</strong> Esta ação não pode ser desfeita. Certifique-se de informar a nova senha ao usuário.
      </div>
    </div>
  );
};

export default TrocarSenhaUsuarios;