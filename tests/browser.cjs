// Run after: npm install --no-save --package-lock=false playwright@1.51.1
// Then: npx playwright install --with-deps chromium && node tests/browser.cjs
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const server=spawn('python3',['-m','http.server','8765','--directory',path.dirname(root)],{stdio:'ignore'});
const url=`http://127.0.0.1:8765/${path.basename(root)}/?seed=GOLFI-TEST`;
let browser;
(async()=>{
  for(let i=0;i<40;i++){try{if((await fetch(url)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({headless:true});
  fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(url);await page.locator('#lets-play').click();
  await page.screenshot({path:path.join(root,'test-results/mobile.png')});
  assert.equal(await page.locator('#hole-number').textContent(),'01');
  assert.equal(await page.locator('[data-club].active').count(),1);
  // Touch input, cancellation and aiming on a phone-sized viewport.
  const box=await page.locator('#course').boundingBox();
  const touch=await context.newCDPSession(page);
  const point={x:Math.round(box.x+box.width/2),y:Math.round(box.y+box.height*.65)};
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x,y:point.y+70}]});
  await page.waitForFunction(()=>parseInt(document.querySelector('#power-value').textContent)>0);
  await touch.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  assert.equal(await page.locator('#strokes').textContent(),'0');
  assert.equal(await page.locator('#power-value').textContent(),'0%');
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x,y:point.y+95}]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForFunction(()=>document.querySelector('#strokes').textContent==='1');
  await page.waitForFunction(()=>!document.querySelector('#swing').disabled,{},{timeout:20000});
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('golfi-round-v1')));
  assert.equal(before.strokes,1);assert.equal(before.ball.moving,false);
  await page.reload();assert.equal(await page.locator('#strokes').textContent(),'1');
  await page.locator('#scorecard').click();assert.equal(await page.locator('tbody tr').count(),9);await page.locator('#resume').click();
  for(const viewport of [{width:320,height:568},{width:844,height:390},{width:1440,height:900}]){
    await page.setViewportSize(viewport);await page.waitForTimeout(150);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
    const bounds=await page.locator('#swing').boundingBox();assert.ok(bounds.y+bounds.height<=viewport.height,'swing control fits');
    await page.screenshot({path:path.join(root,`test-results/layout-${viewport.width}.png`)});
  }
  await page.setViewportSize({width:390,height:844});
  // Stage a short putt, then complete all nine holes through real controls/physics.
  const engine=await import(require('node:url').pathToFileURL(path.join(root,'engine.js')).href);
  for(let hole=0;hole<9;hole++){
    const c=engine.generateCourse('GOLFI-TEST',hole);
    const scores=Array.from({length:hole},(_,i)=>({strokes:4,par:engine.generateCourse('GOLFI-TEST',i).par}));
    const snapshot=JSON.stringify({seed:'GOLFI-TEST',hole,scores,strokes:3,ball:engine.makeBall({x:c.pin.x,y:c.pin.y+12})});
    // Install after the previous page's visibilitychange autosave, before game startup.
    await page.addInitScript(({hole,snapshot})=>{
      if(new URL(location.href).searchParams.get('test-hole')===String(hole))localStorage.setItem('golfi-round-v1',snapshot);
    },{hole,snapshot});
    await page.goto(url+'&test-hole='+hole);await page.locator('[data-club="putter"]').click();
    assert.equal(await page.locator('#strokes').textContent(),'3');
    assert.equal(await page.locator('#distance').textContent(),'6');
    const swing=await page.locator('#swing').boundingBox();
    await page.mouse.move(swing.x+swing.width/2,swing.y+swing.height/2);await page.mouse.down();await page.waitForTimeout(470);await page.mouse.up();
    try{await page.waitForFunction(()=>document.querySelector('#next')!==null,{},{timeout:15000});}
    catch(error){console.error('Failed short putt on hole',hole+1,await page.evaluate(()=>localStorage.getItem('golfi-round-v1'))));await page.screenshot({path:path.join(root,'test-results/failed-putt.png')});throw error;}
    assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('golfi-round-v1')))).scores.length,hole+1);
    if(hole===8){assert.ok((await page.locator('#modal-content').textContent()).includes('That’s a round.'));await page.screenshot({path:path.join(root,'test-results/round-complete.png')});}
    await page.locator('#next').click();
    assert.equal(await page.locator('#hole-number').textContent(),String(hole===8?1:hole+2).padStart(2,'0'));
  }
  assert.deepEqual(errors,[]);console.log('Browser checks passed: touch swing/cancel, saves, 4 viewports, nine-hole progression, restart, no console errors.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();server.kill();});
