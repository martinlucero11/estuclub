
import { redirect } from "next/navigation";
import { cookies } from 'next/headers';
import { firestore } from "@/firebase/server-config";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { RoleProvider } from "@/context/role-context";
import { UserRole } from "@/types/data";

async function getUserRoles(uid: string): Promise<UserRole[]> {
    const userDoc = await firestore.collection('users').doc(uid).get();
    const userData = userDoc.data();
    return userData?.roles || [];
}

export default async function DashboardLayout({
  children,
}: { 
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  // For this example, we'll assume the cookie value is the user's UID.
  // In a real app, you'd verify this cookie with Firebase Auth Admin SDK.
  const uid = sessionCookie;

  if (!uid) {
    redirect("/");
  }

  const userRoles = await getUserRoles(uid);

  if (userRoles.length === 0) {
      // This case might happen if roles are not yet assigned.
      // Redirect or show a default non-privileged view.
      redirect("/");
  }

  return (
    <RoleProvider availableRoles={userRoles}>
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1 p-8 pt-6">
            {children}
        </main>
      </div>
    </RoleProvider>
  );
}
