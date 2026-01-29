import React, { useState, useEffect } from 'react';
import { supabase } from '../src/utils/supabase';

const GerenciarVendedores = ({ loja = 'tatuape' }) => {
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({
    nome: '',
    email: '',
    tipo: '',
    meta_mensal: '',
    ativo: true
  });

  // Definir tabela baseada na loja
  const tabela = loja === 'mogi' ? 'usuarios_mogi' : 'usuarios_tatuape';

  useEffect(() => {
    carregarVendedores();
  }, [loja]);

  const carregarVendedores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(tabela)
        .select('*')
        .order('nome');

      if (error) throw error;
      setVendedores(data || []);
    } catch (error) {
      setMessage(`❌ Erro ao carregar usuários: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const iniciarEdicao = (vendedor) => {
    setEditando(vendedor.id);
    setFormEdit({
      nome: vendedor.nome,
      email: vendedor.email,
      tipo: vendedor.tipo,
      meta_mensal: vendedor.meta_mensal || '',
      ativo: vendedor.ativo
    });
  };

  const cancelarEdicao = () => {
    setEditando(null);
    setFormEdit({
      nome: '',
      email: '',
      tipo: '',
      meta_mensal: '',
      ativo: true
    });
  };

  const salvarEdicao = async (vendedorId) => {
    try {
      const { error } = await supabase
        .from(tabela)
        .update({
          nome: formEdit.nome,
          email: formEdit.email,
          tipo: formEdit.tipo,
          meta_mensal: formEdit.tipo === 'vendedor' ? parseFloat(formEdit.meta_mensal) || 0 : 0,
          ativo: formEdit.ativo
        })
        .eq('id', vendedorId);

      if (error) throw error;

      setMessage('✅ Usuário atualizado com sucesso!');
      setEditando(null);
      carregarVendedores();
    } catch (error) {
      setMessage(`❌ Erro ao atualizar usuário: ${error.message}`);
    }
  };

  const alternarStatus = async (vendedorId, statusAtual) => {
    if (!confirm(`${statusAtual ? 'Desativar' : 'Ativar'} este usuário?`)) return;

    try {
      const { error } = await supabase
        .from(tabela)
        .update({ ativo: !statusAtual })
        .eq('id', vendedorId);

      if (error) throw error;

      setMessage(`✅ Usuário ${!statusAtual ? 'ativado' : 'desativado'} com sucesso!`);
      carregarVendedores();
    } catch (error) {
      setMessage(`❌ Erro ao alterar status: ${error.message}`);
    }
  };

  const excluirVendedor = async (vendedorId, nomeVendedor) => {
    if (!confirm(`ATENÇÃO: Excluir permanentemente o usuário "${nomeVendedor}"?\n\nEsta ação não pode ser desfeita!`)) return;

    try {
      const { error } = await supabase
        .from(tabela)
        .delete()
        .eq('id', vendedorId);

      if (error) throw error;

      setMessage('✅ Usuário excluído com sucesso!');
      carregarVendedores();
    } catch (error) {
      setMessage(`❌ Erro ao excluir usuário: ${error.message}`);
    }
  };

  const getNomeLoja = () => {
    return loja === 'mogi' ? 'Mogi das Cruzes' : 'Tatuapé';
  };

  const getCorLoja = () => {
    return loja === 'mogi' ? '#10b981' : '#3b82f6';
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'vendedor': return '👤';
      case 'gerente': return '👔';
      case 'caixa': return '💰';
      default: return '👤';
    }
  };

  return (
    <div style={{
      maxWidth: '1000px',
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
          👥 Gerenciar Usuários do Sistema
        </h2>
        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
          Loja: {getNomeLoja()} • {vendedores.length} usuários cadastrados
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
          🔄 Carregando usuários...
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: '#ffffff',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Usuário</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Tipo</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Meta</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {vendedores.map((vendedor, index) => (
                <tr key={vendedor.id} style={{
                  borderBottom: '1px solid #e5e7eb',
                  background: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                }}>
                  <td style={{ padding: '1rem' }}>
                    {editando === vendedor.id ? (
                      <input
                        type="text"
                        value={formEdit.nome}
                        onChange={(e) => setFormEdit({...formEdit, nome: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px'
                        }}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>{getTipoIcon(vendedor.tipo)}</span>
                        <span style={{ fontWeight: '600', color: vendedor.ativo ? '#111827' : '#9ca3af' }}>
                          {vendedor.nome}
                        </span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem', color: vendedor.ativo ? '#6b7280' : '#9ca3af' }}>
                    {editando === vendedor.id ? (
                      <input
                        type="email"
                        value={formEdit.email}
                        onChange={(e) => setFormEdit({...formEdit, email: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px'
                        }}
                      />
                    ) : (
                      vendedor.email
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {editando === vendedor.id ? (
                      <select
                        value={formEdit.tipo}
                        onChange={(e) => setFormEdit({...formEdit, tipo: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px'
                        }}
                      >
                        <option value="vendedor">Vendedor</option>
                        <option value="gerente">Gerente</option>
                        <option value="caixa">Caixa</option>
                      </select>
                    ) : (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        background: vendedor.tipo === 'vendedor' ? '#dbeafe' : vendedor.tipo === 'gerente' ? '#fef3c7' : '#f3e8ff',
                        color: vendedor.tipo === 'vendedor' ? '#1e40af' : vendedor.tipo === 'gerente' ? '#92400e' : '#7c3aed'
                      }}>
                        {vendedor.tipo}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', color: vendedor.ativo ? '#6b7280' : '#9ca3af' }}>
                    {editando === vendedor.id && formEdit.tipo === 'vendedor' ? (
                      <input
                        type="number"
                        value={formEdit.meta_mensal}
                        onChange={(e) => setFormEdit({...formEdit, meta_mensal: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px'
                        }}
                        placeholder="0"
                      />
                    ) : (
                      vendedor.tipo === 'vendedor' && vendedor.meta_mensal > 0 
                        ? `R$ ${parseFloat(vendedor.meta_mensal).toLocaleString('pt-BR')}`
                        : '-'
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: vendedor.ativo ? '#dcfce7' : '#fee2e2',
                      color: vendedor.ativo ? '#166534' : '#dc2626'
                    }}>
                      {vendedor.ativo ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {editando === vendedor.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => salvarEdicao(vendedor.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}
                        >
                          ✅ Salvar
                        </button>
                        <button
                          onClick={cancelarEdicao}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}
                        >
                          ❌ Cancelar
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => iniciarEdicao(vendedor)}
                          style={{
                            padding: '0.5rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => alternarStatus(vendedor.id, vendedor.ativo)}
                          style={{
                            padding: '0.5rem',
                            background: vendedor.ativo ? '#f59e0b' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                          title={vendedor.ativo ? 'Desativar' : 'Ativar'}
                        >
                          {vendedor.ativo ? '⏸️' : '▶️'}
                        </button>
                        <button
                          onClick={() => excluirVendedor(vendedor.id, vendedor.nome)}
                          style={{
                            padding: '0.5rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>ℹ️ Instruções:</h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
          <li>✏️ <strong>Editar:</strong> Clique para modificar dados do usuário</li>
          <li>⏸️/▶️ <strong>Ativar/Desativar:</strong> Controla se o usuário pode fazer login</li>
          <li>🗑️ <strong>Excluir:</strong> Remove permanentemente o usuário (cuidado!)</li>
          <li>Usuários inativos aparecem em cinza e não podem acessar o sistema</li>
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
        <strong>⚠️ Atenção:</strong> Excluir usuários é uma ação irreversível. Prefira desativar usuários que não estão mais na empresa.
      </div>
    </div>
  );
};

export default GerenciarVendedores;