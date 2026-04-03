'use client';

import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api/auth.api';
import type { LoginDto, RegisterDto } from '@/types/api.types';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Role } from '@/types/api.types';

export function useAuth() {
  const { user, accessToken, login, logout: clearStore, isLoggedIn } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (dto: LoginDto) => {
    const result = await authApi.login(dto);
    login(result.user, result.accessToken, result.refreshToken);
    toast.success(`Welcome back, ${result.user.name}!`);
    // Role-based redirect
    if (result.user.role === Role.ADMIN) {
      router.push('/users');
    } else {
      router.push('/dashboard');
    }
  };

  const handleRegister = async (dto: RegisterDto) => {
    await authApi.register(dto);
    toast.success('Account created! Please log in.');
    router.push('/login');
  };

  const handleLogout = async () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      try { await authApi.logout(refreshToken); } catch { /* ignore */ }
    }
    clearStore();
    router.push('/login');
  };

  return {
    user,
    accessToken,
    isLoggedIn: isLoggedIn(),
    login:    handleLogin,
    register: handleRegister,
    logout:   handleLogout,
  };
}
