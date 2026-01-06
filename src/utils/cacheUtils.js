// Utilitário para limpar cache e garantir uso do banco correto

export const clearSupabaseCache = () => {
  try {
    // Limpar localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Limpar sessionStorage
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    
    console.log('🧹 Cache do Supabase limpo');
    return true;
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
    return false;
  }
};

export const forceCorrectDatabase = () => {
  // Garantir que estamos usando o banco correto
  const correctUrl = 'https://cuukvbdlzzksaxyjielo.supabase.co';
  
  // Verificar se há alguma configuração incorreta no localStorage
  const currentConfig = localStorage.getItem('supabase.auth.token');
  if (currentConfig) {
    try {
      const config = JSON.parse(currentConfig);
      if (config.url && config.url !== correctUrl) {
        console.log('🔧 Corrigindo URL do banco no cache');
        localStorage.removeItem('supabase.auth.token');
      }
    } catch (e) {
      // Ignorar erros de parsing
    }
  }
  
  console.log('✅ Banco correto configurado:', correctUrl);
};

// Executar automaticamente ao importar
if (typeof window !== 'undefined') {
  clearSupabaseCache();
  forceCorrectDatabase();
}