import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiService, api } from '../services/apiService';
import { TemporaryImage } from '../types';

export const useTemporaryGallery = () => {
    const queryClient = useQueryClient();

    useAutoCleanupGallery();

    const {
        data,
        isLoading,
        isFetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        error
    } = useInfiniteQuery({
        queryKey: ['temporary_gallery'],
        queryFn: async ({ pageParam = 0 }) => {
            const limit = 24;
            const data = await apiService.getTemporaryGallery(limit, pageParam);
            return data.map((img: any) => {
                let updatedImg = { ...img };
                
                // Handle imageUrl
                if (typeof updatedImg.imageUrl === 'string' && updatedImg.imageUrl.startsWith('http') && updatedImg.imageUrl.includes('pages.dev')) {
                    try {
                        const url = new URL(updatedImg.imageUrl);
                        updatedImg.imageUrl = url.pathname + url.search;
                    } catch (e) {}
                }

                // Handle thumbnailUrl
                if (typeof updatedImg.thumbnailUrl === 'string' && updatedImg.thumbnailUrl.startsWith('http') && updatedImg.thumbnailUrl.includes('pages.dev')) {
                    try {
                        const url = new URL(updatedImg.thumbnailUrl);
                        updatedImg.thumbnailUrl = url.pathname + url.search;
                    } catch (e) {}
                }

                return updatedImg;
            });
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.length < 24) return undefined;
            return allPages.length * 24;
        }
    });

    const galleryImages = data?.pages.flat() || [];

    const uploadMutation = useMutation({
        mutationFn: ({ file, userId, userFullName, projectId, location }: {
            file: File,
            userId: number,
            userFullName: string,
            projectId?: number,
            location?: string
        }) => apiService.uploadTemporaryImage(file, userId, userFullName, projectId, location),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['temporary_gallery'] }),
    });

    const updateImageMutation = useMutation({
        mutationFn: ({ id, location }: { id: string, location: string }) =>
            apiService.updateTemporaryImageLocation(id, location),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['temporary_gallery'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: ({ id, imageUrl }: { id: string, imageUrl: string }) =>
            apiService.deleteTemporaryImage(id, imageUrl),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['temporary_gallery'] }),
    });

    const batchUpdateMutation = useMutation({
        mutationFn: ({ ids, location }: { ids: string[], location: string }) =>
            apiService.batchUpdateTemporaryImageLocation(ids, location),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['temporary_gallery'] }),
    });

    const batchDeleteMutation = useMutation({
        mutationFn: (items: { id: string, imageUrl: string }[]) =>
            apiService.batchDeleteTemporaryImages(items),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['temporary_gallery'] }),
    });

    return {
        galleryImages,
        isLoading,
        isSyncing: isFetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
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
            await apiService.cleanupExpiredGalleryImages();
        };
        runCleanup();
    }, []);
};
