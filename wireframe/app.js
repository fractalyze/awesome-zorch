/* awesome-zorch wireframe — shared chrome + rendering. Vanilla, no modules/fetch (must run from file://). */
(function () {
  const RAW = window.__AZ_DATA__ || { entries: {}, boards: [], profiles: [], results: [] };
  const BROWSABLE = ["Hash", "PCS", "Argument", "Folding", "Primitive"];
  const D = {
    entries: RAW.entries, boards: RAW.boards, profiles: RAW.profiles, results: RAW.results, browsable: BROWSABLE,
    get(id){ return RAW.entries[id]; },
    list(cat){ return Object.entries(RAW.entries).filter(([,v]) => v.category===cat).map(([id,v]) => ({ id, ...v })); },
    all(){ return Object.entries(RAW.entries).map(([id,v]) => ({ id, ...v })); },
    browsableSchemes(){ return this.all().filter(e => BROWSABLE.includes(e.category)); },
    catalog(){ return this.all().filter(e => BROWSABLE.includes(e.category) || e.category === "Implementation"); },
  };
  const $ = (sel, root=document) => root.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;" }[c]));
  const PLAIN = ["Field","Arithmetization"]; // no detail page — render as text

  const NAV = [
    ["index.html","Home","home"], ["implementations.html","Implementations","implementations"],
    ["schemes.html","Schemes","schemes"], ["leaderboard.html","Leaderboard","leaderboard"],
    ["contribute.html","Contribute","contribute"],
  ];
  const STAR = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.8 5.9 21.4l1.4-6.8L2.2 9.9l6.9-.8z"/></svg>';
  const GH = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.9 10.9c.6.1.8-.2.8-.5v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z"/></svg>';

  function chrome() {
    const page = document.body.dataset.page || "";
    const links = NAV.map(([h,l,k]) => `<a class="link hideable ${k===page?"active":""}" href="${h}">${l}</a>`).join("");
    document.body.insertAdjacentHTML("afterbegin",
      `<div class="mocknote">Wireframe mock · sample data · not a live site</div>
       <header class="site"><div class="wrap nav">
         <a class="brand" href="index.html"><span class="logo"></span>awesome-zorch</a>${links}
         <span class="spacer"></span><a class="btn gh" href="#">${GH} Sign in with GitHub</a>
       </div></header>`);
    document.body.insertAdjacentHTML("beforeend",
      `<footer class="site"><div class="wrap row">
         <span>awesome-zorch — a community hub for ZK schemes &amp; implementations.</span>
         <span class="spacer"></span><a href="#">Data repo</a><a href="../schema.md">Schema</a><a href="../design.md">Spec</a>
       </div></footer>`);
  }

  /* ---------- shared bits ---------- */
  const stars = (n) => n==null?"":`<span class="stars muted small">${STAR} ${n}</span>`;
  const detailHref = (id) => (D.get(id).category==="Implementation"?"implementation.html":"scheme.html")+"?id="+encodeURIComponent(id);
  const nameOf = (id) => (D.get(id)||{}).name || id;
  function link(id){ const e=D.get(id); if(!e) return `<span class="muted">${esc(id)}</span>`;
    return PLAIN.includes(e.category) ? esc(e.name) : `<a href="${detailHref(id)}">${esc(e.name)}</a>`; }
  const pq = (impl) => impl.pcs ? !!D.get(impl.pcs).post_quantum : false;
  const shuffle = (a) => { a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };

  function fmt(v, unit) {
    if (v == null) return "—";
    if (unit === "KB" && v < 1) return Math.round(v*1000) + " B";
    if (["ms","MB","MH/s","kHz"].includes(unit)) return (v>=100?Math.round(v):v) + " " + unit;
    return v + " " + unit;
  }

  function papersFor(e) {
    const out = [], add = (links, src) => (links||[]).forEach(u => out.push({u, src}));
    add(e.paper_links, e.name);
    ["pcs","hash","folding"].forEach(k => { if (e[k]) add(D.get(e[k]).paper_links, D.get(e[k]).name); });
    (e.arguments||[]).forEach(a => add(D.get(a).paper_links, D.get(a).name));
    const seen = new Set(); return out.filter(p => seen.has(p.u)?false:(seen.add(p.u),true));
  }

  function barChart(rows, col, subjLabel) {
    const vals = rows.map(r => r[col.key]).filter(v => v!=null);
    const max = Math.max(...vals, 1);
    const bars = rows.map((r,i) => {
      const v = r[col.key], w = Math.max(3, Math.round((v/max)*100));
      const label = subjLabel(r);
      return `<div class="bar-row" title="${esc(label)}: ${esc(fmt(v,col.unit))}">
        <div class="bar-label">${esc(label)}${i===0?' <span class="best-pill">best</span>':''}</div>
        <div class="bar-track"><div class="bar${i===0?' win':''}" style="width:${w}%"></div>
          <span class="bar-val">${esc(fmt(v,col.unit))}</span></div>
      </div>`;
    }).join("");
    const dir = col.lower ? "shorter is better" : "longer is better";
    return `<div class="chart" role="img" aria-label="${esc(col.label)} comparison">
      ${bars}<div class="chart-cap muted small">${esc(col.label)} (${esc(col.unit)}) · ${dir}</div></div>`;
  }

  /* ---------- cards ---------- */
  function implChips(e){ const p=[e.field&&nameOf(e.field), e.hash&&nameOf(e.hash), e.pcs&&nameOf(e.pcs)].filter(Boolean);
    return `<div class="chips">${p.map(x=>`<span class="chip">${esc(x)}</span>`).join("")}</div>`; }

  function cardFor(e) {
    if (e.category === "Implementation")
      return `<div class="card"><div class="title"><span class="kindpill">${esc(e.kind)}</span>
          <a href="${detailHref(e.id)}">${esc(e.name)}</a></div>
        <p class="desc">${esc(e.description)}</p>${implChips(e)}
        <div class="meta">${stars(e.github_stars)}${e.license?`<span>${esc(e.license)}</span>`:""}
          ${e.languages?`<span>${esc(e.languages[0])}</span>`:""}${e.updated_at?`<span>updated ${esc(e.updated_at)}</span>`:""}</div></div>`;
    return `<div class="card"><div class="title"><span class="chip k cat">${esc(e.category)}</span>
        <a href="${detailHref(e.id)}">${esc(e.name)}</a>
        ${e.status==="coming-soon"?'<span class="chip soon">coming soon</span>':''}</div>
      <p class="desc">${esc(e.description)}</p>${schemeChips(e)}<div class="meta">${stars(e.github_stars)}</div></div>`;
  }
  function schemeChips(e) {
    const c = [];
    if (e.category==="PCS"){ c.push(e.assumption, e.setup_type, e.polynomial_type, reqLabel(e.field_requirement));
      if (e.post_quantum) c.push({t:"post-quantum",pq:true}); }
    else if (e.category==="Hash") c.push(e.arithmetization_friendly?"algebraic":"bit-oriented", e.construction);
    else if (e.category==="Argument") c.push(e.relation, e.technique);
    else if (e.category==="Folding" && e.decider) c.push("decider: "+nameOf(e.decider));
    else if (e.category==="Primitive") c.push(e.benchmarkable?"benchmarkable":"not-yet-benchmarkable");
    return `<div class="chips">${c.filter(Boolean).map(x =>
      typeof x==="object"?`<span class="chip pq">${esc(x.t)}</span>`:`<span class="chip">${esc(x)}</span>`).join("")}</div>`;
  }
  const REQ = { FieldAgnostic:"field-agnostic", PairingCurve:"needs pairing curve",
    PrimeOrderGroup:"needs prime-order group", Lattice:"needs lattice" };
  const reqLabel = (r) => r ? REQ[r] || r : null;

  /* ---------- HOME ---------- */
  function renderHome() {
    const root = $("#app");
    const catalog = D.catalog();
    const recent = catalog.filter(e=>e.updated_at).sort((a,b)=> a.updated_at<b.updated_at?1:-1).slice(0,4);
    const trending = catalog.slice().sort((a,b)=> (b.github_stars||0)-(a.github_stars||0)).slice(0,4);
    const boards = shuffle(D.boards.filter(b=>b.active)).slice(0,3);

    const teaser = (b) => {
      const prof = D.profiles.find(p=>p.board===b.id);
      const col = prof.columns.find(c=>c.primary);
      const rows = D.results.filter(r=>r.profile===prof.id)
        .sort((a,b2)=> col.lower? a[col.key]-b2[col.key] : b2[col.key]-a[col.key]).slice(0,3);
      return `<div class="card"><div class="title"><a href="leaderboard.html?board=${b.id}">${esc(b.label)} leaderboard →</a></div>
        <table><tbody>${rows.map((r,i)=>`<tr><td class="rank ${i===0?"top":""}">#${i+1}</td>
          <td>${r.variant?esc(r.variant):link(r.subject)}</td><td class="num">${fmt(r[col.key],col.unit)}</td></tr>`).join("")}</tbody></table>
        <div class="small muted">${esc(col.label)} · ${esc(prof.field_class)} · ${esc(prof.degree)} · ${esc(prof.device)}</div></div>`;
    };

    root.innerHTML = `
      <section class="hero wrap">
        <h1>The cryptography community building the future.</h1>
        <p class="sub">The platform where the ZK community collaborates on schemes, implementations,
          and benchmarks. Zorch takes your research idea to production — fast.</p>
        <div class="ctas"><a class="btn primary" href="implementations.html">Explore implementations</a>
          <a class="btn" href="contribute.html">Contribute</a></div>
      </section>
      <section class="block wrap">
        <div class="section-head"><h2>Latest</h2></div>
        <div class="tabs" id="home-tabs"><button class="active" data-t="recent">Recently added</button>
          <button data-t="trending">Trending</button></div>
        <div class="grid" id="home-list"></div>
      </section>
      <section class="block wrap">
        <div class="section-head"><h2>Leaderboards <span class="muted small">(random pick — refresh for others)</span></h2>
          <a href="leaderboard.html">View all →</a></div>
        <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">${boards.map(teaser).join("")}</div>
      </section>
      <section class="block wrap"><div class="callout">
        <b>Add your implementation.</b> The catalog is a data-only GitHub repo — open a PR with your entry
        and it shows up here. Benchmarks run on a hidden test set, so you submit the implementation, never
        the numbers. <a href="contribute.html">How it works →</a></div></section>`;

    const list = $("#home-list");
    const draw = (w) => list.innerHTML = (w==="recent"?recent:trending).map(cardFor).join("");
    draw("recent");
    $("#home-tabs").addEventListener("click", (ev) => { const b=ev.target.closest("button"); if(!b) return;
      $("#home-tabs .active").classList.remove("active"); b.classList.add("active"); draw(b.dataset.t); });
  }

  /* ---------- BROWSE ---------- */
  function renderBrowse(mode) {
    const root = $("#app"); const isImpl = mode==="impl";
    const items = isImpl ? D.list("Implementation") : D.browsableSchemes();
    const groups = isImpl ? [
      { key:"kind",  title:"Kind",  opts:["Zkvm","Snark","Accumulation"], get:e=>[e.kind] },
      { key:"field", title:"Field", opts:[...new Set(items.map(e=>nameOf(e.field)))], get:e=>[nameOf(e.field)] },
      { key:"pq",    title:"Security", opts:["post-quantum"], get:e=>pq(e)?["post-quantum"]:[] },
    ] : [
      { key:"cat",  title:"Category", opts:D.browsable, get:e=>[e.category] },
      { key:"req",  title:"Field requirement", opts:Object.values(REQ), get:e=> e.field_requirement?[reqLabel(e.field_requirement)]:[] },
      { key:"setup",title:"PCS setup", opts:["Transparent","UniversalTrusted"], get:e=> e.setup_type?[e.setup_type]:[] },
      { key:"poly", title:"Polynomial", opts:["Univariate","Multilinear"], get:e=> e.polynomial_type?[e.polynomial_type]:[] },
      { key:"pq",   title:"Security", opts:["post-quantum"], get:e=> e.post_quantum?["post-quantum"]:[] },
    ];
    const state = {}; groups.forEach(g=> state[g.key]=new Set());
    root.innerHTML = `
      <section class="block wrap">
        <div class="section-head"><h2>${isImpl?"Implementations":"Schemes"}</h2>
          ${isImpl?"":'<span class="muted small">Filter by what your SNARK needs, then combine.</span>'}</div>
        <div class="browse">
          <aside class="filters">
            <input class="select" id="search" placeholder="Search…">
            ${groups.map(g=>`<div class="filter-group"><h4>${g.title}</h4>
              ${g.opts.map(o=>`<label><input type="checkbox" data-g="${g.key}" value="${esc(o)}">${esc(o)}</label>`).join("")}</div>`).join("")}
          </aside>
          <div><div class="result-count" id="count"></div><div class="grid" id="list"></div></div>
        </div></section>`;
    const listEl=$("#list"), countEl=$("#count"), search=$("#search");
    function apply(){
      const q=search.value.trim().toLowerCase();
      const out=items.filter(e=>{
        if(q && !(e.name.toLowerCase().includes(q) || (e.description||"").toLowerCase().includes(q))) return false;
        return groups.every(g=>{ const sel=state[g.key]; if(!sel.size) return true; return g.get(e).some(v=>sel.has(v)); });
      });
      countEl.textContent = `${out.length} ${isImpl?"implementations":"schemes"}`;
      listEl.innerHTML = out.length ? out.map(cardFor).join("") : `<p class="muted">No matches.</p>`;
    }
    root.querySelectorAll('input[type=checkbox]').forEach(cb=> cb.addEventListener("change",()=>{
      const s=state[cb.dataset.g]; cb.checked?s.add(cb.value):s.delete(cb.value); apply(); }));
    search.addEventListener("input", apply); apply();
  }

  /* ---------- LEADERBOARD ---------- */
  function renderLeaderboard() {
    const root = $("#app");
    const wanted = new URLSearchParams(location.search).get("board");
    let boardId = (D.boards.find(b=>b.id===wanted) || D.boards.find(b=>b.active)).id;
    const AXES = [["field_class","Field"],["degree","Degree / size"],["device","Device"]];
    const sel = {};

    root.innerHTML = `
      <section class="block wrap"><div class="section-head"><h2>Leaderboard</h2></div>
        <div class="lb">
          <aside class="lb-nav" id="lb-nav">${D.boards.map(b=>`
            <button class="lb-board ${b.id===boardId?"active":""} ${b.active?"":"soon"}" data-b="${b.id}">
              ${esc(b.label)}${b.active?"":' <span class="chip soon">soon</span>'}</button>`).join("")}</aside>
          <div id="lb-main"></div>
        </div></section>`;

    function initSel(){ const first=D.profiles.find(p=>p.board===boardId);
      AXES.forEach(([k])=> sel[k]= first?first[k]:null); }

    function drawMain(){
      const board = D.boards.find(b=>b.id===boardId);
      const main = $("#lb-main");
      if(!board.active){ main.innerHTML = `<div class="callout"><b>${esc(board.label)} — coming soon.</b> ${esc(board.gate||board.note||"")}</div>`; return; }
      const profs = D.profiles.filter(p=>p.board===boardId);
      const controls = AXES.map(([k,label])=>{
        const opts=[...new Set(profs.map(p=>p[k]))];
        if(opts.length<=1) return `<span class="chip">${esc(label)}: ${esc(opts[0]||"—")}</span>`;
        return `<label class="ctl">${esc(label)}
          <select data-axis="${k}">${opts.map(o=>`<option ${o===sel[k]?"selected":""}>${esc(o)}</option>`).join("")}</select></label>`;
      }).join("");
      const prof = profs.find(p=> AXES.every(([k])=> p[k]===sel[k]));
      const body = prof ? renderBoard(prof, board) :
        `<p class="muted" style="margin-top:14px">No benchmark for this combination yet.</p>`;
      main.innerHTML = `<div class="board-controls">${controls}</div>${body}`;
      main.querySelectorAll("select[data-axis]").forEach(s=> s.addEventListener("change",()=>{
        sel[s.dataset.axis]=s.value; drawMain(); }));
    }

    function renderBoard(prof, board){
      const col=prof.columns.find(c=>c.primary);
      const rows=D.results.filter(r=>r.profile===prof.id).sort((a,b)=> col.lower? a[col.key]-b[col.key] : b[col.key]-a[col.key]);
      const subjLabel=(r)=> r.variant? r.variant : nameOf(r.subject);
      const head=`<th>#</th><th>${board.id==="Zkvm"||board.id==="Sumcheck"?"Entry":"Scheme"}</th>`+
        prof.columns.map(c=>`<th>${esc(c.label)} <span class="muted">(${esc(c.unit)})</span></th>`).join("");
      const tbody=rows.map((r,i)=>`<tr><td class="rank ${i===0?"top":""}">#${i+1}</td>
        <td>${r.variant?`${link(r.subject)} <span class="muted small">${esc(r.variant)}</span>`:link(r.subject)}</td>
        ${prof.columns.map(c=>`<td class="num">${fmt(r[c.key],c.unit)}</td>`).join("")}</tr>`).join("");
      return `
        <div class="context-line small muted">Device <b>${esc(prof.device)}</b> · Field <b>${esc(prof.field_class)}</b>
          · Size <b>${esc(prof.degree)}</b> · 128-bit security</div>
        ${barChart(rows, col, subjLabel)}
        <div class="tablewrap"><table><thead><tr>${head}</tr></thead><tbody>${tbody}</tbody></table></div>
        <div class="panel" style="margin-top:16px"><h3>How this is measured</h3>
          <p class="small muted" style="margin:0">${esc(board.methodology)} Numbers are produced server-side on a
          hidden test set — contributors submit implementations, not scores.</p></div>`;
    }

    $("#lb-nav").addEventListener("click",(ev)=>{ const b=ev.target.closest("button.lb-board"); if(!b) return;
      $("#lb-nav .active")?.classList.remove("active"); b.classList.add("active"); boardId=b.dataset.b; initSel(); drawMain(); });
    initSel(); drawMain();
  }

  /* ---------- DETAIL: implementation (README left, metadata right) ---------- */
  function renderImplDetail() {
    const root=$("#app");
    const id=new URLSearchParams(location.search).get("id")||"impl/sp1-zorch";
    const e=D.get(id); if(!e){ root.innerHTML=`<div class="wrap block">Unknown entry.</div>`; return; }

    const nodes=[];
    (e.arguments||[]).forEach(a=>nodes.push(["Argument",a]));
    if(e.folding) nodes.push(["Folding",e.folding]);
    if(e.pcs) nodes.push(["PCS",e.pcs]);
    if(e.hash) nodes.push(["Hash",e.hash]);
    const graph = nodes.length ? nodes.map(([layer,nid],i)=>`${i?'<div class="arrow">↓</div>':''}
      <div class="node"><span class="layer">${layer}</span>${link(nid)}</div>`).join("")
      : `<span class="muted small">No composable primitives declared.</span>`;

    const benches=D.results.filter(r=>r.subject===id);
    const benchTable=benches.map(r=>{ const p=D.profiles.find(x=>x.id===r.profile);
      return `<tr><td>${esc(D.boards.find(b=>b.id===p.board).label)} · ${esc(p.degree)}</td>
        ${p.columns.map(c=>`<td class="num">${fmt(r[c.key],c.unit)}</td>`).join("")}</tr>`; }).join("");
    const papers=papersFor(e);

    root.innerHTML=`
      <div class="wrap">
        <div class="detail-head"><div class="grow">
          <div class="chips" style="margin-bottom:8px"><span class="kindpill">${esc(e.kind)}</span>
            ${e.trace_layout?`<span class="chip">trace: ${esc(e.trace_layout)}</span>`:""}
            ${pq(e)?`<span class="chip pq">post-quantum</span>`:""}</div>
          <h1>${esc(e.name)}</h1><p class="muted">${esc(e.description)}</p>
          <div class="chips">${stars(e.github_stars)}${e.license?`<span class="chip">${esc(e.license)}</span>`:""}
            ${(e.languages||[]).map(l=>`<span class="chip">${esc(l)}</span>`).join("")}</div></div>
          <a class="btn" href="${esc(e.ref.repo)}">${GH} upstream · ${esc(e.ref.version)}</a></div>

        <div class="detail-cols">
          <div>
            <div class="panel readme">
              <h2>${esc(e.name)}</h2><p>${esc(e.description)}</p>
              <p class="small muted">On the live site this panel renders the upstream README from
                <a href="${esc(e.ref.repo)}">${esc(e.ref.repo.replace("https://github.com/",""))}</a>${e.pypi?` · PyPI <code>${esc(e.pypi.name)}</code>`:""}.</p>
              ${e.pypi?`<pre>pip install ${esc(e.pypi.name)}</pre>`:""}
            </div>
            <div class="panel"><h3>Benchmarks</h3>
              ${benches.length?`<div class="tablewrap"><table><thead><tr><th>Profile</th>
                ${D.profiles.find(x=>x.id===benches[0].profile).columns.map(c=>`<th>${esc(c.label)}</th>`).join("")}</tr></thead>
                <tbody>${benchTable}</tbody></table></div>`:`<p class="muted">No benchmarks on record yet.</p>`}
              <p class="small muted" style="margin-top:10px">Run server-side on a hidden test set — device &amp;
                size shown per row. See the <a href="leaderboard.html?board=${e.kind==="Zkvm"?"Zkvm":"PCS"}">leaderboard</a>.</p></div>
          </div>
          <aside>
            <div class="panel"><h3>Metadata</h3><dl class="kv">
              <dt>Kind</dt><dd>${esc(e.kind)}</dd>
              <dt>Upstream</dt><dd><a href="${esc(e.ref.repo)}">${esc(e.ref.version)}</a></dd>
              <dt>Field</dt><dd>${e.field?esc(nameOf(e.field)):"—"}</dd>
              <dt>Arithmetization</dt><dd>${e.arithmetization?esc(nameOf(e.arithmetization)):"—"}</dd>
              ${e.trace_layout?`<dt>Trace layout</dt><dd>${esc(e.trace_layout)}</dd>`:""}
              ${e.trusted_setup?`<dt>Trusted setup</dt><dd>${esc(e.trusted_setup)}</dd>`:""}
              <dt>Security</dt><dd>${esc((e.parameters||{}).security_bits)}-bit</dd>
              <dt>License</dt><dd>${esc(e.license||"—")}</dd></dl>
              ${e.setup_note?`<p class="small muted" style="margin:10px 0 0">${esc(e.setup_note)}</p>`:""}</div>

            <div class="panel"><h3>Composition</h3><div class="stack">${graph}</div>
              ${e.decider?`<p class="small muted" style="margin:10px 0 0">Decider: ${link(e.decider)}</p>`:""}</div>

            ${e.pypi?`<div class="panel"><h3>Install (PyPI)</h3>
              <pre class="codeblock" style="margin:0">pip install ${esc(e.pypi.name)}</pre>
              <p class="small muted" style="margin:8px 0 0">${esc(e.pypi.name)} · v${esc(e.pypi.version)}</p></div>`:""}

            <div class="panel"><h3>Papers</h3>
              ${papers.length?papers.map(p=>`<div class="small" style="margin-bottom:6px">
                <a href="${esc(p.u)}">${esc(p.u.replace(/^https?:\/\//,""))}</a>
                <span class="muted"> — ${esc(p.src)}</span></div>`).join("")
                :`<span class="muted small">None linked.</span>`}</div>
          </aside>
        </div></div>`;
  }

  /* ---------- DETAIL: scheme ---------- */
  function renderSchemeDetail() {
    const root=$("#app");
    const id=new URLSearchParams(location.search).get("id")||"pcs/whir";
    const e=D.get(id); if(!e){ root.innerHTML=`<div class="wrap block">Unknown entry.</div>`; return; }

    const slots=["field","hash","pcs","arithmetization","folding","decider"];
    const usedBy=D.list("Implementation").filter(im=> slots.some(s=>im[s]===id) || (im.arguments||[]).includes(id));
    const papers=papersFor(e);
    const needs=(e.needs&&e.needs.length)?e.needs.map(n=>`<span class="chip k">${esc(n)}</span>`).join(" "):`<span class="muted small">none</span>`;

    const opts = e.category==="Primitive" && e.optimizations ? `
      <div class="panel"><h3>Optimizations</h3><div class="usedby">
        ${e.optimizations.map(o=>`<div><b>${esc(o.name)}</b> <span class="muted small">— ${esc(o.note)}</span>
          ${o.paper?` <a class="small" href="${esc(o.paper)}">paper</a>`:""}</div>`).join("")}</div>
        <p class="small muted" style="margin:10px 0 0">Each registers as a variant on the
          <a href="leaderboard.html?board=Sumcheck">Sumcheck board</a>.</p></div>` : "";

    const gate = e.status==="coming-soon" ? `<div class="callout" style="margin-bottom:16px">
      <b>Benchmarking coming soon.</b> ${esc(e.gate||"")}</div>` : "";

    root.innerHTML=`
      <div class="wrap">
        <div class="detail-head"><div class="grow">
          <div class="chips" style="margin-bottom:8px"><span class="chip k cat">${esc(e.category)}</span>
            ${e.status==="coming-soon"?'<span class="chip soon">coming soon</span>':''}</div>
          <h1>${esc(e.name)}</h1><p class="muted">${esc(e.description)}</p>
          <div class="chips">${stars(e.github_stars)}</div></div></div>
        <div class="detail-cols">
          <div>
            ${gate}
            <div class="panel"><h3>Properties</h3><dl class="kv">${schemePropRows(e)}</dl>
              ${e.setup_note?`<p class="small muted" style="margin:10px 0 0">${esc(e.setup_note)}</p>`:""}</div>
            ${opts}
          </div>
          <aside>
            <div class="panel"><h3>Requires (slots)</h3><div class="chips">${needs}</div>
              ${e.field_requirement?`<p class="small muted" style="margin:10px 0 0">Field: ${esc(reqLabel(e.field_requirement))}</p>`:""}</div>
            <div class="panel"><h3>Papers</h3>${papers.length?papers.map(p=>`<div class="small" style="margin-bottom:6px">
              <a href="${esc(p.u)}">${esc(p.u.replace(/^https?:\/\//,""))}</a></div>`).join("")
              :`<span class="muted small">None linked.</span>`}</div>
            <div class="panel"><h3>Used by</h3><div class="usedby">${usedBy.length?usedBy.map(im=>
              `<a href="${detailHref(im.id)}"><span class="kindpill">${esc(im.kind)}</span> ${esc(im.name)}</a>`).join("")
              :`<span class="muted small">No implementations yet.</span>`}</div></div>
          </aside>
        </div></div>`;
  }

  function schemePropRows(e){
    const row=(k,v)=>`<dt>${k}</dt><dd>${v}</dd>`;
    if(e.category==="PCS") return [
      row("Assumption",esc(e.assumption)), row("Post-quantum", e.post_quantum?'<span class="chip pq">yes</span>':"no"),
      row("Setup",esc(e.setup_type)), row("Field requirement", esc(reqLabel(e.field_requirement))),
      row("Polynomial",esc(e.polynomial_type)), row("Homomorphic", e.homomorphic?"yes":"no"),
      row("Hiding / Binding", `${esc(e.hiding)} / ${esc(e.binding)}`),
      row("Prover",`<span class="mono">${esc(e.prover_complexity)}</span>`),
      row("Verifier",`<span class="mono">${esc(e.verifier_complexity)}</span>`),
      row("Proof size",`<span class="mono">${esc(e.proof_size_class)}</span>`),
    ].join("");
    if(e.category==="Hash") return [
      row("Arithmetization-friendly", e.arithmetization_friendly?"yes (algebraic)":"no (bit-oriented)"),
      row("Construction",esc(e.construction)), row("Field requirement", esc(reqLabel(e.field_requirement))) ].join("");
    if(e.category==="Argument") return [ row("Relation",esc(e.relation)), row("Technique",esc(e.technique)) ].join("");
    if(e.category==="Folding") return row("Decider", e.decider?link(e.decider):"—");
    if(e.category==="Primitive") return [ row("Benchmarkable", e.benchmarkable?"yes":"not yet"),
      e.status?row("Status", esc(e.status)):"" ].join("");
    return "";
  }

  document.addEventListener("DOMContentLoaded",()=>{ chrome();
    ({ home:renderHome, implementations:()=>renderBrowse("impl"), schemes:()=>renderBrowse("scheme"),
       leaderboard:renderLeaderboard, implementation:renderImplDetail, scheme:renderSchemeDetail,
       contribute:()=>{} }[document.body.dataset.page]||(()=>{}))(); });
})();
