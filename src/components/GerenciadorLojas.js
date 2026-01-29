import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../utils/supabase';
import { LojaFileService } from '../utils/lojaFileService';

const Container = styled.div`
  width: 100%;
  padding: 20px;
`;

const Card = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 1px solid #404040;
  border-radius: 16px;
  padding: 25px;
  margin-bottom: 20px;
  color: #ffffff;
`;

const Button = styled.button`
  padding: 15px 30px;
  background: ${props => props.variant === 'success' ? '#16a34a' : props.variant === 'danger' ? '#dc2626' : '#ffffff'};
  color: ${props => props.variant === 'success' || props.variant === 'danger' ? '#ffffff' : '#000000'};
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 10px;
  margin-bottom: 10px;
  
  &:hover { 
    opacity: 0.8;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Table = styled.table`
  width: 100%;
  background: #111111;
  border-radius: 8px;
  border-collapse: collapse;
  border: 1px solid #333333;
  margin-bottom: 20px;
  overflow: hidden;
`;

const Th = styled.th`
  background: #222222;
  color: #ffffff;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 1px;
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #333333;
`;

const Td = styled.td`
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #333333;
  font-size: 14px;
  color: #ffffff;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #1a1a1a;
  border: 1px solid #404040;
  border-radius: 16px;
  padding: 30px;
  width: 90%;
  max-width: 600px;
  color: #ffffff;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  background: #333333;
  border: 1px solid #666666;
  border-radius: 8px;
  color: #ffffff;
  margin-bottom: 15px;
  
  &::placeholder {
    color: #999999;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  background: #333333;
  border: 1px solid #666666;
  border-radius: 8px;
  color: #ffffff;
  margin-bottom: 15px;
  min-height: 80px;
  resize: vertical;
  
  &::placeholder {
    color: #999999;
  }
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props => {
    switch(props.status) {
      case 'ativa': return '#16a34a';
      case 'inativa': return '#dc2626';
      case 'manutencao': return '#f59e0b';
      default: return '#666666';
    }
  }};
  color: white;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default function GerenciadorLojas() {
  const [lojas, setLojas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [criandoLoja, setCriandoLoja] = useState(false);
  const [editandoLoja, setEditandoLoja] = useState(false);
  const [lojaEditando, setLojaEditando] = useState(null);
  const [novaLoja, setNovaLoja] = useState({
    codigo_loja: '',
    nome_loja: '',
    endereco: '',
    telefone: '',
    email: '',
    gerente_responsavel: ''
  });

  useEffect(() => {
    carregarLojas();
  }, []);

  const carregarLojas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lojas_sistema')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLojas(data || []);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
      alert('Erro ao carregar lojas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const abrirEdicao = (loja) => {
    setLojaEditando({
      id: loja.id,
      codigo_loja: loja.codigo_loja,
      nome_loja: loja.nome_loja,
      endereco: loja.endereco || '',
      telefone: loja.telefone || '',
      email: loja.email || '',
      gerente_responsavel: loja.gerente_responsavel || ''
    });
    setShowEditModal(true);
  };

  const salvarEdicao = async () => {
    if (!lojaEditando.nome_loja) {
      alert('Nome da loja é obrigatório!');
      return;
    }

    try {
      setEditandoLoja(true);

      const { error } = await supabase
        .from('lojas_sistema')
        .update({
          nome_loja: lojaEditando.nome_loja,
          endereco: lojaEditando.endereco,
          telefone: lojaEditando.telefone,
          email: lojaEditando.email,
          gerente_responsavel: lojaEditando.gerente_responsavel
        })
        .eq('id', lojaEditando.id);

      if (error) throw error;

      alert('Loja atualizada com sucesso!');
      setShowEditModal(false);
      setLojaEditando(null);
      carregarLojas();

    } catch (error) {
      console.error('Erro ao atualizar loja:', error);
      alert('Erro ao atualizar loja: ' + error.message);
    } finally {
      setEditandoLoja(false);
    }
  };

  const criarNovaLoja = async () => {
    if (!novaLoja.codigo_loja || !novaLoja.nome_loja) {
      alert('Código e nome da loja são obrigatórios!');
      return;
    }

    try {
      setCriandoLoja(true);

      const { data: lojaData, error: lojaError } = await supabase
        .from('lojas_sistema')
        .insert([{
          codigo_loja: novaLoja.codigo_loja.toLowerCase().replace(/[^a-z0-9]/g, ''),
          nome_loja: novaLoja.nome_loja,
          endereco: novaLoja.endereco,
          telefone: novaLoja.telefone,
          email: novaLoja.email,
          gerente_responsavel: novaLoja.gerente_responsavel,
          status: 'ativa'
        }])
        .select()
        .single();

      if (lojaError) throw lojaError;

      const { error: tabelasError } = await supabase.rpc('criar_tabelas_loja', {
        codigo_loja: lojaData.codigo_loja
      });

      if (tabelasError) throw tabelasError;

      // 3. Criar todas as páginas e componentes da loja
      await LojaFileService.criarArquivosLoja(lojaData.codigo_loja, novaLoja.nome_loja);

      alert(`Loja "${novaLoja.nome_loja}" criada com sucesso!\n\nCriado automaticamente:\n✅ Todas as tabelas do banco\n✅ Páginas da loja (/${lojaData.codigo_loja})\n✅ Componentes (Login, Gerente, Vendedor)\n✅ Utilitários e serviços\n\nAcesse: /${lojaData.codigo_loja}`);
      
      setShowModal(false);
      setNovaLoja({
        codigo_loja: '',
        nome_loja: '',
        endereco: '',
        telefone: '',
        email: '',
        gerente_responsavel: ''
      });
      
      carregarLojas();

    } catch (error) {
      console.error('Erro ao criar loja:', error);
      alert('Erro ao criar loja: ' + error.message);
    } finally {
      setCriandoLoja(false);
    }
  };

  const alterarStatusLoja = async (lojaId, novoStatus) => {
    try {
      const { error } = await supabase
        .from('lojas_sistema')
        .update({ status: novoStatus })
        .eq('id', lojaId);

      if (error) throw error;
      
      carregarLojas();
      alert('Status da loja alterado com sucesso!');
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status: ' + error.message);
    }
  };

  const removerLoja = async (loja) => {
    if (!confirm(`Tem certeza que deseja REMOVER PERMANENTEMENTE a loja "${loja.nome_loja}"?`)) {
      return;
    }

    try {
      // 1. Remover arquivos e páginas da loja
      await LojaFileService.removerArquivosLoja(loja.codigo_loja);
      
      // 2. Remover todas as tabelas da loja
      const { error: tabelasError } = await supabase.rpc('remover_tabelas_loja', {
        codigo_loja: loja.codigo_loja
      });

      if (tabelasError) throw tabelasError;

      // 3. Remover registro da loja
      const { error: lojaError } = await supabase
        .from('lojas_sistema')
        .delete()
        .eq('id', loja.id);

      if (lojaError) throw lojaError;

      alert('Loja removida com sucesso!\n\nRemovido:\n❌ Todas as tabelas\n❌ Todas as páginas\n❌ Todos os componentes\n❌ Todos os arquivos');
      carregarLojas();

    } catch (error) {
      console.error('Erro ao remover loja:', error);
      alert('Erro ao remover loja: ' + error.message);
    }
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Container>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <LoadingSpinner />
          <span style={{ marginLeft: '10px' }}>Carregando lojas...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>🏪 Gerenciamento de Lojas</h2>
          <Button onClick={() => setShowModal(true)} variant="success">
            + Nova Loja
          </Button>
        </div>

        <Table>
          <thead>
            <tr>
              <Th>Código</Th>
              <Th>Nome da Loja</Th>
              <Th>Endereço</Th>
              <Th>Gerente</Th>
              <Th>Status</Th>
              <Th>Criada em</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {lojas.map(loja => (
              <tr key={loja.id}>
                <Td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                  {loja.codigo_loja}
                </Td>
                <Td style={{ fontWeight: 'bold' }}>
                  {loja.nome_loja}
                </Td>
                <Td>{loja.endereco || '-'}</Td>
                <Td>{loja.gerente_responsavel || '-'}</Td>
                <Td>
                  <StatusBadge status={loja.status}>
                    {loja.status}
                  </StatusBadge>
                </Td>
                <Td>{formatarData(loja.created_at)}</Td>
                <Td>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    <Button 
                      onClick={() => abrirEdicao(loja)}
                      style={{ padding: '8px 12px', fontSize: '12px' }}
                    >
                      Editar
                    </Button>
                    
                    {loja.status === 'ativa' ? (
                      <Button 
                        onClick={() => alterarStatusLoja(loja.id, 'inativa')}
                        style={{ padding: '8px 12px', fontSize: '12px' }}
                      >
                        Desativar
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => alterarStatusLoja(loja.id, 'ativa')}
                        variant="success"
                        style={{ padding: '8px 12px', fontSize: '12px' }}
                      >
                        Ativar
                      </Button>
                    )}
                    
                    <Button 
                      onClick={() => removerLoja(loja)}
                      variant="danger"
                      style={{ padding: '8px 12px', fontSize: '12px' }}
                    >
                      Remover
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>

        {lojas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666666' }}>
            Nenhuma loja encontrada. Clique em "Nova Loja" para criar a primeira.
          </div>
        )}
      </Card>

      {showModal && (
        <Modal onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <ModalContent>
            <h3 style={{ marginBottom: '20px' }}>🏪 Criar Nova Loja</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Código da Loja *
              </label>
              <Input
                type="text"
                placeholder="Ex: santos, campinas, abc"
                value={novaLoja.codigo_loja}
                onChange={(e) => setNovaLoja({...novaLoja, codigo_loja: e.target.value})}
                disabled={criandoLoja}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Nome da Loja *
              </label>
              <Input
                type="text"
                placeholder="Ex: VH Alfaiataria Santos"
                value={novaLoja.nome_loja}
                onChange={(e) => setNovaLoja({...novaLoja, nome_loja: e.target.value})}
                disabled={criandoLoja}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Endereço
              </label>
              <TextArea
                placeholder="Endereço completo da loja"
                value={novaLoja.endereco}
                onChange={(e) => setNovaLoja({...novaLoja, endereco: e.target.value})}
                disabled={criandoLoja}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Telefone
                </label>
                <Input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={novaLoja.telefone}
                  onChange={(e) => setNovaLoja({...novaLoja, telefone: e.target.value})}
                  disabled={criandoLoja}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="loja@vh.com"
                  value={novaLoja.email}
                  onChange={(e) => setNovaLoja({...novaLoja, email: e.target.value})}
                  disabled={criandoLoja}
                />
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Gerente Responsável
              </label>
              <Input
                type="text"
                placeholder="Nome do gerente da loja"
                value={novaLoja.gerente_responsavel}
                onChange={(e) => setNovaLoja({...novaLoja, gerente_responsavel: e.target.value})}
                disabled={criandoLoja}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button 
                onClick={() => setShowModal(false)}
                disabled={criandoLoja}
              >
                Cancelar
              </Button>
              <Button 
                onClick={criarNovaLoja}
                variant="success"
                disabled={criandoLoja || !novaLoja.codigo_loja || !novaLoja.nome_loja}
              >
                {criandoLoja ? (
                  <>
                    <LoadingSpinner style={{ marginRight: '10px' }} />
                    Criando Loja...
                  </>
                ) : (
                  'Criar Loja'
                )}
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}

      {showEditModal && lojaEditando && (
        <Modal onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}>
          <ModalContent>
            <h3 style={{ marginBottom: '20px' }}>✏️ Editar Loja</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Código da Loja</label>
              <Input
                type="text"
                value={lojaEditando.codigo_loja}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <small style={{ color: '#999999' }}>O código da loja não pode ser alterado</small>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nome da Loja *</label>
              <Input
                type="text"
                value={lojaEditando.nome_loja}
                onChange={(e) => setLojaEditando({...lojaEditando, nome_loja: e.target.value})}
                disabled={editandoLoja}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Endereço</label>
              <TextArea
                value={lojaEditando.endereco}
                onChange={(e) => setLojaEditando({...lojaEditando, endereco: e.target.value})}
                disabled={editandoLoja}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Telefone</label>
                <Input
                  type="text"
                  value={lojaEditando.telefone}
                  onChange={(e) => setLojaEditando({...lojaEditando, telefone: e.target.value})}
                  disabled={editandoLoja}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
                <Input
                  type="email"
                  value={lojaEditando.email}
                  onChange={(e) => setLojaEditando({...lojaEditando, email: e.target.value})}
                  disabled={editandoLoja}
                />
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Gerente Responsável</label>
              <Input
                type="text"
                value={lojaEditando.gerente_responsavel}
                onChange={(e) => setLojaEditando({...lojaEditando, gerente_responsavel: e.target.value})}
                disabled={editandoLoja}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button onClick={() => setShowEditModal(false)} disabled={editandoLoja}>Cancelar</Button>
              <Button onClick={salvarEdicao} variant="success" disabled={editandoLoja || !lojaEditando.nome_loja}>
                {editandoLoja ? (
                  <>
                    <LoadingSpinner style={{ marginRight: '10px' }} />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}