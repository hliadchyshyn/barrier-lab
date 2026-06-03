import { describe, it, expect } from 'vitest';
import { getUploadUrl, getDownloadUrl } from './r2';

describe('r2 helpers', () => {
  it('getUploadUrl returns a presigned https URL', async () => {
    const url = await getUploadUrl('test-key.mp4', 'video/mp4');
    expect(typeof url).toBe('string');
    expect(url).toMatch(/^https:\/\//);
  });

  it('getDownloadUrl returns a presigned https URL', async () => {
    const url = await getDownloadUrl('test-key.mp4');
    expect(typeof url).toBe('string');
    expect(url).toMatch(/^https:\/\//);
  });
});
