import { readdirSync,readFileSync,statSync } from 'node:fs';
import { join } from 'node:path';
function walk(dir){return readdirSync(dir).flatMap(name=>{const p=join(dir,name);return statSync(p).isDirectory()?walk(p):[p];});}
const files=walk('src').filter(f=>f.endsWith('.css')&&!f.includes('/generated/'));
const violations=[];
for(const file of files){
 const text=readFileSync(file,'utf8');
 // Media and container query preludes cannot read custom properties, so their lengths are exempt.
 const css=text.replace(/\/\*[\s\S]*?\*\//g,'').replace(/@(?:media|container)[^{]*\{/g,'{');
 // Keep all physical design values in DTCG tokens, not in component CSS.
 const patterns=[/#(?:[0-9a-f]{3,8})\b/gi,/\brgba?\s*\(/gi,/\b(?:hsla?|oklch|lab|color)\s*\(/gi,/(?<![\w.-])-?\d*\.?\d+(?:px|rem|em|vw|vh|pt|ch)\b/gi];
 for(const pattern of patterns){for(const match of css.matchAll(pattern)) violations.push(`${file}: hardcoded design value ${match[0]}`);}
}
const componentDirs=walk('src/components').filter(f=>f.endsWith('.astro'));
for(const cmp of componentDirs){
 const css=cmp.replace(/\.astro$/,'.module.css');
 if(!files.includes(css)) violations.push(`${cmp}: missing co-located ${css}`);
}
if(violations.length){console.error(violations.join('\n'));process.exit(1);}
console.log(`CSS rules OK: ${files.length} stylesheets, ${componentDirs.length} co-located components.`);
