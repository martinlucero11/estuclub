import { 
    ShoppingCart, 
    Shirt, 
    Fuel, 
    Utensils, 
    Building, 
    Ticket, 
    Music, 
    GraduationCap, 
    Heart, 
    Plane,
    Palette,
    Smile,
    LucideIcon,
    Shapes
} from 'lucide-react';

export const iconMap: { [key: string]: LucideIcon } = {
    ShoppingCart,
    Shirt,
    Fuel,
    Utensils,
    Building,
    Ticket,
    Music,
    GraduationCap,
    Heart,
    Plane,
    Palette,
    Smile,
    Shapes,
};

export const iconList = Object.keys(iconMap);

export const getIcon = (name: string): LucideIcon => {
    return iconMap[name] || Smile; // Return a default icon if not found
};
