
import os
import re

def final_standardization():
    root_dir = 'src'
    
    replacements = {
        # Imports
        r"@/components/benefits/perks-grid": "@/components/benefits/benefits-grid",
        r"@/components/benefits/perks-carousel": "@/components/benefits/benefits-carousel",
        
        # Props in BenefitsGrid/Carousel
        r"perks={": "benefits={",
        r"({ perks })": "({ benefits })",
        r"({ perks }:": "({ benefits }:",
        r"BenefitsGridProps { perks:": "BenefitsGridProps { benefits:",
        r"perks.map": "benefits.map",
        r"if (!perks": "if (!benefits",
        r"perks.length": "benefits.length",
        r"BenefitsCarouselProps { perks:": "BenefitsCarouselProps { benefits:",
        
        # Component Names
        r"FeaturedPerks": "FeaturedBenefits",
    }

    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                file_path = os.path.join(root, file)
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                for pattern, subst in replacements.items():
                    # We use simple replace for props to avoid over-matching, 
                    # but for some we might need regex.
                    # Given the context, simple string replace is relatively safe for these specific patterns.
                    new_content = new_content.replace(pattern, subst)
                
                if new_content != content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Standardized: {file_path}")

if __name__ == '__main__':
    final_standardization()
