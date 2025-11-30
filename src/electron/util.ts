import { ipcMain, WebContents, WebFrameMain } from "electron";
import { pathToFileURL } from "url";
import { getUIPath } from "./pathResolver.js";

export function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

export function ipcMainHandle<Key extends keyof EventPayloadMapping>(
  key: Key,
  handler: (
    event: Electron.IpcMainInvokeEvent,
    ...args: any[]
  ) => EventPayloadMapping[Key]
) {
  ipcMain.handle(key, async (event, ...args) => {
    // if (event.senderFrame) {
    //   validateEventFrame(event.senderFrame);
    //   return handler(event, ...args);
    // }
    // throw new Error("Malicious event");
    return await handler(event, ...args);
  });
}

//TODO: Define all possible paths for the event frame
export function validateEventFrame(frame: WebFrameMain) {
  if (isDev() && new URL(frame.url).host === "localhost:5213") {
    return;
  }
  if (frame.url !== pathToFileURL(getUIPath()).toString()) {
    throw new Error("Malicious event");
  }
}

export function ipcWebContentsSend<Key extends keyof EventPayloadMapping>(
  key: Key,
  webContents: WebContents,
  payload: EventPayloadMapping[Key]
) {
  webContents.send(key, payload);
}
