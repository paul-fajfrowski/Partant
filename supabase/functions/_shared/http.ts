export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
// Bound bytes while reading, not after allocating an arbitrary request body.
export async function readJson(req: Request, limit = 400_000): Promise<any> {
  if (Number(req.headers.get("content-length")) > limit)
    throw new HttpError(413, "Contenu trop volumineux.");
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, "Requête vide.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw new HttpError(413, "Contenu trop volumineux.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  const raw = new TextDecoder().decode(bytes);
  if (/"(?:__proto__|constructor|prototype)"\s*:/.test(raw))
    throw new HttpError(400, "Requête invalide.");
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw Error();
    return value;
  } catch {
    throw new HttpError(400, "Requête invalide.");
  }
}
