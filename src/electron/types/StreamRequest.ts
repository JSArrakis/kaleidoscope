export interface IStreamRequest {
  Title?: string;
  Env?: string;
  Password?: string;
  Tags?: string[] | any[];
  MultiTags?: string[] | any[];
  Movies?: string[];
  EndTime?: number;
  StartTime?: number;
}
