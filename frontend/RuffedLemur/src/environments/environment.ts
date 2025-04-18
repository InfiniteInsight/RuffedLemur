export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api/v1',
  logErrorsToServer: true,
  logApiResponses: true,
  defaultPageSize: 10,
  refreshTokenInterval: 10 * 60 * 1000, // 10 minutes in milliseconds
  ssoProviders: ['google', 'github', 'okta', 'microsoft'],
  appName: 'RuffedLemur'
};
