'use client';

import { useEffect, useRef } from 'react';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export function useRealtime(khatmaId: string) {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const joined = useRef(false);

  useEffect(() => {
    if (!accessToken || !khatmaId) return;

    const socket = getSocket(accessToken);

    if (!joined.current) {
      socket.emit('join_khatma', { khatmaId });
      joined.current = true;
    }

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['khatma', khatmaId] });
    };

    socket.on('part_reserved', (data) => {
      invalidate();
    });

    socket.on('part_completed', (data) => {
      invalidate();
    });

    socket.on('khatma_completed', () => {
      invalidate();
      toast.success('🎉 تم ختم القرآن الكريم! جزاكم الله خيراً', { duration: 8000 });
    });

    socket.on('khatma_restarted', (data) => {
      invalidate();
      toast.success(`بدأت دورة جديدة — الدورة ${data.iteration}`);
    });

    return () => {
      socket.emit('leave_khatma', { khatmaId });
      socket.off('part_reserved');
      socket.off('part_completed');
      socket.off('khatma_completed');
      socket.off('khatma_restarted');
      joined.current = false;
    };
  }, [accessToken, khatmaId, queryClient]);
}
