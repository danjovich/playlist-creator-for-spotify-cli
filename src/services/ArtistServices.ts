import SpotifyWebApi from 'spotify-web-api-node';
import { Artist } from '../interfaces';

export default class ArtistServices {
  public static getSimplifiedArtists(
    newTrackArtists: SpotifyApi.ArtistObjectSimplified[]
  ): Artist[] {
    return newTrackArtists.map((newTrackArtist) => {
      return {
        id: newTrackArtist.id,
        genres: [] as string[]
      };
    });
  }

  public static updateArtistsArray(
    artistsArray: Artist[],
    newArtists: Artist[]
  ): Artist[] {
    newArtists.forEach((artist) => {
      if (!artistsArray.some((arrayArtist) => arrayArtist.id === artist.id)) {
        artistsArray.push(artist);
      }
    });

    return artistsArray;
  }

  public static async getArtistsWithGenresAndGenresArray(
    artists: Artist[],
    setProgress: (value: number) => void,
    accessToken: string
  ): Promise<[Artist[], string[]]> {
    const artistsWithGenres = [] as Artist[];
    const genres = [] as string[];

    const spotifyWebApi = new SpotifyWebApi({ accessToken });

    const artistsIds = artists.map((artist) => artist.id);

    for (let i = 0; i < artistsIds.length; i += 50) {
      setProgress(i / artistsIds.length);

      const response = await spotifyWebApi.getArtists(
        artistsIds.slice(i, i + 50)
      );

      const { artists: completeArtists } = response.body;

      completeArtists
        .map((artist) => {
          return {
            id: artist.id,
            genres: artist.genres
          };
        })
        .forEach((artist) => artistsWithGenres.push(artist));
    }

    artistsWithGenres.forEach((artist) =>
      artist.genres.forEach((genre) => {
        if (!genres.includes(genre)) genres.push(genre);
      })
    );

    setProgress(1);

    return [artistsWithGenres, genres.sort()];
  }
}
