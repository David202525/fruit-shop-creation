import json
import os
import re
import smtplib
import psycopg2
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from psycopg2.extras import RealDictCursor
from typing import Any, Dict, Optional


def send_order_email(to_email: str, subject: str, html_body: str) -> None:
    """Отправить HTML письмо клиенту через SMTP."""
    smtp_host = os.environ.get('SMTP_HOST', '')
    smtp_port = int(os.environ.get('SMTP_PORT', 465))
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_password = os.environ.get('SMTP_PASSWORD', '')
    if not smtp_host or not smtp_user or not smtp_password or not to_email:
        return
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = smtp_user
    msg['To'] = to_email
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))
    try:
        with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, [to_email], msg.as_string())
    except Exception as e:
        print(f'Email send error: {e}')


STATUS_COLORS = {
    'pending':    ('#f59e0b', '⏳', 'Ожидает подтверждения'),
    'processing': ('#3b82f6', '📦', 'Принят в обработку'),
    'delivered':  ('#10b981', '✅', 'Доставлен'),
    'rejected':   ('#ef4444', '❌', 'Отклонён'),
    'cancelled':  ('#6b7280', '🚫', 'Отменён'),
}


def build_order_email_html(order_id: int, new_status: str, customer_name: Optional[str],
                            rejection_reason: Optional[str], tracking_number: Optional[str],
                            order_items: Optional[list], total_amount: Optional[float]) -> str:
    """Сгенерировать красивый HTML для письма о смене статуса заказа."""
    color, emoji, status_label = STATUS_COLORS.get(new_status, ('#6b7280', '📋', new_status))
    name_str = customer_name or 'Клиент'

    extra_block = ''
    if new_status == 'rejected' and rejection_reason:
        extra_block = f'''
        <div style="background:#fff1f2;border-left:4px solid #ef4444;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
            <p style="margin:0;color:#991b1b;font-size:14px;"><strong>Причина отклонения:</strong> {rejection_reason}</p>
        </div>'''
    if new_status == 'delivered' and tracking_number:
        extra_block = f'''
        <div style="background:#ecfdf5;border-left:4px solid #10b981;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
            <p style="margin:0;color:#065f46;font-size:14px;"><strong>Трек-номер:</strong> {tracking_number}</p>
        </div>'''
    if new_status == 'processing':
        extra_block = '''
        <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
            <p style="margin:0;color:#1e40af;font-size:14px;">Мы проверяем ваш заказ и свяжемся с вами в ближайшее время для уточнения деталей доставки.</p>
        </div>'''

    items_html = ''
    if order_items:
        rows = ''.join(
            f'<tr><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#374151;">{it.get("product_name","—")}</td>'
            f'<td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:center;color:#374151;">{it.get("quantity",1)} шт.</td>'
            f'<td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;color:#374151;">{float(it.get("price",0)):.0f}₽</td></tr>'
            for it in order_items
        )
        total_str = f'{float(total_amount):.0f}₽' if total_amount else ''
        items_html = f'''
        <table style="width:100%;border-collapse:collapse;margin:16px 0;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
            <thead>
                <tr style="background:#f9fafb;">
                    <th style="padding:10px 12px;text-align:left;font-size:13px;color:#6b7280;font-weight:600;">Товар</th>
                    <th style="padding:10px 12px;text-align:center;font-size:13px;color:#6b7280;font-weight:600;">Кол-во</th>
                    <th style="padding:10px 12px;text-align:right;font-size:13px;color:#6b7280;font-weight:600;">Сумма</th>
                </tr>
            </thead>
            <tbody>{rows}</tbody>
            {f'<tfoot><tr><td colspan="2" style="padding:10px 12px;font-weight:700;color:#111827;">Итого</td><td style="padding:10px 12px;text-align:right;font-weight:700;color:#111827;">{total_str}</td></tr></tfoot>' if total_str else ''}
        </table>'''

    return f'''<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#166534,#15803d);padding:32px 40px;text-align:center;">
          <p style="margin:0 0 8px;font-size:36px;">{emoji}</p>
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Питомник растений</h1>
          <p style="margin:8px 0 0;color:#bbf7d0;font-size:14px;">Обновление статуса заказа</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">Здравствуйте, <strong style="color:#111827;">{name_str}</strong>!</p>
          <p style="margin:0 0 24px;color:#374151;font-size:16px;">Статус вашего заказа <strong>#{order_id}</strong> изменён:</p>

          <!-- Status badge -->
          <div style="text-align:center;margin:0 0 24px;">
            <span style="display:inline-block;background:{color};color:#ffffff;font-size:18px;font-weight:700;padding:12px 32px;border-radius:100px;letter-spacing:0.02em;">
              {emoji} {status_label}
            </span>
          </div>

          {extra_block}
          {items_html}

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
            Если у вас возникли вопросы, свяжитесь с нами через чат поддержки на сайте.<br>
            Спасибо, что выбрали наш питомник! 🌱
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">© 2024 Питомник растений · ИП Бояринцев Вадим Вячеславович</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>'''


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

                # Отправка email клиенту
                customer_email = body.get('customer_email') or ''
                if not customer_email:
                    # Пробуем извлечь email из delivery_address: "email:xxx@xxx.com | ..."
                    cur.execute("SELECT delivery_address, total_amount FROM orders WHERE id = %s", (order_id,))
                    order_row = cur.fetchone()
                    if order_row and order_row['delivery_address']:
                        m = re.search(r'email:([^\s|,]+)', order_row['delivery_address'])
                        if m:
                            customer_email = m.group(1).strip()
                    total_for_email = float(order_row['total_amount']) if order_row else None
                else:
                    cur.execute("SELECT total_amount FROM orders WHERE id = %s", (order_id,))
                    o = cur.fetchone()
                    total_for_email = float(o['total_amount']) if o else None

                if customer_email:
                    # Загружаем товары заказа для письма
                    cur.execute("""
                        SELECT oi.quantity, oi.price, p.name as product_name
                        FROM order_items oi
                        LEFT JOIN products p ON p.id = oi.product_id
                        WHERE oi.order_id = %s
                    """, (order_id,))
                    items_for_email = [dict(r) for r in cur.fetchall()]

                    # Имя клиента
                    cur.execute("SELECT full_name FROM users WHERE id = %s", (user_id,))
                    u_row = cur.fetchone()
                    customer_name = u_row['full_name'] if u_row else None

                    html = build_order_email_html(
                        order_id=order_id,
                        new_status=new_status,
                        customer_name=customer_name,
                        rejection_reason=rejection_reason,
                        tracking_number=tracking_number,
                        order_items=items_for_email,
                        total_amount=total_for_email
                    )
                    _, _, status_label_email = STATUS_COLORS.get(new_status, ('#6b7280', '📋', new_status))
                    send_order_email(
                        to_email=customer_email,
                        subject=f'Заказ #{order_id} — {status_label_email}',
                        html_body=html
                    )

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