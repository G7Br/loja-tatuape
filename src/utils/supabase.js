import { createClient } from '@supabase/supabase-js';

// Credenciais Tatuapé
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Credenciais Mogi
const supabaseUrlMogi = 'https://imecyqjxvkxmdgfdvmbk.supabase.co';
const supabaseKeyMogi = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltZWN5cWp4dmt4bWRnZmR2bWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDU1ODgsImV4cCI6MjA4MDE4MTU4OH0.tKvXB75zt68xS3TyP27hX3VjItmIbNsy-OFP28fBw5k';

export const supabase = createClient(supabaseUrl, supabaseKey);
export const supabaseMogi = createClient(supabaseUrlMogi, supabaseKeyMogi);

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
      
      if (detectedStore) {
        // Login direto na loja detectada
        const client = detectedStore === 'mogi' ? supabaseMogi : supabase;
        const { data, error } = await client
          .from(`usuarios_${detectedStore}`)
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
        
        // Usar cargo ou tipo, o que estiver disponível
        const userRole = data.cargo || data.tipo;
        console.log('Role final usado:', userRole);
        
        const userWithStore = { ...data, loja: detectedStore };
        localStorage.setItem('current_user', JSON.stringify(userWithStore));
        localStorage.setItem('current_store', detectedStore);
        
        const redirectPath = redirectUser(detectedStore, userRole);
        
        return { 
          user: userWithStore, 
          error: null, 
          redirectTo: detectedStore,
          redirectPath 
        };
      }
      
      // Se não detectou pelo email, tentar em ambas as lojas
      const stores = ['tatuape', 'mogi'];
      
      for (const store of stores) {
        const client = store === 'mogi' ? supabaseMogi : supabase;
        const { data, error } = await client
          .from(`usuarios_${store}`)
          .select('*')
          .eq('email', usuario)
          .eq('senha', senha)
          .eq('ativo', true)
          .single();
        
        if (!error && data) {
          console.log('=== FALLBACK LOGIN SUCCESS ===');
          console.log('Dados do usuário:', data);
          console.log('Campo cargo:', data.cargo);
          console.log('Campo tipo:', data.tipo);
          console.log('Loja encontrada:', store);
          
          // Usar cargo ou tipo, o que estiver disponível
          const userRole = data.cargo || data.tipo;
          console.log('Role final usado:', userRole);
          
          const userWithStore = { ...data, loja: store };
          localStorage.setItem('current_user', JSON.stringify(userWithStore));
          localStorage.setItem('current_store', store);
          
          const redirectPath = redirectUser(store, userRole);
          
          return { 
            user: userWithStore, 
            error: null, 
            redirectTo: store,
            redirectPath 
          };
        }
      }
      
      return { user: null, error: 'Usuário ou senha inválidos' };
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
    // Manter compatibilidade
    localStorage.removeItem('user_tatuape');
    return Promise.resolve();
  }
};
