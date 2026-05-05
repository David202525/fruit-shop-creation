import json
import os
import requests
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Handle Alfabank payment status checks and webhooks via getOrderStatusExtended.do API
    Args: event with httpMethod, queryStringParameters (orderId) or body
          context with request_id
    Returns: HTTP response with payment status and DB updates
    '''
    import psycopg2
    from psycopg2.extras import RealDictCursor
    
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
        cur.execute("SELECT alfabank_password FROM site_settings WHERE id = 1")
        settings = cur.fetchone()
        
        if not settings or not settings.get('alfabank_password'):
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Alfabank token not configured'}),
                'isBase64Encoded': False
            }
        
        api_token = settings['alfabank_password']
    finally:
        cur.close()
        conn.close()
    
    alfabank_status_url = 'https://payment.alfabank.ru/payment/rest/getOrderStatusExtended.do'
    
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        alfa_order_id = params.get('orderId')
        
        if not alfa_order_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'orderId parameter required'}),
                'isBase64Encoded': False
            }
        
        try:
            response = requests.post(alfabank_status_url, data={
                'token': api_token,
                'orderId': alfa_order_id
            }, timeout=10)
            response.raise_for_status()
            
            status_data = response.json()
            print(f"Alfabank response: {json.dumps(status_data)}")
            
            order_status = status_data.get('orderStatus')
            
            if order_status == 4:
                order_number = status_data.get('orderNumber', '')
                print(f"Refund detected for order number: {order_number}")
                
                user_id = None
                order_id = None
                is_preorder_payment = False
                
                if order_number.startswith('topup_'):
                    parts = order_number.split('_')
                    if len(parts) >= 2:
                        user_id = parts[1]
                        print(f"Extracted user_id from order_number: {user_id}")
                elif order_number.startswith('preorder_'):
                    parts = order_number.split('_')
                    if len(parts) >= 3:
                        order_id = parts[1]
                        user_id = parts[2]
                        is_preorder_payment = True
                        print(f"Extracted preorder order_id: {order_id}, user_id: {user_id}")
                elif order_number.startswith('order_'):
                    parts = order_number.split('_')
                    if len(parts) >= 2:
                        order_id = parts[1]
                        print(f"Extracted order_id from order_number: {order_id}")
                
                amount_kopecks = status_data.get('amount', 0)
                amount = float(amount_kopecks) / 100
                print(f"Refund amount: {amount} RUB, user_id: {user_id}, order_id: {order_id}")
                
                if user_id and amount > 0:
                    db_url = os.environ.get('DATABASE_URL')
                    conn = psycopg2.connect(db_url)
                    cur = conn.cursor(cursor_factory=RealDictCursor)
                    
                    try:
                        if order_id and is_preorder_payment:
                            cur.execute(
                                "UPDATE orders SET amount_paid = GREATEST(amount_paid - %s, 0) WHERE id = %s",
                                (amount, order_id)
                            )
                            cur.execute(
                                "INSERT INTO transactions (user_id, type, amount, description) VALUES (%s, 'refund', %s, 'Возврат доплаты предзаказа через Альфа-Банк')",
                                (user_id, -amount)
                            )
                            cur.execute(
                                "INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id) VALUES (%s, 'refund', 'Возврат средств', %s, 'order', %s)",
                                (user_id, f'Возврат доплаты предзаказа: {amount} ₽', order_id)
                            )
                            print(f"Preorder refund completed: order_id={order_id}, amount={amount}")
                        elif order_id:
                            cur.execute(
                                "UPDATE orders SET status = 'cancelled', payment_verified = false WHERE id = %s",
                                (order_id,)
                            )
                            cur.execute(
                                "INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id) VALUES (%s, 'refund', 'Заказ отменён', 'Заказ отменён, платёж возвращён', 'order', %s)",
                                (user_id, order_id)
                            )
                        else:
                            cur.execute(
                                "SELECT COALESCE(SUM(ABS(amount)),0) AS r FROM transactions WHERE alfa_order_id = %s AND type = 'refund'",
                                (alfa_order_id,)
                            )
                            already = float(cur.fetchone()['r'] or 0)
                            if already >= amount:
                                print(f"Refund already recorded for alfa_order_id={alfa_order_id}, skipping")
                            else:
                                to_refund = amount - already
                                cur.execute(
                                    "UPDATE users SET balance = GREATEST(balance - %s, 0) WHERE id = %s",
                                    (to_refund, user_id)
                                )
                                cur.execute(
                                    "INSERT INTO transactions (user_id, type, amount, description, alfa_order_id) VALUES (%s, 'refund', %s, 'Возврат средств через Альфа-Банк', %s)",
                                    (user_id, -to_refund, alfa_order_id)
                                )
                                cur.execute(
                                    "INSERT INTO notifications (user_id, type, title, message) VALUES (%s, 'refund', 'Возврат средств', %s)",
                                    (user_id, f'Возврат пополнения: {to_refund} ₽')
                                )
                                print(f"Balance refund completed: user_id={user_id}, amount={to_refund}")
                        
                        conn.commit()
                    finally:
                        cur.close()
                        conn.close()
            
            elif order_status == 2:
                order_number = status_data.get('orderNumber', '')
                print(f"Order number: {order_number}")
                
                user_id = None
                order_id = None
                is_preorder_payment = False
                
                if order_number.startswith('topup_'):
                    parts = order_number.split('_')
                    if len(parts) >= 2:
                        user_id = parts[1]
                        print(f"Extracted user_id from order_number: {user_id}")
                elif order_number.startswith('preorder_'):
                    parts = order_number.split('_')
                    if len(parts) >= 3:
                        order_id = parts[1]
                        user_id = parts[2]
                        is_preorder_payment = True
                        print(f"Extracted preorder order_id: {order_id}, user_id: {user_id}")
                elif order_number.startswith('order_'):
                    parts = order_number.split('_')
                    if len(parts) >= 2:
                        order_id = parts[1]
                        print(f"Extracted order_id from order_number: {order_id}")
                
                amount_kopecks = status_data.get('amount', 0)
                amount = float(amount_kopecks) / 100
                print(f"Payment amount: {amount} RUB, user_id: {user_id}, order_id: {order_id}")
                
                if user_id and amount > 0:
                    db_url = os.environ.get('DATABASE_URL')
                    conn = psycopg2.connect(db_url)
                    cur = conn.cursor(cursor_factory=RealDictCursor)
                    
                    try:
                        if order_id and is_preorder_payment:
                            cur.execute(
                                "UPDATE orders SET amount_paid = amount_paid + %s, payment_verified = true WHERE id = %s",
                                (amount, order_id)
                            )
                            cur.execute(
                                "INSERT INTO transactions (user_id, type, amount, description) VALUES (%s, 'preorder_payment', %s, 'Доплата предзаказа через Альфа-Банк')",
                                (user_id, amount)
                            )
                            print(f"Preorder payment completed: order_id={order_id}, amount={amount}")
                        elif order_id:
                            cur.execute(
                                "UPDATE orders SET status = 'confirmed', payment_verified = true WHERE id = %s",
                                (order_id,)
                            )
                        else:
                            cur.execute(
                                "SELECT id FROM transactions WHERE alfa_order_id = %s AND type = 'deposit' LIMIT 1",
                                (alfa_order_id,)
                            )
                            existing = cur.fetchone()
                            if existing:
                                print(f"Deposit already recorded for alfa_order_id={alfa_order_id}, skipping")
                            else:
                                cur.execute(
                                    "UPDATE users SET balance = balance + %s WHERE id = %s",
                                    (amount, user_id)
                                )
                                cur.execute(
                                    "INSERT INTO transactions (user_id, type, amount, description, alfa_order_id) VALUES (%s, 'deposit', %s, 'Пополнение через Альфа-Банк', %s)",
                                    (user_id, amount, alfa_order_id)
                                )
                        
                        conn.commit()
                    finally:
                        cur.close()
                        conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'orderStatus': order_status,
                    'statusDescription': {
                        0: 'Заказ зарегистрирован, но не оплачен',
                        1: 'Предавторизованная сумма захолдирована',
                        2: 'Проведена полная авторизация суммы заказа',
                        3: 'Авторизация отменена',
                        4: 'По транзакции была проведена операция возврата',
                        5: 'Инициирована авторизация через ACS банка-эмитента',
                        6: 'Авторизация отклонена'
                    }.get(order_status, 'Неизвестный статус'),
                    'details': status_data
                }),
                'isBase64Encoded': False
            }
        
        except requests.exceptions.RequestException as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Failed to check payment status', 'details': str(e)}),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }