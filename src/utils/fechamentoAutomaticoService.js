import { supabase } from './supabase';

class FechamentoAutomaticoService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
  }

  // Iniciar monitoramento automático
  iniciar() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🕐 Serviço de fechamento automático iniciado');
    
    // Executar imediatamente
    this.executarFechamento();
    
    // Executar a cada hora
    this.intervalId = setInterval(() => {
      this.executarFechamento();
    }, 60 * 60 * 1000); // 1 hora
  }

  // Parar monitoramento
  parar() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Serviço de fechamento automático parado');
  }

  // Executar fechamento automático
  async executarFechamento() {
    try {
      const agora = new Date();
      const horaAtual = agora.getHours();
      
      // Executar apenas entre 00:00 e 01:00
      if (horaAtual === 0) {
        console.log('🔄 Executando fechamento automático de caixa...');
        
        const { error } = await supabase.rpc('fechar_caixa_automatico_mogi');
        
        if (error) {
          console.error('❌ Erro no fechamento automático:', error);
        } else {
          console.log('✅ Fechamento automático executado com sucesso');
        }
      }
    } catch (error) {
      console.error('❌ Erro no serviço de fechamento automático:', error);
    }
  }

  // Forçar fechamento manual
  async forcarFechamento() {
    try {
      console.log('🔄 Forçando fechamento automático...');
      
      const { error } = await supabase.rpc('fechar_caixa_automatico_mogi');
      
      if (error) {
        console.error('❌ Erro no fechamento forçado:', error);
        return false;
      } else {
        console.log('✅ Fechamento forçado executado com sucesso');
        return true;
      }
    } catch (error) {
      console.error('❌ Erro no fechamento forçado:', error);
      return false;
    }
  }
}

// Instância singleton
export const fechamentoAutomaticoService = new FechamentoAutomaticoService();