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
const WCAG=['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'];
// Finite animations only: the "searching" dots repeat forever.
const settle=page=>page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect.getComputedTiming().iterations!==Infinity).map(a=>a.finished)));
const mockAnswer={requestId:'mock',runs:[{mapping:'clef-flash',generation:'ok',insufficientEvidence:false,answer:'Die Anmeldung erfolgt im Campus Management [cm-registration-dates]. Fristen siehe https://www.fu-berlin.de/sites/campusmanagement/index.html.',citations:[{id:'cm-registration-dates',title:'Kursanmeldung',url:'https://example.com/anmeldung'}]}]};
// Taller than the chat log on every viewport.
const longAnswer={...mockAnswer,runs:[{...mockAnswer.runs[0],answer:mockAnswer.runs[0].answer.repeat(14)}]};
// The start of the newest exchange (its question) is inside the visible part of the chat log.
const latestInView=page=>page.evaluate(()=>{const log=document.querySelector('[role="log"]'),box=log.getBoundingClientRect(),top=log.querySelector(':scope > ol > li:last-child').getBoundingClientRect().top;return top>=box.top-1&&top<box.bottom;});
// Smooth scrolling has settled once the log stays put for a few frames.
const scrolled=page=>page.evaluate(()=>new Promise(done=>{const log=document.querySelector('[role="log"]');let last=-1,still=0;const tick=()=>{still=log.scrollTop===last?still+1:0;last=log.scrollTop;still>=5?done():requestAnimationFrame(tick);};tick();}));

