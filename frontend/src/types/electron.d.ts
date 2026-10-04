export {};

declare global {
  interface Window {
    logoAPI: {
      selectLogo: () => Promise<{
        success: boolean;
        canceled?: boolean;
        path?: string;
      }>;

      getLogoUrl: () => string | null;
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