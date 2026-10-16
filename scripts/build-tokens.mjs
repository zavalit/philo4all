/** DTCG 2025.10 subset: typed, inherited tokens; sRGB, dimensions, font families,
 * weights and durations. Fails on invalid aliases and token values. Zero dependencies. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const load = (name) => JSON.parse(readFileSync(new URL(`../tokens/${name}.tokens.json`, import.meta.url)));
const [base, light, dark] = ['base','light','dark'].map(load);
const flatten = (tree, path=[], inherited=null, out=new Map()) => {
  for (const [key, item] of Object.entries(tree)) {
    if (key.startsWith('$')) continue;
    const type = item.$type ?? inherited;
    const next = [...path,key];
    if ('$value' in item) {
      if (!type) throw Error(`Missing DTCG $type: ${next.join('.')}`);
      out.set(next.join('.'), { type, value:item.$value });
    } else flatten(item,next,type,out);
  }
  return out;
};
const primitives = flatten(base);
const resolve = (item, all, trail=[]) => {
  if (typeof item.value==='string' && /^\{[^{}]+\}$/.test(item.value)) {
    const path=item.value.slice(1,-1);
    if (trail.includes(path)) throw Error('Token alias cycle: '+trail.join(' → ')+' → '+path);
    const target=all.get(path);
    if (!target) throw Error('Unknown token alias: '+path);
    if (target.type!==item.type) throw Error('Alias type mismatch: '+path);
    return resolve(target,all,[...trail,path]);
  }
  return item.value;
};
const format = (type,value) => {
  if (type==='color') {
    if (!value || value.colorSpace!=='srgb' || !Array.isArray(value.components) || value.components.length!==3 || value.components.some(n=>typeof n!=='number'||n<0||n>1)) throw Error('Invalid DTCG 2025.10 sRGB token');
    const hex='#'+value.components.map(n=>Math.round(n*255).toString(16).padStart(2,'0')).join('');
    if (value.hex && value.hex.toLowerCase()!==hex) throw Error('Color components/hex mismatch '+hex);
    if (value.alpha===undefined || value.alpha===1) return hex;
    if (typeof value.alpha!=='number' || value.alpha<0 || value.alpha>1) throw Error('Invalid DTCG color alpha');
    return hex+Math.round(value.alpha*255).toString(16).padStart(2,'0');
  }
  if (type==='dimension' || type==='duration') {
    if (!value || typeof value.value!=='number' || !(['px','rem','%'].includes(value.unit)||type==='duration'&&['ms','s'].includes(value.unit))) throw Error('Invalid dimension/duration');
    return `${value.value}${value.unit}`;
  }
  if(type==='string') {if(typeof value!=='string')throw Error('Invalid string');return value;}
  if(type==='fontFamily') return Array.isArray(value)?value.map(x=>/\s/.test(x)?`"${x}"`:x).join(', '):String(value);
  if (type==='number') {if(typeof value!=='number'||!Number.isFinite(value))throw Error('Invalid number');return String(value);}
  if(type==='fontWeight') {if(typeof value!=='number'||value<1||value>1000) throw Error('Invalid fontWeight');return String(value);}
  throw Error('Unsupported DTCG $type: '+type);
};
const slug = key => '--'+key.replaceAll('.','-');
function generate() {
  const lines=['/* GENERATED: npm run tokens. Edit only tokens/*.tokens.json */',':root {','  color-scheme: light dark;'];
  for(const [key,item] of primitives) lines.push(`  ${slug(key)}: ${format(item.type,resolve(item,primitives))};`);
  const roles=flatten(light), overrides=flatten(dark);
  if([...roles.keys()].sort().join()!==[...overrides.keys()].sort().join()) throw Error('Light and dark roles must match');
  for(const [key,item] of roles) {
    const val=resolve(item,new Map([...primitives,...roles]));
    lines.push(`  ${slug(key)}: ${format(item.type,val)};`);
  }
  lines.push('}', '@media (prefers-color-scheme: dark) {', '  :root {');
  for(const [key,item] of overrides){
    const val=resolve(item,new Map([...primitives,...overrides]));
    lines.push(`    ${slug(key)}: ${format(item.type,val)};`);
  }
  lines.push('  }','}','');
  mkdirSync(new URL('../src/styles/generated/',import.meta.url),{recursive:true});
  writeFileSync(new URL('../src/styles/generated/tokens.css',import.meta.url),lines.join('\n'));
  return {roles,overrides};
}
const {roles,overrides}=generate();
const luminance=(hex)=> {const n=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*n[0]+.7152*n[1]+.0722*n[2];};
const check=(mode,collection)=>{
  const m=new Map([...primitives,...collection]);
  const get=k=>format('color',resolve(m.get('color.'+k),m));
  // Text pairs need 4.5:1 (WCAG 1.4.3); focus rings against their surface need 3:1 (WCAG 1.4.11).
  const pairs=[['ink','paper',4.5],['ink','pale',4.5],['ink','maze',4.5],['ink-deep','sage',4.5],['on-strong','forest',4.5],['on-strong','burgundy',4.5],['on-desk','desk',4.5],['focus','paper',3],['focus','pale',3],['focus-desk','desk',3]];
  for(const [fg,bg,min] of pairs){const a=luminance(get(fg)), b=luminance(get(bg));const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);if(ratio<min)throw Error(`${mode} contrast ${fg}/${bg} = ${ratio.toFixed(2)} (<${min})`);console.log(`${mode}: ${fg}/${bg} = ${ratio.toFixed(2)}:1`);}
};
check('light',roles);check('dark',overrides);
console.log('DTCG tokens generated and required WCAG AA foreground/background pairs pass.');
