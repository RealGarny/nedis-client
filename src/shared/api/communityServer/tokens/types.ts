interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface TokenRequest {
  refreshToken: string;
}

// token that lives in cache with locally calculated expiration time
interface CachedAccessToken {
  token: string;
  expiresAtMs: number;
}

export type { TokenResponse, CachedAccessToken, TokenRequest };
