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
export async function choosePhoto(owner?: string) {
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
  if (owner)
    return uploadAsset(
      a.uri,
      a.mimeType ?? "image/jpeg",
      "coach-photos",
      owner,
    );
  return `data:${a.mimeType ?? "image/jpeg"};base64,${a.base64}`;
}

export async function uploadAsset(
  uri: string,
  mime: string,
  bucket: "coach-photos" | "coach-documents",
  owner: string,
) {
  const { supabase } = await import("../lib/supabase");
  const Crypto = await import("expo-crypto");
  const bytes =
    Platform.OS === "web"
      ? await (await fetch(uri)).arrayBuffer()
      : await new (await import("expo-file-system")).File(uri).arrayBuffer();
  if (bytes.byteLength > (bucket === "coach-photos" ? 5 : 10) * 1024 * 1024)
    throw Error("Fichier trop volumineux.");
  const ext = (
    {
      "application/pdf": "pdf",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    } as Record<string, string>
  )[mime];
  if (!ext) throw Error("Choisissez un PDF, JPEG, PNG ou WebP.");
  const path = `${owner}/${Crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, { contentType: mime, upsert: false });
  if (error) throw error;
  return bucket === "coach-photos"
    ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
    : path;
}
export async function chooseDocument(owner: string) {
  const picker = await import("expo-document-picker");
  const result = await picker.getDocumentAsync({
    type: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  return uploadAsset(
    asset.uri,
    asset.mimeType ?? "application/pdf",
    "coach-documents",
    owner,
  );
}
export async function openDocument(path: string) {
  const { supabase } = await import("../lib/supabase");
  const { data, error } = await supabase.storage
    .from("coach-documents")
    .createSignedUrl(path, 60);
  if (error) throw error;
  const { Linking } = await import("react-native");
  await Linking.openURL(data.signedUrl);
}
