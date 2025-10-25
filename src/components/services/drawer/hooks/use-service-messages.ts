'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import type { ServiceMessage } from '../types';

interface UseServiceMessagesReturn {
  messages: ServiceMessage[];
  loading: boolean;
  error: string | null;
  sending: boolean;
  sendMessage: (content: string) => Promise<boolean>;
  refetch: () => void;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useServiceMessages(serviceRelationshipId: string | null): UseServiceMessagesReturn {
  const [sending, setSending] = useState(false);

  const { data, error, isLoading, mutate } = useSWR(
    serviceRelationshipId ? `/api/service-relationships/${serviceRelationshipId}/messages` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 30000, // Poll every 30s for new messages
    }
  );

  const sendMessage = async (content: string): Promise<boolean> => {
    if (!serviceRelationshipId || !content.trim()) return false;

    setSending(true);
    try {
      const response = await fetch(`/api/service-relationships/${serviceRelationshipId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Refresh messages list
      await mutate();
      toast.success('Message sent');
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
      return false;
    } finally {
      setSending(false);
    }
  };

  return {
    messages: data?.messages || [],
    loading: isLoading,
    error: error ? 'Failed to load messages' : null,
    sending,
    sendMessage,
    refetch: mutate,
  };
}

