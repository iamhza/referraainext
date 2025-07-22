import AdminLayout from '@/components/layout/AdminLayout';
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div 
      className="font-sans"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}
    >
      <AdminLayout>{children}</AdminLayout>
    </div>
  );
} 