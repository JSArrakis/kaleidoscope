import { BrowserWindow, dialog } from "electron";

export async function openFileDialogHandler(
  mainWindow: BrowserWindow
): Promise<string[]> {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile", "multiSelections"],
    });
    if (result.canceled) {
      return [];
    } else {
      return result.filePaths;
    }
  } catch (error) {
    console.error("Error opening file dialog:", error);
    throw error;
  }
}
