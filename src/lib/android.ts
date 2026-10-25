/**
 * Android app only: files leave the app through the system share sheet
 * (Files, Google Drive, WhatsApp, e-mail…). The plugins load on first use.
 */
export async function shareFileAndroid(filename: string, text: string): Promise<boolean> {
  try {
    const [{ Directory, Encoding, Filesystem }, { Share }] = await Promise.all([import("@capacitor/filesystem"), import("@capacitor/share")]);
    const { uri } = await Filesystem.writeFile({ path: filename, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: filename, files: [uri], dialogTitle: "حفظ الملف أو مشاركته" });
    return true;
  } catch {
    return false; // closed without choosing, or sharing unavailable
  }
}
