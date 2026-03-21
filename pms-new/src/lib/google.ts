import { google, sheets_v4, drive_v3 } from "googleapis";

/**
 * Google API Client Factory
 * 
 * Provides authenticated clients for Google Sheets and Drive APIs.
 * Supports two authentication methods:
 * 1. OAuth2 - For user-scoped operations (requires user login)
 * 2. Service Account - For server-to-server operations (no user interaction)
 */

// OAuth2 Scopes
const SCOPES = {
  sheets: ["https://www.googleapis.com/auth/spreadsheets"],
  drive: ["https://www.googleapis.com/auth/drive"],
  driveReadonly: ["https://www.googleapis.com/auth/drive.readonly"],
  driveFile: ["https://www.googleapis.com/auth/drive.file"],
} as const;

export type SheetsScope = keyof typeof SCOPES;

/**
 * Create OAuth2 client from environment credentials
 */
export function createOAuth2Client(): OAuth2Client {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  return client;
}

/**
 * Generate OAuth2 authorization URL
 */
export function getOAuth2AuthUrl(): string {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: [...SCOPES.sheets, ...SCOPES.drive],
    prompt: "consent",
  });
}

/**
 * Get tokens from OAuth2 authorization code
 */
export async function getOAuth2Tokens(
  code: string
): Promise<google.auth.OAuth2ClientOptions> {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens as google.auth.OAuth2ClientOptions;
}

/**
 * Create authenticated OAuth2 client from tokens
 */
export function createOAuth2ClientFromTokens(tokens: {
  access_token?: string;
  refresh_token?: string;
  expiry_date?: number;
}): OAuth2Client {
  const client = createOAuth2Client();
  client.setCredentials(tokens);
  return client;
}

// Type alias for OAuth2Client
export type OAuth2Client = ReturnType<typeof createOAuth2Client>;

/**
 * Create Service Account authenticator
 * Best for server-to-server operations (no user login required)
 */
export function createServiceAccountAuth(): google.auth.GoogleAuth {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}"),
    scopes: [...SCOPES.sheets, ...SCOPES.drive],
  });
  return auth;
}

/**
 * Get Sheets API client
 */
export async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  const auth = createServiceAccountAuth();
  return google.sheets({ version: "v4", auth });
}

/**
 * Get Drive API client
 */
export async function getDriveClient(): Promise<drive_v3.Drive> {
  const auth = createServiceAccountAuth();
  return google.drive({ version: "v3", auth });
}

// Re-export types for convenience
export type { sheets_v4, drive_v3 };
