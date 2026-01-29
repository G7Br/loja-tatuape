import React, { useState } from 'react';
import { supabase } from '../src/utils/supabase';

const AdicionarVendedor = ({ loja = 'tatuape' }) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    tipo: 'vendedor',
    metaMensal: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Definir tabela baseada na loja
  const tabela = loja === 'mogi' ? 'usuarios_mogi' : 'usuarios_tatuape';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validarFormulario = () => {
    if (!formData.nome.trim()) {
      setMessage('❌ Nome é obrigatório');
      return false;
    }

    if (!formData.email.trim()) {
      setMessage('❌ Email é obrigatório');
      return false;
    }

    if (!formData.email.includes('@')) {
      setMessage('❌ Email deve ter formato válido');
      return false;
    }

    if (!formData.senha || formData.senha.length < 4) {
      setMessage('❌ Senha deve ter pelo menos 4 caracteres');
      return false;
    }

    if (formData.senha !== formData.confirmarSenha) {
      setMessage('❌ As senhas não coincidem');
      return false;
    }

    if (formData.tipo === 'vendedor' && (!formData.metaMensal || parseFloat(formData.metaMensal) <= 0)) {
      setMessage('❌ Meta mensal é obrigatória para vendedores');
      return false;
    }

    return true;
  };

  const adicionarUsuario = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setLoading(true);
    try {
      // Verificar se email já existe
      const { data: existeUsuario, error: errorVerificacao } = await supabase
        .from(tabela)
        .select('id')
        .eq('email', formData.email.trim())
        .single();

      if (existeUsuario) {
        setMessage('❌ Este email já está cadastrado');
        setLoading(false);
        return;
      }

      // Inserir novo usuário
      const novoUsuario = {
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        senha: formData.senha,
        tipo: formData.tipo,
        meta_mensal: formData.tipo === 'vendedor' ? parseFloat(formData.metaMensal) : 0,
        ativo: true
      };

      const { error } = await supabase
        .from(tabela)
        .insert([novoUsuario]);

      if (error) throw error;

      setMessage(`✅ ${formData.tipo === 'vendedor' ? 'Vendedor' : 'Usuário'} ${formData.nome} adicionado com sucesso!`);
      
      // Limpar formulário
      setFormData({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        tipo: 'vendedor',
        metaMensal: ''
      });
      
    } catch (error) {
      setMessage(`❌ Erro ao adicionar usuário: ${error.message}`);
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
          👤 Adicionar Novo Vendedor
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

      <form onSubmit={adicionarUsuario}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '600',
            color: '#374151'
          }}>
            Nome Completo: *
          </label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
            placeholder="Ex: João Silva"
            required
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '600',
            color: '#374151'
          }}>
            Email: *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
            placeholder="Ex: joao.silva@vh.com"
            required
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '600',
            color: '#374151'
          }}>
            Tipo de Usuário: *
          </label>
          <select
            name="tipo"
            value={formData.tipo}
            onChange={handleInputChange}
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
            <option value="vendedor">Vendedor</option>
            <option value="gerente">Gerente</option>
            <option value="caixa">Caixa</option>
          </select>
        </div>

        {formData.tipo === 'vendedor' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#374151'
            }}>
              Meta Mensal (R$): *
            </label>
            <input
              type="number"
              name="metaMensal"
              value={formData.metaMensal}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
              placeholder="Ex: 15000"
              min="0"
              step="0.01"
              required={formData.tipo === 'vendedor'}
            />
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '600',
            color: '#374151'
          }}>
            Senha: *
          </label>
          <input
            type="password"
            name="senha"
            value={formData.senha}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
            placeholder="Digite a senha (mín. 4 caracteres)"
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
            Confirmar Senha: *
          </label>
          <input
            type="password"
            name="confirmarSenha"
            value={formData.confirmarSenha}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
            placeholder="Digite novamente a senha"
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
          {loading ? '🔄 Adicionando...' : '👤 Adicionar Vendedor'}
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
          <li>Preencha todos os campos obrigatórios (*)</li>
          <li>O email deve ser único no sistema</li>
          <li>Para vendedores, defina uma meta mensal</li>
          <li>A senha deve ter pelo menos 4 caracteres</li>
          <li>O usuário poderá fazer login imediatamente</li>
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
        <strong>💡 Dica:</strong> Anote as credenciais de login e repasse ao novo usuário com segurança.
      </div>
    </div>
  );
};

export default AdicionarVendedor;