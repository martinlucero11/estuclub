export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

// This page exists only to redirect from the old URL to the new one for robustness.
export default function UserManagementRedirect() {
  redirect('/panel-cluber/supplier-management');
}

