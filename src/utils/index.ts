import { TAuthConfig } from 'react-oauth2-code-pkce';

export const baseApiUrl = 'https://www.pathofexile.com/';

export const authConfig: TAuthConfig = {
  clientId: 'stashr',
  authorizationEndpoint: `${baseApiUrl}oauth/authorize`,
  tokenEndpoint: `${baseApiUrl}oauth/token`,
  redirectUri: 'http://localhost:3000/main_window/index.html',
  scope: 'account:profile account:leagues account:stashes',
  autoLogin: false,
  decodeToken: false
};

// export const readFile = async (file) =>
//   new Promise((resolve, reject) => {
//     const reader = new FileReader();

//     reader.onload = (event) => {
//       const { result } = event.currentTarget;

//       if (result) {
//         resolve(result);
//       } else {
//         reject();
//       }
//     };

//     reader.readAsText(file);
//   });
