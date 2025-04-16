export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/1',
  logErrorsToServer: true,
  defaultPageSize: 10,
  refreshTokenInterval: 10 * 60 * 1000, // 10 minutes in milliseconds
  ssoProviders: ['google', 'github', 'okta', 'microsoft'],
  appName: 'RuffledLemur'
};
