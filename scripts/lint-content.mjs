import { readFileSync,readdirSync } from 'node:fs';
const topics=readdirSync('src/content/topics').filter(x=>x.endsWith('.mdx'));
const pages=readdirSync('src/content/pages').filter(x=>x.endsWith('.mdx'));
const problems=[];
if(topics.length!==9) problems.push(`Expected nine topics, found ${topics.length}`);
if(pages.length!==2||!pages.includes('intro.mdx')||!pages.includes('studi-team.mdx')) problems.push('Expected intro.mdx and studi-team.mdx');
const orders=[];
for(const file of [...topics.map(f=>'src/content/topics/'+f),...pages.map(f=>'src/content/pages/'+f)]){
 const source=readFileSync(file,'utf8');
 const meta=source.match(/^---\n([\s\S]*?)\n---\n/);
 if(!meta) problems.push(`Missing YAML frontmatter in ${file}`);
 if(!meta?.[1].includes('title:')||!meta?.[1].includes('description:'))problems.push(`Missing title/description in ${file}`);
 if(file.includes('/topics/')){
  const order=meta?.[1].match(/^order:\s*(\d+)$/m);if(!order)problems.push(`Missing order in ${file}`);else orders.push(Number(order[1]));
  if(!source.includes('<Panel'))problems.push(`Missing content panels in ${file}`);
  if(/^import /m.test(source))problems.push(`Remove import lines in ${file}: Panel is provided by the page`);
 }
 for(const m of source.matchAll(/(?<!!)\[[^\]]+\]\(([^\s)]+)\)/g)){
  const uri=m[1];
  if(!/^(https:\/\/|mailto:|\/|#)/.test(uri))problems.push(`Unsupported link ${uri} (${file})`);
 }
}
if([...orders].sort((a,b)=>a-b).join(',')!=='1,2,3,4,5,6,7,8,9')problems.push(`Invalid topic orders: ${orders}`);
if(problems.length){console.error(problems.join('\n'));process.exit(1);}
console.log(`Content OK: ${topics.length} topics + ${pages.length} introductions; link schemes valid (images are checked by Astro at build).`);
