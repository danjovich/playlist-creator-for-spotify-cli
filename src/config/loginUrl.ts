export default function loginUrl(credentials: {
  redirectUri: string;
  clientId: string;
}): string {
  const authEndpoint = 'https://accounts.spotify.com/authorize';
  const { redirectUri, clientId } = credentials;

  const scopes = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-library-read',
    'playlist-modify-private',
    'playlist-modify-public'
  ];

  const returnedUrl =
    redirectUri && clientId
      ? `${authEndpoint}?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes.join(
          '%20'
        )}`
      : '';

  return returnedUrl;
}
