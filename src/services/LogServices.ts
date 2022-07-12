import kleur from 'kleur';
import readline from 'readline';
import fs from 'fs';
import openurl from 'openurl2';
import util from 'util';
import { Terminal } from 'terminal-kit';
import loginUrl from '@config/loginUrl';
import { Track, PlaylistOptions } from '@interfaces/index';
import UserServices from './UserServices';
import TrackServices from './TrackServices';
import ArtistServices from './ArtistServices';

export default class LogServices {
  public static async initialText(
    rl: readline.Interface,
    term: Terminal
  ): Promise<string> {
    const question = util.promisify(rl.question).bind(rl) as unknown as (
      arg1: string
    ) => Promise<string>;

    await term.slowTyping('Welcome to Playlist Creator for Spotify!\n\n', {
      delay: 40
    });

    this.generateLogo().forEach((line) => console.log(line));
    console.log('\n');

    const credentials = {
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      redirectUri: process.env.REDIRECT_URI,
      refreshToken: process.env.REFRESH_TOKEN
    };

    // eslint-disable-next-line prefer-const
    let { clientId, clientSecret, redirectUri, refreshToken } = credentials;

    let accessToken: string;

    if (!clientId || !clientSecret || !redirectUri) {
      await term.slowTyping(
        'First, you will need to create developer credentials at https://developer.spotify.com/dashboard\n',
        { delay: 40 }
      );

      await term.slowTyping('To do so, follow the steps below:', {
        delay: 40
      });

      await term.slowTyping(
        `
  1. Log in to Spotify;
  2. Click on the button "Create an app";
  3. Give a name (e.g. "PCfS") and a description (e.g. "Create Spotify playlists with your liked songs based on a genre") to the app;
  4. Agree with the terms of service and click on "Create";
  5. Click on "Edit settings" and on "Redirect URIs" enter "http://localhost:8080", click on "Add" and then click on "Save";
  6. Copy the Client ID an then the Secret ID and enter them below.\n`,
        { delay: 40 }
      );

      await term.slowTyping('Enter the Client ID: ', { delay: 40 });

      const newClientId = await question(kleur.green('Enter the Client ID: '));
      clientId = newClientId;

      await term.slowTyping('Enter the Client Secret: ', { delay: 40 });

      const newClientSecret = await question(
        kleur.green('Enter the Client Secret: ')
      );
      clientSecret = newClientSecret;

      redirectUri = 'http://localhost:8080';

      const data =
        `CLIENT_ID=${clientId}\n` +
        `CLIENT_SECRET=${clientSecret}\n` +
        `REDIRECT_URI=${redirectUri}`;

      fs.writeFileSync(`${__dirname}/../../.env`, data);
    }

    if (!refreshToken) {
      const redirectUrl = loginUrl({
        redirectUri: redirectUri as string,
        clientId: clientId as string
      });

      openurl.open(redirectUrl);

      await term.slowTyping(
        'A page prompting you to login to Spotify was opened in your default browser.\n',
        { delay: 40 }
      );

      await term.slowTyping(
        'Please enter the code provided in the redirected page after logging in.\n',
        { delay: 40 }
      );

      await term.slowTyping('Code: ', { delay: 40 });

      const code = await question(kleur.green('Code: '));

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await UserServices.getSpotifyTokenFromCode(code);

      accessToken = newAccessToken;

      fs.appendFileSync(
        `${__dirname}/../../.env`,
        `\nREFRESH_TOKEN=${newRefreshToken}`
      );
    } else {
      const { accessToken: newAccessToken } =
        await UserServices.getNewAccessToken(refreshToken);

      accessToken = newAccessToken;
    }

    return accessToken;
  }

