import {readFileSync, readdirSync, statSync, existsSync} from 'node:fs';
import {join, resolve} from 'node:path';
const root=resolve('dist/client');
const files=[];
function scan(dir){for(const f of readdirSync(dir)){const p=join(dir,f);statSync(p).isDirectory()?scan(p):f.endsWith('.html')&&files.push(p);}}
scan(root);
const problems=[];
for(const file of files){
 const html=readFileSync(file,'utf8');
 // Also check MDX-generated anchors and navigation. External URLs are checked with Lychee in CI.
 for(const match of html.matchAll(/\b(?:href|src)=(?:"([^"]+)"|'([^']+)')/g)){
  const url=match[1]??match[2];
  if(url.startsWith('#')) {
    const id=decodeURIComponent(url.slice(1));
    if(id&&!html.includes(`id="${id}"`)&&!html.includes(`id='${id}'`))problems.push(`${file}: missing in-page anchor ${url}`);
    continue;
  }
  if(!url.startsWith('/') || url.startsWith('//')) continue;
  const [path,fragment]=url.split('#');
  const decoded=decodeURIComponent(path.split('?')[0]);
  const target=resolve(root,'.'+decoded,decoded.endsWith('/')?'index.html':'');
  const candidate=existsSync(target)&&statSync(target).isFile()?target:existsSync(target+'.html')?target+'.html':target;
  if(!candidate.startsWith(root+'/')||!existsSync(candidate)){problems.push(`${file}: missing ${url}`);continue;}
  if(fragment && candidate.endsWith('.html')){
   const id=decodeURIComponent(fragment);
   const body=readFileSync(candidate,'utf8');
   if(!body.includes(`id="${id}"`)&&!body.includes(`id='${id}'`))problems.push(`${file}: missing anchor ${url}`);
  }
 }
}
if(problems.length){console.error(problems.join('\n'));process.exit(1);}
console.log(`Internal link and anchor check passed across ${files.length} HTML documents.`);
