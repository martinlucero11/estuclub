const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src');

const replacements = [
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
    { regex: /rgba\(var\(--primary\),0\.3\)/g, replacement: 'var(--brand-pink)' }, // Fix specific hardcoded RGBA if found
    { regex: /filter-rosa/g, replacement: '' } // Remove filter-rosa since we use real rosa logo
];

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
            let content = fs.readFileSync(filePath, 'utf8');
            let changed = false;
            replacements.forEach(rep => {
                if (rep.regex.test(content)) {
                    content = content.replace(rep.regex, rep.replacement);
                    changed = true;
                }
            });
            if (changed) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Updated: ${filePath}`);
            }
        }
    });
}

walkDir(srcDir);
