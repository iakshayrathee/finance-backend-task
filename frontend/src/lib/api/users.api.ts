import apiClient from './client';
import type {
  SafeUser,
  CreateUserDto,
  UpdateUserDto,
  ListUsersQuery,
  ListUsersResponse,
} from '@/types/api.types';

export const usersApi = {
  create: async (dto: CreateUserDto): Promise<SafeUser> => {
    const { data } = await apiClient.post<{ success: true; data: { user: SafeUser } }>(
      '/users',
      dto
    );
    return data.data.user;
  },

  list: async (query: ListUsersQuery = {}): Promise<ListUsersResponse> => {
    const { data } = await apiClient.get<{ success: true; data: ListUsersResponse }>(
      '/users',
      { params: query }
    );
    return data.data;
  },

  getById: async (id: string): Promise<SafeUser> => {
    const { data } = await apiClient.get<{ success: true; data: { user: SafeUser } }>(
      `/users/${id}`
    );
    return data.data.user;
  },

  update: async (id: string, dto: UpdateUserDto): Promise<SafeUser> => {
    const { data } = await apiClient.patch<{ success: true; data: { user: SafeUser } }>(
      `/users/${id}`,
      dto
    );
    return data.data.user;
  },

  deactivate: async (id: string): Promise<SafeUser> => {
    const { data } = await apiClient.delete<{ success: true; data: { user: SafeUser } }>(
      `/users/${id}`
    );
    return data.data.user;
  },
};
