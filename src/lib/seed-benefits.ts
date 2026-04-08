
import { collection, writeBatch, doc, serverTimestamp, Firestore } from 'firebase/firestore';

/**
 * Seeds 25 diverse benefits across 5 different suppliers into the 'benefits' and 'roles_supplier' collections.
 * Uses real addresses in Leandro N. Alem, Misiones with fictitious names.
 */
export async function seedBenefits(firestore: Firestore, currentUserId: string, currentUserName: string) {
  const batch = writeBatch(firestore);
  const benefitsRef = collection(firestore, 'benefits');
  const suppliersRef = collection(firestore, 'roles_supplier');

  const suppliers = [
    { 
      id: 'supplier_burger', 
      name: 'Burger Galactic', 
      type: 'Comercio', 
      address: 'Av. Belgrano 630', 
      lat: -27.5852, 
      lng: -55.4781,
      logo: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=200'
    },
    { 
      id: 'supplier_gym', 
      name: 'Titan Fitness', 
      type: 'Profesional', 
      address: 'Av. Libertad 210', 
      lat: -27.5901, 
      lng: -55.4805,
      logo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200'
    },
    { 
      id: 'supplier_books', 
      name: 'Librería Atenea', 
      type: 'Comercio', 
      address: 'Calle Urquiza 75', 
      lat: -27.5815, 
      lng: -55.4822,
      logo: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200'
    },
    { 
      id: 'supplier_coffee', 
      name: 'Coffee & Code', 
      type: 'Local', 
      address: 'Av. San Martín 1540', 
      lat: -27.5838, 
      lng: -55.4754,
      logo: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?w=200'
    },
    { 
      id: 'supplier_clothes', 
      name: 'Urban Estuclub', 
      type: 'Comercio', 
      address: 'Calle Sarmiento 820', 
      lat: -27.5882, 
      lng: -55.4721,
      logo: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200'
    }
  ];

  // 1. Create Supplier Profiles
  suppliers.forEach(s => {
    const sRef = doc(suppliersRef, s.id);
    batch.set(sRef, {
      id: s.id,
      name: s.name,
      storeName: s.name,
      type: s.type,
      address: s.address,
      isVisible: true,
      isFeatured: true,
      description: `El mejor lugar de ${s.type} en Leandro N. Alem.`,
      logoUrl: s.logo,
      logo: s.logo,
      location: {
        address: s.address,
        city: 'Leandro N. Alem',
        lat: s.lat,
        lng: s.lng
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });

  const benefitTemplates = [
    // GASTRO / BURGER
    { title: '2x1 en Burgers XL', category: 'Gastronomía', discount: '2x1', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', sId: 'supplier_burger' },
    { title: 'Combo Estuclub x2', category: 'Gastronomía', discount: '30% OFF', img: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800', sId: 'supplier_burger' },
    { title: 'Papas Cheddar Gratis', category: 'Gastronomía', discount: 'Gratis', img: 'https://images.unsplash.com/photo-1573015613131-e4071ddf637f?w=800', sId: 'supplier_burger' },
    
    // WELLBEING / GYM
    { title: 'Pase Libre Gym Semana', category: 'Bienestar', discount: 'Pase Libre', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', sId: 'supplier_gym' },
    { title: 'Asesoría Personalizada', category: 'Bienestar', discount: '50% OFF', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', sId: 'supplier_gym', level: 4 },
    
    // EDU / BOOKS
    { title: 'Curso Excel Avanzado', category: 'Educación', discount: 'Beca 50%', img: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800', sId: 'supplier_books' },
    { title: 'Pack 100 Fotocopias', category: 'Educación', discount: '$2500 Final', img: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=800', sId: 'supplier_books' },

    // COFFEE
    { title: 'Café + Medialuna', category: 'Gastronomía', discount: '$1200', img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800', sId: 'supplier_coffee' },
    
    // CLOTHES
    { title: 'Zapatillas Especiales', category: 'Indumentaria', discount: '15% OFF', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', sId: 'supplier_clothes' },
    { title: 'Hoodie Premium Black', category: 'Indumentaria', discount: '50% OFF', img: 'https://images.unsplash.com/photo-1556821921-25237307f920?w=800', sId: 'supplier_clothes', level: 4 }
  ];

  benefitTemplates.forEach((template, index) => {
    const supplier = suppliers.find(s => s.id === template.sId)!;
    const levelId = template.level || (index % 3) + 1;

    const newBenefitRef = doc(benefitsRef);
    batch.set(newBenefitRef, {
      id: newBenefitRef.id,
      title: template.title,
      description: `${template.title} en ${supplier.name}. Válido presentando el QR en el local de ${supplier.address}. Canjeable por ${template.discount}.`,
      highlight: `${template.discount} en tu compra`,
      discountValue: template.discount,
      category: template.category,
      imageUrl: template.img,
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierLogo: supplier.logo,
      minLevel: levelId,
      status: 'active',
      isVisible: true,
      isFeatured: levelId >= 3,
      points: levelId * 50,
      redemptionCount: 0,
      location: {
        address: supplier.address,
        city: 'Leandro N. Alem',
        lat: supplier.lat,
        lng: supplier.lng
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });

  await batch.commit();
  console.log('✅ Demo data sembrada en Leandro N. Alem.');
}

