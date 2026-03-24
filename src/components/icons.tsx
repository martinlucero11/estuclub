import { 
    ShoppingCart, 
    Shirt, 
    Fuel, 
    Utensils, 
    Buildings, 
    Ticket, 
    Music, 
    GraduationCap, 
    Heart, 
    Plane,
    Palette,
    Smile,
    Icon,
    Shapes
} from '@phosphor-icons/react';

export const iconMap: { [key: string]: Icon } = {
    ShoppingCart,
    Shirt,
    Fuel,
    Utensils,
    Buildings,
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

export const getIcon = (name: string): Icon => {
    return iconMap[name] || Smile; // Return a default icon if not found
};
