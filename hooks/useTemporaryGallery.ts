import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService, supabase } from '../services/supabaseService';
import { TemporaryImage } from '../types';

export const useTemporaryGallery = () => {
    const queryClient = useQueryClient();

    useAutoCleanupGallery();

    const {
        data: galleryImages = [],
        isLoading,
        isFetching,
        error
    } = useQuery({
        queryKey: ['temporary_gallery'],
        queryFn: () => supabaseService.getTemporaryGallery(),
    });

    // Supabase Real-time Subscription
    useEffect(() => {
        const channel = supabase
            .channel('gallery-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'temporary_gallery' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['temporary_gallery'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    const uploadMutation = useMutation({
        mutationFn: ({ file, userId, userFullName, projectId, location }: {
            file: File,
            userId: number,
            userFullName: string,
            projectId?: number,
            location?: string
        }) => supabaseService.uploadTemporaryImage(file, userId, userFullName, projectId, location),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['temporary_gallery'] }),
    });

    const updateImageMutation = useMutation({
        mutationFn: ({ id, location }: { id: string, location: string }) =>
            supabaseService.updateTemporaryImageLocation(id, location),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['temporary_gallery'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: ({ id, imageUrl }: { id: string, imageUrl: string }) =>
            supabaseService.deleteTemporaryImage(id, imageUrl),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['temporary_gallery'] }),
    });

    const batchUpdateMutation = useMutation({
        mutationFn: ({ ids, location }: { ids: string[], location: string }) =>
            supabaseService.batchUpdateTemporaryImageLocation(ids, location),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['temporary_gallery'] }),
    });

    const batchDeleteMutation = useMutation({
        mutationFn: (items: { id: string, imageUrl: string }[]) =>
            supabaseService.batchDeleteTemporaryImages(items),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['temporary_gallery'] }),
    });

    return {
        galleryImages,
        isLoading,
        isSyncing: isFetching,
        error,
        uploadImage: uploadMutation.mutateAsync,
        isUploading: uploadMutation.isPending,
        updateImage: updateImageMutation.mutateAsync,
        isUpdating: updateImageMutation.isPending,
        deleteImage: deleteMutation.mutateAsync,
        batchUpdateImages: batchUpdateMutation.mutateAsync,
        batchDeleteImages: batchDeleteMutation.mutateAsync
    };
};

export const useAutoCleanupGallery = () => {
    useEffect(() => {
        const runCleanup = async () => {
            console.log("Running gallery cleanup check...");
            await supabaseService.cleanupExpiredGalleryImages();
        };
        runCleanup();
    }, []);
};