  public static async mainText(
    rl: readline.Interface,
    term: Terminal,
    accessToken: string
  ): Promise<void> {
    const question = util.promisify(rl.question).bind(rl) as unknown as (
      arg1: string
    ) => Promise<string>;

    await term.slowTyping(
      "Let's start! First, we will need to load your saved songs. This should take less than 30 seconds.\n",
      { delay: 40 }
    );

    let progressBar = term.progressBar({
      width: 80,
      title: 'Loading your songs:',
      titleStyle: term.green,
      eta: true,
      percent: true
    });

    const setProgress = (value: number) => {
      progressBar.update(value);
    };

    const [tracks, artists] = await TrackServices.getSavedTracks(
      accessToken,
      setProgress
    );

    console.log('\n');

    await term.slowTyping(
      'Now, we will load the genres of the artists in your saved songs. This should take only some seconds.\n',
      { delay: 40 }
    );

    progressBar = term.progressBar({
      width: 80,
      title: 'Loading the genres:',
      titleStyle: term.green,
      eta: true,
      percent: true
    });

    const [artistsWithGenres, genres] =
      await ArtistServices.getArtistsWithGenresAndGenresArray(
        artists,
        setProgress,
        accessToken
      );

    const updatedTracks = TrackServices.updateTracksArtists(
      tracks,
      artistsWithGenres
    );

    // eslint-disable-next-line no-constant-condition
    while (true) {
      console.log('\n');

      await term.slowTyping(
        'Choose the genre for your playlist (press tab for autocompletion):\n',
        {
          delay: 40
        }
      );

      const genre = await term.inputField({
        autoComplete: genres,
        autoCompleteMenu: true,
        autoCompleteHint: true
      }).promise;

      await term.slowTyping("\nNow, let's choose the playlist options\n", {
        delay: 40
      });

      await term.slowTyping('What will the playlist name be? ', {
        delay: 40
      });

      const name = await question(
        kleur.green('What will the playlist name be? ')
      );

      await term.slowTyping('What will the playlist description be?', {
        delay: 40
      });

      const description = await question(
        kleur.green('What will the playlist description be? ')
      );

      await term.slowTyping('Will the playlist be collaborative [y|n]? ', {
        delay: 40
      });

      const collaborative = await term.yesOrNo({
        yes: ['y', 'ENTER'],
        no: ['n']
      }).promise;

      let isPublic: boolean | undefined = false;

      if (!collaborative) {
        await term.slowTyping('\nWill the playlist be public [y|n]? ', {
          delay: 40
        });

        isPublic = await term.yesOrNo({
          yes: ['y', 'ENTER'],
          no: ['n']
        }).promise;
      }

      await this.createPlaylist(genre as string, updatedTracks, accessToken, {
        collaborative: collaborative ?? false,
        description,
        isPublic: isPublic ?? false,
        name
      });

      await term.slowTyping('\nThe playlist was created! Check your Spotify.', {
        delay: 40
      });

      await term.slowTyping(
        '\nDo you want to create another playlist [y|n]? ',
        {
          delay: 40
        }
      );

      const continueApp = await term.yesOrNo({
        yes: ['y', 'ENTER'],
        no: ['n']
      }).promise;

      console.log('\n');

      if (!continueApp) {
        break;
      }
    }
  }

  private static async createPlaylist(
    genre: string,
    savedTracks: Track[],
    accessToken: string,
    playlistOptions: PlaylistOptions
  ): Promise<void> {
    const { collaborative, description, isPublic, name } = playlistOptions;

    const filteredTracks = TrackServices.filterByGenre(savedTracks, genre);

    await TrackServices.createPlaylist(accessToken, filteredTracks, {
      name,
      description,
      collaborative,
      isPublic
    });
  }

  private static generateLogo(): string[] {
    const lines = [];

    lines[0] =
      kleur.red('8888888b.   ') +
      kleur.yellow('.d8888b.   ') +
      kleur.magenta('.d888 ') +
      kleur.green('.d8888b.');

    lines[1] =
      kleur.red('888   Y88b ') +
      kleur.yellow('d88P  Y88b ') +
      kleur.magenta('d88P" ') +
      kleur.green('d88P  Y88b');

    lines[2] =
      kleur.red('888    888 ') +
      kleur.yellow('888    888 ') +
      kleur.magenta('888   ') +
      kleur.green('Y88b.');

    lines[3] =
      kleur.red('888   d88P ') +
      kleur.yellow('888        ') +
      kleur.magenta('888888 ') +
      kleur.green('"Y888b.');

    lines[4] =
      kleur.red('8888888P"  ') +
      kleur.yellow('888        ') +
      kleur.magenta('888       ') +
      kleur.green('"Y88b.');

    lines[5] =
      kleur.red('888        ') +
      kleur.yellow('888    888 ') +
      kleur.magenta('888         ') +
      kleur.green('"888');

    lines[6] =
      kleur.red('888        ') +
      kleur.yellow('Y88b  d88P ') +
      kleur.magenta('888   ') +
      kleur.green('Y88b  d88P');

    lines[7] =
      kleur.red('888         ') +
      kleur.yellow('"Y8888P"  ') +
      kleur.magenta('888    ') +
      kleur.green('"Y8888P"');

    return lines;
  }
}
