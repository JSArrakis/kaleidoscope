export class LoadMediaArgs {
  password: string;
  media: string[];

  constructor(password: string, movies: string[]) {
    this.password = password;
    this.media = movies;
  }
}
