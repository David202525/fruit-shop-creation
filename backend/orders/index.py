import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Any, Dict


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
}


def ok(body: dict, status: int = 200) -> dict:
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json', **CORS_HEADERS},
        'body': json.dumps(body, ensure_ascii=False, default=str),
        'isBase64Encoded': False,
    }


def err(message: str, status: int = 400) -> dict:
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json', **CORS_HEADERS},
        'body': json.dumps({'success': False, 'error': message}, ensure_ascii=False),
        'isBase64Encoded': False,
    }


STATUS_LABELS = {
    'pending': 'Ожидает',
    'processing': 'В обработке',
    'delivered': 'Доставлен',
    'rejected': 'Отклонён',
    'cancelled': 'Отменён',
}


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Управление заказами: получение списка и обновление статуса (с трек-номером).
    GET — список всех заказов для админа.
    PUT — обновить статус, трек-номер, причину отказа, цену доставки.
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    db_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        method = event.get('httpMethod', 'GET')

        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            user_id = params.get('user_id')

            where_clause = 'WHERE o.user_id = %s' if user_id else ''
            query_params = (int(user_id),) if user_id else ()

            cur.execute(f"""
                SELECT
                    o.*,
                    u.full_name AS user_name,
                    u.phone     AS user_phone,
                    u.email     AS user_email,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id',           oi.id,
                                'product_id',   oi.product_id,
                                'product_name', p.name,
                                'quantity',     oi.quantity,
                                'price',        oi.price,
                                'out_of_stock', oi.is_out_of_stock,
                                'available_quantity', oi.available_quantity,
                                'available_price',    oi.available_price
                            )
                        ) FILTER (WHERE oi.id IS NOT NULL),
                        '[]'
                    ) AS items
                FROM orders o
                LEFT JOIN users u ON u.id = o.user_id
                LEFT JOIN order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                {where_clause}
                GROUP BY o.id, u.full_name, u.phone, u.email
                ORDER BY o.created_at DESC
            """, query_params)
            orders = cur.fetchall()
            return ok({'orders': [dict(r) for r in orders]})

        if method == 'PUT':
            raw_body = event.get('body') or '{}'
            body = json.loads(raw_body)

            order_id = body.get('order_id')
            if not order_id:
                return err('order_id required')

            new_status = body.get('status')
            rejection_reason = body.get('rejection_reason')
            custom_delivery_price = body.get('custom_delivery_price')
            tracking_number = body.get('tracking_number')

            valid_statuses = list(STATUS_LABELS.keys())
            if new_status and new_status not in valid_statuses:
                return err(f'Invalid status. Must be one of: {valid_statuses}')

            cur.execute("SELECT id, user_id, status FROM orders WHERE id = %s", (order_id,))
            order = cur.fetchone()
            if not order:
                return err('Order not found', 404)

            set_parts = []
            params = []

            if new_status is not None:
                set_parts.append('status = %s')
                params.append(new_status)
                # При переводе предзаказа в обработку — рассчитать second_payment_amount
                if new_status == 'processing':
                    cur.execute("SELECT is_preorder, total_amount, amount_paid, second_payment_amount FROM orders WHERE id = %s", (order_id,))
                    ord_data = cur.fetchone()
                    if ord_data and ord_data['is_preorder'] and (not ord_data['second_payment_amount'] or float(ord_data['second_payment_amount']) == 0):
                        second_amt = float(ord_data['total_amount']) - float(ord_data['amount_paid'] or 0)
                        if second_amt > 0:
                            set_parts.append('second_payment_amount = %s')
                            params.append(second_amt)

            if rejection_reason is not None:
                set_parts.append('rejection_reason = %s')
                params.append(rejection_reason if rejection_reason else None)

            if custom_delivery_price is not None:
                set_parts.append('custom_delivery_price = %s')
                params.append(float(custom_delivery_price) if custom_delivery_price else None)
                if custom_delivery_price:
                    set_parts.append('delivery_price_set_by_admin = true')

            if tracking_number is not None:
                cur.execute("""
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'orders' AND column_name = 'tracking_number'
                """)
                if cur.fetchone():
                    set_parts.append('tracking_number = %s')
                    params.append(tracking_number if tracking_number else None)

            if not set_parts:
                return err('Nothing to update')

            params.append(order_id)
            cur.execute(
                f"UPDATE orders SET {', '.join(set_parts)} WHERE id = %s",
                params
            )

            if new_status and new_status != order['status']:
                user_id = order['user_id']
                status_label = STATUS_LABELS.get(new_status, new_status)

                if new_status == 'delivered':
                    title = 'Заказ доставлен'
                    if tracking_number:
                        message = f'Ваш заказ #{order_id} доставлен. Трек-номер: {tracking_number}'
                    else:
                        message = f'Ваш заказ #{order_id} доставлен!'
                elif new_status == 'processing':
                    title = 'Заказ в обработке'
                    message = f'Ваш заказ #{order_id} принят в обработку.'
                elif new_status == 'rejected':
                    title = 'Заказ отклонён'
                    reason_text = f' Причина: {rejection_reason}' if rejection_reason else ''
                    message = f'Ваш заказ #{order_id} отклонён.{reason_text}'
                elif new_status == 'cancelled':
                    title = 'Заказ отменён'
                    message = f'Ваш заказ #{order_id} отменён.'
                else:
                    title = 'Статус заказа изменён'
                    message = f'Статус вашего заказа #{order_id}: {status_label}'

                try:
                    cur.execute(
                        """INSERT INTO notifications
                            (user_id, type, title, message, entity_type, entity_id)
                           VALUES (%s, 'order_status', %s, %s, 'order', %s)""",
                        (user_id, title, message, order_id)
                    )
                except Exception:
                    pass

            conn.commit()
            return ok({'success': True})

        if method == 'POST':
            raw_body = event.get('body') or '{}'
            body = json.loads(raw_body)

            user_id = body.get('user_id')
            items = body.get('items', [])
            payment_method = body.get('payment_method', 'cash')
            delivery_address = body.get('delivery_address', '')
            delivery_type = body.get('delivery_type', 'pickup')
            delivery_zone_id = body.get('delivery_zone_id')
            total_amount = body.get('total_amount', 0)
            full_order_amount = body.get('full_order_amount', total_amount)
            is_preorder = body.get('is_preorder', False)
            cashback_percent = body.get('cashback_percent', 5)
            alfabank_order_id = body.get('alfabank_order_id')

            if not user_id or not items:
                return err('user_id and items required')

            cur.execute("SELECT id, balance, cashback FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            if not user:
                return err('User not found', 404)

            if payment_method == 'balance':
                if float(user['balance']) < float(total_amount):
                    return err('Недостаточно средств на балансе')
                cur.execute(
                    "UPDATE users SET balance = balance - %s WHERE id = %s",
                    (total_amount, user_id)
                )
                cur.execute(
                    "INSERT INTO transactions (user_id, type, amount, description) VALUES (%s, 'purchase', %s, 'Оплата заказа')",
                    (user_id, -float(total_amount))
                )

            cashback_earned = round(float(full_order_amount) * float(cashback_percent) / 100, 2) if payment_method == 'balance' else 0

            cur.execute("""
                INSERT INTO orders (user_id, total_amount, status, payment_method, delivery_address,
                    delivery_type, delivery_zone_id, cashback_earned, amount_paid, is_preorder, payment_verified)
                VALUES (%s, %s, 'pending', %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                user_id, full_order_amount, payment_method, delivery_address,
                delivery_type, delivery_zone_id, cashback_earned,
                total_amount if payment_method == 'balance' else 0,
                is_preorder,
                payment_method == 'balance'
            ))
            order_id = cur.fetchone()['id']

            for item in items:
                cur.execute("""
                    INSERT INTO order_items (order_id, product_id, quantity, price)
                    VALUES (%s, %s, %s, %s)
                """, (order_id, item.get('product_id'), item.get('quantity', 1), item.get('price', 0)))
                if item.get('quantity'):
                    cur.execute(
                        "UPDATE products SET stock = GREATEST(COALESCE(stock,0) - %s, 0) WHERE id = %s AND stock IS NOT NULL",
                        (item.get('quantity', 1), item.get('product_id'))
                    )

            if payment_method == 'balance' and cashback_earned > 0:
                cur.execute(
                    "UPDATE users SET cashback = COALESCE(cashback,0) + %s WHERE id = %s",
                    (cashback_earned, user_id)
                )

            try:
                cur.execute(
                    "INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id) VALUES (%s, 'order', 'Заказ оформлен', %s, 'order', %s)",
                    (user_id, f'Ваш заказ #{order_id} успешно оформлен!', order_id)
                )
            except Exception:
                pass

            conn.commit()
            return ok({'success': True, 'order_id': order_id})

        if method == 'DELETE':
            raw_body = event.get('body') or '{}'
            body = json.loads(raw_body)
            order_id = body.get('order_id')
            if not order_id:
                return err('order_id required')
            cur.execute("DELETE FROM order_items WHERE order_id = %s", (order_id,))
            cur.execute("DELETE FROM orders WHERE id = %s", (order_id,))
            conn.commit()
            return ok({'success': True})

        return err('Method not allowed', 405)

    except Exception as e:
        conn.rollback()
        print(f'orders handler error: {e}')
        return err(str(e), 500)
    finally:
        cur.close()
        conn.close()