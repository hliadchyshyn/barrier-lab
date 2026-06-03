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
