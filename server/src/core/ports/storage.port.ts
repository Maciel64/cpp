export interface StoragePort {
  upload(key: string, body: Uint8Array, contentType: string): Promise<void>;
  getSignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
}