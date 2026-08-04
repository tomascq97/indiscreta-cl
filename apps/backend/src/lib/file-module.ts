import type { S3FileConfiguration } from "./env";

type S3ProviderOptions = {
  file_url: string;
  access_key_id: string;
  secret_access_key: string;
  region: string;
  bucket: string;
  endpoint?: string;
  additional_client_config?: {
    forcePathStyle: boolean;
  };
};

type S3FileProvider = {
  resolve: "@medusajs/medusa/file-s3";
  id: "s3";
  is_default: true;
  options: S3ProviderOptions;
};

export type FileModuleConfiguration = {
  resolve: "@medusajs/medusa/file";
  options: {
    // Medusa 2.18 runtime and documentation use this array; its published type
    // incorrectly declares a singular `provider` property.
    providers: [S3FileProvider];
  };
};

export function buildFileModule(
  configuration?: S3FileConfiguration,
): FileModuleConfiguration | undefined {
  if (!configuration) {
    return undefined;
  }

  const {
    fileUrl,
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
    endpoint,
    forcePathStyle,
  } = configuration;

  return {
    resolve: "@medusajs/medusa/file",
    options: {
      providers: [
        {
          resolve: "@medusajs/medusa/file-s3",
          id: "s3",
          is_default: true,
          options: {
            file_url: fileUrl,
            access_key_id: accessKeyId,
            secret_access_key: secretAccessKey,
            region,
            bucket,
            ...(endpoint ? { endpoint } : {}),
            ...(forcePathStyle !== undefined
              ? {
                  additional_client_config: {
                    forcePathStyle,
                  },
                }
              : {}),
          },
        },
      ],
    },
  };
}
