
import os
import re

def standardize():
    root_dir = 'src'
    replacements = {
        r"'perks'": "'benefits'",
        r'"perks"': '"benefits"',
        r"'benefitRedemptions'": "'redemptions'",
        r'"benefitRedemptions"': '"redemptions"',
        r"'benefit_redemptions'": "'redemptions'",
        r'"benefit_redemptions"': '"redemptions"',
        r"'redeemed_benefits'": "'redemptions'",
        r'"redeemed_benefits"': '"redemptions"',
        r"'benefit_redemption'": "'redemptions'",
        r'"benefit_redemption"': '"redemptions"',
        r"BenefitRedemptionsTable": "RedemptionsTable",
        r"makeBenefitRedemptionSerializable": "makeRedemptionSerializable"
    }

    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                file_path = os.path.join(root, file)
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                for pattern, subst in replacements.items():
                    new_content = re.sub(pattern, subst, new_content)
                
                if new_content != content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated: {file_path}")

if __name__ == '__main__':
    standardize()
