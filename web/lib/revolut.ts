// Revolut Business API client — Sprint 2 implementation
// OAuth flow, token refresh, and transaction sync

const REVOLUT_API_URL = process.env.REVOLUT_API_URL || "https://b2b.revolut.com/api/1.0";

export async function getAuthUrl(): Promise<string> {
  // TODO: Build OAuth authorize URL with READ scope
  return `${REVOLUT_API_URL}/authorize`;
}

export async function exchangeCode(_code: string) {
  // TODO: Exchange auth code for access + refresh tokens
  return { accessToken: "", refreshToken: "", expiresIn: 2400 };
}

export async function refreshToken(_refreshToken: string) {
  // TODO: Use refresh token to get new access token
  return { accessToken: "", refreshToken: "", expiresIn: 2400 };
}

export async function getAccounts(_accessToken: string) {
  // TODO: GET /accounts — returns account list with balances
  return [];
}

export async function getTransactions(_accessToken: string, _accountId: string, _from: Date, _to: Date) {
  // TODO: GET /transactions with date range
  return [];
}
