
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
  const programsByName = new Map(D.programs.map(p => [p.program, p]));
  const aliasMap = new Map([
    ['iza-bren','izalontamab brengitecan (iza-bren)'],
    ['torvutatug samrotecan','torvutatug samrotecan (AZD5335)'],
    ['zola-cel','zola-cel (CD19 NEX-T)']
  ]);
  const chartEl = document.getElementById('chart');
  const tooltip = document.getElementById('tooltip');
  const unitGrid = document.getElementById('unit-grid');
  const detailTitle = document.getElementById('detail-title');
  const detailMeta = document.getElementById('detail-meta');
  const detailBadge = document.getElementById('detail-badge');
  const tableBody = document.getElementById('program-table-body');
  const searchInput = document.getElementById('program-search');
  const benchmarkGrid = document.getElementById('benchmark-grid');
  const benchmarkSection = document.getElementById('commercial-section');
  let selectedCell = null;
  let selectedUnitId = null;
  let currentPrograms = [];

  const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const slug = s => String(s).toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const formatRevenue = m => m >= 1000 ? `$${(m/1000).toFixed(m % 1000 ? 1 : 0)}B` : `$${m}M`;
  const intensityLabel = i => ['None','Limited','Moderate','Strong'][i] || 'None';
  const factorShort = f => ({'Shared indications':'Indications','Shared modalities':'Modalities','Shared target / mechanism':'Target / mechanism','Stage alignment':'Stage'})[f] || f;
  const companyClass = c => c === 'AstraZeneca' ? 'az' : 'bms';
  const canonical = name => aliasMap.get(name) || name;

  function svgEl(name, attrs={}, text='') {
    const el = document.createElementNS('http://www.w3.org/2000/svg', name);
    Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k, v));
    if (text !== '') el.textContent = text;
    return el;
  }
  function addMultilineText(svg, lines, x, y, attrs={}) {
    const t = svgEl('text', {x,y,...attrs});
    lines.forEach((line,i) => {
      const sp = svgEl('tspan', {x, dy: i===0 ? 0 : 14}, line);
      t.appendChild(sp);
    });
    svg.appendChild(t); return t;
  }
  function wrapLabel(label) {
    const map = {
      'Solid tumors':['Solid','tumors'], 'Hematology':['Hematology'],
      'Immunology / resp. / fibrosis':['Immunology /','resp. / fibrosis'], 'CV':['CV'],
      'Rare disease':['Rare','disease'], 'Renal / metabolic':['Renal /','metabolic'],
      'Infectious disease':['Infectious','disease'], 'Neuroscience':['Neuroscience']
    };
    return map[label] || [label];
  }

  function renderChart() {
    const W=1120,H=720,left=180,right=35,top=38,barBase=285,matrixTop=360,matrixGap=83;
    const colW=(W-left-right)/diseaseOrder.length;
    const svg=svgEl('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-labelledby':'chart-svg-title chart-svg-desc'});
    svg.appendChild(svgEl('title',{id:'chart-svg-title'},'AstraZeneca and BMS portfolio collision matrix'));
    svg.appendChild(svgEl('desc',{id:'chart-svg-desc'},'Stacked bars show late-stage program counts by disease area. Clickable red bubbles show the count and directness of shared indication, modality, target and stage dimensions.'));

    svg.appendChild(svgEl('text',{x:18,y:24,'font-size':13,'font-weight':850,fill:D.palette.ink,'letter-spacing':'.04em'},'LATE-STAGE PROGRAM FOOTPRINT'));
    svg.appendChild(svgEl('text',{x:18,y:45,'font-size':12,fill:'#667085'},'Unique lead Phase II or Phase III/pivotal/registration assets/programs'));

    // Company legend
    const lx=W-270,ly=22;
    const azRect=svgEl('rect',{x:lx,y:ly-10,width:22,height:13,rx:2,fill:D.palette.az}); svg.appendChild(azRect);
    svg.appendChild(svgEl('rect',{x:lx,y:ly-10,width:3,height:13,fill:D.palette.azAccent}));
    svg.appendChild(svgEl('text',{x:lx+29,y:ly+1,'font-size':12,fill:'#344054'},'AstraZeneca'));
    svg.appendChild(svgEl('rect',{x:lx+125,y:ly-10,width:22,height:13,rx:2,fill:D.palette.bms}));
    svg.appendChild(svgEl('rect',{x:lx+125,y:ly-10,width:3,height:13,fill:D.palette.bmsAccent}));
    svg.appendChild(svgEl('text',{x:lx+154,y:ly+1,'font-size':12,fill:'#344054'},'BMS'));

    const maxTotal=Math.max(...diseaseOrder.map(d=>d.azPrograms+d.bmsPrograms));
    const barScale=165/maxTotal;
    svg.appendChild(svgEl('line',{x1:left-5,y1:barBase,x2:W-right,y2:barBase,stroke:'#d9dee7','stroke-width':1.2}));
    diseaseOrder.forEach((d,i)=>{
      const x=left+i*colW+colW/2, bw=61;
      const azH=d.azPrograms*barScale,bmsH=d.bmsPrograms*barScale,total=d.azPrograms+d.bmsPrograms;
      if (d.azPrograms>0){
        svg.appendChild(svgEl('rect',{x:x-bw/2,y:barBase-azH,width:bw,height:azH,fill:D.palette.az}));
        svg.appendChild(svgEl('rect',{x:x-bw/2,y:barBase-azH,width:3,height:azH,fill:D.palette.azAccent}));
        if(azH>25) svg.appendChild(svgEl('text',{x,y:barBase-azH/2+4,'text-anchor':'middle','font-size':13,'font-weight':800,fill:'#fff'},String(d.azPrograms)));
      }
      if (d.bmsPrograms>0){
        svg.appendChild(svgEl('rect',{x:x-bw/2,y:barBase-azH-bmsH,width:bw,height:bmsH,fill:D.palette.bms}));
        svg.appendChild(svgEl('rect',{x:x-bw/2,y:barBase-azH-bmsH,width:3,height:bmsH,fill:D.palette.bmsAccent}));
        if(bmsH>25) svg.appendChild(svgEl('text',{x,y:barBase-azH-bmsH/2+4,'text-anchor':'middle','font-size':13,'font-weight':800,fill:'#fff'},String(d.bmsPrograms)));
      }
      svg.appendChild(svgEl('text',{x,y:barBase-azH-bmsH-9,'text-anchor':'middle','font-size':15,'font-weight':900,fill:D.palette.ink},String(total)));
      addMultilineText(svg,wrapLabel(d.plotLabel),x,barBase+24,{'text-anchor':'middle','font-size':12,'font-weight':760,fill:D.palette.ink});
      svg.appendChild(svgEl('line',{x1:x,y1:matrixTop-42,x2:x,y2:matrixTop+(factors.length-1)*matrixGap+48,stroke:'#ece7e1','stroke-width':1}));
    });

    factors.forEach((f,fi)=>{
      const y=matrixTop+fi*matrixGap;
      svg.appendChild(svgEl('line',{x1:left-5,y1:y,x2:W-right,y2:y,stroke:'#ddd7cf','stroke-width':1.1}));
      svg.appendChild(svgEl('text',{x:left-15,y:y+5,'text-anchor':'end','font-size':13,fill:D.palette.ink},f));
    });

    const radius = count => count===0?7:count===1?13:count===2?16:count===3?19:22;
    diseaseOrder.forEach((d,i)=>{
      const x=left+i*colW+colW/2;
      const nonzero=[];
      factors.forEach((f,fi)=>{
        const y=matrixTop+fi*matrixGap;
        const r=D.plot.find(p=>p.diseaseArea===d.diseaseArea&&p.factor===f);
        if(!r) return;
        if(r.overlapCount>0) nonzero.push(y);
      });
      if(nonzero.length>1) svg.appendChild(svgEl('line',{x1:x,y1:Math.min(...nonzero),x2:x,y2:Math.max(...nonzero),stroke:'#344054','stroke-width':2}));
      factors.forEach((f,fi)=>{
        const y=matrixTop+fi*matrixGap;
        const r=D.plot.find(p=>p.diseaseArea===d.diseaseArea&&p.factor===f);
        if(!r) return;
        if(r.overlapCount===0){
          svg.appendChild(svgEl('circle',{cx:x,cy:y,r:7,fill:'#fff',stroke:'#bfc7d3','stroke-width':1.5}));
          return;
        }
        const g=svgEl('g',{class:'bubble',tabindex:'0',role:'button','data-cell-id':r.cellId,'aria-label':`${d.plotLabel}, ${f}: ${r.overlapCount} overlap units, ${intensityLabel(r.intensity)} directness`});
        const fill=[null,D.palette.red1,D.palette.red2,D.palette.red3][r.intensity];
        const cr=radius(r.overlapCount);
        g.appendChild(svgEl('circle',{cx:x,cy:y,r:cr,fill,stroke:'#9f1239','stroke-width':1.5}));
        g.appendChild(svgEl('text',{x,y:y+5,'text-anchor':'middle','font-size':13,'font-weight':900,fill:r.intensity===3?'#fff':'#7f1d2d'},String(r.overlapCount)));
        const activate=()=>selectCell(r.cellId,true);
        g.addEventListener('click',activate);
        g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});
        g.addEventListener('pointerenter',e=>showTooltip(e,r));
        g.addEventListener('pointermove',moveTooltip);
        g.addEventListener('pointerleave',hideTooltip);
        svg.appendChild(g);
      });
    });

    // Legends
    const ly2=690;
    svg.appendChild(svgEl('text',{x:18,y:ly2-22,'font-size':11,'font-weight':850,fill:'#344054'},'BUBBLE SIZE = OVERLAP COUNT'));
    [1,2,4].forEach((n,j)=>{
      const x=220+j*95, rr=radius(n);
      svg.appendChild(svgEl('circle',{cx:x,cy:ly2-25,r:rr,fill:'#fff',stroke:'#475467','stroke-width':1.3}));
      svg.appendChild(svgEl('text',{x,y:ly2-21,'text-anchor':'middle','font-size':11,'font-weight':850,fill:'#172231'},String(n)));
    });
    svg.appendChild(svgEl('text',{x:585,y:ly2-22,'font-size':11,'font-weight':850,fill:'#344054'},'RED TONE = DIRECTNESS'));
    [1,2,3].forEach((n,j)=>{
      const x=770+j*120,fill=[null,D.palette.red1,D.palette.red2,D.palette.red3][n];
      svg.appendChild(svgEl('circle',{cx:x,cy:ly2-25,r:12,fill,stroke:'#9f1239','stroke-width':1.2}));
      svg.appendChild(svgEl('text',{x:x+21,y:ly2-21,'font-size':11,fill:'#344054'},intensityLabel(n).toLowerCase()));
    });
    chartEl.innerHTML=''; chartEl.appendChild(svg);
  }

  function showTooltip(e,r){
    tooltip.innerHTML=`<strong>${esc(r.plotLabel)} · ${esc(factorShort(r.factor))}</strong>${r.overlapCount} distinct overlap ${r.overlapCount===1?'unit':'units'} · ${esc(intensityLabel(r.intensity))} directness<br><span style="color:#cdd5df">Click for evidence and program details</span>`;
    tooltip.classList.add('show'); moveTooltip(e);
  }
  function moveTooltip(e){tooltip.style.left=`${Math.min(e.clientX+16,window.innerWidth-270)}px`;tooltip.style.top=`${Math.min(e.clientY+16,window.innerHeight-120)}px`;}
  function hideTooltip(){tooltip.classList.remove('show');}

  function getProgramsForUnits(units){
    const names=[];
    units.forEach(u=>[...u.azPrograms,...u.bmsPrograms].forEach(n=>names.push(canonical(n))));
    return [...new Set(names)].map(n=>programsByName.get(n)).filter(Boolean);
  }
  function renderUnitCards(units){
    if(!units.length){unitGrid.innerHTML='<div class="empty-state">No distinct overlap units were coded for this chart cell.</div>';return;}
    unitGrid.innerHTML=units.map(u=>`
      <button class="unit-card ${selectedUnitId===u.id?'active':''}" data-unit-id="${esc(u.id)}" type="button">
        <div class="unit-top"><span class="unit-name">${esc(u.unit)}</span><span class="directness d${u.directness}">${esc(intensityLabel(u.directness))}</span></div>
        <p>${esc(u.rationale)}</p>
        <div class="program-chips">
          ${u.azPrograms.map(p=>`<span class="chip az">AZ · ${esc(p)}</span>`).join('')}
          ${u.bmsPrograms.map(p=>`<span class="chip bms">BMS · ${esc(p)}</span>`).join('')}
        </div>
      </button>`).join('');
    unitGrid.querySelectorAll('.unit-card').forEach(btn=>btn.addEventListener('click',()=>selectUnit(btn.dataset.unitId)));
  }
  function selectUnit(id){
    selectedUnitId = selectedUnitId===id ? null : id;
    const units=unitsByCell.get(selectedCell)||[];
    renderUnitCards(units);
    currentPrograms=getProgramsForUnits(selectedUnitId?units.filter(u=>u.id===selectedUnitId):units);
    renderPrograms(); renderBenchmarks(selectedUnitId?units.filter(u=>u.id===selectedUnitId):units);
  }
  function renderPrograms(){
    const q=searchInput.value.trim().toLowerCase();
    const rows=currentPrograms.filter(p=>!q||[p.company,p.program,p.stage,p.modality,p.representativeIndications,p.overlapIndication,p.clinicalSetting,p.trialId].join(' ').toLowerCase().includes(q));
    if(!rows.length){tableBody.innerHTML='<tr><td colspan="10"><div class="empty-state">No matching program details. Clear the search or select another overlap unit.</div></td></tr>';return;}
    rows.sort((a,b)=>(a.company.localeCompare(b.company)||a.program.localeCompare(b.program)));
    tableBody.innerHTML=rows.map(p=>`
      <tr>
        <td><span class="company-pill ${companyClass(p.company)}">${p.company==='AstraZeneca'?'AZ':'BMS'}</span></td>
        <td><strong>${esc(p.program)}</strong><div class="muted">${esc(p.modality)}</div></td>
        <td><span class="stage-pill">${esc(p.trialStage||p.stage)}</span></td>
        <td>${p.trialId?`<strong>${esc(p.trialName)}</strong><br><a class="source-link" href="${esc(p.trialUrl)}" target="_blank" rel="noopener">${esc(p.trialId)} ↗</a>`:`<span class="muted">Pipeline snapshot only</span>`}</td>
        <td>${esc(p.potentialLaunchIndication||p.representativeIndications)}</td>
        <td>${esc(p.clinicalSetting||'See pipeline source')}</td>
        <td class="nowrap">${esc(p.primaryCompletion||'Not mapped')}</td>
        <td class="nowrap">${esc(p.illustrativeLaunchWindow||'Not estimated')}${p.primaryCompletion?'<div class="muted">illustrative</div>':''}</td>
        <td>${esc(p.historicalSales)}</td>
        <td><a class="source-link" href="${esc(p.sourceUrl)}" target="_blank" rel="noopener">Pipeline ↗</a>${p.detailNote?`<div class="muted">${esc(p.detailNote)}</div>`:''}</td>
      </tr>`).join('');
  }
  function renderBenchmarks(units){
    const unitNames=new Set(units.map(u=>u.unit));
    let benchmarks=D.commercialBenchmarks.filter(b=>unitNames.has(b.overlapUnit));
    if(!benchmarks.length && selectedCell){
      const area=(D.plot.find(p=>p.cellId===selectedCell)||{}).diseaseArea;
      benchmarks=D.commercialBenchmarks.filter(b=>b.diseaseArea===area);
    }
    benchmarkSection.hidden=!benchmarks.length;
    benchmarkGrid.innerHTML=benchmarks.map(b=>`
      <div class="benchmark">
        <div class="label">${esc(b.product)} · ${esc(String(b.year))}</div>
        <div class="value">${formatRevenue(b.worldwideRevenue)}</div>
        <div class="basis">${esc(b.basis)}</div>
        <div class="note">${esc(b.relevance)} ${esc(b.limitations)}</div>
        <a href="${esc(b.sourceUrl)}" target="_blank" rel="noopener">Company source ↗</a>
      </div>`).join('');
  }
  function updateSelectedBubble(){
    document.querySelectorAll('.bubble').forEach(b=>b.classList.toggle('selected',b.dataset.cellId===selectedCell));
  }
  function selectCell(cellId,scroll=false){
    hideTooltip();
    selectedCell=cellId; selectedUnitId=null; searchInput.value='';
    const r=D.plot.find(p=>p.cellId===cellId);
    if(!r)return;
    const units=unitsByCell.get(cellId)||[];
    detailTitle.textContent=`${r.plotLabel} · ${factorShort(r.factor)}`;
    detailMeta.textContent=units.length?`${units.length} distinct overlap ${units.length===1?'unit':'units'} · ${r.relationship}`:'No coded overlap in this dimension';
    detailBadge.textContent=`${intensityLabel(r.intensity)} directness`;
    detailBadge.style.opacity=r.intensity?1:.5;
    renderUnitCards(units);
    currentPrograms=getProgramsForUnits(units);
    renderPrograms(); renderBenchmarks(units); updateSelectedBubble();
    history.replaceState(null,'',`#details/${r.diseaseSlug}/${r.factorSlug}`);
    if(scroll) document.getElementById('details').scrollIntoView({behavior:'smooth',block:'start'});
    window.setTimeout(hideTooltip, scroll ? 650 : 0);
  }
  function initialCell(){
    const parts=location.hash.split('/');
    if(parts[0]==='#details'&&parts.length>=3){
      const id=`${parts[1]}--${parts[2]}`;
      if(D.plot.some(p=>p.cellId===id&&p.overlapCount>0))return id;
    }
    return D.plot.find(p=>p.diseaseArea==='Solid-tumor oncology'&&p.factor==='Shared indications').cellId;
  }
  function renderSources(){
    const list=document.getElementById('source-list');
    list.innerHTML=D.sources.map(s=>`<li><div><a class="source-name" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a></div><div>${esc(s.date)}</div><div class="source-use">${esc(s.use)}</div></li>`).join('');
  }
  searchInput.addEventListener('input',renderPrograms);
  renderChart(); renderSources(); selectCell(initialCell(),false);
})();
