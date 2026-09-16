import { Platform } from "react-native";
export async function exportFile(name: string, content: string, mime: string) {
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(new Blob([content], { type: mime })),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const { File, Paths } = await import("expo-file-system"),
    Sharing = await import("expo-sharing");
  if (!(await Sharing.isAvailableAsync()))
    throw Error("Le partage de fichier n’est pas disponible sur cet appareil.");
  const f = new File(Paths.cache, name);
  f.create({ overwrite: true });
  f.write(content);
  await Sharing.shareAsync(f.uri, {
    mimeType: mime,
    dialogTitle: "Enregistrer mon fichier Partant",
  });
}
export async function choosePhoto() {
  const picker = await import("expo-image-picker");
  const r = await picker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    base64: true,
    quality: 0.7,
  });
  if (r.canceled) return null;
  const a = r.assets[0];
  if (!a.base64 || a.base64.length * 0.75 > 600 * 1024)
    throw Error("Choisissez une photo de moins de 600 Ko.");
  if (
    a.mimeType &&
    !["image/jpeg", "image/png", "image/webp"].includes(a.mimeType)
  )
    throw Error("Choisissez un JPEG, PNG ou WebP.");
  return `data:${a.mimeType ?? "image/jpeg"};base64,${a.base64}`;
}
