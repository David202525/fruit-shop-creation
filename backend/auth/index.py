import json
import os
from typing import Dict, Any
import bcrypt

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: User authentication and registration
    Args: event with httpMethod, body
    Returns: HTTP response with user data or error
    '''
    try:
        import psycopg2
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Accept, Cache-Control, X-User-Id, X-Auth-Token, X-Session-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        from psycopg2.extras import RealDictCursor
        db_url = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(db_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            params = event.get('queryStringParameters', {})
            action = params.get('action', 'users')
            user_id = params.get('user_id')
            
            if action == 'referral_code' and user_id:
                cur.execute(f"SELECT referral_code FROM referral_codes WHERE user_id = {user_id}")
                code_result = cur.fetchone()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'referral_code': code_result['referral_code'] if code_result else None
                    }),
                    'isBase64Encoded': False
                }
            
            if action == 'get_referral_data' and user_id:
                import random
                import string
                
                cur.execute(f"SELECT referral_code FROM referral_codes WHERE user_id = {user_id}")
                code_result = cur.fetchone()
                
                if code_result:
                    referral_code = code_result['referral_code']
                else:
                    referral_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
                    cur.execute(f"INSERT INTO referral_codes (user_id, referral_code) VALUES ({user_id}, '{referral_code}')")
                    conn.commit()
                
                cur.execute(f"""
                    SELECT 
                        r.id,
                        r.referred_id,
                        r.reward_given,
                        r.first_order_total,
                        r.created_at,
                        u.full_name,
                        u.phone
                    FROM referrals r
                    JOIN users u ON u.id = r.referred_id
                    WHERE r.referrer_id = {user_id}
                    ORDER BY r.created_at DESC
                """)
                referrals_data = cur.fetchall()
                
                referrals = []
                for row in referrals_data:
                    referrals.append({
                        'id': row['id'],
                        'referred_user': {
                            'id': row['referred_id'],
                            'full_name': row['full_name'],
                            'phone': row['phone']
                        },
                        'reward_given': row['reward_given'],
                        'first_order_total': float(row['first_order_total']) if row['first_order_total'] else None,
                        'created_at': row['created_at'].isoformat() if row['created_at'] else None
                    })
                
                cur.execute(f"""
                    SELECT COALESCE(SUM(reward_amount), 0) as total
                    FROM referrals 
                    WHERE referrer_id = {user_id} AND reward_given = true
                """)
                result = cur.fetchone()
                total_earned = float(result['total']) if result else 0
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'referral_code': referral_code,
                        'referrals': referrals,
                        'total_earned': total_earned
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            if action == 'ban_status' and user_id:
                from datetime import datetime
                
                cur.execute(f"SELECT banned, ban_reason, ban_until FROM users WHERE id = {user_id}")
                user = cur.fetchone()
                
                if user and user['banned'] and user['ban_until']:
                    ban_until = user['ban_until']
                    if isinstance(ban_until, str):
                        ban_until = datetime.fromisoformat(ban_until.replace('Z', '+00:00'))
                    
                    if datetime.now(ban_until.tzinfo) >= ban_until:
                        cur.execute(f"UPDATE users SET banned = false, ban_reason = NULL, ban_until = NULL WHERE id = {user_id}")
                        conn.commit()
                        user['banned'] = False
                        user['ban_reason'] = None
                        user['ban_until'] = None
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'banned': user['banned'] if user else False,
                        'ban_reason': user['ban_reason'] if user else None,
                        'ban_until': str(user['ban_until']) if user and user['ban_until'] else None
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            if action == 'get_all_users':
                cur.execute("""
                    SELECT id, phone, full_name, is_admin, is_courier, balance, cashback, avatar, created_at, email 
                    FROM users 
                    ORDER BY created_at DESC
                """)
                users = cur.fetchall()
                
                users_list = []
                for user in users:
                    users_list.append({
                        'id': user['id'],
                        'phone': user['phone'],
                        'full_name': user['full_name'],
                        'is_admin': user['is_admin'],
                        'is_courier': user['is_courier'],
                        'balance': float(user['balance']) if user['balance'] else 0.00,
                        'cashback': float(user['cashback']) if user['cashback'] else 0.00,
                        'avatar': user['avatar'] if user['avatar'] else '👤',
                        'created_at': user['created_at'].isoformat() if user['created_at'] else None,
                        'email': user['email'] if user['email'] else None
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'users': users_list}, default=str),
                    'isBase64Encoded': False
                }
            
            if action == 'user' and user_id:
                cur.execute(f"SELECT id, phone, full_name, is_admin, is_courier, balance, cashback, avatar, email FROM users WHERE id = {user_id}")
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'User not found'}),
                        'isBase64Encoded': False
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'user': {
                            'id': user['id'],
                            'phone': user['phone'],
                            'full_name': user['full_name'],
                            'is_admin': user['is_admin'],
                            'is_courier': user['is_courier'],
                            'balance': float(user['balance']) if user['balance'] else 0.00,
                            'cashback': float(user['cashback']) if user['cashback'] else 0.00,
                            'avatar': user['avatar'] if user['avatar'] else '👤',
                            'email': user['email'] if user['email'] else None
                        }
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            if action == 'codes' and user_id:
                cur.execute(f"SELECT is_admin FROM users WHERE id = {user_id}")
                user = cur.fetchone()
                
                if not user or not user['is_admin']:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Admin access required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    SELECT 
                        lc.id,
                        lc.login_code,
                        lc.created_at,
                        lc.used_at,
                        lc.expires_at,
                        u.full_name as user_name,
                        u.phone,
                        (lc.expires_at < NOW()) as is_expired,
                        (lc.used_at IS NOT NULL) as is_used
                    FROM admin_login_codes lc
                    LEFT JOIN users u ON lc.user_id = u.id
                    ORDER BY lc.created_at DESC
                    LIMIT 100
                """)
                
                login_codes_rows = cur.fetchall()
                login_codes = []
                
                for row in login_codes_rows:
                    login_codes.append({
                        'id': row[0],
                        'login_code': row[1],
                        'created_at': row[2].isoformat() if row[2] else None,
                        'used_at': row[3].isoformat() if row[3] else None,
                        'expires_at': row[4].isoformat() if row[4] else None,
                        'user_name': row[5] or 'Неизвестный',
                        'phone': row[6] or '',
                        'is_expired': row[7],
                        'is_used': row[8]
                    })
                
                cur.execute("""
                    SELECT 
                        pr.id,
                        pr.phone,
                        pr.reset_code,
                        pr.created_at,
                        pr.used_at,
                        pr.expires_at,
                        u.full_name as user_name,
                        u.phone as user_phone,
                        (pr.expires_at < NOW()) as is_expired,
                        (pr.used_at IS NOT NULL) as is_used
                    FROM password_reset_codes pr
                    LEFT JOIN users u ON pr.user_id = u.id
                    ORDER BY pr.created_at DESC
                    LIMIT 100
                """)
                
                reset_codes_rows = cur.fetchall()
                reset_codes = []
                
                for row in reset_codes_rows:
                    reset_codes.append({
                        'id': row[0],
                        'phone': row[1] or '',
                        'reset_code': row[2],
                        'created_at': row[3].isoformat() if row[3] else None,
                        'used_at': row[4].isoformat() if row[4] else None,
                        'expires_at': row[5].isoformat() if row[5] else None,
                        'user_name': row[6] or 'Неизвестный',
                        'user_email': row[7] or row[1] or '',
                        'is_expired': row[8],
                        'is_used': row[9]
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'login_codes': login_codes,
                        'reset_codes': reset_codes
                    }),
                    'isBase64Encoded': False
                }
            
            if action == 'balance' and user_id:
                cur.execute(f"SELECT balance, cashback, is_admin, avatar FROM users WHERE id = {user_id}")
                user = cur.fetchone()
                
                cur.execute(
                    f"SELECT * FROM transactions WHERE user_id = {user_id} ORDER BY created_at DESC LIMIT 50"
                )
                transactions = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'balance': float(user['balance']) if user else 0.00,
                        'cashback': float(user['cashback']) if user else 0.00,
                        'is_admin': user['is_admin'] if user else False,
                        'avatar': user['avatar'] if user else '👤',
                        'transactions': [dict(t) for t in transactions]
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            if action == 'admin_online':
                cur.execute(f"SELECT is_admin FROM users WHERE id = {user_id}")
                user = cur.fetchone()
                if not user or not user['is_admin']:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Admin access required'}),
                        'isBase64Encoded': False
                    }
                
                from datetime import datetime, timedelta
                offline_threshold = (datetime.now() - timedelta(minutes=5)).strftime('%Y-%m-%d %H:%M:%S')
                
                cur.execute(f"""
                    SELECT u.id, u.full_name, u.avatar, aos.last_seen, aos.is_online
                    FROM users u
                    LEFT JOIN admin_online_status aos ON u.id = aos.user_id
                    WHERE u.is_admin = TRUE
                    ORDER BY aos.last_seen DESC NULLS LAST
                """)
                
                admins = cur.fetchall()
                online_admins = []
                for admin in admins:
                    admin_dict = dict(admin)
                    last_seen = admin_dict.get('last_seen')
                    
                    if last_seen and last_seen > datetime.strptime(offline_threshold, '%Y-%m-%d %H:%M:%S'):
                        admin_dict['is_online'] = True
                    else:
                        admin_dict['is_online'] = False
                    
                    online_admins.append(admin_dict)
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'admins': online_admins}, default=str),
                    'isBase64Encoded': False
                }
            
            if action == 'admin_chat':
                cur.execute(f"SELECT is_admin FROM users WHERE id = {user_id}")
                user = cur.fetchone()
                if not user or not user['is_admin']:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Admin access required'}),
                        'isBase64Encoded': False
                    }
                
                limit = int(params.get('limit', 50))
                
                cur.execute(f"""
                    SELECT acm.id, acm.user_id, acm.message, acm.created_at, acm.is_read,
                           u.full_name, u.avatar
                    FROM admin_chat_messages acm
                    JOIN users u ON acm.user_id = u.id
                    ORDER BY acm.created_at DESC
                    LIMIT {limit}
                """)
                
                messages = cur.fetchall()
                messages_list = [dict(msg) for msg in reversed(messages)]
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'messages': messages_list}, default=str),
                    'isBase64Encoded': False
                }
            
            if action == 'all_referral_stats':
                cur.execute("""
                    SELECT 
                        u.id as user_id,
                        u.phone as user_phone,
                        u.full_name as user_name,
                        rc.referral_code as promo_code,
                        COUNT(r.id) as total_referrals,
                        COUNT(CASE WHEN r.reward_given = true THEN 1 END) as successful_referrals,
                        COUNT(CASE WHEN r.reward_given = false THEN 1 END) as pending_referrals,
                        COALESCE(SUM(CASE WHEN r.reward_given = true THEN r.reward_amount ELSE 0 END), 0) as total_earned
                    FROM users u
                    LEFT JOIN referral_codes rc ON rc.user_id = u.id
                    LEFT JOIN referrals r ON r.referrer_id = u.id
                    WHERE rc.referral_code IS NOT NULL
                    GROUP BY u.id, u.phone, u.full_name, rc.referral_code
                    HAVING COUNT(r.id) > 0
                    ORDER BY total_earned DESC, successful_referrals DESC
                """)
                
                stats_data = cur.fetchall()
                result = []
                
                for row in stats_data:
                    user_id = row['user_id']
                    
                    cur.execute(f"""
                        SELECT 
                            r.referred_id,
                            u.phone as referred_phone,
                            u.full_name as referred_name,
                            r.created_at as referred_at,
                            COALESCE(r.first_order_total, 0) as order_total,
                            CASE 
                                WHEN r.reward_given = true THEN 'completed'
                                WHEN r.first_order_total >= 1500 THEN 'processing'
                                ELSE 'pending'
                            END as order_status,
                            COALESCE(r.reward_amount, 0) as bonus_earned,
                            r.reward_given as bonus_awarded
                        FROM referrals r
                        JOIN users u ON u.id = r.referred_id
                        WHERE r.referrer_id = {user_id}
                        ORDER BY r.created_at DESC
                    """)
                    
                    referrals = []
                    for ref_row in cur.fetchall():
                        referrals.append({
                            'referred_user_id': ref_row['referred_id'],
                            'referred_phone': ref_row['referred_phone'],
                            'referred_name': ref_row['referred_name'],
                            'referred_at': ref_row['referred_at'].isoformat() if ref_row['referred_at'] else None,
                            'order_total': float(ref_row['order_total']),
                            'order_status': ref_row['order_status'],
                            'bonus_earned': float(ref_row['bonus_earned']),
                            'bonus_awarded': ref_row['bonus_awarded']
                        })
                    
                    result.append({
                        'user_id': row['user_id'],
                        'user_phone': row['user_phone'],
                        'user_name': row['user_name'],
                        'promo_code': row['promo_code'],
                        'total_referrals': row['total_referrals'],
                        'successful_referrals': row['successful_referrals'],
                        'pending_referrals': row['pending_referrals'],
                        'total_earned': float(row['total_earned']),
                        'referrals': referrals
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'data': result}, default=str),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                """SELECT id, phone, full_name, is_admin, is_super_admin, admin_permissions, balance, cashback, avatar, created_at 
                   FROM users 
                   ORDER BY created_at DESC"""
            )
            users = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'users': [dict(u) for u in users]}, default=str),
                'isBase64Encoded': False
            }
        finally:
            cur.close()
            conn.close()
    

    if method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        user_id = body_data.get('user_id')
        
        if 'snow_effect_enabled' in body_data:
            snow_enabled = body_data.get('snow_effect_enabled')
            
            db_url = os.environ.get('DATABASE_URL')
            conn = psycopg2.connect(db_url)
            cur = conn.cursor()
            
            try:
                cur.execute(
                    f"UPDATE users SET snow_effect_enabled = {snow_enabled} WHERE id = {user_id}"
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            finally:
                cur.close()
                conn.close()
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    action = body_data.get('action')
    
    if action == 'user':
        user_id = body_data.get('user_id')
        if not user_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'user_id required'}),
                'isBase64Encoded': False
            }
        
        from psycopg2.extras import RealDictCursor
        db_url = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(db_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            cur.execute(f"SELECT id, phone, full_name, is_admin, is_courier, balance, cashback, avatar FROM users WHERE id = {user_id}")
            user = cur.fetchone()
            
            if not user:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User not found'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'user': {
                        'id': user['id'],
                        'phone': user['phone'],
                        'full_name': user['full_name'],
                        'is_admin': user['is_admin'],
                        'is_courier': user['is_courier'],
                        'balance': float(user['balance']) if user['balance'] else 0.00,
                        'cashback': float(user['cashback']) if user['cashback'] else 0.00,
                        'avatar': user['avatar'] if user['avatar'] else '👤'
                    }
                }, default=str),
                'isBase64Encoded': False
            }
        finally:
            cur.close()
            conn.close()
    
    phone_raw = body_data.get('phone', '').strip()
    password = body_data.get('password', '')
    login_code = body_data.get('login_code', '')
    
    import re
    cleaned_phone = re.sub(r'\D', '', phone_raw)
    if cleaned_phone.startswith('8'):
        cleaned_phone = '7' + cleaned_phone[1:]
    elif not cleaned_phone.startswith('7'):
        cleaned_phone = '7' + cleaned_phone
    
    if len(cleaned_phone) >= 11:
        phone = f"+7 ({cleaned_phone[1:4]}) {cleaned_phone[4:7]}-{cleaned_phone[7:9]}-{cleaned_phone[9:11]}"
    else:
        phone = phone_raw
    
    print(f"Phone normalization: raw='{phone_raw}' -> cleaned='{cleaned_phone}' -> formatted='{phone}'")
    
    if action in ['update_balance', 'update_cashback', 'toggle_admin', 'ban_user', 'unban_user', 'update_avatar', 'update_permissions', 'create_referral_code', 'update_admin_status', 'send_admin_message', 'mark_chat_read']:
        from psycopg2.extras import RealDictCursor
        db_url = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(db_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            if action == 'create_referral_code':
                user_id = body_data.get('user_id')
                referral_code = body_data.get('referral_code')
                
                if not user_id or not referral_code:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'user_id and referral_code required'}),
                        'isBase64Encoded': False
                    }
                
                code_escaped = referral_code.replace("'", "''")
                cur.execute(
                    f"INSERT INTO referral_codes (user_id, referral_code) VALUES ({user_id}, '{code_escaped}') ON CONFLICT (referral_code) DO NOTHING RETURNING referral_code"
                )
                conn.commit()
                result = cur.fetchone()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'referral_code': result['referral_code'] if result else None
                    }),
                    'isBase64Encoded': False
                }
            
            if action == 'toggle_admin':
                user_id = body_data.get('user_id')
                is_admin = body_data.get('is_admin')
                
                if not user_id or is_admin is None:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'user_id and is_admin are required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    f"UPDATE users SET is_admin = {str(is_admin).lower()} WHERE id = {user_id} RETURNING id, is_admin"
                )
                conn.commit()
                user = cur.fetchone()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'user': dict(user)
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            if action == 'ban_user':
                user_id = body_data.get('user_id')
                ban_reason = body_data.get('ban_reason', '').replace("'", "''")
                duration_hours = body_data.get('duration_hours')
                
                if not user_id or not ban_reason:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'user_id and ban_reason are required'}),
                        'isBase64Encoded': False
                    }
                
                from datetime import datetime, timedelta
                
                if duration_hours == 'permanent':
                    ban_until = None
                    cur.execute(
                        f"UPDATE users SET banned = true, ban_reason = '{ban_reason}', ban_until = NULL WHERE id = {user_id}"
                    )
                else:
                    ban_until = datetime.now() + timedelta(hours=int(duration_hours))
                    cur.execute(
                        f"UPDATE users SET banned = true, ban_reason = '{ban_reason}', ban_until = '{ban_until.isoformat()}' WHERE id = {user_id}"
                    )
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            if action == 'unban_user':
                user_id = body_data.get('user_id')
                
                if not user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'user_id is required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    f"UPDATE users SET banned = false, ban_reason = NULL, ban_until = NULL WHERE id = {user_id}"
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            if action == 'update_avatar':
                user_id = body_data.get('user_id')
                avatar = body_data.get('avatar', '').replace("'", "''")
                
                if not user_id or not avatar:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'user_id and avatar are required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    f"UPDATE users SET avatar = '{avatar}' WHERE id = {user_id} RETURNING avatar"
                )
                conn.commit()
                updated_user = cur.fetchone()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'avatar': updated_user['avatar']
                    }),
                    'isBase64Encoded': False
                }
            
            if action == 'update_permissions':
                user_id = body_data.get('user_id')
                permissions = body_data.get('permissions', [])
                is_super_admin = body_data.get('is_super_admin', False)
                
                if not user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'user_id is required'}),
                        'isBase64Encoded': False
                    }
                
                permissions_escaped = [p.replace("'", "''") for p in permissions]
                permissions_str = "'{" + ','.join(f'{p}' for p in permissions_escaped) + "}'"
                
                cur.execute(
                    f"UPDATE users SET admin_permissions = {permissions_str}::TEXT[], is_super_admin = {str(is_super_admin).lower()} WHERE id = {user_id} RETURNING id, admin_permissions, is_super_admin"
                )
                conn.commit()
                user = cur.fetchone()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'user': dict(user)
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            if action == 'update_admin_status':
                user_id = body_data.get('user_id')
                
                cur.execute(f"SELECT is_admin FROM users WHERE id = {user_id}")
                user = cur.fetchone()
                if not user or not user['is_admin']:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Admin access required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"""
                    INSERT INTO admin_online_status (user_id, last_seen, is_online, updated_at)
                    VALUES ({user_id}, CURRENT_TIMESTAMP, TRUE, CURRENT_TIMESTAMP)
                    ON CONFLICT (user_id) 
                    DO UPDATE SET last_seen = CURRENT_TIMESTAMP, is_online = TRUE, updated_at = CURRENT_TIMESTAMP
                """)
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            if action == 'send_admin_message':
                user_id = body_data.get('user_id')
                message = body_data.get('message', '').strip()
                
                cur.execute(f"SELECT is_admin FROM users WHERE id = {user_id}")
                user = cur.fetchone()
                if not user or not user['is_admin']:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Admin access required'}),
                        'isBase64Encoded': False
                    }
                
                if not message:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Message cannot be empty'}),
                        'isBase64Encoded': False
                    }
                
                message_escaped = message.replace("'", "''")
                
                cur.execute(f"""
                    INSERT INTO admin_chat_messages (user_id, message, created_at, is_read)
                    VALUES ({user_id}, '{message_escaped}', CURRENT_TIMESTAMP, FALSE)
                    RETURNING id, user_id, message, created_at, is_read
                """)
                
                new_message = cur.fetchone()
                
                cur.execute(f"SELECT full_name, avatar FROM users WHERE id = {user_id}")
                user_info = cur.fetchone()
                
                conn.commit()
                
                result = dict(new_message)
                result['full_name'] = user_info['full_name']
                result['avatar'] = user_info['avatar']
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': result}, default=str),
                    'isBase64Encoded': False
                }
            
            if action == 'mark_chat_read':
                user_id = body_data.get('user_id')
                
                cur.execute(f"SELECT is_admin FROM users WHERE id = {user_id}")
                user = cur.fetchone()
                if not user or not user['is_admin']:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Admin access required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("UPDATE admin_chat_messages SET is_read = TRUE WHERE is_read = FALSE")
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }

            
            user_id = body_data.get('user_id')
            amount = body_data.get('amount')
            transaction_type = body_data.get('type')
            description = body_data.get('description', '').replace("'", "''")
            
            if not all([user_id, amount, transaction_type]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'user_id, amount and type are required'}),
                    'isBase64Encoded': False
                }
            
            if transaction_type == 'deposit':
                cur.execute(
                    f"UPDATE users SET balance = balance + {amount} WHERE id = {user_id} RETURNING balance"
                )
            elif transaction_type == 'withdraw':
                cur.execute(f"SELECT balance FROM users WHERE id = {user_id}")
                user = cur.fetchone()
                if not user or float(user['balance']) < float(amount):
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Insufficient balance'}),
                        'isBase64Encoded': False
                    }
                cur.execute(
                    f"UPDATE users SET balance = balance - {amount} WHERE id = {user_id} RETURNING balance"
                )
            elif transaction_type == 'cashback_deposit':
                cur.execute(
                    f"UPDATE users SET cashback = cashback + {amount} WHERE id = {user_id} RETURNING cashback"
                )
            elif transaction_type == 'cashback_used':
                cur.execute(
                    f"UPDATE users SET cashback = cashback - {amount}, balance = balance + {amount} WHERE id = {user_id} RETURNING balance, cashback"
                )
            elif transaction_type == 'cashback_exchange':
                cashback_amount = body_data.get('cashback_amount', 0)
                
                cur.execute(f"SELECT cashback FROM users WHERE id = {user_id}")
                user = cur.fetchone()
                if not user or float(user['cashback']) < float(cashback_amount):
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Недостаточно кэшбека'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    f"UPDATE users SET cashback = cashback - {cashback_amount}, balance = balance + {amount} WHERE id = {user_id} RETURNING balance, cashback"
                )
            
            cur.execute(
                f"INSERT INTO transactions (user_id, type, amount, description) VALUES ({user_id}, '{transaction_type}', {amount}, '{description}') RETURNING *"
            )
            
            conn.commit()
            transaction = cur.fetchone()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'transaction': dict(transaction)
                }, default=str),
                'isBase64Encoded': False
            }
        finally:
            cur.close()
            conn.close()
    
    if method == 'DELETE':
        from psycopg2.extras import RealDictCursor
        db_url = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(db_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            body_data = json.loads(event.get('body', '{}'))
            transaction_ids = body_data.get('transaction_ids', [])
            
            if not transaction_ids:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'transaction_ids required'}),
                    'isBase64Encoded': False
                }
            
            ids_str = ','.join(str(id) for id in transaction_ids)
            cur.execute(f"DELETE FROM transactions WHERE id IN ({ids_str})")
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'deleted_count': cur.rowcount
                }),
                'isBase64Encoded': False
            }
        finally:
            cur.close()
            conn.close()
    
    if action == 'verify_code':
        user_id = body_data.get('user_id')
        if not user_id or not login_code:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'user_id и login_code обязательны'}),
                'isBase64Encoded': False
            }
        
        from datetime import datetime
        
        db_url = os.environ.get('DATABASE_URL')
        if not db_url:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Database not configured'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        code_escaped = login_code.replace("'", "''")
        
        cur.execute(
            f"SELECT id, user_id, used_at, expires_at FROM admin_login_codes WHERE login_code = '{code_escaped}' AND user_id = {user_id}"
        )
        code_record = cur.fetchone()
        
        if not code_record:
            cur.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверный код'}),
                'isBase64Encoded': False
            }
        
        if code_record[2] is not None:
            cur.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Код уже использован'}),
                'isBase64Encoded': False
            }
        
        expires_at = datetime.fromisoformat(str(code_record[3]).replace('Z', '+00:00'))
        if expires_at < datetime.now(expires_at.tzinfo or None):
            cur.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Код истёк'}),
                'isBase64Encoded': False
            }
        
        cur.execute(
            f"UPDATE admin_login_codes SET used_at = CURRENT_TIMESTAMP WHERE id = {code_record[0]}"
        )
        conn.commit()
        
        cur.execute(
            f"SELECT id, phone, full_name, is_admin, balance, cashback, avatar FROM users WHERE id = {user_id}"
        )
        user = cur.fetchone()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'user': {
                    'id': user[0],
                    'phone': user[1],
                    'full_name': user[2],
                    'is_admin': user[3],
                    'balance': float(user[4]) if user[4] else 0.00,
                    'cashback': float(user[5]) if user[5] else 0.00,
                    'avatar': user[6] if user[6] else '👤'
                }
            }),
            'isBase64Encoded': False
        }
    
    if not phone or not password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Телефон и пароль обязательны'}),
            'isBase64Encoded': False
        }
    
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'База данных не настроена'}),
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
    except psycopg2.Error as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка подключения к БД: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    try:
        if action == 'register':
            full_name = body_data.get('full_name', '')
            referral_code = body_data.get('referral_code', '')
            email = body_data.get('email', '').strip().lower()
            
            phone_escaped = phone.replace("'", "''")
            full_name_escaped = full_name.replace("'", "''")
            referral_code_escaped = referral_code.replace("'", "") if referral_code else ''
            email_escaped = email.replace("'", "''") if email else ''
            
            cur.execute(f"SELECT id FROM users WHERE phone = '{phone_escaped}'")
            if cur.fetchone():
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пользователь с таким телефоном уже существует'}),
                    'isBase64Encoded': False
                }
            
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            password_hash_escaped = password_hash.replace("'", "''")
            
            email_col = ", email" if email_escaped else ""
            email_val = f", '{email_escaped}'" if email_escaped else ""

            if referral_code_escaped:
                cur.execute(
                    f"INSERT INTO users (phone, password, full_name, balance, cashback, avatar, referred_by_code{email_col}) VALUES ('{phone_escaped}', '{password_hash_escaped}', '{full_name_escaped}', 0.00, 0.00, '👤', '{referral_code_escaped}'{email_val}) RETURNING id, phone, full_name, is_admin, balance, cashback, avatar"
                )
            else:
                cur.execute(
                    f"INSERT INTO users (phone, password, full_name, balance, cashback, avatar{email_col}) VALUES ('{phone_escaped}', '{password_hash_escaped}', '{full_name_escaped}', 0.00, 0.00, '👤'{email_val}) RETURNING id, phone, full_name, is_admin, balance, cashback, avatar"
                )
            conn.commit()
            user = cur.fetchone()
            user_id = user[0]
            
            if referral_code_escaped:
                cur.execute(
                    f"SELECT user_id FROM referral_codes WHERE referral_code = '{referral_code_escaped}'"
                )
                referrer_row = cur.fetchone()
                if referrer_row and referrer_row[0] != user_id:
                    referrer_id = referrer_row[0]
                    cur.execute(
                        f"INSERT INTO referrals (referrer_id, referred_id, referral_code, reward_amount) VALUES ({referrer_id}, {user_id}, '{referral_code_escaped}', 500.00)"
                    )
                    conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'user': {
                        'id': user_id,
                        'phone': user[1],
                        'full_name': user[2],
                        'is_admin': user[3],
                        'balance': float(user[4]) if user[4] else 0.00,
                        'cashback': float(user[5]) if user[5] else 0.00,
                        'avatar': user[6] if user[6] else '👤'
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'login':
            phone_escaped = phone.replace("'", "''")
            skip_admin_code = body_data.get('skip_admin_code', False)
            
            print(f"Login attempt: phone='{phone_escaped}', skip_admin_code={skip_admin_code}")
            
            cur.execute(
                f"SELECT id, phone, full_name, is_admin, balance, cashback, banned, ban_reason, ban_until, avatar, password, snow_effect_enabled FROM users WHERE phone = '{phone_escaped}'"
            )
            user_row = cur.fetchone()
            
            if not user_row:
                print(f"User not found for phone: {phone_escaped}")
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неверный телефон или пароль'}),
                    'isBase64Encoded': False
                }
            
            stored_password = user_row[10]
            
            if stored_password.startswith('$2b$') or stored_password.startswith('$2a$') or stored_password.startswith('$2y$'):
                if not bcrypt.checkpw(password.encode('utf-8'), stored_password.encode('utf-8')):
                    print(f"Password check failed (bcrypt)")
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверный телефон или пароль'}),
                        'isBase64Encoded': False
                    }
            else:
                if stored_password != password:
                    print(f"Password check failed (plain text)")
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверный телефон или пароль'}),
                        'isBase64Encoded': False
                    }
            
            user = user_row[:10]
            
            print(f"User authenticated successfully")
            
            if user and user[3] and not skip_admin_code:
                import random
                import string
                from datetime import datetime, timedelta
                
                login_code = ''.join(random.choices(string.digits, k=6))
                expires_at = datetime.now() + timedelta(minutes=10)
                
                cur.execute(
                    f"INSERT INTO admin_login_codes (user_id, login_code, expires_at) VALUES ({user[0]}, '{login_code}', '{expires_at.isoformat()}') RETURNING id"
                )
                conn.commit()
                
                smtp_host = os.environ.get('SMTP_HOST')
                smtp_port = os.environ.get('SMTP_PORT')
                smtp_user = os.environ.get('SMTP_USER')
                smtp_password = os.environ.get('SMTP_PASSWORD')
                admin_email = os.environ.get('ADMIN_EMAIL')

                if smtp_host and smtp_port and smtp_user and smtp_password and admin_email:
                    try:
                        import smtplib
                        import ssl
                        from email.mime.text import MIMEText
                        from email.mime.multipart import MIMEMultipart
                        from email.utils import formataddr
                        from email.header import Header

                        subject = 'Код для входа в админку'
                        html_body = f"""
                        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background:#f7f8fa; border-radius:12px;">
                          <h2 style="color:#222; margin:0 0 12px;">Вход в админ-панель</h2>
                          <p style="color:#555; margin:0 0 20px;">Одноразовый код для входа:</p>
                          <div style="font-size:32px; letter-spacing:8px; font-weight:bold; text-align:center; background:#fff; padding:16px; border-radius:8px; border:1px solid #e3e6eb; color:#1a73e8;">{login_code}</div>
                          <p style="color:#888; font-size:13px; margin:16px 0 0;">⏱ Действителен 10 минут</p>
                          <p style="color:#888; font-size:13px; margin:6px 0 0;">👤 {user[2]} &nbsp;·&nbsp; 📱 {user[1]}</p>
                          <p style="color:#aaa; font-size:12px; margin:20px 0 0;">Если это были не вы — проигнорируйте письмо.</p>
                        </div>
                        """
                        text_body = f"Код для входа в админку: {login_code}\nДействителен 10 минут.\n{user[2]} ({user[1]})"

                        msg = MIMEMultipart('alternative')
                        msg['Subject'] = Header(subject, 'utf-8')
                        msg['From'] = formataddr((str(Header('Админка', 'utf-8')), smtp_user))
                        msg['To'] = admin_email
                        msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
                        msg.attach(MIMEText(html_body, 'html', 'utf-8'))

                        port_int = int(smtp_port)
                        context_ssl = ssl.create_default_context()
                        if port_int == 465:
                            with smtplib.SMTP_SSL(smtp_host, port_int, context=context_ssl, timeout=10) as server:
                                server.login(smtp_user, smtp_password)
                                server.sendmail(smtp_user, [admin_email], msg.as_string())
                        else:
                            with smtplib.SMTP(smtp_host, port_int, timeout=10) as server:
                                server.starttls(context=context_ssl)
                                server.login(smtp_user, smtp_password)
                                server.sendmail(smtp_user, [admin_email], msg.as_string())
                        print(f"Admin login code sent to {admin_email}")
                    except Exception as e:
                        print(f"Email send error: {e}")
                else:
                    print("SMTP credentials are not configured")
            
            if not user:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неверный телефон или пароль'}),
                    'isBase64Encoded': False
                }
            
            if user[3] and not skip_admin_code:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'requires_code': True,
                        'user': {
                            'id': user[0],
                            'phone': user[1],
                            'full_name': user[2],
                            'is_admin': user[3]
                        }
                    }),
                    'isBase64Encoded': False
                }
            
            if user[6]:
                from datetime import datetime
                ban_until = user[8]
                if ban_until:
                    ban_until_dt = datetime.fromisoformat(str(ban_until).replace('Z', '+00:00'))
                    if ban_until_dt > datetime.now(ban_until_dt.tzinfo):
                        return {
                            'statusCode': 200,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({
                                'banned': True,
                                'ban_reason': user[7],
                                'ban_until': str(ban_until)
                            }),
                            'isBase64Encoded': False
                        }
                    else:
                        cur.execute(f"UPDATE users SET banned = false, ban_reason = NULL, ban_until = NULL WHERE id = {user[0]}")
                        conn.commit()
                else:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'banned': True,
                            'ban_reason': user[7],
                            'ban_until': None
                        }),
                        'isBase64Encoded': False
                    }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'user': {
                        'id': user[0],
                        'phone': user[1],
                        'full_name': user[2],
                        'is_admin': user[3],
                        'balance': float(user[4]) if user[4] else 0.00,
                        'cashback': float(user[5]) if user[5] else 0.00,
                        'avatar': user[9] if user[9] else '👤',
                        'snow_effect_enabled': user_row[11] if len(user_row) > 11 else True
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'update_email':
            user_id_val = body_data.get('user_id')
            email = body_data.get('email', '').strip().lower()
            if not user_id_val:
                return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'user_id обязателен'}), 'isBase64Encoded': False}
            email_escaped = email.replace("'", "''") if email else ''
            if email_escaped:
                cur.execute(f"UPDATE users SET email = '{email_escaped}' WHERE id = {user_id_val}")
            else:
                cur.execute(f"UPDATE users SET email = NULL WHERE id = {user_id_val}")
            conn.commit()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True}), 'isBase64Encoded': False}

        elif action == 'forgot_password':
            import random, string, smtplib, ssl
            from datetime import datetime, timedelta
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            from email.utils import formataddr
            from email.header import Header

            phone_escaped = phone.replace("'", "''")
            cur.execute(f"SELECT id, phone, full_name, email FROM users WHERE phone = '{phone_escaped}'")
            user_row = cur.fetchone()
            if not user_row:
                return {'statusCode': 404, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Пользователь не найден'}), 'isBase64Encoded': False}
            
            user_id_val, user_phone, user_name, user_email = user_row
            if not user_email:
                return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'У этого аккаунта не привязан email. Обратитесь к администратору.'}), 'isBase64Encoded': False}

            reset_code = ''.join(random.choices(string.digits, k=6))
            expires_at = datetime.now() + timedelta(minutes=15)
            cur.execute(f"INSERT INTO password_reset_codes (user_id, phone, email, reset_code, expires_at) VALUES ({user_id_val}, '{phone_escaped}', '{user_email.replace(chr(39), chr(39)*2)}', '{reset_code}', '{expires_at.isoformat()}')")
            conn.commit()

            smtp_host = os.environ.get('SMTP_HOST')
            smtp_port = os.environ.get('SMTP_PORT')
            smtp_user = os.environ.get('SMTP_USER')
            smtp_password = os.environ.get('SMTP_PASSWORD')

            if smtp_host and smtp_port and smtp_user and smtp_password:
                html_body = f"""
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background:#f7f8fa; border-radius:12px;">
                  <h2 style="color:#222; margin:0 0 12px;">Восстановление пароля</h2>
                  <p style="color:#555; margin:0 0 20px;">Ваш код для сброса пароля:</p>
                  <div style="font-size:32px; letter-spacing:8px; font-weight:bold; text-align:center; background:#fff; padding:16px; border-radius:8px; border:1px solid #e3e6eb; color:#1a73e8;">{reset_code}</div>
                  <p style="color:#888; font-size:13px; margin:16px 0 0;">⏱ Действителен 15 минут</p>
                  <p style="color:#aaa; font-size:12px; margin:20px 0 0;">Если вы не запрашивали сброс пароля — проигнорируйте письмо.</p>
                </div>
                """
                msg = MIMEMultipart('alternative')
                msg['Subject'] = Header('Восстановление пароля', 'utf-8')
                msg['From'] = formataddr((str(Header('Сад мечты', 'utf-8')), smtp_user))
                msg['To'] = user_email
                msg.attach(MIMEText(f"Код для сброса пароля: {reset_code}\nДействителен 15 минут.", 'plain', 'utf-8'))
                msg.attach(MIMEText(html_body, 'html', 'utf-8'))
                try:
                    port_int = int(smtp_port)
                    ctx = ssl.create_default_context()
                    if port_int == 465:
                        with smtplib.SMTP_SSL(smtp_host, port_int, context=ctx, timeout=10) as srv:
                            srv.login(smtp_user, smtp_password)
                            srv.sendmail(smtp_user, [user_email], msg.as_string())
                    else:
                        with smtplib.SMTP(smtp_host, port_int, timeout=10) as srv:
                            srv.starttls(context=ctx)
                            srv.login(smtp_user, smtp_password)
                            srv.sendmail(smtp_user, [user_email], msg.as_string())
                    print(f"Password reset code sent to {user_email}")
                except Exception as e:
                    print(f"Email send error: {e}")

            masked = user_email[:2] + '***@' + user_email.split('@')[-1]
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True, 'message': f'Код отправлен на {masked}'}), 'isBase64Encoded': False}

        elif action == 'reset_password':
            from datetime import datetime
            phone_escaped = phone.replace("'", "''")
            reset_code = body_data.get('code', '').strip()
            new_password = body_data.get('new_password', '')
            if not reset_code or not new_password:
                return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Код и новый пароль обязательны'}), 'isBase64Encoded': False}

            reset_code_escaped = reset_code.replace("'", "''")
            cur.execute(f"SELECT id, user_id, expires_at, used_at FROM password_reset_codes WHERE phone = '{phone_escaped}' AND reset_code = '{reset_code_escaped}' ORDER BY created_at DESC LIMIT 1")
            code_row = cur.fetchone()
            if not code_row:
                return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Неверный код восстановления'}), 'isBase64Encoded': False}
            code_id, user_id_val, expires_at, used_at = code_row
            if used_at:
                return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Код уже использован'}), 'isBase64Encoded': False}
            if datetime.now() > expires_at:
                return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Код истёк, запросите новый'}), 'isBase64Encoded': False}

            new_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            new_hash_escaped = new_hash.replace("'", "''")
            cur.execute(f"UPDATE users SET password = '{new_hash_escaped}' WHERE id = {user_id_val}")
            cur.execute(f"UPDATE password_reset_codes SET used_at = NOW() WHERE id = {code_id}")
            conn.commit()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True, 'message': 'Пароль успешно изменён'}), 'isBase64Encoded': False}

        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверное действие'}),
                'isBase64Encoded': False
            }
    
    except psycopg2.Error as db_err:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка базы данных: {str(db_err)}'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Внутренняя ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }
    finally:
        try:
            cur.close()
            conn.close()
        except:
            pass