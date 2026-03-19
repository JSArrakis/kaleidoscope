import * as bumperController from "../controllers/bumperController.js";

export async function getBumpersHandler(): Promise<Bumper[]> {
  console.log("[bumperHandler] IPC: getBumpers");
  return bumperController.getAllBumpers();
}

export async function createBumperHandler(
  bumper: Bumper
): Promise<{ message: string; status: number }> {
  console.log("[bumperHandler] IPC: createBumper -", bumper.mediaItemId);
  // Type-safe call with proper Bumper type matching backend repository
  return bumperController.createBumper(bumper);
}

export async function deleteBumperHandler(
  bumper: Bumper
): Promise<{ message: string; status: number }> {
  console.log("[bumperHandler] IPC: deleteBumper -", bumper.mediaItemId);
  return bumperController.deleteBumper(bumper.mediaItemId);
}

export async function updateBumperHandler(
  bumper: Bumper
): Promise<{ message: string; status: number }> {
  console.log("[bumperHandler] IPC: updateBumper -", bumper.mediaItemId);
  // Type-safe call with Partial<Bumper> since controller expects updates
  return bumperController.updateBumper(bumper.mediaItemId, bumper);
}
