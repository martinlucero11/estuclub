
'use client';

import React from 'react';
import Link from 'next/link';
import { useRole } from '@/context/role-context';
import { useAuth } from '@/firebase'; // Assuming a hook that provides user data including supplier capabilities
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Store, 
  Receipt, 
  Megaphone, 
  CalendarClock, 
  Users, 
  CheckCheck 
} from 'lucide-react';

const adminNavItems = [
  { title: "Beneficios", href: "/dashboard/benefits", icon: Store, description: "Gestionar todos los beneficios" },
  { title: "Canjes", href: "/dashboard/redemptions", icon: Receipt, description: "Auditar todos los canjes" },
  { title: "Aprobar Anuncios", href: "/dashboard/approve-announcements", icon: CheckCheck, description: "Moderar anuncios de proveedores" },
  { title: "Gestión de Proveedores", href: "/dashboard/supplier-management", icon: Users, description: "Habilitar módulos para proveedores" },
];

const supplierNavItems = (
  announcementsEnabled?: boolean,
  appointmentsEnabled?: boolean
) => [
  { title: "Beneficios", href: "/dashboard/benefits", icon: Store, description: "Gestionar mis beneficios" },
  { title: "Canjes", href: "/dashboard/redemptions", icon: Receipt, description: "Ver historial de mis canjes" },
  ...(announcementsEnabled ? [{ title: "Anuncios", href: "/dashboard/announcements", icon: Megaphone, description: "Gestionar mis anuncios" }] : []),
  ...(appointmentsEnabled ? [{ title: "Turnos", href: "/dashboard/appointments", icon: CalendarClock, description: "Gestionar mis horarios y turnos" }] : []),
];

export default function DashboardPage() {
  const { activeRole } = useRole();
  const { user } = useAuth(); // Provides user profile, including supplier capabilities

  const navItems = activeRole === 'admin' 
    ? adminNavItems 
    : supplierNavItems(user?.supplierProfile?.announcementsEnabled, user?.supplierProfile?.appointmentsEnabled);

  return (
    <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground mb-8">
            Selecciona una acción para continuar.
        </p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {navItems.map((item) => (
                <Link href={item.href} key={item.title}>
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {item.title}
                            </CardTitle>
                            <item.icon className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <div className="p-6 pt-0">
                             <CardDescription>{item.description}</CardDescription>
                        </div>
                    </Card>
                </Link>
            ))}
        </div>
    </div>
  );
}
