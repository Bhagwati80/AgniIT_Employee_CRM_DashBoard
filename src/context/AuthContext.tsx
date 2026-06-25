'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Employee, useAppContext } from './AppContext';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  currentUser: Employee | null;
  login: (email: string, password?: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}



const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { employees } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Only run on client after hydration
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing currentUser from localStorage');
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser, hydrated]);

  // Guard routes
  useEffect(() => {
    if (!hydrated) return;
    const isAuthRoute = pathname === '/';
    if (!currentUser && !isAuthRoute) {
      router.push('/');
    } else if (currentUser && isAuthRoute) {
      router.push('/dashboard');
    }
  }, [currentUser, pathname, router, hydrated]);

  const login = (email: string, password?: string) => {
  console.log("Employees:", employees);

  const user = employees.find(
    e => e.email === email && e.password === password
  );

  console.log("Found User:", user);

  if (user) {
    setCurrentUser(user);
    return true;
  }

  return false;
};
  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      login,
      logout,
      isAuthenticated: !!currentUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
