'use client';

import React from 'react';
import { CouponManagement } from '@/components/admin/CouponManagement';
import { useUser } from '@/firebase';
import { redirect } from 'next/navigation';

export default function AdminCouponsPage() {
    const { roles, isUserLoading } = useUser();

    if (isUserLoading) return null;

    // Security: Only Admin
    if (!roles.includes('admin')) {
        redirect('/');
    }

    return (
        <div className="animate-in fade-in duration-700">
            <CouponManagement />
        </div>
    );
}
