export const API_ENDPOINTS = {
  dashboardApi: '/api/dashboard-api',
  statsApi: '/api/stats-api',
  notificationsApi: '/api/notifications-api',
  approvalsApi: '/api/approvals-api',
  savingsApi: '/api/savings-api',
  ticketsApi: '/api/tickets-api',
  dictionariesApi: '/api/dictionaries-api',
  authApi: '/api/auth-api',
  paymentsApi: '/api/payments-api',
  categoriesApi: '/api/categories',
  usersApi: '/api/users-api',
  invoiceOcr: '/api/invoice-ocr',
  monitoring: '/api/monitoring',
  pushNotifications: '/api/push-notifications',
  clearAllData: '/api/clear-all-data',
  collectLogs: '/api/collect-logs',
  logAnalyzer: '/api/log-analyzer',
  main: '/api/main',
} as const;

export const getApiUrl = (endpoint: string, baseApi: keyof typeof API_ENDPOINTS = 'dictionariesApi'): string => {
  return `${API_ENDPOINTS[baseApi]}?endpoint=${endpoint}`;
};
