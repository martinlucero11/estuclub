
'use client';

import { ArrowRight, Building, ChevronDown, Gift, MapPin, ShoppingCart, Fuel, Utensils, Shirt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MainLayout from '@/components/layout/main-layout';
import Image from 'next/image';
import Link from 'next/link';

// --- MOCK DATA (for design purposes) ---
const categories = [
  { name: 'Mercado', icon: ShoppingCart, color: 'text-blue-500' },
  { name: 'Indumentaria', icon: Shirt, color: 'text-pink-500' },
  { name: 'Combustible', icon: Fuel, color: 'text-orange-500' },
  { name: 'Restaurantes', icon: Utensils, color: 'text-red-500' },
  { name: 'Instituciones', icon: Building, color: 'text-purple-500' },
];

const nearbyPerks = [
  {
    logo: 'https://cdn-icons-png.flaticon.com/512/732/732084.png',
    name: 'Café Martínez',
    category: 'Restaurantes',
    discount: '15% de ahorro',
  },
  {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Logo_de_YPF.svg/1200px-Logo_de_YPF.svg.png',
    name: 'YPF',
    category: 'Combustible',
    discount: '10% OFF',
  },
  {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Logo_Coto.svg/1200px-Logo_Coto.svg.png',
    name: 'Supermercados Coto',
    category: 'Mercado',
    discount: '20% los Lunes',
  },
];

const newPromos = [
    {
        logo: 'https://seeklogo.com/images/A/adidas-logo-107B082DA0-seeklogo.com.png',
        name: 'Adidas',
        category: 'Indumentaria',
        discount: '25% en zapatillas',
    },
    {
        logo: 'https://i.pinimg.com/originals/a7/23/b9/a723b9d78e344583a697241c88bd5bce.png',
        name: 'Mostaza',
        category: 'Restaurantes',
        discount: '2x1 en Combos',
    },
    {
        logo: 'https://www.ispc.edu.ar/wp-content/uploads/2021/08/logo-ispc.png',
        name: 'ISPC',
        category: 'Instituciones',
        discount: '50% en Cursos',
    },
];
// --- END MOCK DATA ---

const HomeHeader = () => (
  <div className="flex items-center justify-between p-4">
    <Button variant="ghost" className="flex items-center gap-2">
      <MapPin className="h-5 w-5 text-primary" />
      <span className="font-semibold">Viendo cerca tuyo</span>
      <ChevronDown className="h-4 w-4 text-muted-foreground" />
    </Button>
    <div className="flex items-center justify-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary">
       <span className="font-logo-script text-2xl">EstuClub</span>
    </div>
  </div>
);

const CategoryCarousel = () => (
    <div className="px-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground">Categorías</h2>
        <div className="mt-2 flex w-full gap-3 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((category) => {
                const Icon = category.icon;
                return (
                    <div key={category.name} className="flex-shrink-0">
                        <Card className="flex h-24 w-24 flex-col items-center justify-center gap-2 rounded-2xl border-gray-100 bg-white shadow-sm transition-transform hover:-translate-y-1">
                            <Icon className={`h-8 w-8 ${category.color}`} strokeWidth={1.5} />
                            <span className="text-xs font-medium text-muted-foreground">{category.name}</span>
                        </Card>
                    </div>
                );
            })}
        </div>
    </div>
);


const PerkCard = ({ perk }: { perk: (typeof nearbyPerks)[0] }) => (
    <Card className="h-full w-64 flex-shrink-0 rounded-2xl border-gray-100 bg-white shadow-sm">
        <CardContent className="flex h-full flex-col p-4">
             <div className="relative mb-3 h-16 w-16 overflow-hidden rounded-xl">
                 <img src={perk.logo} alt={`${perk.name} logo`} className="h-full w-full object-contain" />
            </div>
            <div className="flex-grow space-y-1">
                <p className="font-semibold text-foreground">{perk.name}</p>
                <p className="text-xs text-muted-foreground">{perk.category}</p>
            </div>
            <p className="mt-2 text-lg font-extrabold text-primary">{perk.discount}</p>
        </CardContent>
    </Card>
);


const PerksSection = ({ title, perks }: { title: string, perks: (typeof nearbyPerks) }) => (
    <section className="space-y-3 py-4">
        <div className="flex items-center justify-between px-4">
            <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
            <Button variant="link" className="text-sm text-primary">
                Ver todos
                <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
        </div>
        <div className="flex w-full gap-4 overflow-x-auto pl-4 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {perks.map((perk, index) => (
                <PerkCard key={index} perk={perk} />
            ))}
        </div>
    </section>
);


const PromoBanners = () => (
    <section className="space-y-4 p-4">
        <div className="rounded-2xl bg-pink-100 p-6 shadow-sm">
            <h3 className="text-xl font-extrabold text-pink-800">¿Hambre?</h3>
            <p className="text-pink-700">Todos los promos de comida en un solo lugar.</p>
        </div>
        <div className="rounded-2xl bg-yellow-100 p-6 shadow-sm">
            <h3 className="text-xl font-extrabold text-yellow-800">¡Acá hay descuentos!</h3>
            <p className="text-yellow-700">Explora beneficios que no sabías que tenías.</p>
        </div>
    </section>
);

export default function HomePageRedesign() {
  return (
    <MainLayout>
        {/* We use MainLayout to keep Header and BottomNav consistent */}
        <div className="mx-auto w-full bg-gray-50/50 dark:bg-card">
            <div className="mx-auto max-w-2xl space-y-4 pb-8">
                <HomeHeader />
                <CategoryCarousel />
                <PerksSection title="Cerca Tuyo" perks={nearbyPerks} />
                <PerksSection title="Nuevas Promociones" perks={newPromos} />
                <PromoBanners />
            </div>
        </div>
    </MainLayout>
  );
}
