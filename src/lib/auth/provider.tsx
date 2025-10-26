"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: "case_manager" | "provider";
}

interface AuthContextType {
  user: User | null;
  getUser: () => Promise<User | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  getUser: async () => null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  const getUser = async () => {
    // TODO: Replace with actual API call to get user data
    const mockUser = {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "case_manager" as const,
    };
    setUser(mockUser);
    return mockUser;
  };

  const signOut = async () => {
    // TODO: Replace with actual sign out logic
    setUser(null);
    router.push("/");
  };

  useEffect(() => {
    getUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, getUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 