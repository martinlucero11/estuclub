
import { redirect } from "next/navigation";
import { auth } from "@/auth"; // Assuming NextAuth setup
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { RoleProvider } from "@/context/role-context";
import { navConfig } from "@/config/nav-menu";

export default async function DashboardLayout({
  children,
}: { 
  children: React.ReactNode;
}) {
  const session = await auth(); // Server-side session check
  
  if (!session?.user) {
    redirect("/");
  }

  // Determine available roles from session
  const userRoles = session.user.roles || [];

  return (
    <RoleProvider availableRoles={userRoles}>
      <div className="flex min-h-screen">
        <Sidebar items={navConfig.sidebarNav} />
        <main className="flex-1 flex flex-col">
          <DashboardHeader />
          <div className="flex-1 p-8 pt-6">
            {children}
          </div>
        </main>
      </div>
    </RoleProvider>
  );
}
