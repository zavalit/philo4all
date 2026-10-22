import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,extname} from 'node:path';
const ROOT=resolve('dist/client');
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
    // Headings are the source of truth for page labels.
    const mislabelled=await page.evaluate(()=>{
     const text=el=>el?.textContent.replace(/\s+/g,' ').trim();
     const headings=[...document.querySelectorAll('[data-sheet]')].map(sheet=>text(document.getElementById(sheet.getAttribute('aria-labelledby'))));
     return [...document.querySelectorAll('[data-page-link]')].map((link,i)=>[text(link),headings[i]]).filter(([a,b])=>a!==b);
    });
    if(mislabelled.length)fail(`Page labels differ from headings: ${JSON.stringify(mislabelled)} (${label})`);
    const columns=await page.locator('nav[aria-labelledby="themen-title"] ol').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
    if(columns!==(width<768?1:3))fail(`Unexpected topic columns ${columns} (${label})`);
    const position=await sheets.first().evaluate(el=>getComputedStyle(el).position);
    const stacked=width>=960&&reducedMotion==='no-preference';
    if(position!==(stacked?'sticky':'relative'))fail(`Sheets should ${stacked?'':'not '}stack, got ${position} (${label})`);

    const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
    if(results.violations.length)fail(label,results.violations.map(v=>v.id+' ('+v.nodes.length+' nodes)').join(', '));
    if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth))fail(`Horizontal overflow (${label})`);

    const duplicateIds=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);return ids.filter((id,i)=>ids.indexOf(id)!==i);});
    if(duplicateIds.length)fail(`Duplicate ids ${duplicateIds.join(', ')} (${label})`);

    if(width>=960){
     // Hovering a dot previews its sheet as a live copy; the copy's layout must match the sheet box for box.
     for(let i=0;i<11;i++){
      await links.nth(i).hover();
      const result=await page.evaluate(i=>{
       const preview=document.querySelector('[data-preview]');
       const copy=preview?.querySelector('[data-preview-mini] > *');
       const sheet=document.querySelectorAll('[data-sheet]')[i];
       const boxes=el=>[...el.querySelectorAll('*')].map(e=>[e.offsetLeft,e.offsetTop,e.offsetWidth,e.offsetHeight].join());
       return {open:preview?.hasAttribute('data-open'),same:!!copy&&boxes(sheet).join()===boxes(copy).join()};
      },i);
      if(!result.open)fail(`Preview ${i+1} did not open (${label})`);
      if(!result.same)fail(`Preview ${i+1} differs from its sheet (${label})`);
     }
     await page.keyboard.press('Escape');
     if(await page.locator('[data-preview][data-open]').count())fail(`Escape did not close the preview (${label})`);
     await page.evaluate(()=>document.getElementById('thema-03').scrollIntoView({behavior:'instant'}));
     await nextFrames(page);
     const current=await page.locator('[data-page-link][aria-current="location"]').getAttribute('href');
     if(current!=='#thema-03')fail(`Current page did not follow scrolling: ${current} (${label})`);
     await links.nth(5).click();
    }else{
     await page.locator('[popovertarget="seiten"]').click();
     if(!await page.locator('[data-pages]').evaluate(el=>el.matches(':popover-open')))fail(`Page list did not open (${label})`);
     await links.nth(5).click();
     if(await page.locator('[data-pages]').evaluate(el=>el.matches(':popover-open')))fail(`Page list stayed open (${label})`);
    }
    if(new URL(page.url()).hash!=='#thema-04')fail(`Page navigation failed (${label})`);

    // The URL hash follows the page in view (none on the cover), and a deep link survives loading.
    const hashIs=hash=>page.waitForFunction(hash=>location.hash===hash,hash,{timeout:3000}).then(()=>true,()=>false);
    for(const id of ['thema-07','thema-02']){
     await page.evaluate(id=>{const anchor=document.getElementById(id);scrollTo({top:anchor.getBoundingClientRect().top+scrollY+40,behavior:'instant'});},id);
     if(!await hashIs('#'+id))fail(`Hash ${await page.evaluate(()=>location.hash)} while reading ${id} (${label})`);
    }
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    if(!await hashIs(''))fail(`Hash not cleared on the cover (${label})`);
    await page.goto(origin+'/?deep-link#thema-05');
    const arrived=await page.waitForFunction(()=>document.querySelector('[data-page-link][aria-current]')?.getAttribute('href')==='#thema-05',null,{timeout:3000}).then(()=>true,()=>false);
    const deepHash=await page.evaluate(()=>location.hash);
    if(!arrived||deepHash!=='#thema-05')fail(`Deep link not kept: arrived ${arrived}, hash ${deepHash} (${label})`);
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
