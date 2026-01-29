import { supabase } from './supabase';

/**
 * Serviço para criar/remover automaticamente páginas e componentes de lojas
 */
export class LojaFileService {

  /**
   * Cria todas as páginas e componentes para uma nova loja
   */
  static async criarArquivosLoja(codigoLoja, nomeLoja) {
    try {
      // 1. Criar páginas da loja
      await this.criarPaginasLoja(codigoLoja, nomeLoja);
      
      // 2. Criar componentes da loja
      await this.criarComponentesLoja(codigoLoja, nomeLoja);
      
      // 3. Criar utilitários da loja
      await this.criarUtilitariosLoja(codigoLoja);
      
      return true;
    } catch (error) {
      console.error('Erro ao criar arquivos da loja:', error);
      throw error;
    }
  }

  /**
   * Remove todas as páginas e componentes de uma loja
   */
  static async removerArquivosLoja(codigoLoja) {
    try {
      // Lista de arquivos para remover
      const arquivos = [
        `src/pages/${codigoLoja}/index.js`,
        `src/pages/${codigoLoja}/gerente.js`,
        `src/pages/${codigoLoja}/vendedor.js`,
        `src/components/${codigoLoja}/Login${this.capitalize(codigoLoja)}.js`,
        `src/components/${codigoLoja}/Gerente${this.capitalize(codigoLoja)}.js`,
        `src/components/${codigoLoja}/Vendedor${this.capitalize(codigoLoja)}.js`,
        `src/components/${codigoLoja}/Caixa${this.capitalize(codigoLoja)}.js`,
        `src/components/${codigoLoja}/SistemaVendas${this.capitalize(codigoLoja)}.js`,
        `src/utils/supabase${this.capitalize(codigoLoja)}.js`
      ];

      // Simular remoção (em produção, usaria API do sistema de arquivos)
      console.log('Arquivos que seriam removidos:', arquivos);
      
      return true;
    } catch (error) {
      console.error('Erro ao remover arquivos da loja:', error);
      throw error;
    }
  }

  /**
   * Cria as páginas principais da loja
   */
  static async criarPaginasLoja(codigoLoja, nomeLoja) {
    const nomeCapitalizado = this.capitalize(codigoLoja);
    
    // Página principal da loja
    const paginaIndex = `import React from 'react';
import Login${nomeCapitalizado} from '../components/${codigoLoja}/Login${nomeCapitalizado}';

export default function ${nomeCapitalizado}() {
  return <Login${nomeCapitalizado} />;
}`;

    // Página do gerente
    const paginaGerente = `import React from 'react';
import Gerente${nomeCapitalizado} from '../components/${codigoLoja}/Gerente${nomeCapitalizado}';

export default function Gerente${nomeCapitalizado}Page() {
  return <Gerente${nomeCapitalizado} />;
}`;

    // Página do vendedor
    const paginaVendedor = `import React from 'react';
import Vendedor${nomeCapitalizado} from '../components/${codigoLoja}/Vendedor${nomeCapitalizado}';

export default function Vendedor${nomeCapitalizado}Page() {
  return <Vendedor${nomeCapitalizado} />;
}`;

    // Simular criação de arquivos (em produção, usaria API do sistema de arquivos)
    console.log('Páginas criadas para', nomeLoja, ':', {
      [`src/pages/${codigoLoja}/index.js`]: paginaIndex,
      [`src/pages/${codigoLoja}/gerente.js`]: paginaGerente,
      [`src/pages/${codigoLoja}/vendedor.js`]: paginaVendedor
    });
  }

