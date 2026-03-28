import { useAuth } from './AuthContext';

export function useCurrentUser() {
  const { user, isLoadingAuth } = useAuth();
  return { data: user, isLoading: isLoadingAuth };
}

export function isParent(user) {
  return user?.role === 'admin' || user?.role === 'parent';
}