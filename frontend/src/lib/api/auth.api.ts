import apiClient from './client';
import type {
  LoginDto,
  RegisterDto,
  LoginResponse,
  RegisterResponse,
  TokenPair,
} from '@/types/api.types';

export const authApi = {
  register: async (dto: RegisterDto): Promise<RegisterResponse> => {
    const { data } = await apiClient.post<{ success: true; data: RegisterResponse }>(
      '/auth/register',
      dto
    );
    return data.data;
  },

  login: async (dto: LoginDto): Promise<LoginResponse> => {
    const { data } = await apiClient.post<{ success: true; data: LoginResponse }>(
      '/auth/login',
      dto
    );
    return data.data;
  },

  refresh: async (refreshToken: string): Promise<TokenPair> => {
    const { data } = await apiClient.post<{ success: true; data: TokenPair }>(
      '/auth/refresh',
      { refreshToken }
    );
    return data.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
  },
};
