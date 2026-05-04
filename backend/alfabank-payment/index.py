import json
import os
import requests
from typing import Dict, Any
from urllib.parse import urlencode, quote


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Create Alfabank payment for orders and balance top-up via Alfa Checkout API
    Args: event with httpMethod, body (amount, user_id, order_id, description)
          context with request_id
    Returns: HTTP response with payment_url or error
    Note: Uses production Alfabank API with API credentials
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
                'Access-Control-Allow-Headers': 'Content-Type, Accept, Cache-Control, X-User-Id, X-Auth-Token, X-Session-Id',
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
                'body': json.dumps({
                    'error': 'Alfabank token not configured',
                    'message': 'Онлайн-оплата временно недоступна. Обратитесь к администратору для настройки.'
                }),
                'isBase64Encoded': False
            }
        
        api_token = settings['alfabank_password']
    finally:
        cur.close()
        conn.close()
    
    body_data = json.loads(event.get('body', '{}'))
    amount = body_data.get('amount')
    user_id = body_data.get('user_id')
    order_id = body_data.get('order_id')
    email = body_data.get('email')
    description = body_data.get('description', 'Оплата заказа')
    return_url = body_data.get('return_url', 'https://your-site.com/payment/success')
    
    if not amount or not user_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'amount and user_id required'}),
            'isBase64Encoded': False
        }
    
    if float(amount) <= 0:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Amount must be positive'}),
            'isBase64Encoded': False
        }
    
    alfabank_api_url = 'https://payment.alfabank.ru/payment/rest/register.do'
    
    amount_in_kopecks = int(float(amount) * 100)
    is_preorder = body_data.get('is_preorder_payment', False)

    import time
    import secrets as _secrets
    unique_suffix = f"{int(time.time() * 1000)}{_secrets.token_hex(3)}"

    if order_id and is_preorder:
        order_number = f"preorder_{order_id}_{user_id}_{unique_suffix}"
    elif order_id:
        order_number = f"order_{order_id}_{user_id}_{unique_suffix}"
    else:
        order_number = f"topup_{user_id}_{unique_suffix}"
    
    payload = {
        'token': api_token,
        'orderNumber': order_number,
        'amount': amount_in_kopecks,
        'returnUrl': return_url,
        'failUrl': return_url,
        'description': description,
        'language': 'ru',
        'pageView': 'MOBILE'
    }
    
    if email:
        payload['email'] = email
        payload['jsonParams'] = json.dumps({'email': email})
        print(f"Adding email to payment: {email}")
    
    try:
        print(f"Creating payment: amount={amount_in_kopecks} kopecks, order={order_number}")
        print(f"Using API token: {api_token[:8]}...{api_token[-4:]} (len={len(api_token)})")
        
        print(f"Request payload keys: {list(payload.keys())}")
        response = requests.post(alfabank_api_url, data=payload, timeout=10)
        print(f"Alfabank response status: {response.status_code}")
        print(f"Alfabank response text: {response.text[:500]}")
        
        try:
            data = response.json()
        except ValueError as json_error:
            print(f"Failed to parse JSON: {str(json_error)}")
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'error': 'Invalid response from payment gateway',
                    'details': response.text[:200]
                }),
                'isBase64Encoded': False
            }
        
        print(f"Alfabank response data: {json.dumps(data)}")
        
        if 'formUrl' in data:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'payment_url': data['formUrl'],
                    'order_id': data.get('orderId'),
                    'order_number': order_number
                }),
                'isBase64Encoded': False
            }
        else:
            error_message = data.get('errorMessage', 'Unknown error from Alfabank')
            error_code = data.get('errorCode', 'UNKNOWN')
            print(f"Alfabank error: {error_code} - {error_message}")
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': False,
                    'error': error_message,
                    'error_code': error_code,
                    'details': data
                }),
                'isBase64Encoded': False
            }
    
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': 'Failed to connect to Alfabank API',
                'details': str(e)
            }),
            'isBase64Encoded': False
        }
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': 'Internal server error',
                'details': str(e)
            }),
            'isBase64Encoded': False
        }