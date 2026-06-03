async function getRoot(): Promise<FileSystemDirectoryHandle> {
  return navigator.storage.getDirectory();
}

function fileName(id: string): string {
  return `video-${id}`;
}

export async function saveVideo(id: string, blob: Blob): Promise<void> {
  const root = await getRoot();
  const handle = await root.getFileHandle(fileName(id), { create: true });
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

export async function loadVideoUrl(id: string): Promise<string | null> {
  try {
    const root = await getRoot();
    const handle = await root.getFileHandle(fileName(id));
    const file = await handle.getFile();
    return URL.createObjectURL(file);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'NotFoundError') return null;
    throw err;
  }
}

export async function deleteVideo(id: string): Promise<void> {
  try {
    const root = await getRoot();
    await root.removeEntry(fileName(id));
  } catch {
    // file may not exist — silently ignore
  }
}

export async function uploadVideoToR2(runId: string, blob: Blob): Promise<void> {
  const { api } = await import('./apiClient');
  const contentType = blob.type || 'video/mp4';

  const { url } = await api.post<{ url: string; key: string }>(
    `/api/runs/${runId}/video-upload-url`,
    { contentType },
  );

  const uploadRes = await fetch(url, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': contentType },
  });

  if (!uploadRes.ok) throw new Error(`R2 upload failed: ${uploadRes.status}`);

  await api.patch(`/api/runs/${runId}/video-uploaded`, {});
}
