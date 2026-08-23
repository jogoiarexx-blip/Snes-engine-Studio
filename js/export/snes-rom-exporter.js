/**
 * SNES Engine Studio 1.0 — Real .SFC ROM exporter
 * Generates a bootable 32 KiB LoROM directly in the browser, no external assembler.
 * Current SNES runtime subset: current scene tilemap preview + controllable OBJ player.
 */
(function(global){
'use strict';

const ROM_SIZE=0x8000, CPU_BASE=0x8000;
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function hexToBgr15(hex){
  let s=String(hex||'#000000').replace('#',''); if(s.length===3)s=s.split('').map(c=>c+c).join('');
  const r=parseInt(s.slice(0,2),16)||0,g=parseInt(s.slice(2,4),16)||0,b=parseInt(s.slice(4,6),16)||0;
  return ((b>>3)<<10)|((g>>3)<<5)|(r>>3);
}
function snesTitle(name){
  const raw=String(name||'SNES ENGINE GAME').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,' ').toUpperCase().slice(0,21);
  return raw.padEnd(21,' ');
}
function makeSolid4bpp(colorIndex){
  const out=[]; const p0=(colorIndex&1)?0xff:0, p1=(colorIndex&2)?0xff:0, p2=(colorIndex&4)?0xff:0, p3=(colorIndex&8)?0xff:0;
  for(let y=0;y<8;y++){out.push(p0,p1);} for(let y=0;y<8;y++){out.push(p2,p3);} return out;
}
function playerTile4bpp(){
  // 8x8 diamond/hero marker, palette color 1 with transparent corners.
  const pix=[
    '00011000','00111100','01111110','11111111',
    '11111111','01111110','00111100','00011000'
  ];
  const lo=[]; for(const row of pix){let p0=0; for(let x=0;x<8;x++)if(row[x]==='1')p0|=(1<<(7-x)); lo.push(p0,0);}
  return lo.concat(new Array(16).fill(0));
}
function mapData(project,theme){
  const sc=(project.scenes||[]).find(s=>s.id===project.currentScene)||(project.scenes||[])[0]||{};
  const map=sc.map||(sc.layers&&sc.layers.ground)||[];
  const out=[];
  for(let y=0;y<32;y++) for(let x=0;x<32;x++){
    const t=(map[y]&&Number.isFinite(+map[y][x]))?clamp(+map[y][x],0,7):0;
    out.push(t&255,0);
  }
  return {scene:sc,bytes:out};
}
class Asm{
  constructor(){this.b=[];this.labels={};this.fix=[];}
  pc(){return CPU_BASE+this.b.length;}
  label(n){this.labels[n]=this.pc();}
  emit(){for(const n of arguments)this.b.push(n&255);}
  imm(op,n){this.emit(op,n);}
  abs(op,a){this.emit(op,a&255,(a>>8)&255);}
  dp(op,a){this.emit(op,a&255);}
  branch(op,label){this.emit(op,0);this.fix.push({kind:'rel8',at:this.b.length-1,label,base:this.pc()});}
  absLabel(op,label,xOffset=0){this.emit(op,0,0);this.fix.push({kind:'abs16',at:this.b.length-2,label,add:xOffset});}
  resolve(){
    for(const f of this.fix){const target=this.labels[f.label]; if(target==null)throw new Error('Label ausente: '+f.label);
      if(f.kind==='rel8'){let d=target-f.base;if(d<-128||d>127)throw new Error('Branch fora do alcance '+f.label+' '+d);this.b[f.at]=d&255;}
      else {const a=(target+(f.add||0))&0xffff;this.b[f.at]=a&255;this.b[f.at+1]=(a>>8)&255;}
    }
    return this.b;
  }
}
function buildCode(data){
  const a=new Asm();
  const STA=0x8d, STZ=0x9c, LDA=0xa9;
  a.label('reset');
  a.emit(0x78,0x18,0xfb);      // SEI, CLC, XCE
  a.emit(0xc2,0x10);           // REP #$10 (X/Y 16-bit)
  a.emit(0xe2,0x20);           // SEP #$20 (A 8-bit)
  a.emit(0x4b,0xab);           // PHK, PLB => DBR=0
  a.imm(LDA,0x80);a.abs(STA,0x2100); // force blank
  a.abs(STZ,0x4200);a.abs(STZ,0x420c);a.abs(STZ,0x212c);a.abs(STZ,0x212d);
  a.abs(STZ,0x2105);a.abs(STZ,0x2106);a.abs(STZ,0x2133);
  // Player state in low WRAM.
  a.imm(LDA,data.playerX);a.dp(0x85,0x00); a.imm(LDA,data.playerY);a.dp(0x85,0x01);

  // CGRAM: BG palette 0 (colors 0..8)
  a.abs(STZ,0x2121);
  for(const c of data.bgPalette){a.imm(LDA,c&255);a.abs(STA,0x2122);a.imm(LDA,(c>>8)&255);a.abs(STA,0x2122);}
  // OBJ palette 0 starts at CGRAM 128: transparent + gold + white.
  a.imm(LDA,0x80);a.abs(STA,0x2121);
  for(const c of [0x0000,0x03ff,0x7fff,0x001f]){a.imm(LDA,c&255);a.abs(STA,0x2122);a.imm(LDA,(c>>8)&255);a.abs(STA,0x2122);}

  // VRAM write mode increment after high byte.
  a.imm(LDA,0x80);a.abs(STA,0x2115);
  // OBJ tile at word $0000.
  a.abs(STZ,0x2116);a.abs(STZ,0x2117);
  a.emit(0xa2,0,0); // LDX #0
  a.label('copy_obj');
  a.absLabel(0xbd,'obj_data');a.abs(STA,0x2118);a.emit(0xe8);
  a.absLabel(0xbd,'obj_data');a.abs(STA,0x2119);a.emit(0xe8);
  a.emit(0xe0,32,0);a.branch(0xd0,'copy_obj');

  // BG tile graphics at word $1000.
  a.imm(LDA,0x00);a.abs(STA,0x2116);a.imm(LDA,0x10);a.abs(STA,0x2117);
  a.emit(0xa2,0,0);a.label('copy_bg');
  a.absLabel(0xbd,'bg_data');a.abs(STA,0x2118);a.emit(0xe8);
  a.absLabel(0xbd,'bg_data');a.abs(STA,0x2119);a.emit(0xe8);
  a.emit(0xe0,data.bgTiles.length&255,(data.bgTiles.length>>8)&255);a.branch(0xd0,'copy_bg');

  // BG1 tilemap at word $2000, 32x32.
  a.imm(LDA,0x00);a.abs(STA,0x2116);a.imm(LDA,0x20);a.abs(STA,0x2117);
  a.emit(0xa2,0,0);a.label('copy_map');
  a.absLabel(0xbd,'map_data');a.abs(STA,0x2118);a.emit(0xe8);
  a.absLabel(0xbd,'map_data');a.abs(STA,0x2119);a.emit(0xe8);
  a.emit(0xe0,data.map.length&255,(data.map.length>>8)&255);a.branch(0xd0,'copy_map');

  // Mode 1, BG1 map $2000, BG1 tiles $1000, OBJ tiles $0000.
  a.imm(LDA,0x01);a.abs(STA,0x2105);
  a.imm(LDA,0x20);a.abs(STA,0x2107);
  a.imm(LDA,0x01);a.abs(STA,0x210b);
  a.abs(STZ,0x2101);
  // Scroll 0 (latches require two writes).
  for(const r of [0x210d,0x210e]){a.abs(STZ,r);a.abs(STZ,r);}

  // Hide all 128 sprites.
  a.abs(STZ,0x2102);a.abs(STZ,0x2103);a.emit(0xa2,0x80,0x00);a.label('oam_hide');
  a.imm(LDA,0x00);a.abs(STA,0x2104);a.imm(LDA,0xf0);a.abs(STA,0x2104);
  a.imm(LDA,0x00);a.abs(STA,0x2104);a.imm(LDA,0x00);a.abs(STA,0x2104);
  a.emit(0xca);a.branch(0xd0,'oam_hide');
  // Clear OAM high table.
  a.abs(STZ,0x2102);a.imm(LDA,0x01);a.abs(STA,0x2103);a.emit(0xa2,0x20,0x00);a.label('oam_hi');
  a.abs(STZ,0x2104);a.emit(0xca);a.branch(0xd0,'oam_hi');

  // Write player sprite #0.
  a.abs(STZ,0x2102);a.abs(STZ,0x2103);a.dp(0xa5,0x00);a.abs(STA,0x2104);a.dp(0xa5,0x01);a.abs(STA,0x2104);
  a.imm(LDA,0x00);a.abs(STA,0x2104);a.imm(LDA,0x30);a.abs(STA,0x2104);

  a.imm(LDA,0x11);a.abs(STA,0x212c); // BG1 + OBJ main screen
  a.imm(LDA,0x01);a.abs(STA,0x4200); // auto joypad read
  a.imm(LDA,0x0f);a.abs(STA,0x2100); // display on, full brightness

  a.label('frame');
  // Wait until out of vblank, then enter next vblank.
  a.label('wait_out');a.abs(0xad,0x4212);a.branch(0x30,'wait_out');
  a.label('wait_in');a.abs(0xad,0x4212);a.branch(0x10,'wait_in');
  a.label('wait_joy');a.abs(0xad,0x4212);a.imm(0x29,0x01);a.branch(0xd0,'wait_joy');
  // D-pad in $4219: UDLR bits 3..0.
  a.abs(0xad,0x4219);a.dp(0x85,0x02);
  a.dp(0xa5,0x02);a.imm(0x29,0x01);a.branch(0xf0,'no_right');a.dp(0xe6,0x00);a.label('no_right');
  a.dp(0xa5,0x02);a.imm(0x29,0x02);a.branch(0xf0,'no_left'); a.dp(0xc6,0x00);a.label('no_left');
  a.dp(0xa5,0x02);a.imm(0x29,0x04);a.branch(0xf0,'no_down'); a.dp(0xe6,0x01);a.label('no_down');
  a.dp(0xa5,0x02);a.imm(0x29,0x08);a.branch(0xf0,'no_up');   a.dp(0xc6,0x01);a.label('no_up');
  // Update sprite OAM during vblank.
  a.abs(STZ,0x2102);a.abs(STZ,0x2103);a.dp(0xa5,0x00);a.abs(STA,0x2104);a.dp(0xa5,0x01);a.abs(STA,0x2104);
  a.imm(LDA,0x00);a.abs(STA,0x2104);a.imm(LDA,0x30);a.abs(STA,0x2104);
  a.branch(0x80,'frame');

  // Data tables in same bank.
  a.label('obj_data');a.emit.apply(a,data.objTile);
  a.label('bg_data');a.emit.apply(a,data.bgTiles);
  a.label('map_data');a.emit.apply(a,data.map);
  return {bytes:a.resolve(),labels:a.labels};
}
function buildRom(project,themes){
  const sc=(project.scenes||[]).find(s=>s.id===project.currentScene)||(project.scenes||[])[0]||{};
  const theme=(themes&&themes[sc.themeId])||Object.values(themes||{})[0]||{tiles:[]};
  const md=mapData(project,theme);
  const palette=[hexToBgr15('#101424')];
  for(let i=0;i<8;i++)palette.push(hexToBgr15((theme.tiles&&theme.tiles[i]&&theme.tiles[i].color)||'#404858'));
  const bgTiles=[];for(let i=0;i<8;i++)bgTiles.push.apply(bgTiles,makeSolid4bpp(i+1));
  const player=(sc.entities||[]).find(e=>e.type==='player')||{x:120,y:100};
  const data={map:md.bytes,bgTiles,objTile:playerTile4bpp(),bgPalette:palette,playerX:clamp(Math.round((player.x||120)/2),8,247),playerY:clamp(Math.round((player.y||100)*0.75),8,215)};
  const code=buildCode(data); if(code.bytes.length>0x7fc0)throw new Error('Runtime SNES excedeu o banco LoROM de 32 KiB');
  const rom=new Uint8Array(ROM_SIZE);rom.fill(0xff);rom.set(code.bytes,0);
  // Internal header at $00:FFC0 -> file $7FC0.
  const title=snesTitle(project.name);for(let i=0;i<21;i++)rom[0x7fc0+i]=title.charCodeAt(i)&0x7f;
  rom[0x7fd5]=0x20; // LoROM SlowROM
  rom[0x7fd6]=0x00; // ROM only
  rom[0x7fd7]=0x05; // 32 KiB
  rom[0x7fd8]=0x00; // SRAM none
  rom[0x7fd9]=0x01; // NTSC North America (widely accepted)
  rom[0x7fda]=0x33; rom[0x7fdb]=0x00;
  // Vectors: point all relevant interrupts to reset/idle code at $8000.
  for(const off of [0x7fe4,0x7fe6,0x7fe8,0x7fea,0x7fee,0x7ff4,0x7ff8,0x7ffa,0x7ffc,0x7ffe]){rom[off]=0x00;rom[off+1]=0x80;}
  // Checksum fields initially zero, then compute byte-sum checksum including complement+checksum contribution (510).
  rom[0x7fdc]=rom[0x7fdd]=rom[0x7fde]=rom[0x7fdf]=0;
  let sum=0;for(let i=0;i<rom.length;i++)sum=(sum+rom[i])&0xffff;const checksum=(sum+510)&0xffff, comp=checksum^0xffff;
  rom[0x7fdc]=comp&255;rom[0x7fdd]=(comp>>8)&255;rom[0x7fde]=checksum&255;rom[0x7fdf]=(checksum>>8)&255;
  return {rom,meta:{title,scene:md.scene.name||'Cena',runtimeBytes:code.bytes.length,checksum,format:'LoROM 32 KiB .sfc',features:['tilemap da cena atual','paleta do tema','player controlado pelo D-pad']}};
}
function compatibility(project){
  const issues=[],warnings=[]; const sc=(project.scenes||[]).find(s=>s.id===project.currentScene)||(project.scenes||[])[0];
  if(!sc)issues.push('Projeto sem cena para compilar.');
  if((project.scenes||[]).length>1)warnings.push('A ROM 1.0 compila a cena atual; troca de cenas ainda não foi portada para o runtime SNES.');
  if(sc&&((sc.entities||[]).filter(e=>e.type==='enemy').length))warnings.push('Inimigos ainda não executam IA na ROM SNES 1.0.');
  if(project.studio&&project.studio.events&&project.studio.events.length)warnings.push('Eventos visuais ainda não são executados pela ROM SNES 1.0.');
  if(project.assets&&project.assets.length)warnings.push('Assets PNG/áudio modernos não são copiados automaticamente; a ROM usa tiles/paleta compatíveis gerados da cena.');
  return {ok:!issues.length,issues,warnings};
}
function download(){
  const A=global.SNESStudio;if(!A)return;const project=A.project,check=compatibility(project);
  if(!check.ok){A.toast('ROM SNES: '+check.issues[0]);return;}
  if(check.warnings.length){
    const msg='Compatibilidade SNES 1.0\n\nA ROM será inicializável, mas estes recursos do projeto ainda não foram portados para o runtime nativo do SNES:\n\n• '+check.warnings.join('\n• ')+'\n\nContinuar e gerar a ROM da cena atual?';
    if(typeof confirm==='function'&&!confirm(msg))return;
  }
  try{
    const built=buildRom(project,A.THEMES);const base=(project.name||'meu-jogo').replace(/[^a-z0-9-_]+/gi,'_');
    A.downloadFile(base+'.sfc',built.rom,'application/octet-stream');
    A.setStatus&&A.setStatus('ROM SNES compilada: '+built.meta.format+' · '+built.meta.scene+' · '+built.meta.runtimeBytes+' bytes de runtime');
    A.toast(check.warnings.length?'ROM .SFC gerada · '+check.warnings.length+' aviso(s) de compatibilidade':'ROM .SFC gerada com sucesso');
    if(check.warnings.length)console.warn('[SNES ROM compatibility]',check.warnings);
  }catch(err){console.error(err);A.toast('Falha ao compilar ROM: '+err.message);}
}
function install(){
  const btn=document.getElementById('exportSnesBtn');if(!btn)return;btn.textContent='🎮 ROM SNES (.sfc)';btn.title='Compilar ROM LoROM .sfc inicializável';btn.onclick=download;
}
global.SNESSfcExporter={buildRom,compatibility,download};
addEventListener('snesstudio:ready',()=>setTimeout(install,0));if(global.SNESStudio)setTimeout(install,0);
})(window);
