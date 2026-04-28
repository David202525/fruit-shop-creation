/**
 * Патчит все hardcoded URL functions.poehali.dev на локальный backend.
 * Запускается перед сборкой внутри Docker.
 */

const fs = require('fs');
const path = require('path');

// По умолчанию используем относительный путь /api — это работает и для HTTPS-режима через Traefik,
// и при доступе по домену. При запуске без домена пользователь должен указать VITE_API_BASE_URL=http://IP:8000.
const BASE_URL = process.env.VITE_API_BASE_URL || '/api';

// UUID → имя функции (полный маппинг всех функций проекта)
const UUID_TO_FUNCTION = {
  // Основные функции (func2url.json)
  '2cc7c24d-08b2-4c44-a9a7-8d09198dbefc': 'auth',
  '5ae817c6-e62e-40c6-8e34-18ffac2d3cfc': 'products',
  'b35bef37-8423-4939-b43b-0fb565cc8853': 'orders',
  '9b1ac59e-93b6-41de-8974-a7f58d4ffaf9': 'settings',
  '0a62d37c-9fd0-4ff3-9b5b-2c881073d3ac': 'categories',
  '60d635ae-584e-4966-b483-528742647efb': 'alfabank-payment',
  '563d9333-4b51-4637-82a8-c2a66058792a': 'alfabank-webhook',
  'fc281a64-4d76-4cbd-9ae6-6cf970c14f35': 'notifications',
  'ed127250-fe9d-4c7e-9a93-fb8b7fdc038a': 'loyalty-card',
  '44df414c-694f-4079-aa96-764afeaf23e3': 'upload-image',
  '98c69bc9-5dec-4d0e-b5d8-8abc20d4db4d': 'support-chat',
  'a833bb69-e590-4a5f-a513-450a69314192': 'support',
  '5417d2b2-c525-4686-856d-577e2d90240c': 'statistics',
  '14c40ab2-8b60-4ccc-b428-bb824cb6871c': 'admin-get-logs',
  '4986919b-8daf-4d91-b11a-b3bde148f13f': 'admin-update-profile',
  '56deea36-35f7-4c07-becc-dedeaa3de78d': 'content-manager',
  'c2c15ef8-454e-4315-bff3-7109e95d5f3d': 'user-tickets',
  'ff57c64d-2ef3-40a0-b0ef-d3ecc109a1fa': 'plants-inventory',
  '8c8e301f-2323-4f3b-85f0-14a3c210e670': 'delivery-zones',
  'c7d83bd6-2027-4170-8c35-7f6462c5274a': 'password-reset',
  '91674d2e-1306-4ae6-9c23-ab0938e8ce5c': 'ratings',
  '4a59ecd1-c528-41e9-a77d-003da941bcf4': 'google-auth',
  '77f82e21-01e9-4f2b-98c5-de4ef28792ad': 'favorites',
  // UUID из src/config/api.ts
  '597de3a8-5db2-4e46-8835-5a37042b00f1': 'auth',
  'cc3b9628-07ec-420e-b340-1c20cad986da': 'auth',
  'e779e7ac-e5aa-4f88-b2dc-e856132ad15d': 'users-api',
  '7f682e02-1640-40e7-8e2a-7a4e7723b309': 'payments-api',
  '57770127-fe63-43db-9fb1-87a2bbe27010': 'categories',
  // Недостающие UUID из исходников
  '08b68f40-ac3c-482d-a3e6-2162d9ca149b': 'dashboard-api',
  '1dd9da2d-583e-4678-9e8a-b647fdb30eea': 'upload-image',
  '20167b17-c827-4e24-b1a1-2ca1571d5bab': 'payments-api',
  '28de9a43-6aa7-491b-a20e-7a2e9ecebe49': 'approvals-api',
  '36ca4c35-8625-4e62-b383-d5feac4de266': 'tickets-api',
  '37368ef2-6990-44c6-9439-232d3a5820ff': 'upload-image',
  '3e531873-80bf-4d1f-bf41-1900d639b186': 'notifications-api',
  '5977014b-b187-49a2-8bf6-4ffb51e2aaeb': 'main',
  '69d0e8e7-3feb-4d34-9a63-64521e899118': 'clear-all-data',
  '87c6f94e-2ca8-4eb7-a7de-a98cec1dd03c': 'settings',
  '8f2170d4-9167-4354-85a1-4478c2403dfd': 'main',
  '97e7934f-259b-404b-9eae-6de53448c8c2': 'savings-api',
  'a0000b1e-3d3e-4094-b08e-2893df500d3f': 'process-scheduled-payments',
  'acbb6915-96bf-4e7f-ab66-c34c3fa4b26c': 'collect-logs',
  'ad233746-6bc7-475c-9eff-4547fd9394a5': 'support',
  'b3ad2f9d-7ef7-471b-a7fc-2ff1e0855ff8': 'dictionaries-api',
  'b41527a2-cf8d-4623-8504-e8717507b9d0': 'invoice-ocr',
  'cc67e884-8946-4bcd-939d-ea3c195a6598': 'push-notifications',
  'd0eab1c3-6c38-45d7-bbb4-71f9163a691f': 'stats-api',
  'dd221a88-cc33-4a30-a59f-830b0a41862f': 'log-analyzer',
  'eeefc720-2351-43cd-804d-44fbd748ab8f': 'process-scheduled-payments',
  'ffd10ecc-7940-4a9a-92f7-e6eea426304d': 'monitoring',
};

const SOURCE_DIR = path.join(__dirname, '..', 'src');

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (EXTENSIONS.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

let totalPatched = 0;

const files = walkDir(SOURCE_DIR);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  for (const [uuid, funcName] of Object.entries(UUID_TO_FUNCTION)) {
    const oldUrl = `https://functions.poehali.dev/${uuid}`;
    const newUrl = `${BASE_URL}/${funcName}`;

    if (content.includes(oldUrl)) {
      content = content.split(oldUrl).join(newUrl);
      console.log(`  [OK] ${path.relative(SOURCE_DIR, file)}: ${funcName}`);
      changed = true;
      totalPatched++;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
  }
}

console.log(`\nPatched ${totalPatched} URL(s) in ${files.length} scanned files.`);
console.log(`Backend URL: ${BASE_URL}`);

// Финальная проверка: ищем все оставшиеся functions.poehali.dev URL в исходниках,
// чтобы не пропустить UUID, которых нет в маппинге.
const LEFTOVER_RE = /https:\/\/functions\.poehali\.dev\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g;
const leftover = new Set();
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(LEFTOVER_RE);
  if (matches) {
    for (const m of matches) {
      leftover.add(`${m}  -->  ${path.relative(SOURCE_DIR, file)}`);
    }
  }
}
if (leftover.size > 0) {
  console.warn(`\n[WARN] Найдены ${leftover.size} неперехваченных UUID — добавь их в UUID_TO_FUNCTION:`);
  for (const item of leftover) {
    console.warn(`   ${item}`);
  }
}
