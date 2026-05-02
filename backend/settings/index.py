import json
import os
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage site settings and information with Yandex Maps API key
    Args: event with httpMethod, body, queryStringParameters
    Returns: HTTP response with settings data and API keys
    '''
    import psycopg2
    from psycopg2.extras import RealDictCursor
    
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Accept, Cache-Control, X-User-Id, X-Auth-Token, X-Session-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    db_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            get_api_key = params.get('api_key') == 'yandex_maps'
            get_holiday = params.get('holiday_settings') == 'true'
            
            if get_holiday:
                cur.execute("""
                    SELECT enabled, active_holiday, show_banner, calendar_enabled, 
                           calendar_days_feb23, calendar_days_march8, updated_at
                    FROM t_p77282076_fruit_shop_creation.holiday_settings
                    WHERE id = 1
                """)
                row = cur.fetchone()
                
                if row:
                    holiday_settings = {
                        'enabled': row['enabled'],
                        'activeHoliday': row['active_holiday'],
                        'showBanner': row['show_banner'],
                        'calendarEnabled': row['calendar_enabled'],
                        'calendarDays': {
                            'feb23': row['calendar_days_feb23'],
                            'march8': row['calendar_days_march8']
                        },
                        'updatedAt': row['updated_at'].isoformat() if row['updated_at'] else None
                    }
                else:
                    holiday_settings = {
                        'enabled': False,
                        'activeHoliday': None,
                        'showBanner': False,
                        'calendarEnabled': False,
                        'calendarDays': {'feb23': 8, 'march8': 8},
                        'updatedAt': None
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(holiday_settings),
                    'isBase64Encoded': False
                }
            
            if get_api_key:
                yandex_key = os.environ.get('YANDEX_MAPS_API_KEY', '')
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'api_key': yandex_key}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT * FROM site_settings WHERE id = 1")
            settings = cur.fetchone()
            
            if not settings:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'settings': {
                            'site_name': 'Питомник растений',
                            'site_description': 'Плодовые и декоративные культуры высокого качества',
                            'phone': '+7 (495) 123-45-67',
                            'email': 'info@plantsnursery.ru',
                            'address': 'Московская область, г. Пушкино, ул. Садовая, 15',
                            'work_hours': 'Пн-Вс: 9:00 - 19:00',
                            'promotions': '',
                            'additional_info': ''
                        }
                    }),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'settings': dict(settings)}, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            
            timer_only = (
                'chat_response_warning_seconds' in body_data
                and 'chat_response_danger_seconds' in body_data
                and 'site_name' not in body_data
            )
            if timer_only:
                try:
                    warn_sec = int(body_data.get('chat_response_warning_seconds', 60))
                    danger_sec = int(body_data.get('chat_response_danger_seconds', 180))
                    if warn_sec < 5 or danger_sec < 5 or danger_sec <= warn_sec:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Invalid timer values'}),
                            'isBase64Encoded': False
                        }
                    cur.execute(
                        f"UPDATE site_settings SET chat_response_warning_seconds = {warn_sec}, chat_response_danger_seconds = {danger_sec} WHERE id = 1"
                    )
                    if cur.rowcount == 0:
                        cur.execute(
                            f"INSERT INTO site_settings (id, chat_response_warning_seconds, chat_response_danger_seconds) VALUES (1, {warn_sec}, {danger_sec})"
                        )
                    conn.commit()
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True, 'chat_response_warning_seconds': warn_sec, 'chat_response_danger_seconds': danger_sec}),
                        'isBase64Encoded': False
                    }
                except Exception as e:
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': str(e)}),
                        'isBase64Encoded': False
                    }
            
            def safe_str(value):
                if value is None:
                    return ''
                return str(value).replace("'", "''")
            
            site_name = safe_str(body_data.get('site_name', ''))
            logo_url = safe_str(body_data.get('logo_url', ''))
            site_desc = safe_str(body_data.get('site_description', ''))
            phone = safe_str(body_data.get('phone', ''))
            email = safe_str(body_data.get('email', ''))
            address = safe_str(body_data.get('address', ''))
            work_hours = safe_str(body_data.get('work_hours', ''))
            promotions = safe_str(body_data.get('promotions', ''))
            additional_info = safe_str(body_data.get('additional_info', ''))
            price_list_url = safe_str(body_data.get('price_list_url', ''))
            holiday_theme = safe_str(body_data.get('holiday_theme', 'none')) if body_data.get('holiday_theme') else 'none'
            loyalty_card_price = body_data.get('loyalty_card_price', 500) if body_data.get('loyalty_card_price') is not None else 500
            loyalty_unlock_amount = body_data.get('loyalty_unlock_amount', 5000) if body_data.get('loyalty_unlock_amount') is not None else 5000
            loyalty_cashback_percent = body_data.get('loyalty_cashback_percent', 5) if body_data.get('loyalty_cashback_percent') is not None else 5
            balance_payment_cashback_percent = body_data.get('balance_payment_cashback_percent', 5) if body_data.get('balance_payment_cashback_percent') is not None else 5
            admin_pin = safe_str(body_data.get('admin_pin', '0000')) if body_data.get('admin_pin') else '0000'
            alfabank_login = safe_str(body_data.get('alfabank_login', ''))
            alfabank_password = safe_str(body_data.get('alfabank_password', ''))
            delivery_enabled = bool(body_data.get('delivery_enabled', False))
            pickup_enabled = bool(body_data.get('pickup_enabled', False))
            preorder_enabled = bool(body_data.get('preorder_enabled', False))
            preorder_message = safe_str(body_data.get('preorder_message', 'Предзаказ на весну 2026. Доставка с марта по май 2026 года.'))
            preorder_start_date = body_data.get('preorder_start_date')
            preorder_end_date = body_data.get('preorder_end_date')
            
            if preorder_start_date:
                preorder_start_date = f"'{preorder_start_date}'"
            else:
                preorder_start_date = 'NULL'
            
            if preorder_end_date:
                preorder_end_date = f"'{preorder_end_date}'"
            else:
                preorder_end_date = 'NULL'
            
            delivery_price = body_data.get('delivery_price', 0) if body_data.get('delivery_price') is not None else 0
            free_delivery_min = body_data.get('free_delivery_min', 3000) if body_data.get('free_delivery_min') is not None else 3000
            courier_delivery_price = body_data.get('courier_delivery_price', 300) if body_data.get('courier_delivery_price') is not None else 300
            
            about_title = safe_str(body_data.get('about_title', ''))
            about_text = safe_str(body_data.get('about_text', ''))
            care_title = safe_str(body_data.get('care_title', ''))
            care_watering_title = safe_str(body_data.get('care_watering_title', ''))
            care_watering_text = safe_str(body_data.get('care_watering_text', ''))
            care_lighting_title = safe_str(body_data.get('care_lighting_title', ''))
            care_lighting_text = safe_str(body_data.get('care_lighting_text', ''))
            care_pruning_title = safe_str(body_data.get('care_pruning_title', ''))
            care_pruning_text = safe_str(body_data.get('care_pruning_text', ''))
            delivery_title = safe_str(body_data.get('delivery_title', ''))
            delivery_courier_title = safe_str(body_data.get('delivery_courier_title', ''))
            delivery_courier_text = safe_str(body_data.get('delivery_courier_text', ''))
            delivery_transport_title = safe_str(body_data.get('delivery_transport_title', ''))
            delivery_transport_text = safe_str(body_data.get('delivery_transport_text', ''))
            delivery_pickup_title = safe_str(body_data.get('delivery_pickup_title', ''))
            delivery_pickup_text = safe_str(body_data.get('delivery_pickup_text', ''))
            payment_title = safe_str(body_data.get('payment_title', ''))
            
            payment_methods = body_data.get('payment_methods', '')
            if isinstance(payment_methods, str):
                payment_methods_json = json.dumps([m.strip() for m in payment_methods.split('\n') if m.strip()])
            else:
                payment_methods_json = json.dumps(payment_methods)
            payment_methods_json = payment_methods_json.replace("'", "''")
            
            is_maintenance_mode = bool(body_data.get('is_maintenance_mode', False))
            maintenance_reason = safe_str(body_data.get('maintenance_reason', 'Сайт временно закрыт на техническое обслуживание'))
            auto_maintenance_enabled = bool(body_data.get('auto_maintenance_enabled', False))
            maintenance_start_time = body_data.get('maintenance_start_time')
            maintenance_end_time = body_data.get('maintenance_end_time')
            show_online_counter = bool(body_data.get('show_online_counter', False))
            online_boost = body_data.get('online_boost', 0) if body_data.get('online_boost') is not None else 0
            
            if maintenance_start_time:
                maintenance_start_time = f"'{maintenance_start_time}'"
            else:
                maintenance_start_time = 'NULL'
            
            if maintenance_end_time:
                maintenance_end_time = f"'{maintenance_end_time}'"
            else:
                maintenance_end_time = 'NULL'
            
            cur.execute(
                f"""INSERT INTO site_settings (
                    id, site_name, logo_url, site_description, phone, email, address, work_hours, promotions, additional_info, price_list_url, 
                    holiday_theme, loyalty_card_price, loyalty_unlock_amount, loyalty_cashback_percent, balance_payment_cashback_percent, admin_pin,
                    alfabank_login, alfabank_password,
                    delivery_enabled, pickup_enabled, preorder_enabled, preorder_message, preorder_start_date, preorder_end_date, 
                    delivery_price, free_delivery_min, courier_delivery_price,
                    about_title, about_text, care_title, care_watering_title, care_watering_text, care_lighting_title, care_lighting_text,
                    care_pruning_title, care_pruning_text, delivery_title, delivery_courier_title, delivery_courier_text,
                    delivery_transport_title, delivery_transport_text, delivery_pickup_title, delivery_pickup_text,
                    payment_title, payment_methods,
                    is_maintenance_mode, maintenance_reason, auto_maintenance_enabled, maintenance_start_time, maintenance_end_time,
                    show_online_counter, online_boost
                   )
                   VALUES (1, '{site_name}', '{logo_url}', '{site_desc}', '{phone}', '{email}', '{address}', '{work_hours}', '{promotions}', '{additional_info}', '{price_list_url}', 
                    '{holiday_theme}', {loyalty_card_price}, {loyalty_unlock_amount}, {loyalty_cashback_percent}, {balance_payment_cashback_percent}, '{admin_pin}',
                    '{alfabank_login}', '{alfabank_password}',
                    {delivery_enabled}, {pickup_enabled}, {preorder_enabled}, '{preorder_message}', {preorder_start_date}, {preorder_end_date},
                    {delivery_price}, {free_delivery_min}, {courier_delivery_price},
                    '{about_title}', '{about_text}', '{care_title}', '{care_watering_title}', '{care_watering_text}', '{care_lighting_title}', '{care_lighting_text}',
                    '{care_pruning_title}', '{care_pruning_text}', '{delivery_title}', '{delivery_courier_title}', '{delivery_courier_text}',
                    '{delivery_transport_title}', '{delivery_transport_text}', '{delivery_pickup_title}', '{delivery_pickup_text}',
                    '{payment_title}', '{payment_methods_json}'::jsonb,
                    {is_maintenance_mode}, '{maintenance_reason}', {auto_maintenance_enabled}, {maintenance_start_time}, {maintenance_end_time},
                    {show_online_counter}, {online_boost}
                   )
                   ON CONFLICT (id) DO UPDATE SET
                   site_name = EXCLUDED.site_name,
                   logo_url = EXCLUDED.logo_url,
                   site_description = EXCLUDED.site_description,
                   phone = EXCLUDED.phone,
                   email = EXCLUDED.email,
                   address = EXCLUDED.address,
                   work_hours = EXCLUDED.work_hours,
                   promotions = EXCLUDED.promotions,
                   additional_info = EXCLUDED.additional_info,
                   price_list_url = EXCLUDED.price_list_url,
                   holiday_theme = EXCLUDED.holiday_theme,
                   loyalty_card_price = EXCLUDED.loyalty_card_price,
                   loyalty_unlock_amount = EXCLUDED.loyalty_unlock_amount,
                   loyalty_cashback_percent = EXCLUDED.loyalty_cashback_percent,
                   balance_payment_cashback_percent = EXCLUDED.balance_payment_cashback_percent,
                   admin_pin = EXCLUDED.admin_pin,
                   alfabank_login = EXCLUDED.alfabank_login,
                   alfabank_password = EXCLUDED.alfabank_password,
                   delivery_enabled = EXCLUDED.delivery_enabled,
                   pickup_enabled = EXCLUDED.pickup_enabled,
                   preorder_enabled = EXCLUDED.preorder_enabled,
                   preorder_message = EXCLUDED.preorder_message,
                   preorder_start_date = EXCLUDED.preorder_start_date,
                   preorder_end_date = EXCLUDED.preorder_end_date,
                   delivery_price = EXCLUDED.delivery_price,
                   free_delivery_min = EXCLUDED.free_delivery_min,
                   courier_delivery_price = EXCLUDED.courier_delivery_price,
                   about_title = EXCLUDED.about_title,
                   about_text = EXCLUDED.about_text,
                   care_title = EXCLUDED.care_title,
                   care_watering_title = EXCLUDED.care_watering_title,
                   care_watering_text = EXCLUDED.care_watering_text,
                   care_lighting_title = EXCLUDED.care_lighting_title,
                   care_lighting_text = EXCLUDED.care_lighting_text,
                   care_pruning_title = EXCLUDED.care_pruning_title,
                   care_pruning_text = EXCLUDED.care_pruning_text,
                   delivery_title = EXCLUDED.delivery_title,
                   delivery_courier_title = EXCLUDED.delivery_courier_title,
                   delivery_courier_text = EXCLUDED.delivery_courier_text,
                   delivery_transport_title = EXCLUDED.delivery_transport_title,
                   delivery_transport_text = EXCLUDED.delivery_transport_text,
                   delivery_pickup_title = EXCLUDED.delivery_pickup_title,
                   delivery_pickup_text = EXCLUDED.delivery_pickup_text,
                   payment_title = EXCLUDED.payment_title,
                   payment_methods = EXCLUDED.payment_methods,
                   is_maintenance_mode = EXCLUDED.is_maintenance_mode,
                   maintenance_reason = EXCLUDED.maintenance_reason,
                   auto_maintenance_enabled = EXCLUDED.auto_maintenance_enabled,
                   maintenance_start_time = EXCLUDED.maintenance_start_time,
                   maintenance_end_time = EXCLUDED.maintenance_end_time,
                   show_online_counter = EXCLUDED.show_online_counter,
                   online_boost = EXCLUDED.online_boost,
                   updated_at = CURRENT_TIMESTAMP
                   RETURNING *"""
            )
            conn.commit()
            settings = cur.fetchone()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'settings': dict(settings)}, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'update_holiday':
                enabled = body_data.get('enabled', False)
                active_holiday = body_data.get('activeHoliday')
                show_banner = body_data.get('showBanner', False)
                calendar_enabled = body_data.get('calendarEnabled', False)
                calendar_days = body_data.get('calendarDays', {})
                
                cur.execute("""
                    UPDATE t_p77282076_fruit_shop_creation.holiday_settings
                    SET enabled = %s, active_holiday = %s, show_banner = %s, 
                        calendar_enabled = %s, calendar_days_feb23 = %s, 
                        calendar_days_march8 = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = 1
                """, (enabled, active_holiday, show_banner, calendar_enabled,
                      calendar_days.get('feb23', 8), calendar_days.get('march8', 8)))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Holiday settings updated'}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()