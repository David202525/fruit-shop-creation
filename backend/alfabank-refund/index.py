import json
import os
import requests
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Make refund through Alfabank API by admin and decrease user balance
    Args: event with httpMethod POST, body (transaction_id, amount, admin_id)
          context with request_id
    Returns: HTTP response with success or error
    '''
    import psycopg2
    from psycopg2.extras import RealDictCursor

    method: str = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }

    body_data = json.loads(event.get('body', '{}'))
    transaction_id = body_data.get('transaction_id')
    refund_amount = body_data.get('amount')
    admin_id = body_data.get('admin_id')

    if not transaction_id or not refund_amount or not admin_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'transaction_id, amount and admin_id required'}),
            'isBase64Encoded': False
        }

    refund_amount = float(refund_amount)
    if refund_amount <= 0:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Сумма возврата должна быть больше 0'}),
            'isBase64Encoded': False
        }

    db_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("SELECT is_admin FROM users WHERE id = %s", (admin_id,))
        admin = cur.fetchone()
        if not admin or not admin.get('is_admin'):
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Доступ только для администратора'}),
                'isBase64Encoded': False
            }

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

        cur.execute(
            "SELECT id, user_id, amount, alfa_order_id, type, description FROM transactions WHERE id = %s",
            (transaction_id,)
        )
        tx = cur.fetchone()
        if not tx:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Транзакция не найдена'}),
                'isBase64Encoded': False
            }

        if tx['type'] != 'deposit':
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Возврат возможен только для пополнений'}),
                'isBase64Encoded': False
            }

        if not tx['alfa_order_id']:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'У этой транзакции нет ID платежа в Альфе. Возврат возможен только для пополнений после обновления системы.'}),
                'isBase64Encoded': False
            }

        original_amount = float(tx['amount'])
        if refund_amount > original_amount:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Сумма возврата ({refund_amount}₽) больше суммы пополнения ({original_amount}₽)'}),
                'isBase64Encoded': False
            }

        cur.execute(
            "SELECT COALESCE(SUM(ABS(amount)), 0) AS refunded FROM transactions WHERE alfa_order_id = %s AND type = 'refund'",
            (tx['alfa_order_id'],)
        )
        already_refunded = float(cur.fetchone()['refunded'])
        if already_refunded + refund_amount > original_amount:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Уже возвращено {already_refunded}₽, можно вернуть ещё максимум {original_amount - already_refunded}₽'}),
                'isBase64Encoded': False
            }

        user_id = tx['user_id']
        cur.execute("SELECT balance FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        if not user:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Пользователь не найден'}),
                'isBase64Encoded': False
            }
        current_balance = float(user['balance'])
        if current_balance < refund_amount:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'error': f'Недостаточно средств на балансе пользователя. Сейчас: {current_balance}₽, требуется списать: {refund_amount}₽'
                }),
                'isBase64Encoded': False
            }

        alfa_order_id = tx['alfa_order_id']
        amount_kopecks = int(refund_amount * 100)

        print(f"Refunding {refund_amount}₽ ({amount_kopecks} kopecks) for alfa_order_id={alfa_order_id}, user_id={user_id}")

        refund_url = 'https://payment.alfabank.ru/payment/rest/refund.do'
        response = requests.post(refund_url, data={
            'token': api_token,
            'orderId': alfa_order_id,
            'amount': amount_kopecks
        }, timeout=15)

        print(f"Alfabank refund response: {response.status_code} {response.text[:300]}")

        try:
            data = response.json()
        except ValueError:
            return {
                'statusCode': 502,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Альфа вернула некорректный ответ', 'details': response.text[:200]}),
                'isBase64Encoded': False
            }

        error_code = str(data.get('errorCode', '0'))
        if error_code != '0':
            error_message = data.get('errorMessage', 'Unknown error')
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'error': f'Альфа отклонила возврат: {error_message}',
                    'error_code': error_code
                }),
                'isBase64Encoded': False
            }

        cur.execute(
            "UPDATE users SET balance = balance - %s WHERE id = %s",
            (refund_amount, user_id)
        )
        cur.execute(
            "INSERT INTO transactions (user_id, type, amount, description, alfa_order_id) VALUES (%s, 'refund', %s, %s, %s)",
            (user_id, -refund_amount, f'Возврат через Альфа-Банк (админ #{admin_id})', alfa_order_id)
        )
        try:
            cur.execute(
                "INSERT INTO notifications (user_id, type, title, message) VALUES (%s, 'refund', 'Возврат средств', %s)",
                (user_id, f'Произведён возврат {refund_amount}₽ через Альфа-Банк')
            )
        except Exception as e:
            print(f"Notification insert failed (ignored): {e}")

        conn.commit()

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'message': f'Возврат {refund_amount}₽ выполнен. Баланс пользователя уменьшен.',
                'refunded_amount': refund_amount,
                'user_id': user_id
            }),
            'isBase64Encoded': False
        }

    except Exception as e:
        conn.rollback()
        print(f"Refund error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Внутренняя ошибка: {str(e)}'}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()
