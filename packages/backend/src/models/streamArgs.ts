export class StreamArgs {
  env?: string;
  movies?: string[];
  tagsOR?: string[];
  tagsAND?: string[];
  blocks?: string[];
  endTime?: number;
  durEval?: string[];
  startTime?: number;
  continuous?: boolean;
  password: string;

  constructor(password: string) {
    this.password = password;
  }
}
