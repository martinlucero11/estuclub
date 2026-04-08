
import os

def fix_nomenclature():
    root_dir = 'src'
    
    # 1. Nomenclature & Collection Unification (Literal strings)
    replacements = {
        # Perks to Benefits (Fixing imports)
        "import PerkCard from '../perks/perk-card'": "import BenefitCard from '../benefits/benefit-card'",
        'import PerkCard from "../perks/perk-card"': 'import BenefitCard from "../benefits/benefit-card"',
        "import PerkCard from '@/components/perks/perk-card'": "import BenefitCard from '@/components/benefits/benefit-card'",
        'import PerkCard from "@/components/perks/perk-card"': 'import BenefitCard from "@/components/benefits/benefit-card"',
        
        # Banners to Announcements
        "collection(firestore, 'banners')": "collection(firestore, 'announcements')",
        "collection(db, 'banners')": "collection(db, 'announcements')",
        "doc(firestore, 'banners',": "doc(firestore, 'announcements',",
        "doc(db, 'banners',": "doc(db, 'announcements',",
        
        # Specific search/replace for terminology if seen as literal
        "'banners'": "'announcements'",
        '"banners"': '"announcements"',
        " banners ": " announcements ",
        "Banner": "Announcement",
        "BannerCard": "AnnouncementCard",
    }

    # Files to ignore (e.g. scripts themselves)
    ignore_files = ['final_standardization.py']

    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts')) and file not in ignore_files:
                file_path = os.path.join(root, file)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content = content
                    for target, replacement in replacements.items():
                        new_content = new_content.replace(target, replacement)
                    
                    if new_content != content:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Refactored: {file_path}")
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")

if __name__ == '__main__':
    fix_nomenclature()
