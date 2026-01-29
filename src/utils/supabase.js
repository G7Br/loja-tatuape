import { createClient } from '@supabase/supabase-js';

// CONFIGURAÇÃO UNIFICADA - TODOS USAM O PROJETO TATUAPÉ
// ⚠️ IMPORTANTE: Sempre usar este banco para ambas as lojas (Tatuapé e Mogi)
const supabaseUrl = 'https://cuukvbdlzzksaxyjielo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1dWt2YmRsenprc2F4eWppZWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjMzNDMsImV4cCI6MjA3OTY5OTM0M30.hGGVP4iHX35hJT5KHcth91z5KENS5urO5z5uVT2gcso';

// Log para confirmar qual banco está sendo usado
console.log('🔗 Supabase URL configurada:', supabaseUrl);

// Cliente único para ambas as lojas
export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper para obter tabela baseada na loja atual
export const getTableName = (baseTable, user = null) => {
  const currentStore = user?.loja || authService?.getCurrentStore?.() || 'tatuape';
  return `${baseTable}_${currentStore}`;
};

// Helper para queries com loja dinâmica
export const queryWithStore = (baseTable, user = null) => {
  const tableName = getTableName(baseTable, user);
  return supabase.from(tableName);
};

// Helper para detectar loja pelo email
const detectStoreFromEmail = (email) => {
  if (email.includes('.tatuape@') || email.includes('@tatuape.')) return 'tatuape';
  if (email.includes('.mogi@') || email.includes('@mogi.')) return 'mogi';
  return null;
};

// Helper para redirecionar baseado na loja e cargo
const redirectUser = (store, cargo) => {
  console.log('=== REDIRECT DEBUG ===');
  console.log('Loja:', store);
  console.log('Cargo:', cargo);
  console.log('Tipo do cargo:', typeof cargo);
  
  // Verificar se é usuário online (independente da loja)
  if (['vendedor_online', 'gerente_online', 'separador_online', 'caixa_online'].includes(cargo)) {
    return '/online';
  }
  
  if (store === 'mogi') {
    let redirectPath;
    switch (cargo) {
      case 'vendedor':
        redirectPath = '/mogi/vendedor';
        break;
      case 'gerente':
        redirectPath = '/mogi/gerente';
        break;
      case 'caixa':
        redirectPath = '/mogi';
        break;
      default:
        redirectPath = '/mogi';
        console.log('Cargo não reconhecido, usando /mogi como padrão');
    }
    console.log('Redirecionando para:', redirectPath);
    return redirectPath;
  } else {
    console.log('Redirecionando para Tatuapé: /');
    return '/';
  }
};

export const authService = {
  login: async (usuario, senha) => {
    try {
      // Detectar loja automaticamente pelo email
      const detectedStore = detectStoreFromEmail(usuario);
      const tableName = `usuarios_${detectedStore || 'tatuape'}`;
      
      console.log('🔍 Tentando login:', {
        usuario,
        detectedStore,
        tableName,
        supabaseUrl: supabaseUrl
      });
      
      // Buscar na tabela usuarios com sufixo da loja
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('email', usuario)
        .eq('senha', senha)
        .eq('ativo', true)
        .single();
      
      if (error || !data) {
        return { user: null, error: 'Usuário ou senha inválidos' };
      }
      
      console.log('=== LOGIN SUCCESS ===');
      console.log('Dados do usuário:', data);
      console.log('Campo cargo:', data.cargo);
      console.log('Campo tipo:', data.tipo);
      console.log('Loja detectada:', detectedStore);
      
      // Usar cargo ou tipo_usuario, o que estiver disponível
      const userRole = data.cargo || data.tipo || data.tipo_usuario;
      console.log('Role final usado:', userRole);
      
      const userWithStore = { ...data, loja: detectedStore || 'tatuape' };
      localStorage.setItem('current_user', JSON.stringify(userWithStore));
      localStorage.setItem('current_store', detectedStore || 'tatuape');
      
      const redirectPath = redirectUser(detectedStore || 'tatuape', userRole);
      
      return { 
        user: userWithStore, 
        error: null, 
        redirectTo: detectedStore || 'tatuape',
        redirectPath 
      };
    } catch (error) {
      return { user: null, error: error.message };
    }
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('current_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  getCurrentStore: () => {
    return localStorage.getItem('current_store') || 'tatuape';
  },

  signOut: () => {
    localStorage.removeItem('current_user');
    localStorage.removeItem('current_store');
    localStorage.removeItem('user_tatuape');
    return Promise.resolve();
  }
};
