import json
import os
import uuid
from typing import Dict, Any

SCHEMA = 't_p77282076_fruit_shop_creation'

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Управление картами лояльности: получение, покупка, разблокировка за покупки
    """
    import psycopg2
    from psycopg2.extras import RealDictCursor

    method = event.get('httpMethod', 'GET')

    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**cors_headers, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    db_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    headers = {'Content-Type': 'application/json', **cors_headers}

    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            user_id = params.get('user_id')

            if not user_id:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'user_id required'})}

            cur.execute(f"SELECT loyalty_card_price, loyalty_unlock_amount, loyalty_cashback_percent FROM {SCHEMA}.site_settings WHERE id = 1")
            s = cur.fetchone()
            card_price = int(s['loyalty_card_price']) if s and s.get('loyalty_card_price') else 500
            unlock_amount = int(s['loyalty_unlock_amount']) if s and s.get('loyalty_unlock_amount') else 5000
            cashback_percent = int(s['loyalty_cashback_percent']) if s and s.get('loyalty_cashback_percent') else 5

            cur.execute(f"SELECT * FROM {SCHEMA}.loyalty_cards WHERE user_id = {user_id} AND is_active = true ORDER BY id DESC LIMIT 1")
            card = cur.fetchone()

            cur.execute(f"SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM {SCHEMA}.transactions WHERE user_id = {user_id} AND type = 'purchase' AND amount < 0")
            spent_row = cur.fetchone()
            total_spent = float(spent_row['total']) if spent_row else 0

            can_unlock = total_spent >= unlock_amount and not card

            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'card': dict(card) if card else None,
                    'card_price': card_price,
                    'unlock_amount': unlock_amount,
                    'cashback_percent': cashback_percent,
                    'total_spent': total_spent,
                    'can_unlock': can_unlock
                }, default=str)
            }

        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id')
            unlock_free = body.get('unlock_free', False)

            if not user_id:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'user_id required'})}

            cur.execute(f"SELECT loyalty_card_price, loyalty_unlock_amount FROM {SCHEMA}.site_settings WHERE id = 1")
            s = cur.fetchone()
            card_price = int(s['loyalty_card_price']) if s and s.get('loyalty_card_price') else 500
            unlock_amount = int(s['loyalty_unlock_amount']) if s and s.get('loyalty_unlock_amount') else 5000

            cur.execute(f"SELECT balance FROM {SCHEMA}.users WHERE id = {user_id}")
            u = cur.fetchone()
            if not u:
                return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Пользователь не найден'})}

            balance = float(u['balance'])

            if unlock_free:
                cur.execute(f"SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM {SCHEMA}.transactions WHERE user_id = {user_id} AND type = 'purchase' AND amount < 0")
                spent_row = cur.fetchone()
                total_spent = float(spent_row['total']) if spent_row else 0
                if total_spent < unlock_amount:
                    return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Недостаточно покупок для разблокировки'})}
            else:
                if balance < card_price:
                    return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Недостаточно средств'})}
                new_balance = balance - card_price
                cur.execute(f"UPDATE {SCHEMA}.users SET balance = {new_balance} WHERE id = {user_id}")
                desc = 'Покупка карты лояльности'.replace("'", "''")
                cur.execute(f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES ({user_id}, -{card_price}, 'purchase', '{desc}')")

            card_number = f"LC-{uuid.uuid4().hex[:8].upper()}"
            qr_code = f"loyalty:{user_id}:{card_number}"
            cur.execute(f"INSERT INTO {SCHEMA}.loyalty_cards (user_id, card_number, qr_code, is_active, activated_at) VALUES ({user_id}, '{card_number}', '{qr_code}', true, NOW()) RETURNING *")
            new_card = cur.fetchone()
            conn.commit()

            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'success': True, 'card': dict(new_card)}, default=str)
            }

        return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'Method not allowed'})}

    except Exception as e:
        conn.rollback()
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': str(e)})}
    finally:
        cur.close()
        conn.close()
