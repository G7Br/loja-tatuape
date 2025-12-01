import psycopg2
import json
from datetime import datetime

# Configurações do Supabase
HOST = "db.cuukvbdlzzksaxyjielo.supabase.co"
PASSWORD = "5xVpuZZLgwcYa5lW"
DATABASE = "postgres"
USER = "postgres"
PORT = "5432"

def get_connection():
    return psycopg2.connect(
        host=HOST,
        database=DATABASE,
        user=USER,
        password=PASSWORD,
        port=PORT
    )

def get_all_tables(conn):
    cursor = conn.cursor()
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    """)
    return [row[0] for row in cursor.fetchall()]

def backup_table_data(conn, table_name):
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM {table_name}")
    columns = [desc[0] for desc in cursor.description]
    rows = cursor.fetchall()
    return columns, rows

def create_sql_backup():
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"supabase_backup_{timestamp}.sql"
    
    try:
        conn = get_connection()
        print("✅ Conectado ao Supabase")
        
        tables = get_all_tables(conn)
        print(f"📋 Encontradas {len(tables)} tabelas")
        
        with open(backup_file, 'w', encoding='utf-8') as f:
            f.write(f"-- Backup Supabase - {datetime.now()}\n\n")
            
            for table in tables:
                print(f"📦 Fazendo backup: {table}")
                
                columns, rows = backup_table_data(conn, table)
                
                if rows:
                    cols_str = ', '.join(columns)
                    f.write(f"INSERT INTO {table} ({cols_str}) VALUES\n")
                    
                    for i, row in enumerate(rows):
                        values = []
                        for val in row:
                            if val is None:
                                values.append('NULL')
                            elif isinstance(val, str):
                                escaped_val = val.replace("'", "''")
                                values.append(f"'{escaped_val}'")
                            else:
                                values.append(str(val))
                        
                        values_str = ', '.join(values)
                        if i == len(rows) - 1:
                            f.write(f"({values_str});\n\n")
                        else:
                            f.write(f"({values_str}),\n")
        
        conn.close()
        print(f"✅ Backup concluído: {backup_file}")
        
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    create_sql_backup()