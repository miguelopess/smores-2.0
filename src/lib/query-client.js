import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: true,
			refetchOnReconnect: true,
			staleTime: 0,
			retry: 1,
		},
	},
});