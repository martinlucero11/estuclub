
import os
import re

def fix_remaining_imports():
    root_dir = 'src'
    
    replacements = {
        # Fix specific broken file imports seen in grep
        r"@/components/benefits/perk-detail-skeleton": "@/components/benefits/benefit-detail-skeleton",
        r"@/components/benefits/redeem-perk-dialog": "@/components/benefits/redeem-benefit-dialog",
        r"./perk-detail-skeleton": "./benefit-detail-skeleton",
        r"./redeem-perk-dialog": "./redeem-benefit-dialog",
        
        # Internal component names
        r"perkDetailSkeleton": "BenefitDetailSkeleton",
        r"RedeemPerkDialog": "RedeemBenefitDialog",
    }

    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                file_path = os.path.join(root, file)
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                for pattern, subst in replacements.items():
                    new_content = new_content.replace(pattern, subst)
                
                if new_content != content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Fixed Imports: {file_path}")

if __name__ == '__main__':
    fix_remaining_imports()
