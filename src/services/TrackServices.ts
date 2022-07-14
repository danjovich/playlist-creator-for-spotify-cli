import axios from 'axios';
import SpotifyWebApi from 'spotify-web-api-node';
import waitFor from '../functions/waitFor';
import { Artist, PlaylistOptions, Track } from '../interfaces';
import ArtistServices from './ArtistServices';

export default class TrackServices {
  private static spotifyWebApi = new SpotifyWebApi();

  public static async getSavedTracks(
    accessToken: string,
    setProgress: (value: number) => void
  ): Promise<[Track[], Artist[]]> {
    this.spotifyWebApi.setAccessToken(accessToken);

    let total = 50;
    let tracks: Track[] = [];
    let artists: Artist[] = [];

    for (let i = 0; i < total; i += 50) {
      setProgress(i / total);

      const response = await this.spotifyWebApi.getMySavedTracks({
        limit: 50,
        offset: i
      });

      i === 0 && (total = response.body.total);

      const nextTracks = response.body.items.map((item) => {
        // eslint-disable-next-line camelcase
        const { added_at } = item;
        const { artists: newTrackArtists, id } = item.track;

        const artistsSimplified =
          ArtistServices.getSimplifiedArtists(newTrackArtists);

        artists = ArtistServices.updateArtistsArray(artists, artistsSimplified);

        return { artists: artistsSimplified, id, addedAt: new Date(added_at) };
      });

      tracks = [...nextTracks, ...tracks];
    }

    setProgress(1);

    return [tracks, artists];
  }

  public static updateTracksArtists(
    tracks: Track[],
    artists: Artist[]
  ): Track[] {
    return tracks.map((track) => {
      const updatedArtists = track.artists.map((artist) => {
        const updatedArtist = artists.find(
          (newArtist) => newArtist.id === artist.id
        );

        return updatedArtist ?? artist;
      });

      return { ...track, artists: updatedArtists };
    });
  }

  public static filterByGenre(tracks: Track[], genre: string) {
    return tracks.filter((track) =>
      track.artists.some((artist) => artist.genres.includes(genre))
    );
  }

  public static async createPlaylist(
    accessToken: string,
    tracks: Track[],
    options: PlaylistOptions,
    setProgress: (progress: number) => void
  ): Promise<void> {
    this.spotifyWebApi.setAccessToken(accessToken);

    const { name, isPublic, ...restOfOptions } = options;

    const response = await this.spotifyWebApi.createPlaylist(name, {
      public: isPublic,
      ...restOfOptions
    });

    const { id } = response.body;

    const sortedTracks = this.sortByDate(tracks);

    const formattedTracksArray = sortedTracks.map(
      (track) => `spotify:track:${track.id}`
    );

    let error = false;

    for (let i = 0; i < formattedTracksArray.length; i += 50) {
      const slicedArray = formattedTracksArray.slice(i, i + 50);

      await waitFor(1000);

      try {
        await axios.post(
          `https://api.spotify.com/v1/playlists/${id}/tracks`,
          {
            uris: slicedArray
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        );
      } catch (err) {
        error = true;
        break;
      }

      setProgress(i / formattedTracksArray.length);
    }

    setProgress(1);

    if (error) {
      console.log('An error ocurred while creating the playlist...');
    }
  }

  private static sortByDate(tracks: Track[]): Track[] {
    return tracks.sort(
      (trackA, trackB) => trackB.addedAt.getTime() - trackA.addedAt.getTime()
    );
  }
}
