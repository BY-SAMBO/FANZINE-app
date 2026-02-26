// Raw ESC/POS printer — cross-platform (macOS via lp, Windows via print/copy)

import { execFile, exec } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { tmpdir, platform } from "os";
import { join } from "path";

const PRINTER_NAME = process.env.POS_PRINTER_NAME || "Printer_POS_80";

export async function printRaw(data: Buffer): Promise<void> {
  const tmpPath = join(tmpdir(), `comanda-${Date.now()}.bin`);
  await writeFile(tmpPath, data);
  try {
    if (platform() === "win32") {
      await printWindows(tmpPath);
    } else {
      await printUnix(tmpPath);
    }
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}

/** macOS / Linux: CUPS lp command */
function printUnix(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile("lp", ["-d", PRINTER_NAME, "-o", "raw", filePath], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/** Windows: send raw bytes via `copy /b` to the shared printer */
function printWindows(filePath: string): Promise<void> {
  // Windows needs the printer as a UNC share (\\PC\Printer) or mapped port
  // POS_PRINTER_NAME should be set to the share name, e.g.:
  //   \\DESKTOP-ABC\Printer_POS_80   (network share)
  //   USB001                          (local raw port)
  const cmd = `copy /b "${filePath}" "${PRINTER_NAME}"`;
  return new Promise((resolve, reject) => {
    exec(cmd, { shell: "cmd.exe" }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
