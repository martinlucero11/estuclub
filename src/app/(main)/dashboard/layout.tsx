'use client';
import { redirect } from 'next/navigation';

// This layout is deprecated and now redirects to the new unified panel.
export default function DashboardLayout() {
  redirect('/panel-cluber');
  return null;
}

