export {};

declare global {
  interface Window {
    logoAPI: {
      selectLogo: () => Promise<{
        success: boolean;
        canceled?: boolean;
        path?: string;
      }>;

      getLogo: () => Promise<{
        exists: boolean;
        data?: string;
        mimeType?: string;
      }>;
    };

    backupAPI: {
      saveBackup: (
        buffer: ArrayBuffer,
        filename: string,
      ) => Promise<{
        success: boolean;
        canceled: boolean;
        filePath?: string;
        error?: string;
      }>;
    };
  }
}