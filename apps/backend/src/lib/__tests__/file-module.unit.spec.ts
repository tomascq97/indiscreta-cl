import { buildFileModule } from "../file-module";

const s3Configuration = {
  fileUrl: "https://assets.invalid/test-bucket",
  accessKeyId: "test-access-key",
  secretAccessKey: "test-secret-key",
  region: "test-region-1",
  bucket: "test-bucket",
  endpoint: "https://s3-api.invalid",
  forcePathStyle: true,
};

describe("buildFileModule", () => {
  it("keeps the default local provider when S3 is absent", () => {
    expect(buildFileModule()).toBeUndefined();
  });

  it("uses the runtime providers array with the exact S3 provider structure", () => {
    const fileModule = buildFileModule(s3Configuration);

    expect(Array.isArray(fileModule?.options.providers)).toBe(true);
    expect(fileModule).toEqual({
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-s3",
            id: "s3",
            is_default: true,
            options: {
              file_url: s3Configuration.fileUrl,
              access_key_id: s3Configuration.accessKeyId,
              secret_access_key: s3Configuration.secretAccessKey,
              region: s3Configuration.region,
              bucket: s3Configuration.bucket,
              endpoint: s3Configuration.endpoint,
              additional_client_config: {
                forcePathStyle: true,
              },
            },
          },
        ],
      },
    });
  });
});
