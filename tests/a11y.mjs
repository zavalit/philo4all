import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,extname} from 'node:path';
const ROOT=resolve('dist');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
const server=createServer((req,res)=>{
 const request=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const path=resolve(ROOT,'.'+request,request.endsWith('/')?'index.html':'');
 if(!path.startsWith(ROOT+'/')||!existsSync(path)||!statSync(path).isFile()){res.writeHead(404);res.end('Not Found');return;}
 res.setHeader('Content-Type',mime[extname(path)]||'application/octet-stream');res.end(readFileSync(path));
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin=`http://127.0.0.1:${server.address().port}`;
let browser, fails=0;
const fail=(...msg)=>{console.error(...msg);fails++;};
const nextFrames=page=>page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
try{
 browser=await chromium.launch({headless:true});
 for(const theme of ['light','dark']){
  for(const width of [390,1280]){
   for(const reducedMotion of ['no-preference','reduce']){
    const label=`${theme} ${width}px ${reducedMotion}`;
    const context=await browser.newContext({colorScheme:theme,reducedMotion,viewport:{width,height:850}});
    const page=await context.newPage();
    const response=await page.goto(origin+'/');
    if(response?.status()!==200){fail(`HTTP ${response?.status()} (${label})`);await context.close();continue;}
    const sheets=page.locator('[data-sheet]');
    if(await sheets.count()!==11)fail(`Expected 11 sheets (${label})`);
    const links=page.locator('[data-page-link]');
    if(await links.count()!==11)fail(`Expected 11 page links (${label})`);
    const columns=await page.locator('nav[aria-labelledby="themen-title"] ol').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
    if(columns!==(width<768?1:3))fail(`Unexpected topic columns ${columns} (${label})`);
    const position=await sheets.first().evaluate(el=>getComputedStyle(el).position);
    const stacked=width>=960&&reducedMotion==='no-preference';
    if(position!==(stacked?'sticky':'relative'))fail(`Sheets should ${stacked?'':'not '}stack, got ${position} (${label})`);

    const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
    if(results.violations.length)fail(label,results.violations.map(v=>v.id+' ('+v.nodes.length+' nodes)').join(', '));
    if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth))fail(`Horizontal overflow (${label})`);

    if(width>=960){
     if(!await page.locator('[data-teaser] [aria-hidden="true"]').first().isVisible())fail(`Teaser stack hidden (${label})`);
     await page.evaluate(()=>document.getElementById('thema-03').scrollIntoView({behavior:'instant'}));
     await nextFrames(page);
     const current=await page.locator('[data-page-link][aria-current="location"]').getAttribute('href');
     if(current!=='#thema-03')fail(`Teaser did not follow scrolling: ${current} (${label})`);
     await links.nth(5).click();
    }else{
     await page.locator('[popovertarget="seiten"]').click();
     if(!await page.locator('[data-pages]').evaluate(el=>el.matches(':popover-open')))fail(`Page list did not open (${label})`);
     await links.nth(5).click();
     if(await page.locator('[data-pages]').evaluate(el=>el.matches(':popover-open')))fail(`Page list stayed open (${label})`);
    }
    if(new URL(page.url()).hash!=='#thema-04')fail(`Page navigation failed (${label})`);
    await context.close();
   }
  }
 }
 if(!fails)console.log('axe WCAG 2.2 AA and reader checks passed: light/dark, 390/1280 px, with and without reduced motion.');
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
 if(fails)process.exitCode=1;
}
