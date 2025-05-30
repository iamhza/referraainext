"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export default function ProviderNotificationsPage() {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      setNotificationsLoading(true);
      try {
        if (!user) return;
        const res = await fetch('/api/notifications');
        if (!res.ok) throw new Error('Failed to fetch notifications');
        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch (err) {
        setNotifications([]);
      } finally {
        setNotificationsLoading(false);
      }
    }
    if (user) fetchNotifications();
  }, [user]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!user) return <div className="p-8 text-center text-red-500">Not authenticated.</div>;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 animate-fade-in">
      <div className="mb-4">
        <Button variant="outline" asChild>
          <Link href="/provider">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {notificationsLoading ? (
            <div>Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="text-gray-500">No notifications yet.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {notifications.map((notif) => (
                <li key={notif.id} className="py-4 flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{notif.type}</span>
                    <span className="text-xs text-gray-400">{new Date(notif.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-gray-800">{notif.content}</div>
                  {!notif.read && <span className="text-xs text-blue-600 font-bold mt-1">Unread</span>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 