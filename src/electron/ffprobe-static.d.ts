declare module "ffprobe-static" {
  const ffprobeStatic:
    | string
    | {
        path: string;
      };

  export default ffprobeStatic;
}
