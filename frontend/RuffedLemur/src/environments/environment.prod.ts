export const environment = {
  production: true,
  apiUrl: '/api/v1',
  logErrorsToServer: true,
  logApiResponses: false,
  defaultPageSize: 25,
  refreshTokenInterval: 10 * 60 * 1000, // 10 minutes in milliseconds
  ssoProviders: ['google', 'github', 'okta', 'microsoft'],
  appName: 'RuffedLemur'
};
