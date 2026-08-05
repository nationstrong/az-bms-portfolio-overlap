(() => {
  'use strict';
  const D = window.PORTFOLIO_DATA;
  const factors = ['Shared indications','Shared modalities','Shared target / mechanism','Stage alignment'];
  const diseaseOrder = [...new Map(D.plot.map(d => [d.diseaseArea, d])).values()];
  const unitsByCell = new Map();
  D.overlapUnits.forEach(u => {
    if (!unitsByCell.has(u.cellId)) unitsByCell.set(u.cellId, []);
    unitsByCell.get(u.cellId).push(u);
  });
  const matrixByArea = new Map();
  (D.fitCollisionMatrix || []).forEach(c => {
    if (!matrixByArea.has(c.diseaseArea)) matrixByArea.set(c.diseaseArea, []);
    matrixByArea.get(c.diseaseArea).push(c);
  });
  const programsByName = new Map(D.programs.map(p => [p.program, p]));
  const aliasMap = new Map([
    ['iza-bren','izalontamab brengitecan (iza-bren)'],
    ['torvutatug samrotecan','torvutatug samrotecan (AZD5335)'],
    ['zola-cel','zola-cel (CD19 NEX-T)']
  ]);
  const chartEl = document.getElementById('chart');
  const tooltip = document.getElementById('tooltip');
  const unitGrid = document.getElementById('unit-grid');
  const unitSectionHead = document.getElementById('unit-section-head');
  const detailTitle = document.getElementById('detail-title');
  const detailMeta = document.getElementById('detail-meta');
  const detailBadge = document.getElementById('detail-badge');
  const fitMapEl = document.getElementById('fit-map');
  const fitMapSummary = document.getElementById('fit-map-summary');
  const fitMapNote = document.getElementById('fit-map-note');
  const clearMatrixFilter = document.getElementById('clear-matrix-filter');
  const tableBody = document.getElementById('program-table-body');
  const searchInput = document.getElementById('program-search');
  const benchmarkGrid = document.getElementById('benchmark-grid');
  const benchmarkSection = document.getElementById('commercial-section');
  let selectedCell = null;
  let selectedArea = null;
  let selectedUnitId = null;
  let selectedMatrixCellId = null;
  let basePrograms = [];
  let currentPrograms = [];

  const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const slug = s => String(s).toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const formatRevenue = m => m >= 1000 ? `$${(m/1000).toFixed(m % 1000 ? 1 : 0)}B` : `$${m}M`;
  const intensityLabel = i => ['None','Limited','Moderate','Strong'][i] || 'None';
  const factorShort = f => ({'Shared indications':'Indications','Shared modalities':'Modalities','Shared target / mechanism':'Target / mechanism','Stage alignment':'Stage'})[f] || f;
  const companyClass = c => c === 'AstraZeneca' ? 'az' : 'bms';
  const canonical = name => aliasMap.get(name) || name;
  const diseaseMeta = area => diseaseOrder.find(d=>d.diseaseArea===area) || {plotLabel:area,diseaseArea:area};

  function svgEl(name, attrs={}, text='') {
    const el = document.createElementNS('http://www.w3.org/2000/svg', name);
    Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k, v));
    if (text !== '') el.textContent = text;
    return el;
  }
  function addMultilineText(svg, lines, x, y, attrs={}) {
    const t = svgEl('text', {x,y,...attrs});
    lines.forEach((line,i) => t.appendChild(svgEl('tspan',{x,dy:i===0?0:14},line)));
    svg.appendChild(t); return t;
  }
  function wrapLabel(label) {
    const map = {'Solid tumors':['Solid','tumors'],'Hematology':['Hematology'],'Immunology / resp. / fibrosis':['Immunology /','resp. / fibrosis'],'CV':['CV'],'Rare disease':['Rare','disease'],'Renal / metabolic':['Renal /','metabolic'],'Infectious disease':['Infectious','disease'],'Neuroscience':['Neuroscience']};
    return map[label] || [label];
  }

  function renderChart() {
    const W=1120,H=720,left=180,right=35,top=38,barBase=285,matrixTop=360,matrixGap=83;
    const colW=(W-left-right)/diseaseOrder.length;
    const svg=svgEl('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-labelledby':'chart-svg-title chart-svg-desc'});
    svg.appendChild(svgEl('title',{id:'chart-svg-title'},'AstraZeneca and BMS portfolio fit and collision matrix'));
    svg.appendChild(svgEl('desc',{id:'chart-svg-desc'},'Stacked bars show late-stage program counts by disease area and can be selected to explore complementarity. Red bubbles show overlap counts and directness.'));
    svg.appendChild(svgEl('text',{x:18,y:24,'font-size':13,'font-weight':850,fill:D.palette.ink,'letter-spacing':'.04em'},'LATE-STAGE PROGRAM FOOTPRINT'));
    svg.appendChild(svgEl('text',{x:18,y:45,'font-size':12,fill:'#667085'},'Click a disease-area bar for fit; click a red bubble for collision evidence'));
    const lx=W-270,ly=22;
    svg.appendChild(svgEl('rect',{x:lx,y:ly-10,width:22,height:13,rx:2,fill:D.palette.az}));
    svg.appendChild(svgEl('rect',{x:lx,y:ly-10,width:3,height:13,fill:D.palette.azAccent}));
    svg.appendChild(svgEl('text',{x:lx+29,y:ly+1,'font-size':12,fill:'#344054'},'AstraZeneca'));
    svg.appendChild(svgEl('rect',{x:lx+125,y:ly-10,width:22,height:13,rx:2,fill:D.palette.bms}));
    svg.appendChild(svgEl('rect',{x:lx+125,y:ly-10,width:3,height:13,fill:D.palette.bmsAccent}));
    svg.appendChild(svgEl('text',{x:lx+154,y:ly+1,'font-size':12,fill:'#344054'},'BMS'));
    const maxTotal=Math.max(...diseaseOrder.map(d=>d.azPrograms+d.bmsPrograms));
    const barScale=165/maxTotal;
    svg.appendChild(svgEl('line',{x1:left-5,y1:barBase,x2:W-right,y2:barBase,stroke:'#d9dee7','stroke-width':1.2}));
    diseaseOrder.forEach((d,i)=>{
      const x=left+i*colW+colW/2,bw=61;
      const azH=d.azPrograms*barScale,bmsH=d.bmsPrograms*barScale,total=d.azPrograms+d.bmsPrograms;
      const g=svgEl('g',{class:`disease-selector ${selectedArea===d.diseaseArea?'selected':''}`,tabindex:'0',role:'button','data-area':d.diseaseArea,'aria-label':`${d.plotLabel}: ${total} late-stage programs. Open fit-versus-collision map.`});
      g.appendChild(svgEl('rect',{class:'disease-hit',x:x-colW/2+5,y:70,width:colW-10,height:250,rx:8,fill:'transparent',stroke:'transparent'}));
      if(d.azPrograms>0){
        g.appendChild(svgEl('rect',{x:x-bw/2,y:barBase-azH,width:bw,height:azH,fill:D.palette.az}));
        g.appendChild(svgEl('rect',{x:x-bw/2,y:barBase-azH,width:3,height:azH,fill:D.palette.azAccent}));
        if(azH>25) g.appendChild(svgEl('text',{x,y:barBase-azH/2+4,'text-anchor':'middle','font-size':13,'font-weight':800,fill:'#fff'},String(d.azPrograms)));
      }
      if(d.bmsPrograms>0){
        g.appendChild(svgEl('rect',{x:x-bw/2,y:barBase-azH-bmsH,width:bw,height:bmsH,fill:D.palette.bms}));
        g.appendChild(svgEl('rect',{x:x-bw/2,y:barBase-azH-bmsH,width:3,height:bmsH,fill:D.palette.bmsAccent}));
        if(bmsH>25) g.appendChild(svgEl('text',{x,y:barBase-azH-bmsH/2+4,'text-anchor':'middle','font-size':13,'font-weight':800,fill:'#fff'},String(d.bmsPrograms)));
      }
      g.appendChild(svgEl('text',{x,y:barBase-azH-bmsH-9,'text-anchor':'middle','font-size':15,'font-weight':900,fill:D.palette.ink},String(total)));
      const label=svgEl('text',{x,y:barBase+24,'text-anchor':'middle','font-size':12,'font-weight':760,fill:D.palette.ink});
      wrapLabel(d.plotLabel).forEach((line,j)=>label.appendChild(svgEl('tspan',{x,dy:j===0?0:14},line))); g.appendChild(label);
      const activate=()=>selectArea(d.diseaseArea,true);
      g.addEventListener('click',activate); g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});
      svg.appendChild(g);
      svg.appendChild(svgEl('line',{x1:x,y1:matrixTop-42,x2:x,y2:matrixTop+(factors.length-1)*matrixGap+48,stroke:'#ece7e1','stroke-width':1}));
    });
    factors.forEach((f,fi)=>{
      const y=matrixTop+fi*matrixGap;
      svg.appendChild(svgEl('line',{x1:left-5,y1:y,x2:W-right,y2:y,stroke:'#ddd7cf','stroke-width':1.1}));
      svg.appendChild(svgEl('text',{x:left-15,y:y+5,'text-anchor':'end','font-size':13,fill:D.palette.ink},f));
    });
    const radius=count=>count===0?7:count===1?13:count===2?16:count===3?19:22;
    diseaseOrder.forEach((d,i)=>{
      const x=left+i*colW+colW/2; const nonzero=[];
      factors.forEach((f,fi)=>{const r=D.plot.find(p=>p.diseaseArea===d.diseaseArea&&p.factor===f);if(r&&r.overlapCount>0)nonzero.push(matrixTop+fi*matrixGap);});
      if(nonzero.length>1)svg.appendChild(svgEl('line',{x1:x,y1:Math.min(...nonzero),x2:x,y2:Math.max(...nonzero),stroke:'#344054','stroke-width':2}));
      factors.forEach((f,fi)=>{
        const y=matrixTop+fi*matrixGap; const r=D.plot.find(p=>p.diseaseArea===d.diseaseArea&&p.factor===f); if(!r)return;
        if(r.overlapCount===0){svg.appendChild(svgEl('circle',{cx:x,cy:y,r:7,fill:'#fff',stroke:'#bfc7d3','stroke-width':1.5}));return;}
        const g=svgEl('g',{class:`bubble ${selectedCell===r.cellId?'selected':''}`,tabindex:'0',role:'button','data-cell-id':r.cellId,'aria-label':`${d.plotLabel}, ${f}: ${r.overlapCount} overlap units, ${intensityLabel(r.intensity)} directness`});
        const fill=[null,D.palette.red1,D.palette.red2,D.palette.red3][r.intensity],cr=radius(r.overlapCount);
        g.appendChild(svgEl('circle',{cx:x,cy:y,r:cr,fill,stroke:'#9f1239','stroke-width':1.5}));
        g.appendChild(svgEl('text',{x,y:y+5,'text-anchor':'middle','font-size':13,'font-weight':900,fill:r.intensity===3?'#fff':'#7f1d2d'},String(r.overlapCount)));
        const activate=()=>selectCell(r.cellId,true);
        g.addEventListener('click',activate); g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});
        g.addEventListener('pointerenter',e=>showTooltip(e,r)); g.addEventListener('pointermove',moveTooltip); g.addEventListener('pointerleave',hideTooltip);
        svg.appendChild(g);
      });
    });
    const ly2=690;
    svg.appendChild(svgEl('text',{x:18,y:ly2-22,'font-size':11,'font-weight':850,fill:'#344054'},'BUBBLE SIZE = OVERLAP COUNT'));
    [1,2,4].forEach((n,j)=>{const x=220+j*95,rr=radius(n);svg.appendChild(svgEl('circle',{cx:x,cy:ly2-25,r:rr,fill:'#fff',stroke:'#475467','stroke-width':1.3}));svg.appendChild(svgEl('text',{x,y:ly2-21,'text-anchor':'middle','font-size':11,'font-weight':850,fill:'#172231'},String(n)));});
    svg.appendChild(svgEl('text',{x:585,y:ly2-22,'font-size':11,'font-weight':850,fill:'#344054'},'RED TONE = DIRECTNESS'));
    [1,2,3].forEach((n,j)=>{const x=770+j*120,fill=[null,D.palette.red1,D.palette.red2,D.palette.red3][n];svg.appendChild(svgEl('circle',{cx:x,cy:ly2-25,r:12,fill,stroke:'#9f1239','stroke-width':1.2}));svg.appendChild(svgEl('text',{x:x+21,y:ly2-21,'font-size':11,fill:'#344054'},intensityLabel(n).toLowerCase()));});
    chartEl.innerHTML=''; chartEl.appendChild(svg);
  }

  function showTooltip(e,r){tooltip.innerHTML=`<strong>${esc(r.plotLabel)} · ${esc(factorShort(r.factor))}</strong>${r.overlapCount} distinct overlap ${r.overlapCount===1?'unit':'units'} · ${esc(intensityLabel(r.intensity))} directness<br><span style="color:#cdd5df">Click for evidence and the fit-vs-collision map</span>`;tooltip.classList.add('show');moveTooltip(e);}
  function showMatrixTooltip(e,c){const az=c.azPrograms.length?`AZ: ${c.azPrograms.join(', ')}`:'AZ: none';const bms=c.bmsPrograms.length?`BMS: ${c.bmsPrograms.join(', ')}`:'BMS: none';tooltip.innerHTML=`<strong>${esc(c.modality)} × ${esc(c.indication)}</strong>${esc(az)}<br>${esc(bms)}<br><span style="color:#cdd5df">Click to filter the detailed table</span>`;tooltip.classList.add('show');moveTooltip(e);}
  function moveTooltip(e){tooltip.style.left=`${Math.min(e.clientX+16,window.innerWidth-320)}px`;tooltip.style.top=`${Math.min(e.clientY+16,window.innerHeight-145)}px`;}
  function hideTooltip(){tooltip.classList.remove('show');}

  function getProgramsByNames(names){return [...new Set(names.map(canonical))].map(n=>programsByName.get(n)).filter(Boolean);}
  function getProgramsForUnits(units){const names=[];units.forEach(u=>[...u.azPrograms,...u.bmsPrograms].forEach(n=>names.push(n)));return getProgramsByNames(names);}
  function allProgramsForArea(area){return D.programs.filter(p=>p.diseaseArea===area);}

  function sharedAxisSets(area){
    const cells=matrixByArea.get(area)||[]; const byMod=new Map(),byInd=new Map();
    cells.forEach(c=>{if(!byMod.has(c.modality))byMod.set(c.modality,new Set());if(c.azCount)byMod.get(c.modality).add('AZ');if(c.bmsCount)byMod.get(c.modality).add('BMS');if(!byInd.has(c.indication))byInd.set(c.indication,new Set());if(c.azCount)byInd.get(c.indication).add('AZ');if(c.bmsCount)byInd.get(c.indication).add('BMS');});
    return {modalities:new Set([...byMod].filter(([,s])=>s.size===2).map(([k])=>k)),indications:new Set([...byInd].filter(([,s])=>s.size===2).map(([k])=>k))};
  }

  function renderFitMap(area, factor=null){
    const axis=D.fitCollisionAxes?.[area]; const cells=matrixByArea.get(area)||[];
    selectedMatrixCellId=null; clearMatrixFilter.hidden=true;
    if(!axis||!cells.length){fitMapEl.innerHTML='<div class="empty-state">No normalized matrix data are available for this disease area.</div>';fitMapSummary.innerHTML='';return;}
    const lookup=new Map(cells.map(c=>[`${c.modality}|||${c.indication}`,c]));
    const collision=cells.filter(c=>c.status==='overlap').length,azOnly=cells.filter(c=>c.status==='az-only').length,bmsOnly=cells.filter(c=>c.status==='bms-only').length;
    fitMapSummary.innerHTML=`<div class="fit-stat"><strong>${collision}</strong><span>collision cells</span></div><div class="fit-stat"><strong>${azOnly+bmsOnly}</strong><span>complement cells</span></div><div class="fit-stat"><strong>${azOnly}</strong><span>AZ only</span></div><div class="fit-stat"><strong>${bmsOnly}</strong><span>BMS only</span></div>`;
    const shared=sharedAxisSets(area);
    const head=axis.indications.map(ind=>`<th class="${factor==='Shared indications'&&shared.indications.has(ind)?'fit-column-highlight':''}">${esc(ind)}</th>`).join('');
    const rows=axis.modalities.map(mod=>{
      const cellsHtml=axis.indications.map(ind=>{
        const c=lookup.get(`${mod}|||${ind}`);
        if(!c)return '<td><span class="fit-empty" aria-label="No mapped late-stage program"></span></td>';
        const names=[...c.azPrograms,...c.bmsPrograms];
        const aria=`${mod}, ${ind}: ${c.status==='overlap'?'both companies':c.status==='az-only'?'AstraZeneca only':'BMS only'}; ${names.join(', ')}`;
        let inner='';
        if(c.status==='overlap')inner=`<span class="az-num">${c.azCount}<small class="cell-company">AZ</small></span><span class="bms-num">${c.bmsCount}<small class="cell-company">BMS</small></span>`;
        else inner=`<span class="single-num">${c.status==='az-only'?'AZ':'BMS'} ${c.azCount||c.bmsCount}</span>`;
        return `<td><button type="button" class="fit-cell ${c.status} ${c.status==='overlap'?'':'single'}" data-matrix-id="${esc(c.id)}" aria-label="${esc(aria)}">${inner}</button></td>`;
      }).join('');
      return `<tr><th class="${factor==='Shared modalities'&&shared.modalities.has(mod)?'fit-axis-highlight':''}">${esc(mod)}</th>${cellsHtml}</tr>`;
    }).join('');
    fitMapEl.innerHTML=`<table class="fit-matrix"><thead><tr><th class="axis-corner">Modality family ↓<br>Indication territory →</th>${head}</tr></thead><tbody>${rows}</tbody></table>`;
    fitMapNote.textContent=factor==='Shared modalities'?'Rows used by both companies are marked at left. Split cells show a true same-modality, same-indication collision.':factor==='Shared indications'?'Columns occupied by both companies are lightly highlighted. Split cells show where the shared indication also uses the same modality family.':'AZ-only and BMS-only cells indicate portfolio complementarity in this matched late-stage snapshot; split cells indicate collision.';
    fitMapEl.querySelectorAll('.fit-cell').forEach(btn=>{
      const c=cells.find(x=>x.id===btn.dataset.matrixId); if(!c)return;
      btn.addEventListener('click',()=>selectMatrixCell(c));
      btn.addEventListener('pointerenter',e=>showMatrixTooltip(e,c));btn.addEventListener('pointermove',moveTooltip);btn.addEventListener('pointerleave',hideTooltip);
    });
  }

  function selectMatrixCell(c){
    hideTooltip(); selectedMatrixCellId=c.id; selectedUnitId=null; searchInput.value='';
    if(selectedCell) renderUnitCards(unitsByCell.get(selectedCell)||[]);
    currentPrograms=getProgramsByNames([...c.azPrograms,...c.bmsPrograms]);
    document.querySelectorAll('.fit-cell').forEach(b=>b.classList.toggle('selected',b.dataset.matrixId===c.id));
    clearMatrixFilter.hidden=false;
    fitMapNote.innerHTML=`Table filtered to <strong>${esc(c.modality)} × ${esc(c.indication)}</strong> · ${c.status==='overlap'?'collision':'complementarity'} · ${c.azCount} AZ / ${c.bmsCount} BMS program${c.azCount+c.bmsCount===1?'':'s'}.`;
    renderPrograms();
  }
  function clearMatrix(){selectedMatrixCellId=null;currentPrograms=basePrograms.slice();clearMatrixFilter.hidden=true;document.querySelectorAll('.fit-cell').forEach(b=>b.classList.remove('selected'));const factor=selectedCell?(D.plot.find(p=>p.cellId===selectedCell)||{}).factor:null;renderFitMap(selectedArea,factor);renderPrograms();}

  function renderUnitCards(units){
    unitSectionHead.hidden=!selectedCell;
    if(!selectedCell){unitGrid.innerHTML='<div class="empty-state">This view shows the full disease-area portfolio. Select a red bubble above to see the exact collision units behind an overlap count.</div>';return;}
    if(!units.length){unitGrid.innerHTML='<div class="empty-state">No distinct overlap units were coded for this chart cell.</div>';return;}
    unitGrid.innerHTML=units.map(u=>`<button class="unit-card ${selectedUnitId===u.id?'active':''}" data-unit-id="${esc(u.id)}" type="button"><div class="unit-top"><span class="unit-name">${esc(u.unit)}</span><span class="directness d${u.directness}">${esc(intensityLabel(u.directness))}</span></div><p>${esc(u.rationale)}</p><div class="program-chips">${u.azPrograms.map(p=>`<span class="chip az">AZ · ${esc(p)}</span>`).join('')}${u.bmsPrograms.map(p=>`<span class="chip bms">BMS · ${esc(p)}</span>`).join('')}</div></button>`).join('');
    unitGrid.querySelectorAll('.unit-card').forEach(btn=>btn.addEventListener('click',()=>selectUnit(btn.dataset.unitId)));
  }
  function selectUnit(id){selectedUnitId=selectedUnitId===id?null:id;selectedMatrixCellId=null;clearMatrixFilter.hidden=true;const units=unitsByCell.get(selectedCell)||[];renderUnitCards(units);const factor=(D.plot.find(p=>p.cellId===selectedCell)||{}).factor;renderFitMap(selectedArea,factor);basePrograms=getProgramsForUnits(selectedUnitId?units.filter(u=>u.id===selectedUnitId):units);currentPrograms=basePrograms.slice();renderPrograms();renderBenchmarks(selectedUnitId?units.filter(u=>u.id===selectedUnitId):units);}

  function renderPrograms(){
    const q=searchInput.value.trim().toLowerCase();
    const rows=currentPrograms.filter(p=>!q||[p.company,p.program,p.stage,p.modality,p.representativeIndications,p.overlapIndication,p.clinicalSetting,p.trialId,p.matrixModalityFamily,...(p.matrixIndications||[])].join(' ').toLowerCase().includes(q));
    if(!rows.length){tableBody.innerHTML='<tr><td colspan="10"><div class="empty-state">No matching program details. Clear the search or select another matrix cell.</div></td></tr>';return;}
    rows.sort((a,b)=>(a.company.localeCompare(b.company)||a.program.localeCompare(b.program)));
    tableBody.innerHTML=rows.map(p=>`<tr><td><span class="company-pill ${companyClass(p.company)}">${p.company==='AstraZeneca'?'AZ':'BMS'}</span></td><td><strong>${esc(p.program)}</strong><div class="muted">${esc(p.modality)}</div></td><td><span class="stage-pill">${esc(p.trialStage||p.stage)}</span></td><td>${p.trialId?`<strong>${esc(p.trialName)}</strong><br><a class="source-link" href="${esc(p.trialUrl)}" target="_blank" rel="noopener">${esc(p.trialId)} ↗</a>`:`<span class="muted">Pipeline snapshot only</span>`}</td><td>${esc(p.potentialLaunchIndication||p.representativeIndications)}</td><td>${esc(p.clinicalSetting||'See pipeline source')}</td><td class="nowrap">${esc(p.primaryCompletion||'Not mapped')}</td><td class="nowrap">${esc(p.illustrativeLaunchWindow||'Not estimated')}${p.primaryCompletion?'<div class="muted">illustrative</div>':''}</td><td>${esc(p.historicalSales)}</td><td><a class="source-link" href="${esc(p.sourceUrl)}" target="_blank" rel="noopener">Pipeline ↗</a>${p.detailNote?`<div class="muted">${esc(p.detailNote)}</div>`:''}</td></tr>`).join('');
  }
  function renderBenchmarks(units=[]){
    const unitNames=new Set(units.map(u=>u.unit)); let benchmarks=D.commercialBenchmarks.filter(b=>unitNames.has(b.overlapUnit));
    if(!benchmarks.length&&selectedArea)benchmarks=D.commercialBenchmarks.filter(b=>b.diseaseArea===selectedArea);
    benchmarkSection.hidden=!benchmarks.length;
    benchmarkGrid.innerHTML=benchmarks.map(b=>`<div class="benchmark"><div class="label">${esc(b.product)} · ${esc(String(b.year))}</div><div class="value">${formatRevenue(b.worldwideRevenue)}</div><div class="basis">${esc(b.basis)}</div><div class="note">${esc(b.relevance)} ${esc(b.limitations)}</div><a href="${esc(b.sourceUrl)}" target="_blank" rel="noopener">Company source ↗</a></div>`).join('');
  }

  function selectArea(area,scroll=false){
    hideTooltip();selectedArea=area;selectedCell=null;selectedUnitId=null;selectedMatrixCellId=null;searchInput.value='';
    const d=diseaseMeta(area);basePrograms=allProgramsForArea(area);currentPrograms=basePrograms.slice();
    detailTitle.textContent=`${d.plotLabel} · fit vs collision map`;
    const az=basePrograms.filter(p=>p.company==='AstraZeneca').length,bms=basePrograms.length-az;
    detailMeta.textContent=`${basePrograms.length} late-stage programs · ${az} AZ / ${bms} BMS · click a populated matrix cell to filter the table`;
    detailBadge.textContent='Portfolio map';detailBadge.style.opacity=1;
    renderFitMap(area,null);renderUnitCards([]);renderPrograms();renderBenchmarks([]);renderChart();
    history.replaceState(null,'',`#details/${slug(area)}/portfolio-map`);
    if(scroll)document.getElementById('details').scrollIntoView({behavior:'smooth',block:'start'});
  }

  function selectCell(cellId,scroll=false){
    hideTooltip();selectedCell=cellId;selectedUnitId=null;selectedMatrixCellId=null;searchInput.value='';
    const r=D.plot.find(p=>p.cellId===cellId);if(!r)return;selectedArea=r.diseaseArea;
    const units=unitsByCell.get(cellId)||[];
    detailTitle.textContent=`${r.plotLabel} · ${factorShort(r.factor)}`;
    detailMeta.textContent=units.length?`${units.length} distinct overlap ${units.length===1?'unit':'units'} · ${r.relationship}`:'No coded overlap in this dimension';
    detailBadge.textContent=`${intensityLabel(r.intensity)} directness`;detailBadge.style.opacity=r.intensity?1:.5;
    renderFitMap(selectedArea,r.factor);renderUnitCards(units);basePrograms=getProgramsForUnits(units);currentPrograms=basePrograms.slice();renderPrograms();renderBenchmarks(units);renderChart();
    history.replaceState(null,'',`#details/${r.diseaseSlug}/${r.factorSlug}`);
    if(scroll)document.getElementById('details').scrollIntoView({behavior:'smooth',block:'start'});
  }

  function initialSelection(){
    const parts=location.hash.split('/');
    if(parts[0]==='#details'&&parts.length>=3){
      const area=diseaseOrder.find(d=>slug(d.diseaseArea)===parts[1]);
      if(area&&parts[2]==='portfolio-map')return {type:'area',value:area.diseaseArea};
      const id=`${parts[1]}--${parts[2]}`;if(D.plot.some(p=>p.cellId===id&&p.overlapCount>0))return {type:'cell',value:id};
    }
    return {type:'cell',value:D.plot.find(p=>p.diseaseArea==='Solid-tumor oncology'&&p.factor==='Shared modalities').cellId};
  }
  function renderSources(){const list=document.getElementById('source-list');list.innerHTML=D.sources.map(s=>`<li><div><a class="source-name" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a></div><div>${esc(s.date)}</div><div class="source-use">${esc(s.use)}</div></li>`).join('');}

  searchInput.addEventListener('input',renderPrograms);clearMatrixFilter.addEventListener('click',clearMatrix);
  renderSources();const initial=initialSelection();if(initial.type==='area')selectArea(initial.value,false);else selectCell(initial.value,false);
})();
