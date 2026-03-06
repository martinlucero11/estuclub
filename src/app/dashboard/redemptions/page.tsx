'use client';
import { redirect } from 'next/navigation';

// This page is deprecated and now redirects to the new unified panel.
export default function DashboardRedemptionsPage() {
  redirect('/panel-cluber/redemptions');
}