// The AI chat is behind ?ai: without it nothing shows and no island code is requested; with it a button under the page
// dots (above the page pill on narrow screens) opens a modal dialog. The backend is mocked in the browser.
async function checkAiChat({theme,width,reducedMotion},label){
 const context=await browser.newContext({colorScheme:theme,reducedMotion,viewport:{width,height:850}});
 const page=await context.newPage();
 const requests=[],questions=[];let backend='answer',gate=Promise.resolve(),release=()=>{};
 page.on('request',request=>requests.push(request.url()));
 await page.route('**/api/chat',async route=>{
  questions.push(route.request().postDataJSON());
  await gate;
  return backend==='busy'?route.fulfill({status:429,json:{error:{code:'budget-exceeded',message:'Daily cap reached.'}}}):route.fulfill({json:backend==='long'?longAnswer:mockAnswer});
 });
 const launcher=page.getByRole('button',{name:'KI-Chat öffnen'});
 const dialog=page.getByRole('dialog',{name:'KI-Chat'});
 const field=page.getByRole('textbox',{name:'Deine Frage'});
 const scan=async state=>{const results=await new AxeBuilder({page}).withTags(WCAG).analyze();if(results.violations.length)fail(`AI chat ${state} (${label})`,results.violations.map(v=>v.id+' ('+v.nodes.length+' nodes)').join(', '));};

 for(const query of ['','?ai=0','?ai=false']){
  requests.length=0;
  await page.goto(origin+'/'+query);
  await page.waitForFunction(()=>document.documentElement.hasAttribute('data-reader-ready'));
  await page.waitForTimeout(400);
  if(await launcher.count())fail(`AI chat shown without the flag "${query}" (${label})`);
  if(requests.some(url=>/\/_astro\/(AiChat|client|react)\.[\w-]+\.js/.test(url)))fail(`AI chat code loaded without the flag "${query}" (${label})`);
  if(query==='' && await page.locator('astro-island[client="query"][ssr]').count()!==1)fail(`AI chat island was hydrated without the flag (${label})`);
 }

 await page.goto(origin+'/?ai');
 await launcher.waitFor({timeout:5000});
 const layout=await page.evaluate(()=>{
  const rect=el=>{const r=el.getBoundingClientRect();return{top:r.top,bottom:r.bottom,right:r.right,x:r.left+r.width/2};};
  const dots=[...document.querySelectorAll('[data-page-link]')].map(rect);
  const button=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('KI-Chat öffnen'));
  return{dots,button:rect(button),pill:rect(document.querySelector('[popovertarget="seiten"]')),height:innerHeight};
 });
 if(width>=960){
  const last=layout.dots.at(-1);
  if(layout.button.top<last.bottom)fail(`AI chat button overlaps the page dots (${label})`);
  if(Math.abs(layout.button.x-last.x)>1.5)fail(`AI chat button is not on the dots' axis: ${layout.button.x} vs ${last.x} (${label})`);
  if(Math.abs((layout.dots[0].top+last.bottom)/2-layout.height/2)>1)fail(`Page dots are no longer centred (${label})`);
 }else if(layout.button.bottom>layout.pill.top||Math.abs(layout.button.right-layout.pill.right)>1)fail(`AI chat button is not right above the page pill (${label})`);

 // Tooltip: shown on hover, dismissed by Escape without moving the pointer (WCAG 1.4.13).
 const tip=page.locator('span[aria-hidden="true"]',{hasText:/^KI-Chat$/});
 await launcher.hover();
 await tip.waitFor({state:'visible',timeout:2000}).catch(()=>fail(`AI chat tooltip did not show on hover (${label})`));
 await page.keyboard.press('Escape');
 await tip.waitFor({state:'hidden',timeout:2000}).catch(()=>fail(`Escape did not dismiss the AI chat tooltip (${label})`));

 await launcher.focus();
 await launcher.press('Enter');
 if(!await dialog.evaluate(el=>el.matches(':modal')))fail(`AI chat did not open as a modal dialog (${label})`);
 await settle(page);
 if(!await field.evaluate(el=>el===document.activeElement))fail(`Focus did not move to the question field (${label})`);
 await scan('dialog');

 await field.fill('Wie melde ich mich für einen Kurs an?');
 await field.press('Enter');
 await dialog.getByText('Die Anmeldung erfolgt im Campus Management').waitFor({timeout:5000});
 if(questions.length!==1||Object.keys(questions[0]).join()!=='question'||questions[0].question!=='Wie melde ich mich für einen Kurs an?')fail(`Unexpected request ${JSON.stringify(questions)} (${label})`);
 const source=dialog.getByRole('link',{name:/^Quelle 1: Kursanmeldung/});
 if(await source.count()!==1||await source.getAttribute('target')!=='_blank'||await source.getAttribute('rel')!=='noopener noreferrer')fail(`Citation marker is not a safe source link (${label})`);
 if((await dialog.innerText()).includes('cm-registration-dates'))fail(`Raw citation id shown (${label})`);
 await scan('answer');

 backend='busy';
 await field.fill('Noch eine Frage');
 await field.press('Enter');
 const retry=dialog.getByRole('button',{name:'Erneut versuchen'});
 await retry.waitFor({timeout:5000});
 if(!(await dialog.innerText()).includes('zu viele Fragen')||(await dialog.innerText()).includes('Daily cap'))fail(`Error not shown in plain German (${label})`);
 await scan('error');
 backend='answer';
 await retry.click();
 await dialog.getByText('Die Anmeldung erfolgt im Campus Management').nth(1).waitFor({timeout:5000});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))fail(`Horizontal overflow with the AI chat open (${label})`);

 // A long answer starts in view, with its question above it, rather than scrolling to its end.
 backend='long';
 await field.fill('Eine Frage mit langer Antwort');
 await field.press('Enter');
 await dialog.getByText('Die Anmeldung erfolgt im Campus Management').nth(2).waitFor({timeout:5000});
 await scrolled(page);
 if(!await latestInView(page))fail(`A long answer does not start in view (${label})`);
 backend='answer';

 // Closing the dialog does not cancel a question: the answer is waiting, and in view, when it is reopened.
 gate=new Promise(done=>release=done);
 await field.fill('Und noch eine Frage');
 await field.press('Enter');
 await page.keyboard.press('Escape');
 if(await dialog.isVisible())fail(`Escape did not close the AI chat (${label})`);
 if(!await launcher.evaluate(el=>el===document.activeElement))fail(`Focus did not return to the AI chat button (${label})`);
 release();
 await page.waitForTimeout(300);
 await launcher.click();
 await settle(page);
 if(!await latestInView(page))fail(`Newest exchange is out of view after reopening (${label})`);
 if(await dialog.getByText('Die Anmeldung erfolgt im Campus Management').count()!==4)fail(`Answer lost while the AI chat was closed (${label})`);
 await page.keyboard.press('Escape');
 if(new URL(page.url()).search!=='?ai')fail(`AI chat changed the URL: ${page.url()} (${label})`);
 await context.close();
}
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

    const results=await new AxeBuilder({page}).withTags(WCAG).analyze();
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
    await checkAiChat({theme,width,reducedMotion},label);
   }
  }
 }
 if(!fails)console.log('axe WCAG 2.2 AA, reader and AI chat (?ai) checks passed: light/dark, 390/1280 px, with and without reduced motion.');
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
 if(fails)process.exitCode=1;
}
