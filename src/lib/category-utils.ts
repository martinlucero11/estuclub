/**
 * Centralized utility for category emojis.
 * Provides relevant emojis for all platform categories with comprehensive mapping and fallbacks.
 */
export function getCategoryEmoji(name: string, fallback: string = '✨'): string {
    const normalized = name.toLowerCase().trim();

    // Mapping organized by theme
    const mapping: Record<string, string> = {
        // Gastronomy & Food
        'comida rápida': '🍔',
        'restaurantes': '🍕',
        'gastronomía': '🍳',
        'heladerías': '🍦',
        'cafetería': '☕',
        'sushi': '🍣',
        'pizza': '🍕',
        'hamburguesas': '🍔',
        'empanadas': '🥟',
        'pastelería': '🍰',
        'bebidas': '🍺',
        'vinoteca': '🍷',
        'cervecería': '🍺',
        
        // Health & Beauty
        'barbería': '💈',
        'estética': '💇‍♀️',
        'salud': '🏥',
        'farmacia': '💊',
        'peluquería': '✂️',
        'gimnasio': '🏋️',
        'deportes': '⚽',
        'bienestar': '🧘',
        
        // Retail & Shopping
        'supermercado': '🛒',
        'market': '🛒',
        'indumentaria': '👗',
        'ropa': '👕',
        'moda': '👠',
        'calzado': '👟',
        'librería': '📖',
        'regalería': '🎁',
        'tecnología': '📱',
        'electrónica': '💻',
        'hogar': '🏠',
        'flores': '🌸',
        
        // Services & Corporate
        'servicios': '🛠️',
        'entretenimiento': '🍿',
        'educación': '🎓',
        'cursos': '📚',
        'profesional': '💼',
        'empresa': '🏢',
        'emprendimiento': '🚀',
        'mascotas': '🐾',
        'viajes': '✈️',
        'transporte': '🚗',
        
        // Generic / Fallbacks
        'otros': '📦',
        'vaca': '🐄',
        'estudio': '✍️',
        'universidad': '🏫'
    };

    // Partial match check
    for (const [key, emoji] of Object.entries(mapping)) {
        if (normalized.includes(key)) return emoji;
    }

    return fallback;
}
