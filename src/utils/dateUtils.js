// Utilitários para trabalhar com datas no horário de Brasília
export const getBrasiliaDate = () => {
  return new Date().toLocaleString('pt-BR', { 
    timeZone: 'America/Sao_Paulo' 
  });
};

// Utilitário para formatar valores monetários
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
};

// Função para obter data/hora atual em formato ISO
export const getBrasiliaDateISO = () => {
  return new Date().toISOString();
};

// Função para obter apenas a data (YYYY-MM-DD)
export const getBrasiliaDateOnly = () => {
  return new Date().toISOString().split('T')[0];
};

// Função para formatar data e hora no padrão brasileiro
export const formatBrasiliaDateTime = (dateString) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.warn('Data inválida:', dateString);
      return '-';
    }
    
    // Usar horário local sem conversão de timezone
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error, dateString);
    return '-';
  }
};

// Função para formatar apenas a data no padrão brasileiro
export const formatBrasiliaDate = (dateString) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      console.warn('Data inválida:', dateString);
      return '-';
    }
    
    // Usar horário local sem conversão de timezone
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error, dateString);
    return '-';
  }
};

// Função para formatar apenas o horário no padrão brasileiro
export const formatBrasiliaTime = (dateString) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      console.warn('Data inválida:', dateString);
      return '-';
    }
    
    // Usar horário local sem conversão de timezone
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Erro ao formatar horário:', error, dateString);
    return '-';
  }
};

// Função para criar timestamp no horário de Brasília para inserção no banco
export const createBrasiliaTimestamp = () => {
  const now = new Date();
  
  // Ajustar para horário de Brasília (UTC-3)
  const brasiliaOffset = -3 * 60; // -3 horas em minutos
  const localOffset = now.getTimezoneOffset(); // offset local em minutos
  const totalOffset = brasiliaOffset - localOffset;
  
  const brasiliaTime = new Date(now.getTime() + (totalOffset * 60000));
  
  // Retornar sem 'Z' para que o banco não interprete como UTC
  return brasiliaTime.toISOString().replace('Z', '');
};

// Função para converter UTC para horário de Brasília
export const convertUTCToBrasilia = (utcDateString) => {
  if (!utcDateString) return null;
  
  try {
    const utcDate = new Date(utcDateString);
    
    if (isNaN(utcDate.getTime())) {
      console.warn('Data UTC inválida:', utcDateString);
      return null;
    }
    
    // Converter para horário de Brasília
    const brasiliaDate = new Date(utcDate.toLocaleString('en-US', {
      timeZone: 'America/Sao_Paulo'
    }));
    
    return brasiliaDate;
  } catch (error) {
    console.error('Erro ao converter UTC para Brasília:', error, utcDateString);
    return null;
  }
};