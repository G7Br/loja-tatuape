import requests
import json
from datetime import datetime

# Configurações
SUPABASE_URL = "https://sua-url-do-projeto.supabase.co"
SUPABASE_ANON_KEY = "sua-chave-anonima"
SUPABASE_SERVICE_KEY = "sua-chave-de-servico"  # Opcional, para acesso completo

def get_all_tables():
    """Lista todas as tabelas"""
    headers = {
        'apikey': SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY}'
    }
    
    # Consulta para listar tabelas
    query = """
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    """
    
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
        headers=headers,
        json={"query": query}
    )
    
    return response.json() if response.status_code == 200 else []

def backup_table_data(table_name):
    """Baixa dados de uma tabela específica"""
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}'
    }
    
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/{table_name}",
        headers=headers
    )
    
    if response.status_code == 200:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{table_name}_backup_{timestamp}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(response.json(), f, indent=2, ensure_ascii=False)
        
        print(f"✅ {table_name} salvo em {filename}")
        return True
    else:
        print(f"❌ Erro ao baixar {table_name}: {response.status_code}")
        return False

def main():
    print("🔄 Iniciando backup via API...")
    
    # Exemplo: backup de tabelas específicas
    tables = ["usuarios", "produtos", "vendas"]  # Substitua pelos nomes das suas tabelas
    
    for table in tables:
        backup_table_data(table)

if __name__ == "__main__":
    main()