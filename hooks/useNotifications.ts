import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/apiService';

export interface NotificationState {
    id: string;
    isRead: boolean;
    isDeleted: boolean;
}

export const useNotifications = (userId: number | undefined) => {
    const queryClient = useQueryClient();

    const {
        data: states = [],
        isLoading,
        isFetching,
        error
    } = useQuery({
        queryKey: ['notifications', userId],
        queryFn: () => userId ? apiService.getNotificationStates(userId) : Promise.resolve([]),
        enabled: !!userId,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: { isRead?: boolean; isDeleted?: boolean } }) =>
            userId ? apiService.updateNotificationState(id, userId, updates) : Promise.reject('No user ID'),
        onMutate: async ({ id, updates }) => {
            await queryClient.cancelQueries({ queryKey: ['notifications', userId] });
            const previousStates = queryClient.getQueryData<NotificationState[]>(['notifications', userId]);

            queryClient.setQueryData(['notifications', userId], (old: NotificationState[] = []) => {
                const index = old.findIndex(s => s.id === id);
                if (index >= 0) {
                    const newState = { ...old[index], ...updates };
                    const next = [...old];
                    next[index] = newState;
                    return next;
                } else {
                    return [...old, { id, isRead: false, isDeleted: false, ...updates }];
                }
            });

            return { previousStates };
        },
        onError: (err, variables, context) => {
            if (context?.previousStates) {
                queryClient.setQueryData(['notifications', userId], context.previousStates);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) =>
            userId ? apiService.deleteNotificationPermanently(id, userId) : Promise.reject('No user ID'),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['notifications', userId] });
            const previousStates = queryClient.getQueryData<NotificationState[]>(['notifications', userId]);

            queryClient.setQueryData(['notifications', userId], (old: NotificationState[] = []) =>
                old.filter(s => s.id !== id)
            );

            return { previousStates };
        },
        onError: (err, id, context) => {
            if (context?.previousStates) {
                queryClient.setQueryData(['notifications', userId], context.previousStates);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
        },
    });

    return {
        states,
        isLoading,
        isFetching,
        error,
        updateState: updateMutation.mutate,
        deletePermanently: deleteMutation.mutate
    };
};
