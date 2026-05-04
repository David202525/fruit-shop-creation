# Установка Florarium API на VPS Debian

## Что у тебя получится
- Сайт: https://siberian-florarium.ru
- API: https://siberian-florarium.ru/api/{имя_функции}
- БД PostgreSQL — локально на сервере
- poehali НЕ участвует

## Данные (запиши себе)
- Пароль БД: `Fl0r@rium_2026_xK9pQmZ7`
- Пользователь БД: `florauser`
- Имя БД: `florarium`

---

## ШАГ 1. Подключись к серверу
```bash
ssh root@5.42.117.66
```

## ШАГ 2. Установи софт (одной командой)
```bash
apt update && apt install -y python3 python3-pip python3-venv postgresql postgresql-contrib nginx git certbot python3-certbot-nginx
```

## ШАГ 3. Создай БД (скопируй ВСЁ ЦЕЛИКОМ)
```bash
sudo -u postgres psql <<EOF
CREATE DATABASE florarium;
CREATE USER florauser WITH PASSWORD 'Fl0r@rium_2026_xK9pQmZ7';
GRANT ALL PRIVILEGES ON DATABASE florarium TO florauser;
ALTER DATABASE florarium OWNER TO florauser;
\c florarium
GRANT ALL ON SCHEMA public TO florauser;
EOF
```

## ШАГ 4. Залей дамп БД с poehali
На своём ноутбуке (не на сервере) скачай дамп БД с poehali (в кабинете → Ядро → База данных → Экспорт SQL).
Получишь файл `dump.sql`. Скопируй его на сервер:
```bash
# На своём компьютере:
scp dump.sql root@5.42.117.66:/tmp/dump.sql
```

На сервере залей в новую БД:
```bash
sudo -u postgres psql florarium < /tmp/dump.sql
sudo -u postgres psql -d florarium -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO florauser; GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO florauser;"
```

## ШАГ 5. Скачай код проекта
Подключи GitHub в poehali (Скачать → Подключить GitHub), потом:
```bash
mkdir -p /opt/florarium && cd /opt/florarium
git clone https://github.com/ТВОЙ_ЛОГИН/ТВОЙ_РЕПО.git .
```

## ШАГ 6. Поставь Python-зависимости
```bash
cd /opt/florarium
python3 -m venv venv
source venv/bin/activate
pip install -r requirements-server.txt
```

Дополнительно установи зависимости каждой функции (если есть requirements.txt):
```bash
for d in backend/*/; do
  if [ -f "$d/requirements.txt" ]; then
    pip install -r "$d/requirements.txt"
  fi
done
```

## ШАГ 7. Создай файл с секретами
```bash
nano /opt/florarium/.env
```

Вставь (заменив значения на свои):
```
DATABASE_URL=postgresql://florauser:Fl0r@rium_2026_xK9pQmZ7@localhost:5432/florarium
AWS_ACCESS_KEY_ID=ВЗЯТЬ_ИЗ_ПОЕХАЛИ_СЕКРЕТЫ
AWS_SECRET_ACCESS_KEY=ВЗЯТЬ_ИЗ_ПОЕХАЛИ_СЕКРЕТЫ
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_USER=8905929304011v@mail.ru
SMTP_PASSWORD=ПАРОЛЬ_ПРИЛОЖЕНИЯ_MAIL_RU
ADMIN_EMAIL=8905929304011v@mail.ru
```

Ctrl+O, Enter, Ctrl+X — сохранить и выйти.

```bash
chmod 600 /opt/florarium/.env
```

## ШАГ 8. Запусти API как сервис
```bash
cp /opt/florarium/deploy/florarium-api.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable florarium-api
systemctl start florarium-api
systemctl status florarium-api
```

Должно быть `active (running)` зелёным.

Проверка:
```bash
curl http://127.0.0.1:8000/
# Ответ: {"status":"ok","service":"florarium-api"}
```

## ШАГ 9. Настрой Nginx
```bash
cp /opt/florarium/deploy/nginx.conf /etc/nginx/sites-available/florarium
ln -sf /etc/nginx/sites-available/florarium /etc/nginx/sites-enabled/florarium
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

## ШАГ 10. SSL (HTTPS)
```bash
certbot --nginx -d siberian-florarium.ru -d www.siberian-florarium.ru
```
Введи email, согласись с условиями. Сертификат поставится автоматически.

## ШАГ 11. Залей фронтенд (билд)
В кабинете poehali → Скачать → **Скачать билд**. Получишь zip.

Распакуй и залей на сервер:
```bash
# На своём компьютере:
scp -r dist/* root@5.42.117.66:/var/www/html/
```

## ШАГ 12. Проверка
Открой https://siberian-florarium.ru — сайт должен работать.

Тест API:
```bash
curl https://siberian-florarium.ru/api/main
```

## ШАГ 13. Переключи фронт на свой API (КРИТИЧНО)
Сейчас фронт ходит на `functions.poehali.dev`. Нужно переключить на твой домен.

Это делается в КОДЕ ФРОНТА — Юра (я) подготовил отдельный коммит с заменой URL.
После переключения сделай новый билд → загрузи на сервер → готово.

---

## Полезные команды
- Логи API: `journalctl -u florarium-api -f`
- Перезапуск API: `systemctl restart florarium-api`
- Логи nginx: `tail -f /var/log/nginx/error.log`
- Подключение к БД: `sudo -u postgres psql florarium`
