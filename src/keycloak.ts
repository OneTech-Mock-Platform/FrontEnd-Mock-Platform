import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:9099',
  realm: 'mock-platform',
  clientId: 'mock-platform-frontend',
});


keycloak.onTokenExpired = () => {
  keycloak.updateToken(30).catch(() => keycloak.login());
};

export default keycloak;
