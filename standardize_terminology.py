
import os
import re

def standardize_terminology():
    root_dir = 'src'
    # 1. Update text content
    replacements = {
        r"PerksGrid": "BenefitsGrid",
        r"PerksCarousel": "BenefitsCarousel",
        r"RedeemPerkDialog": "RedeemBenefitDialog",
        r"EditPerkDialog": "EditBenefitDialog",
        r"perks_grid": "benefits_grid",
        r"perks_carousel": "benefits_carousel",
        r"@/components/perks/": "@/components/benefits/",
    }

    # 2. Rename files and update their contents
    for root, dirs, files in os.walk(root_dir, topdown=False):
        for file in files:
            file_path = os.path.join(root, file)
            # Update content
            if file.endswith(('.tsx', '.ts')):
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                for pattern, subst in replacements.items():
                    new_content = new_content.replace(pattern, subst)
                
                if new_content != content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated content: {file_path}")

            # Rename file itself if it contains 'perk'
            if 'perk' in file.lower():
                new_file = file.lower().replace('perk', 'benefit')
                # Keep original casing for some known components if needed, but lower is fine for files
                new_file_path = os.path.join(root, new_file)
                os.rename(file_path, new_file_path)
                print(f"Renamed file: {file_path} -> {new_file_path}")

        for dir_name in dirs:
            if 'perks' in dir_name.lower():
                old_dir_path = os.path.join(root, dir_name)
                new_dir_path = os.path.join(root, dir_name.lower().replace('perks', 'benefits'))
                os.rename(old_dir_path, new_dir_path)
                print(f"Renamed dir: {old_dir_path} -> {new_dir_path}")

if __name__ == '__main__':
    standardize_terminology()
