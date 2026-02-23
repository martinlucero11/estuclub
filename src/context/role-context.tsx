'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '@/types/data';

interface RoleContextType {
  availableRoles: UserRole[];
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ 
  children, 
  availableRoles 
}: { 
  children: ReactNode; 
  availableRoles: UserRole[]; 
}) {
  const getBestRole = (roles: UserRole[]): UserRole => {
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('supplier')) return 'supplier';
    return roles[0] || 'user';
  };

  const [activeRole, setActiveRole] = useState<UserRole>(() => getBestRole(availableRoles));

  useEffect(() => {
    // Ensure active role is always one of the available ones
    if (!availableRoles.includes(activeRole)) {
      setActiveRole(getBestRole(availableRoles));
    }
  }, [availableRoles, activeRole]);

  const value = { availableRoles, activeRole, setActiveRole };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
