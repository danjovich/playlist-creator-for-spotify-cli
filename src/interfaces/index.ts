export interface Artist {
  id: string;
  genres: string[];
}

export interface Track {
  id: string;
  artists: Artist[];
  addedAt: Date;
}

export interface PlaylistOptions {
  name: string;
  description: string;
  collaborative: boolean;
  isPublic: boolean;
}
