import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
    staleTime: 1000 * 60 * 5,
  });
}

export function isParent(user) {
  return user?.role === 'admin' || user?.role === 'parent';
}