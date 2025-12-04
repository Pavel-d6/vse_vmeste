import sqlite3
from datetime import datetime

def fill_table(data):
    conn = sqlite3.connect('db.sqlite3')
    cursor = conn.cursor()
    
    try:
        insert_query = """
        INSERT INTO api_helprequest 
        (title, description, category, urgency, address, latitude, longitude, 
         contact_name, contact_phone, contact_email, is_active, is_fulfilled, 
         created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        print("1")
        cursor.executemany(insert_query, data)
        print("2")
        conn.commit()
        print(f"Успешно добавлено {len(data)} записей")
        
    except sqlite3.Error as e:
        print(f"Ошибка: {e}")
        conn.rollback()
    
    finally:
        conn.close()


apps = []
data = []
for i in range(int(input("Введите количество записей: "))):
    apps.append(input(str())[3:])

# Получаем текущее время для created_at и updated_at
current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

k = 0
j = [str(i).split() for i in open('coords.txt')]
for i in apps:
    k += 1
    data.append((
        "Прием батареек",                           
        "Сдавайте свои батарейки - помогайте природе",  
        "battery",                                 
        "low",                                      
        f"Адрес: {i}",                              
        float(j[k-1][0]),                           
        float(j[k-1][1]),                          
        "-",                            
        "-",                           
        "eco@mail.ru",                            
        1,                                         
        0,                                        
        current_time,                              
        current_time,                               
        0                                           
    ))

fill_table(data)