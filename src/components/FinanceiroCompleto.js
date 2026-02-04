import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../utils/supabase';

const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  color: #ffffff;
  background: #000000;
`;

const Header = styled.div`
  background: #000000;
  border-bottom: 1px solid #333333;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TabContainer = styled.div`
  display: flex;
  padding: 0 20px;
  border-bottom: 1px solid #333333;
  background: #111111;
  overflow-x: auto;
`;

const Tab = styled.button`
  padding: 15px 20px;
  background: ${props => props.$active ? '#333333' : 'transparent'};
  color: ${props => props.$active ? '#ffffff' : '#cccccc'};
  border: none;
  border-bottom: ${props => props.$active ? '3px solid #ffffff' : '3px solid transparent'};
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: #222222; color: #ffffff; }
`;

const Content = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

const Card = styled.div`
  background: #111111;
  border: 1px solid #333333;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
`;

const Button = styled.button`
  padding: 10px 20px;
  background: #ffffff;
  color: #000000;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-right: 10px;
  &:hover { background: #cccccc; }
  
  &.success { background: #10b981; color: #ffffff; }
  &.danger { background: #ef4444; color: #ffffff; }
  &.warning { background: #f59e0b; color: #ffffff; }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  background: #222;
  border: 1px solid #444;
  border-radius: 4px;
  color: white;
  margin-bottom: 10px;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  background: #222;
  border: 1px solid #444;
  border-radius: 4px;
  color: white;
  margin-bottom: 10px;
`;

export default function FinanceiroCompleto({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('vendas-semanais');
  const [dadosVendas, setDadosVendas] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [receitas, setReceitas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para formulários
  const [novoFuncionario, setNovoFuncionario] = useState({
    nome: '', cargo: '', salario: '', loja: 'tatuape'
  });
  const [novaDespesa, setNovaDespesa] = useState({
    descricao: '', valor: '', categoria: '', loja: 'tatuape', data: new Date().toISOString().split('T')[0]
  });
  const [novaReceita, setNovaReceita] = useState({
    descricao: '', valor: '', categoria: '', loja: 'tatuape', data: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      // Carregar vendas das duas lojas
      const [vendasTatuape, vendasMogi] = await Promise.all([
        supabase.from('vendas_tatuape').select('*').order('data_venda', { ascending: false }),
        supabase.from('vendas_mogi').select('*').order('data_venda', { ascending: false })
      ]);

      const todasVendas = [
        ...(vendasTatuape.data || []).map(v => ({ ...v, loja: 'tatuape' })),
        ...(vendasMogi.data || []).map(v => ({ ...v, loja: 'mogi' }))
      ];

      setDadosVendas(todasVendas);

      // Carregar funcionários das duas lojas
      const [funcTatuape, funcMogi] = await Promise.all([
        supabase.from('usuarios_tatuape').select('*'),
        supabase.from('usuarios_mogi').select('*')
      ]);

      const todosFuncionarios = [
        ...(funcTatuape.data || []).map(f => ({ ...f, loja: 'tatuape' })),
        ...(funcMogi.data || []).map(f => ({ ...f, loja: 'mogi' }))
      ];

      setFuncionarios(todosFuncionarios);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const calcularVendasSemanais = () => {
    const hoje = new Date();
    const inicioSemana = new Date(hoje.setDate(hoje.getDate() - hoje.getDay()));
    
    const vendasSemana = dadosVendas.filter(v => {
      const dataVenda = new Date(v.data_venda);
      return dataVenda >= inicioSemana;
    });

    const vendedores = {};
    vendasSemana.forEach(venda => {
      const vendedor = venda.vendedor_nome || 'Sem vendedor';
      if (!vendedores[vendedor]) {
        vendedores[vendedor] = { vendas: 0, valor: 0, loja: venda.loja };
      }
      vendedores[vendedor].vendas += 1;
      vendedores[vendedor].valor += parseFloat(venda.valor_final || 0);
    });

    return Object.entries(vendedores).map(([nome, dados]) => ({
      nome,
      ...dados
    }));
  };

  const calcularTotalSemanal = () => {
    const hoje = new Date();
    const inicioSemana = new Date(hoje.setDate(hoje.getDate() - hoje.getDay()));
    
    return dadosVendas
      .filter(v => new Date(v.data_venda) >= inicioSemana)
      .reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
  };

  const calcularPorCategoria = () => {
    const categorias = {};
    dadosVendas.forEach(venda => {
      // Simular categorias baseadas no valor
      const categoria = parseFloat(venda.valor_final) > 500 ? 'Premium' : 
                       parseFloat(venda.valor_final) > 200 ? 'Médio' : 'Básico';
      
      if (!categorias[categoria]) {
        categorias[categoria] = { vendas: 0, valor: 0 };
      }
      categorias[categoria].vendas += 1;
      categorias[categoria].valor += parseFloat(venda.valor_final || 0);
    });

    return categorias;
  };

  const adicionarFuncionario = async () => {
    if (!novoFuncionario.nome || !novoFuncionario.cargo || !novoFuncionario.salario) {
      alert('Preencha todos os campos');
      return;
    }

    try {
      const { error } = await supabase
        .from(`usuarios_${novoFuncionario.loja}`)
        .insert([{
          nome: novoFuncionario.nome,
          tipo: novoFuncionario.cargo,
          salario_base: parseFloat(novoFuncionario.salario),
          ativo: true
        }]);

      if (error) throw error;

      alert('Funcionário adicionado com sucesso!');
      setNovoFuncionario({ nome: '', cargo: '', salario: '', loja: 'tatuape' });
      carregarDados();
    } catch (error) {
      alert('Erro ao adicionar funcionário: ' + error.message);
    }
  };

  const calcularComissao = (vendedor) => {
    const vendasVendedor = dadosVendas.filter(v => v.vendedor_nome === vendedor);
    const totalVendas = vendasVendedor.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
    
    // 3% de comissão sobre vendas
    return totalVendas * 0.03;
  };

  if (loading) {
    return (
      <Container>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          Carregando...
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src="/images/logo.png" alt="VH Logo" style={{ height: '60px', filter: 'brightness(0) invert(1)' }} />
          <div>
            <h2 style={{ margin: 0, color: '#ffffff' }}>SISTEMA FINANCEIRO</h2>
            <div style={{ color: '#cccccc', fontSize: '0.9rem' }}>Usuário: {user.nome}</div>
          </div>
        </div>
        <Button onClick={onLogout}>Sair</Button>
      </Header>

      <TabContainer>
        <Tab $active={activeTab === 'vendas-semanais'} onClick={() => setActiveTab('vendas-semanais')}>
          Vendas Semanais
        </Tab>
        <Tab $active={activeTab === 'total-semanal'} onClick={() => setActiveTab('total-semanal')}>
          Total Semanal
        </Tab>
        <Tab $active={activeTab === 'categorias'} onClick={() => setActiveTab('categorias')}>
          Por Categoria
        </Tab>
        <Tab $active={activeTab === 'despesas'} onClick={() => setActiveTab('despesas')}>
          Despesas
        </Tab>
        <Tab $active={activeTab === 'receitas'} onClick={() => setActiveTab('receitas')}>
          Receitas
        </Tab>
        <Tab $active={activeTab === 'funcionarios'} onClick={() => setActiveTab('funcionarios')}>
          Funcionários
        </Tab>
        <Tab $active={activeTab === 'salarios'} onClick={() => setActiveTab('salarios')}>
          Salários
        </Tab>
        <Tab $active={activeTab === 'comissoes'} onClick={() => setActiveTab('comissoes')}>
          Comissões
        </Tab>
      </TabContainer>

      <Content>
        {activeTab === 'vendas-semanais' && (
          <Card>
            <h3>📊 Vendas Semanais por Vendedor</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {calcularVendasSemanais().map((vendedor, index) => (
                <div key={index} style={{ background: '#222', padding: '15px', borderRadius: '8px' }}>
                  <h4>{vendedor.nome}</h4>
                  <p>Loja: {vendedor.loja.toUpperCase()}</p>
                  <p>Vendas: {vendedor.vendas}</p>
                  <p>Total: {formatarValor(vendedor.valor)}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'total-semanal' && (
          <Card>
            <h3>💰 Venda Total por Semana</h3>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#10b981', marginBottom: '20px' }}>
                {formatarValor(calcularTotalSemanal())}
              </div>
              <p>Total de vendas desta semana</p>
            </div>
          </Card>
        )}

        {activeTab === 'categorias' && (
          <Card>
            <h3>📋 Relatório por Categoria</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              {Object.entries(calcularPorCategoria()).map(([categoria, dados]) => (
                <div key={categoria} style={{ background: '#222', padding: '15px', borderRadius: '8px' }}>
                  <h4>{categoria}</h4>
                  <p>Vendas: {dados.vendas}</p>
                  <p>Total: {formatarValor(dados.valor)}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'despesas' && (
          <Card>
            <h3>💸 Controle de Despesas</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <h4>Mensal</h4>
                <p>Aluguel: {formatarValor(6300)}</p>
                <p>Energia: {formatarValor(1400)}</p>
                <p>Funcionários: {formatarValor(15000)}</p>
              </div>
              <div>
                <h4>Semanal</h4>
                <p>Aluguel: {formatarValor(1575)}</p>
                <p>Energia: {formatarValor(350)}</p>
                <p>Funcionários: {formatarValor(3750)}</p>
              </div>
            </div>
            
            <h4>Nova Despesa</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <Input placeholder="Descrição" value={novaDespesa.descricao} onChange={(e) => setNovaDespesa({...novaDespesa, descricao: e.target.value})} />
              <Input type="number" placeholder="Valor" value={novaDespesa.valor} onChange={(e) => setNovaDespesa({...novaDespesa, valor: e.target.value})} />
              <Input placeholder="Categoria" value={novaDespesa.categoria} onChange={(e) => setNovaDespesa({...novaDespesa, categoria: e.target.value})} />
              <Select value={novaDespesa.loja} onChange={(e) => setNovaDespesa({...novaDespesa, loja: e.target.value})}>
                <option value="tatuape">Tatuapé</option>
                <option value="mogi">Mogi</option>
              </Select>
            </div>
            <Button className="success" onClick={() => alert('Despesa registrada!')}>Registrar Despesa</Button>
          </Card>
        )}

        {activeTab === 'receitas' && (
          <Card>
            <h3>💰 Controle de Receitas</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <h4>Mensal</h4>
                <p>Vendas: {formatarValor(dadosVendas.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0))}</p>
                <p>Outras: {formatarValor(0)}</p>
              </div>
              <div>
                <h4>Semanal</h4>
                <p>Vendas: {formatarValor(calcularTotalSemanal())}</p>
                <p>Outras: {formatarValor(0)}</p>
              </div>
            </div>
            
            <h4>Nova Receita</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <Input placeholder="Descrição" value={novaReceita.descricao} onChange={(e) => setNovaReceita({...novaReceita, descricao: e.target.value})} />
              <Input type="number" placeholder="Valor" value={novaReceita.valor} onChange={(e) => setNovaReceita({...novaReceita, valor: e.target.value})} />
              <Input placeholder="Categoria" value={novaReceita.categoria} onChange={(e) => setNovaReceita({...novaReceita, categoria: e.target.value})} />
              <Select value={novaReceita.loja} onChange={(e) => setNovaReceita({...novaReceita, loja: e.target.value})}>
                <option value="tatuape">Tatuapé</option>
                <option value="mogi">Mogi</option>
              </Select>
            </div>
            <Button className="success" onClick={() => alert('Receita registrada!')}>Registrar Receita</Button>
          </Card>
        )}

        {activeTab === 'funcionarios' && (
          <Card>
            <h3>👥 Adicionar Novo Funcionário</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '20px' }}>
              <Input placeholder="Nome" value={novoFuncionario.nome} onChange={(e) => setNovoFuncionario({...novoFuncionario, nome: e.target.value})} />
              <Select value={novoFuncionario.cargo} onChange={(e) => setNovoFuncionario({...novoFuncionario, cargo: e.target.value})}>
                <option value="">Selecione o cargo</option>
                <option value="vendedor">Vendedor</option>
                <option value="gerente">Gerente</option>
                <option value="caixa">Caixa</option>
                <option value="estoquista">Estoquista</option>
              </Select>
              <Input type="number" placeholder="Salário" value={novoFuncionario.salario} onChange={(e) => setNovoFuncionario({...novoFuncionario, salario: e.target.value})} />
              <Select value={novoFuncionario.loja} onChange={(e) => setNovoFuncionario({...novoFuncionario, loja: e.target.value})}>
                <option value="tatuape">Tatuapé</option>
                <option value="mogi">Mogi</option>
              </Select>
            </div>
            <Button className="success" onClick={adicionarFuncionario}>Adicionar Funcionário</Button>
            
            <h4 style={{ marginTop: '30px' }}>Funcionários Cadastrados</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
              {funcionarios.map((func, index) => (
                <div key={index} style={{ background: '#222', padding: '15px', borderRadius: '8px' }}>
                  <h5>{func.nome}</h5>
                  <p>Cargo: {func.tipo}</p>
                  <p>Loja: {func.loja.toUpperCase()}</p>
                  <p>Salário: {formatarValor(func.salario_base || 0)}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'salarios' && (
          <Card>
            <h3>💵 Controle de Salários</h3>
            <div style={{ marginBottom: '20px' }}>
              <h4>Total Folha de Pagamento: {formatarValor(funcionarios.reduce((sum, f) => sum + (f.salario_base || 0), 0))}</h4>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
              {funcionarios.map((func, index) => (
                <div key={index} style={{ background: '#222', padding: '15px', borderRadius: '8px' }}>
                  <h5>{func.nome}</h5>
                  <p>Cargo: {func.tipo}</p>
                  <p>Loja: {func.loja.toUpperCase()}</p>
                  <p>Salário Base: {formatarValor(func.salario_base || 0)}</p>
                  <p>Comissão: {formatarValor(calcularComissao(func.nome))}</p>
                  <p style={{ fontWeight: 'bold', color: '#10b981' }}>
                    Total: {formatarValor((func.salario_base || 0) + calcularComissao(func.nome))}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'comissoes' && (
          <Card>
            <h3>🎯 Calcular Comissões</h3>
            <p>Sistema de comissão: 3% sobre vendas realizadas</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
              {funcionarios.filter(f => f.tipo === 'vendedor').map((vendedor, index) => {
                const vendasVendedor = dadosVendas.filter(v => v.vendedor_nome === vendedor.nome);
                const totalVendas = vendasVendedor.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
                const comissao = totalVendas * 0.03;
                
                return (
                  <div key={index} style={{ background: '#222', padding: '15px', borderRadius: '8px' }}>
                    <h5>{vendedor.nome}</h5>
                    <p>Loja: {vendedor.loja.toUpperCase()}</p>
                    <p>Vendas: {vendasVendedor.length}</p>
                    <p>Total Vendido: {formatarValor(totalVendas)}</p>
                    <p style={{ fontWeight: 'bold', color: '#10b981' }}>
                      Comissão (3%): {formatarValor(comissao)}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </Content>
    </Container>
  );
}