"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { motion } from "framer-motion";

export default function SplashPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  // Redirect non-case-managers
  useEffect(() => {
    if (!loading && (!user || user.user_metadata?.role !== 'case_manager')) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user || user.user_metadata?.role !== 'case_manager') {
    return null; // Will be redirected by the useEffect
  }

  return (
    <div className="min-h-screen bg-white">
      {/* User Info & Logout */}
      <div className="absolute top-4 right-6 flex items-center gap-4">
        <span className="text-[#5f6368]">
          {user.email}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          className="text-[#5f6368] hover:bg-[#f8f9fa] hover:text-[#202124] rounded-full px-6"
        >
          Sign out
        </Button>
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center">
        {/* Animated Logo with Reveal Effect */}
        <div className="mb-24 relative overflow-hidden">
          <motion.div
            className="relative"
            initial={{ opacity: 1 }}
            animate={{ x: 0 }}
          >
            <Image
              src="/referra Main Logo.png"
              alt="Referra"
              width={800}
              height={267}
              priority
              className="no-underline"
            />
            <motion.div
              className="absolute top-0 left-0 w-full h-full bg-white"
              initial={{ x: 0 }}
              animate={{ x: "100%" }}
              transition={{ 
                duration: 2,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.5
              }}
              style={{
                background: "linear-gradient(to right, white 0%, white 65%, transparent 100%)",
              }}
            />
          </motion.div>
        </div>

        {/* Main Action Buttons */}
        <motion.div 
          className="flex items-center justify-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.7, duration: 0.6 }}
        >
          <Button
            variant="default"
            className="h-12 px-10 bg-[#0EA5E9] hover:bg-[#0284C7] rounded-md text-[15px] font-medium text-white min-w-[200px]"
            onClick={() => router.push("/case-manager/new-referral")}
          >
            Start new referral
          </Button>

          <Button
            variant="outline"
            className="h-12 px-10 border-[#dadce0] hover:bg-[#f8f9fa] hover:border-[#dadce0] rounded-md text-[15px] font-medium text-[#3c4043] min-w-[200px]"
            onClick={() => router.push("/case-manager/referrals")}
          >
            Go to Dashboard
          </Button>
        </motion.div>
      </div>
    </div>
  );
} 