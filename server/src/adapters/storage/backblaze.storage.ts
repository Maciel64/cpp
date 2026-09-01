import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StoragePort } from "../../core/ports/storage.port";
import { env } from "../../lib/env";

const endpoint = env.B2_ENDPOINT.startsWith("http") ? env.B2_ENDPOINT : `https://${env.B2_ENDPOINT}`;

const client = new S3Client({
  region: "us-east-005",
  endpoint,
  credentials: {
    accessKeyId: env.B2_APPLICATION_KEY_ID,
    secretAccessKey: env.B2_APPLICATION_KEY,
  },
});

function prefixed(key: string): string {
  return env.B2_PREFIX ? `${env.B2_PREFIX}/${key}` : key;
}

export class BackblazeStorageAdapter implements StoragePort {
  async upload(key: string, body: Uint8Array, contentType: string): Promise<void> {
    await client.send(
      new PutObjectCommand({
        Bucket: env.B2_BUCKET,
        Key: prefixed(key),
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async getSignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: env.B2_BUCKET, Key: prefixed(key) }),
      { expiresIn: expiresInSeconds },
    );
  }
}