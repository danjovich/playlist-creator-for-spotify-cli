import SpotifyWebApi from 'spotify-web-api-node';

interface IResponse {
  accessToken: string;
  refreshToken: string;
}

export default class UserServices {
  public static async getSpotifyTokenFromCode(
    code: string
  ): Promise<IResponse> {
    const credentials = {
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      redirectUri: process.env.REDIRECT_URI
    };

    const spotifyWebApi = new SpotifyWebApi(credentials);

    const data = await spotifyWebApi.authorizationCodeGrant(code);

    // eslint-disable-next-line camelcase
    const { access_token, refresh_token } = data.body;

    return {
      accessToken: access_token,
      refreshToken: refresh_token
    };
  }

  public static async getNewAccessToken(
    refreshToken: string
  ): Promise<IResponse> {
    const credentials = {
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      redirectUri: process.env.REDIRECT_URI,
      refreshToken
    };

    const spotifyWebApi = new SpotifyWebApi(credentials);

    const data = await spotifyWebApi.refreshAccessToken();

    // eslint-disable-next-line camelcase
    const { access_token, refresh_token } = data.body;

    return {
      accessToken: access_token,
      // eslint-disable-next-line camelcase
      refreshToken: refresh_token as string
    };
  }
}
