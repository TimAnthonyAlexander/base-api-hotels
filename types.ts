// Generated TypeScript definitions for BaseApi
// Do not edit manually - regenerate with: ./mason types:generate

export type UUID = string;
export type Envelope<T> = { data: T };

export interface ErrorResponse {
  error: string;
  requestId: string;
  errors?: Record<string, string>;
}

export interface User {
  name: string;
  password: string;
  email: string;
  active: boolean;
  id: string;
  created_at?: string;
  updated_at?: string;
}

export interface GetHealthRequestQuery {
  db?: string;
  cache?: string;
}

export type GetHealthResponse = Envelope<any>;

export interface PostSignupRequestBody {
  name?: string;
  email?: string;
  password?: string;
}

export type PostSignupResponse = Envelope<any>;

export interface PostLoginRequestBody {
  email?: string;
  password?: string;
}

export type PostLoginResponse = Envelope<any>;

export type PostLogoutResponse = Envelope<any>;

export type GetMeResponse = Envelope<any>;

export interface GetApiTokenRequestQuery {
  name?: string;
  expires_at?: string;
  id?: string;
}

export type GetApiTokenResponse = Envelope<any>;

export interface PostApiTokenRequestBody {
  name?: string;
  expires_at?: string;
  id?: string;
}

export type PostApiTokenResponse = Envelope<any>;

export interface DeleteApiTokenByIdRequestPath {
  id: string;
}

export type DeleteApiTokenByIdResponse = Envelope<any>;

export interface GetSearchBySearch_idRequestPath {
  search_id: string;
}

export interface GetSearchBySearch_idRequestQuery {
  location_id?: string;
}

export type GetSearchBySearch_idResponse = Envelope<any>;

export interface PostSearchRequestBody {
  search_id?: string;
  location_id?: string;
}

export type PostSearchResponse = Envelope<any>;

export type GetOpenApiResponse = Envelope<any>;