  /**
   * Cria os componentes da loja
   */
  static async criarComponentesLoja(codigoLoja, nomeLoja) {
    const nomeCapitalizado = this.capitalize(codigoLoja);
    
    // Componente de Login
    const componenteLogin = `import React, { useState } from 'react';
import styled from 'styled-components';
import { supabase${nomeCapitalizado} } from '../../utils/supabase${nomeCapitalizado}';

const Container = styled.div\`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000000;
  color: #ffffff;
\`;

const LoginCard = styled.div\`
  background: #1a1a1a;
  padding: 40px;
  border-radius: 16px;
  border: 1px solid #404040;
  width: 100%;
  max-width: 400px;
\`;

const Input = styled.input\`
  width: 100%;
  padding: 12px;
  background: #333333;
  border: 1px solid #666666;
  border-radius: 8px;
  color: #ffffff;
  margin-bottom: 15px;
\`;

const Button = styled.button\`
  width: 100%;
  padding: 15px;
  background: #ffffff;
  color: #000000;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
\`;

export default function Login${nomeCapitalizado}() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase${nomeCapitalizado}
        .from('usuarios_${codigoLoja}')
        .select('*')
        .eq('email', email)
        .eq('senha', senha)
        .eq('ativo', true)
        .single();

      if (error || !data) {
        alert('Email ou senha incorretos');
        return;
      }

      // Redirecionar baseado no tipo de usuário
      if (data.tipo === 'gerente') {
        window.location.href = '/${codigoLoja}/gerente';
      } else if (data.tipo === 'vendedor') {
        window.location.href = '/${codigoLoja}/vendedor';
      } else {
        window.location.href = '/${codigoLoja}/caixa';
      }
      
    } catch (error) {
      console.error('Erro no login:', error);
      alert('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <LoginCard>
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
          ${nomeLoja}
        </h2>
        
        <form onSubmit={handleLogin}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <Input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </LoginCard>
    </Container>
  );
}`;

    // Componente do Gerente
    const componenteGerente = `import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase${nomeCapitalizado} } from '../../utils/supabase${nomeCapitalizado}';

const Container = styled.div\`
  min-height: 100vh;
  background: #000000;
  color: #ffffff;
  padding: 20px;
\`;

const Header = styled.div\`
  background: #1a1a1a;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #404040;
\`;

const Card = styled.div\`
  background: #1a1a1a;
  padding: 25px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #404040;
\`;

export default function Gerente${nomeCapitalizado}() {
  const [vendas, setVendas] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [vendasData, funcionariosData] = await Promise.all([
        supabase${nomeCapitalizado}.from('vendas_${codigoLoja}').select('*').order('created_at', { ascending: false }),
        supabase${nomeCapitalizado}.from('usuarios_${codigoLoja}').select('*').eq('ativo', true)
      ]);

      setVendas(vendasData.data || []);
      setFuncionarios(funcionariosData.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          Carregando...
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <h1>Gerência - ${nomeLoja}</h1>
        <p>Sistema de gestão da loja</p>
      </Header>

      <Card>
        <h3>Vendas Recentes</h3>
        <p>Total de vendas: {vendas.length}</p>
      </Card>

      <Card>
        <h3>Funcionários</h3>
        <p>Total de funcionários: {funcionarios.length}</p>
      </Card>
    </Container>
  );
}`;

    // Componente do Vendedor
    const componenteVendedor = `import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase${nomeCapitalizado} } from '../../utils/supabase${nomeCapitalizado}';

const Container = styled.div\`
  min-height: 100vh;
  background: #000000;
  color: #ffffff;
  padding: 20px;
\`;

const Header = styled.div\`
  background: #1a1a1a;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #404040;
\`;

const Card = styled.div\`
  background: #1a1a1a;
  padding: 25px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #404040;
\`;

export default function Vendedor${nomeCapitalizado}() {
  const [produtos, setProdutos] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [produtosData, vendasData] = await Promise.all([
        supabase${nomeCapitalizado}.from('produtos_${codigoLoja}').select('*').eq('ativo', true),
        supabase${nomeCapitalizado}.from('vendas_${codigoLoja}').select('*').order('created_at', { ascending: false })
      ]);

      setProdutos(produtosData.data || []);
      setVendas(vendasData.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          Carregando...
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <h1>Vendedor - ${nomeLoja}</h1>
        <p>Sistema de vendas</p>
      </Header>

      <Card>
        <h3>Produtos Disponíveis</h3>
        <p>Total de produtos: {produtos.length}</p>
      </Card>

      <Card>
        <h3>Minhas Vendas</h3>
        <p>Total de vendas: {vendas.length}</p>
      </Card>
    </Container>
  );
}`;

    // Simular criação de componentes
    console.log('Componentes criados para', nomeLoja, ':', {
      [`src/components/${codigoLoja}/Login${nomeCapitalizado}.js`]: componenteLogin,
      [`src/components/${codigoLoja}/Gerente${nomeCapitalizado}.js`]: componenteGerente,
      [`src/components/${codigoLoja}/Vendedor${nomeCapitalizado}.js`]: componenteVendedor
    });
  }

  /**
   * Cria os utilitários da loja
   */
  static async criarUtilitariosLoja(codigoLoja) {
    const nomeCapitalizado = this.capitalize(codigoLoja);
    
    // Arquivo de conexão com Supabase específico da loja
    const supabaseConfig = `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase${nomeCapitalizado} = createClient(supabaseUrl, supabaseKey);

// Funções específicas da loja ${codigoLoja}
export const ${codigoLoja}Service = {
  // Buscar produtos
  async buscarProdutos() {
    const { data, error } = await supabase${nomeCapitalizado}
      .from('produtos_${codigoLoja}')
      .select('*')
      .eq('ativo', true);
    
    if (error) throw error;
    return data;
  },

  // Buscar vendas
  async buscarVendas() {
    const { data, error } = await supabase${nomeCapitalizado}
      .from('vendas_${codigoLoja}')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Buscar funcionários
  async buscarFuncionarios() {
    const { data, error } = await supabase${nomeCapitalizado}
      .from('usuarios_${codigoLoja}')
      .select('*')
      .eq('ativo', true);
    
    if (error) throw error;
    return data;
  },

  // Criar venda
  async criarVenda(dadosVenda) {
    const { data, error } = await supabase${nomeCapitalizado}
      .from('vendas_${codigoLoja}')
      .insert([dadosVenda])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};`;

    // Simular criação de utilitários
    console.log('Utilitários criados para', codigoLoja, ':', {
      [`src/utils/supabase${nomeCapitalizado}.js`]: supabaseConfig
    });
  }

  /**
   * Capitaliza a primeira letra
   */
  static capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Gera estrutura de rotas para Next.js
   */
  static gerarRotas(codigoLoja) {
    return {
      [`/${codigoLoja}`]: `Página principal da loja`,
      [`/${codigoLoja}/gerente`]: `Área do gerente`,
      [`/${codigoLoja}/vendedor`]: `Área do vendedor`,
      [`/${codigoLoja}/caixa`]: `Sistema de caixa`
    };
  }
}