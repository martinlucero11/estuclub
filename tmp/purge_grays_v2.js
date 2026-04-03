const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src');

const replacements = [
    // Tailwind Classes
    { regex: /text-muted-foreground/g, replacement: 'text-foreground' },
    { regex: /bg-muted/g, replacement: 'bg-background' },
    { regex: /border-muted/g, replacement: 'border-foreground' },
    { regex: /border-border/g, replacement: 'border-foreground' },
    { regex: /bg-slate-\[?[0-9]+\]?/g, replacement: 'bg-background' },
    { regex: /text-slate-\[?[0-9]+\]?/g, replacement: 'text-foreground' },
    { regex: /bg-gray-\[?[0-9]+\]?/g, replacement: 'bg-background' },
    { regex: /text-gray-\[?[0-9]+\]?/g, replacement: 'text-foreground' },
    { regex: /bg-neutral-\[?[0-9]+\]?/g, replacement: 'bg-background' },
    { regex: /text-neutral-\[?[0-9]+\]?/g, replacement: 'text-foreground' },
    { regex: /bg-zinc-\[?[0-9]+\]?/g, replacement: 'bg-background' },
    { regex: /text-zinc-\[?[0-9]+\]?/g, replacement: 'text-foreground' },
    { regex: /border-slate-\[?[0-9]+\]?/g, replacement: 'border-foreground' },
    { regex: /border-gray-\[?[0-9]+\]?/g, replacement: 'border-foreground' },
    
    // Hardcoded Hex Colors (Darks -> Pure Black)
    { regex: /#0[a-fA-F0-9]{5}/g, replacement: '#000000' }, 
    { regex: /#1[a-fA-F0-9]{5}/g, replacement: '#000000' }, // Zinc/Slate darks
    { regex: /bg-\[#050505\]/g, replacement: 'bg-black' },
    { regex: /bg-\[#0A0A0A\]/g, replacement: 'bg-black' },
    
    // Hardcoded Hex Colors (Legacy Rosa -> Rosa Estuclub #cb465a)
    { regex: /#d93b64/gi, replacement: '#cb465a' },
    { regex: /#d83762/gi, replacement: '#cb465a' },
    { regex: /#f241a3/gi, replacement: '#cb465a' },
    { regex: /#D00067/gi, replacement: '#cb465a' },

    // RGBA matches for legacy colors
    { regex: /rgba\(217,\s*59,\s*100/g, replacement: 'rgba(203, 70, 90' },
    { regex: /rgba\(216,\s*55,\s*98/g, replacement: 'rgba(203, 70, 90' },
    { regex: /rgba\(var\(--primary\),0\.3\)/g, replacement: 'var(--brand-pink)' },

    // Filters
    { regex: /filter-rosa/g, replacement: '' },
    { regex: /brightness-\[?[0-9.]+\]?/g, replacement: '' },
    { regex: /contrast-\[?[0-9.]+\]?/g, replacement: '' }
];

function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
            let content = fs.readFileSync(filePath, 'utf8');
            let originalContent = content;
            replacements.forEach(rep => {
                content = content.replace(rep.regex, rep.replacement);
            });
            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Deep Purgue Updated: ${filePath}`);
            }
        }
    });
}

walkDir(srcDir);
console.log('Deep Purge Completed.');
