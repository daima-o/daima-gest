import { useState, useMemo, useRef, useCallback, useEffect } from "react";

// ─── SVG ICONS App Store style ────────────────────────────────────────────────
const IC = {
  clients: (on) => <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><circle cx="10" cy="8" r="3.8" stroke={on?"#007AFF":"#8E8E93"} strokeWidth="1.7"/><path d="M2.5 22c0-4.142 3.358-7.5 7.5-7.5s7.5 3.358 7.5 7.5" stroke={on?"#007AFF":"#8E8E93"} strokeWidth="1.7" strokeLinecap="round"/><circle cx="19" cy="9.5" r="2.8" stroke={on?"#007AFF":"#8E8E93"} strokeWidth="1.5"/><path d="M22.5 20c0-3.038-2.462-5.5-5.5-5.5" stroke={on?"#007AFF":"#8E8E93"} strokeWidth="1.5" strokeLinecap="round"/></svg>,
  stock:   (on) => <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><rect x="3" y="15" width="6" height="8" rx="1.5" stroke={on?"#007AFF":"#8E8E93"} strokeWidth="1.7"/><rect x="10" y="10" width="6" height="13" rx="1.5" stroke={on?"#007AFF":"#8E8E93"} strokeWidth="1.7"/><rect x="17" y="4" width="6" height="19" rx="1.5" stroke={on?"#007AFF":"#8E8E93"} strokeWidth="1.7"/></svg>,
  stats:   (on) => <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M4 21L10 14L14.5 18L22 9" stroke={on?"#007AFF":"#8E8E93"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="14" r="1.8" fill={on?"#007AFF":"#8E8E93"}/><circle cx="14.5" cy="18" r="1.8" fill={on?"#007AFF":"#8E8E93"}/><circle cx="22" cy="9" r="1.8" fill={on?"#007AFF":"#8E8E93"}/></svg>,
  infos:   (on) => <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><circle cx="13" cy="13" r="10" stroke={on?"#007AFF":"#8E8E93"} strokeWidth="1.7"/><line x1="13" y1="11.5" x2="13" y2="18.5" stroke={on?"#007AFF":"#8E8E93"} strokeWidth="1.9" strokeLinecap="round"/><circle cx="13" cy="8.5" r="1.1" fill={on?"#007AFF":"#8E8E93"}/></svg>,
  ajouter: (on) => <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><circle cx="13" cy="13" r="10" stroke={on?"#007AFF":"#8E8E93"} strokeWidth="1.7"/><line x1="13" y1="8" x2="13" y2="18" stroke={on?"#007AFF":"#8E8E93"} strokeWidth="1.9" strokeLinecap="round"/><line x1="8" y1="13" x2="18" y2="13" stroke={on?"#007AFF":"#8E8E93"} strokeWidth="1.9" strokeLinecap="round"/></svg>,
};

const TABS = [
  { id:"clients", label:"Clients" },
  { id:"stock",   label:"Stock"   },
  { id:"stats",   label:"Stats"   },
  { id:"infos",   label:"Infos"   },
  { id:"ajouter", label:"Ajouter" },
];

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const COUT_PUFF = 5.33;
const PRIX_VENTE = 10;
const ESSENCE_TYPES = ["SP95","SP98","E10","Diesel"];
const FLAVOR_COLORS = ["#34C759","#FF3B30","#FF9500","#FFCC00","#AF52DE","#FF6B35","#007AFF","#FF2D55","#5AC8FA","#4CD964"];

const DEFAULT_FLAVORS = [
  { id:"pomme",     label:"Pomme",     color:"#34C759", bg:"#F0FDF4", emoji:"🍎" },
  { id:"fraise",    label:"Fraise",    color:"#FF3B30", bg:"#FFF1F0", emoji:"🍓" },
  { id:"mangue",    label:"Mangue",    color:"#FF9500", bg:"#FFF7ED", emoji:"🥭" },
  { id:"citron",    label:"Citron",    color:"#FFCC00", bg:"#FEFCE8", emoji:"🍋" },
  { id:"framboise", label:"Framboise", color:"#AF52DE", bg:"#FAF5FF", emoji:"🫐" },
  { id:"peche",     label:"Pêche",     color:"#FF6B35", bg:"#FFF5F0", emoji:"🍑" },
];

const initClients = [
  { id:1, prenom:"Sophie", snap:"sophiem", telephone:"06 12 34 56 78", adresse:"12 rue de la Paix, Paris", dateInscription:"2024-04-01", commandes:[{id:1,date:"2024-04-03",gout:"pomme",quantite:2,livraison:false},{id:2,date:"2024-04-10",gout:"fraise",quantite:1,livraison:true},{id:3,date:"2024-04-22",gout:"pomme",quantite:1,livraison:false}], parrainageFait:[2,3,4,5], parrainePar:null, relance1:true, produit5Offert:false, relance2:false, produitGratuitOffert:false },
  { id:2, prenom:"Thomas", snap:"tleroux", telephone:"07 23 45 67 89", adresse:"5 avenue Victor Hugo, Lyon", dateInscription:"2024-04-05", commandes:[{id:1,date:"2024-04-08",gout:"mangue",quantite:1,livraison:false},{id:2,date:"2024-04-28",gout:"mangue",quantite:2,livraison:true}], parrainageFait:[5], parrainePar:1, relance1:false, produit5Offert:false, relance2:false, produitGratuitOffert:false },
  { id:3, prenom:"Camille", snap:"camille_d", telephone:"06 34 56 78 90", adresse:"", dateInscription:"2024-04-05", commandes:[], parrainageFait:[], parrainePar:1, relance1:false, produit5Offert:false, relance2:false, produitGratuitOffert:false },
  { id:4, prenom:"Julien", snap:"julienb07", telephone:"07 45 67 89 01", adresse:"8 boulevard Haussmann, Paris", dateInscription:"2024-04-08", commandes:[{id:1,date:"2024-04-15",gout:"citron",quantite:2,livraison:false}], parrainageFait:[], parrainePar:1, relance1:false, produit5Offert:false, relance2:false, produitGratuitOffert:false },
  { id:5, prenom:"Marie", snap:"mariefont", telephone:"06 56 78 90 12", adresse:"", dateInscription:"2024-04-08", commandes:[{id:1,date:"2024-04-20",gout:"framboise",quantite:1,livraison:true}], parrainageFait:[], parrainePar:2, relance1:false, produit5Offert:false, relance2:false, produitGratuitOffert:false },
];
const initStock = Object.fromEntries(DEFAULT_FLAVORS.map(f=>[f.id,8]));

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getWeekKey(ds){const d=new Date(ds);const day=d.getDay()||7;d.setDate(d.getDate()+4-day);const j=new Date(d.getFullYear(),0,1);const w=Math.ceil(((d-j)/86400000+1)/7);return`${d.getFullYear()}-W${String(w).padStart(2,"0")}`;}
function weekLabel(key){if(!key)return"";const[year,w]=key.split("-W");const j=new Date(parseInt(year),0,1);const days=(parseInt(w)-1)*7;const mon=new Date(j.getTime()+(days-(j.getDay()||7)+1)*86400000);const sun=new Date(mon.getTime()+6*86400000);const f=d=>d.toLocaleDateString("fr-FR",{day:"2-digit",month:"short"});return`${f(mon)} – ${f(sun)}`;}
function allWeeks(clients){const k=new Set();clients.forEach(c=>{k.add(getWeekKey(c.dateInscription));c.commandes.forEach(x=>k.add(getWeekKey(x.date)));});return[...k].sort();}
const cmdCA=cmd=>PRIX_VENTE+(cmd.livraison?5:0);
const cmdBenef=cmd=>(PRIX_VENTE-COUT_PUFF)+(cmd.livraison?5:0);
function lastOrder(cmds){if(!cmds.length)return null;return cmds.reduce((a,b)=>a.date>b.date?a:b);}
function daysSince(ds){return Math.floor((Date.now()-new Date(ds).getTime())/86400000);}
function getFav(cmds,flavors){if(!cmds.length)return null;const c={};cmds.forEach(x=>{c[x.gout]=(c[x.gout]||0)+x.quantite;});const t=Object.entries(c).sort((a,b)=>b[1]-a[1])[0];return t?flavors.find(f=>f.id===t[0]):null;}
function filleulsActifs(client,clients){return client.parrainageFait.filter(id=>{const c=clients.find(x=>x.id===id);return c&&c.commandes.length>0;}).length;}
function fmtDate(s){return new Date(s).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"});}
function score(c,clients){return c.commandes.length*2+filleulsActifs(c,clients)*3;}
function pctColor(v){return v>=60?"#34C759":"#FF3B30";}
function parrStatus(client,clients){
  const a=filleulsActifs(client,clients);
  if(a>=5&&client.produitGratuitOffert)return{color:"#8E8E93",label:"✓ Puff gratuit offert"};
  if(a>=5)return{level:"gratuit",color:"#34C759",label:"🎁 Puff gratuit à offrir !"};
  if(a===4&&client.relance2)return{color:"#8E8E93",label:"✓ Relancé 4/5"};
  if(a===4)return{level:"relance2",color:"#FF9500",label:"⚡ À relancer — 4/5"};
  if(a>=3&&client.produit5Offert)return{color:"#8E8E93",label:"✓ Puff 5€ offert"};
  if(a>=3)return{level:"5eur",color:"#007AFF",label:"🏷 Puff à 5€ à offrir !"};
  if(a===2&&client.relance1)return{color:"#8E8E93",label:"✓ Relancé 2/3"};
  if(a===2)return{level:"relance1",color:"#FF9500",label:"⚡ À relancer — 2/3"};
  return null;
}
function needsAction(c,clients){const a=filleulsActifs(c,clients);return(a===2&&!c.relance1)||(a===4&&!c.relance2);}

// ─── LONG PRESS BUTTON ────────────────────────────────────────────────────────
function Btn({onClick,children,cls,style,disabled}){
  const[p,setP]=useState(false);const t=useRef(null);
  const s=()=>{setP(true);t.current=setTimeout(()=>setP(false),400);};
  const e=()=>{setP(false);if(t.current)clearTimeout(t.current);};
  return<button onClick={onClick} disabled={disabled} onMouseDown={s} onMouseUp={e} onMouseLeave={e} onTouchStart={s} onTouchEnd={e}
    className={cls} style={{...style,transform:p?"scale(0.94)":"scale(1)",opacity:p?0.7:disabled?0.38:1,transition:"transform 0.1s,opacity 0.1s"}}>{children}</button>;
}

// ─── SWIPE BACK ───────────────────────────────────────────────────────────────
function useSwipeBack(cb){
  const sx=useRef(null);const sy=useRef(null);
  return{
    onTouchStart:e=>{const t=e.touches[0];if(t.clientX<35){sx.current=t.clientX;sy.current=t.clientY;}else sx.current=null;},
    onTouchEnd:e=>{if(sx.current===null)return;const t=e.changedTouches[0];const dx=t.clientX-sx.current;const dy=Math.abs(t.clientY-sy.current);if(dx>60&&dy<80)cb();sx.current=null;},
  };
}

// ─── WEEK SELECTOR ────────────────────────────────────────────────────────────
function WeekSel({weeks,cur,onChange}){
  const i=weeks.indexOf(cur);
  return<div className="flex items-center justify-between my-2">
    <Btn onClick={()=>i>0&&onChange(weeks[i-1])} disabled={i===0} cls="w-8 h-8 rounded-full flex items-center justify-center text-xl" style={{color:"#007AFF"}}>‹</Btn>
    <span className="text-xs font-semibold" style={{color:"#3C3C43"}}>{weekLabel(cur)}</span>
    <Btn onClick={()=>i<weeks.length-1&&onChange(weeks[i+1])} disabled={i===weeks.length-1} cls="w-8 h-8 rounded-full flex items-center justify-center text-xl" style={{color:"#007AFF"}}>›</Btn>
  </div>;
}

// ─── MODALS ───────────────────────────────────────────────────────────────────
function Sheet({onClose,children}){
  return<div className="fixed inset-0 z-50 flex items-end" style={{background:"rgba(0,0,0,0.4)"}} onClick={onClose}>
    <div className="w-full rounded-t-3xl p-5 space-y-3" style={{background:"white"}} onClick={e=>e.stopPropagation()}>
      <div className="w-10 h-1 rounded-full mx-auto mb-1" style={{background:"#E5E5EA"}}/>
      {children}
    </div>
  </div>;
}

function DeleteClientModal({client,onConfirm,onCancel}){
  const[keep,setKeep]=useState(false);
  return<Sheet onClose={onCancel}>
    <div className="text-center"><div className="text-lg font-bold" style={{color:"#1C1C1E"}}>Supprimer {client.prenom} ?</div><div className="text-sm mt-1" style={{color:"#8E8E93"}}>Action irréversible.</div></div>
    <Btn onClick={()=>setKeep(v=>!v)} cls="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl" style={{background:"#F2F2F7"}}>
      <div><div className="text-sm font-medium text-left" style={{color:"#1C1C1E"}}>Garder l'historique des commandes</div><div className="text-xs text-left mt-0.5" style={{color:"#8E8E93"}}>Le CA reste dans les stats</div></div>
      <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center ml-3 flex-shrink-0" style={keep?{background:"#007AFF",borderColor:"#007AFF"}:{borderColor:"#C7C7CC"}}>{keep&&<span className="text-white text-xs font-bold">✓</span>}</div>
    </Btn>
    <Btn onClick={()=>onConfirm(keep)} cls="w-full py-4 rounded-2xl text-sm font-semibold text-white" style={{background:"#FF3B30"}}>Supprimer</Btn>
    <Btn onClick={onCancel} cls="w-full py-4 rounded-2xl text-sm font-semibold" style={{background:"#F2F2F7",color:"#007AFF"}}>Annuler</Btn>
  </Sheet>;
}

// ─── SUB VIEW ─────────────────────────────────────────────────────────────────
function SubView({title,onBack,children}){
  const sw=useSwipeBack(onBack);
  return<div className="space-y-4 pb-28" {...sw}>
    <div className="flex items-center gap-2 pt-2">
      <Btn onClick={onBack} cls="flex items-center gap-1 text-sm font-medium" style={{color:"#007AFF"}}><span className="text-lg">‹</span> Retour</Btn>
    </div>
    <h2 className="text-2xl font-bold" style={{color:"#1C1C1E"}}>{title}</h2>
    {children}
  </div>;
}

// ─── EMOJI INPUT (native iOS emoji keyboard compatible) ───────────────────────
function EmojiInput({value,onChange}){
  return<div className="space-y-2">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-3xl" style={{background:"#F2F2F7",lineHeight:1}}>{value||"?"}</div>
      <div className="flex-1">
        <input
          value={value}
          onChange={e=>onChange(e.target.value)}
          placeholder="Tape ici puis appuie sur 🌐"
          className="w-full px-3 py-2.5 rounded-xl outline-none"
          style={{background:"#F2F2F7",color:"#1C1C1E",fontSize:"16px",WebkitUserSelect:"text",userSelect:"text"}}
          autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
        />
        <div className="text-[10px] mt-1" style={{color:"#C7C7CC"}}>
          Clavier iPhone → touche 🌐 → Emoji · Genmoji Apple AI ✓ · 1, 2 ou 3 emojis
        </div>
      </div>
    </div>
  </div>;
}

// ─── PARRAINAGE TREE ──────────────────────────────────────────────────────────
function TreeNode({id,clients,depth}){
  const c=clients.find(x=>x.id===id);if(!c)return null;
  const a=filleulsActifs(c,clients);
  const grad=["linear-gradient(135deg,#007AFF,#34C759)","linear-gradient(135deg,#FF9500,#FF3B30)","linear-gradient(135deg,#AF52DE,#007AFF)","linear-gradient(135deg,#34C759,#FFCC00)"];
  return<div style={{marginLeft:depth*20}}>
    <div className="flex items-center gap-2.5 py-2">
      {depth>0&&<div style={{width:12,height:2,background:"#E5E5EA",flexShrink:0}}/>}
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{background:grad[depth%grad.length]}}>{c.prenom.charAt(0)}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate" style={{color:"#1C1C1E"}}>{c.prenom}</div>
        <div className="text-xs" style={{color:"#8E8E93"}}>{c.commandes.length} cmd · {a} filleuls actifs</div>
      </div>
      {c.commandes.length>0&&<span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0" style={{background:"#F0FDF4",color:"#34C759"}}>Actif</span>}
    </div>
    {c.parrainageFait.map(fid=><TreeNode key={fid} id={fid} clients={clients} depth={depth+1}/>)}
  </div>;
}

// ─── CLIENT DETAIL ────────────────────────────────────────────────────────────
function ClientDetail({client,clients,stock,flavors,onBack,onAddCommande,onAddParrainage,onToggle,onDelete}){
  const sw=useSwipeBack(onBack);
  const[showCmd,setShowCmd]=useState(false);
  const[showParr,setShowParr]=useState(false);
  const[showDel,setShowDel]=useState(false);
  const[gout,setGout]=useState(flavors[0]?.id||"");
  const[qty,setQty]=useState(1);
  const[date,setDate]=useState(new Date().toISOString().split("T")[0]);
  const[livraison,setLivraison]=useState(false);
  const[parrId,setParrId]=useState("");
  const[copied,setCopied]=useState(false);
  const[snapCopied,setSnapCopied]=useState(false);
  const[mapPopup,setMapPopup]=useState(false);
  const pt=useRef(null);const dl=useRef(false);

  const getC=id=>clients.find(c=>c.id===id);
  const parrain=client.parrainePar?getC(client.parrainePar):null;
  const fav=getFav(client.commandes,flavors);
  const last=lastOrder(client.commandes);
  const inactive=last&&daysSince(last.date)>15;
  const actifs=filleulsActifs(client,clients);
  const ps=parrStatus(client,clients);
  const foui=client.parrainageFait.filter(id=>getC(id)?.commandes.length>0);
  const fnon=client.parrainageFait.filter(id=>!getC(id)?.commandes.length);
  const ca=client.commandes.reduce((s,c)=>s+cmdCA(c),0);
  const benef=client.commandes.reduce((s,c)=>s+cmdBenef(c),0);
  const units=client.commandes.reduce((s,c)=>s+c.quantite,0);
  const selF=flavors.find(f=>f.id===gout);
  const price=PRIX_VENTE+(livraison?5:0);

  const addrClick=()=>{if(dl.current){dl.current=false;return;}if(!client.adresse)return;navigator.clipboard?.writeText(client.adresse);setCopied(true);setTimeout(()=>setCopied(false),2000);};
  const addrStart=()=>{dl.current=false;pt.current=setTimeout(()=>{dl.current=true;setMapPopup(true);},600);};
  const addrEnd=()=>{if(pt.current){clearTimeout(pt.current);pt.current=null;}};
  const copySnap=()=>{navigator.clipboard?.writeText(client.snap);setSnapCopied(true);setTimeout(()=>setSnapCopied(false),2000);};
  const submitCmd=()=>{onAddCommande(client.id,{gout,quantite:qty,date,livraison});setShowCmd(false);setQty(1);setLivraison(false);};
  const submitParr=()=>{if(!parrId)return;onAddParrainage(client.id,parseInt(parrId));setShowParr(false);setParrId("");};
  const R="flex items-center gap-3 px-4 py-3.5 border-b last:border-0";

  return<div className="space-y-5 pb-28" style={{background:"#F2F2F7",minHeight:"100vh"}} {...sw}>
    {showDel&&<DeleteClientModal client={client} onCancel={()=>setShowDel(false)} onConfirm={k=>{onDelete(client.id,k);setShowDel(false);}}/>}
    {mapPopup&&<Sheet onClose={()=>setMapPopup(false)}>
      <div className="text-sm font-semibold text-center" style={{color:"#1C1C1E"}}>Ouvrir l'adresse avec</div>
      <div className="text-xs text-center px-2 py-2 rounded-xl" style={{background:"#F2F2F7",color:"#8E8E93"}}>📍 {client.adresse}</div>
      <Btn onClick={()=>{window.open(`https://waze.com/ul?q=${encodeURIComponent(client.adresse)}`,"_blank");setMapPopup(false);}} cls="w-full py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2" style={{background:"#007AFF15",color:"#007AFF",border:"1px solid #007AFF30"}}>🔵 Waze</Btn>
      <Btn onClick={()=>{window.open(`https://maps.google.com/?q=${encodeURIComponent(client.adresse)}`,"_blank");setMapPopup(false);}} cls="w-full py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2" style={{background:"#34C75915",color:"#34C759",border:"1px solid #34C75930"}}>🟢 Google Maps</Btn>
      <Btn onClick={()=>setMapPopup(false)} cls="w-full py-3.5 rounded-2xl text-sm font-semibold" style={{background:"#F2F2F7",color:"#8E8E93"}}>Annuler</Btn>
    </Sheet>}

    <div className="flex items-center justify-between pt-3 pb-1">
      <Btn onClick={onBack} cls="flex items-center gap-1 text-sm font-medium" style={{color:"#007AFF"}}><span className="text-lg">‹</span> Clients</Btn>
      <Btn onClick={()=>setShowDel(true)} cls="text-sm font-medium px-3 py-1.5 rounded-full" style={{color:"#FF3B30",background:"#FFF1F0"}}>Supprimer</Btn>
    </div>

    {/* Profile card */}
    <div className="bg-white rounded-2xl shadow-sm p-5" style={{WebkitUserSelect:"none",userSelect:"none"}}>
      <div className="flex gap-4 items-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0" style={{background:"linear-gradient(135deg,#007AFF,#34C759)"}}>{client.prenom.charAt(0)}</div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-xl" style={{color:"#1C1C1E"}}>{client.prenom}</div>
          {client.snap&&<div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm" style={{color:"#FFCC00"}}>👻 {client.snap}</span>
            <Btn onClick={copySnap} cls="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{background:snapCopied?"#34C75920":"#F2F2F7",color:snapCopied?"#34C759":"#8E8E93"}}>{snapCopied?"Copié ✓":"Copier"}</Btn>
          </div>}
          {client.telephone&&<div className="text-sm" style={{color:"#8E8E93"}}>{client.telephone}</div>}
        </div>
      </div>
      {client.adresse&&<button onMouseDown={addrStart} onMouseUp={addrEnd} onMouseLeave={addrEnd} onTouchStart={addrStart} onTouchEnd={addrEnd} onClick={addrClick}
        className="mt-3 w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left"
        style={{background:copied?"#F0FDF4":"#F2F2F7",WebkitTouchCallout:"none",WebkitUserSelect:"none",userSelect:"none"}}>
        <span>📍</span>
        <span className="text-xs flex-1" style={{color:copied?"#34C759":"#3C3C43"}}>{copied?"Adresse copiée ✓":client.adresse}</span>
        <span className="text-[10px]" style={{color:"#C7C7CC"}}>Tap · Hold</span>
      </button>}
      <div className="flex gap-2 mt-3 flex-wrap">
        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{background:client.commandes.length>0?"#F0FDF4":"#F2F2F7",color:client.commandes.length>0?"#34C759":"#8E8E93"}}>{client.commandes.length>0?"● Actif":"○ Inscrit"}</span>
        {inactive&&<span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{background:"#FFF1F0",color:"#FF3B30"}}>Inactif {daysSince(last.date)}j</span>}
        {client.parrainePar&&<span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{background:"#EBF5FF",color:"#007AFF"}}>Filleul de {parrain?.prenom}</span>}
      </div>
      <div className="text-xs mt-2" style={{color:"#C7C7CC"}}>Inscrit le {fmtDate(client.dateInscription)}</div>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-3 gap-3">
      {[{l:"Commandes",v:client.commandes.length,c:"#34C759"},{l:"CA total",v:`${ca}€`,c:"#007AFF"},{l:"Bénéfice",v:`${benef.toFixed(0)}€`,c:"#FF9500"}].map(s=>(
        <div key={s.l} className="bg-white rounded-2xl shadow-sm p-4 text-center">
          <div className="text-xl font-bold" style={{color:s.c}}>{s.v}</div>
          <div className="text-[10px] mt-0.5" style={{color:"#8E8E93"}}>{s.l}</div>
        </div>
      ))}
    </div>

    {(fav||last)&&<div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center gap-3">
      {fav&&<span className="text-2xl leading-none">{fav.emoji}</span>}
      <div className="flex-1">{fav&&<div className="text-sm font-semibold" style={{color:"#1C1C1E"}}>Préféré : <span style={{color:fav.color}}>{fav.label}</span></div>}{last&&<div className="text-xs" style={{color:"#8E8E93"}}>Dernier achat : {fmtDate(last.date)}</div>}</div>
    </div>}

    {/* Parrainage status */}
    {ps&&<div className="rounded-2xl p-4 space-y-3" style={{background:`${ps.color}15`,border:`1px solid ${ps.color}30`}}>
      <div className="text-sm font-semibold" style={{color:ps.color}}>{ps.label}</div>
      <div className="flex gap-2 flex-wrap">
        {actifs===2&&<Btn onClick={()=>onToggle(client.id,"relance1")} cls="flex-1 py-2 rounded-xl text-xs font-semibold border" style={client.relance1?{background:"#8E8E9320",color:"#8E8E93",borderColor:"#8E8E9340"}:{background:"#FF950020",color:"#FF9500",borderColor:"#FF950040"}}>{client.relance1?"✓ Relancé":"Marquer relancé"}</Btn>}
        {actifs>=3&&!client.produit5Offert&&<Btn onClick={()=>onToggle(client.id,"produit5Offert")} cls="flex-1 py-2 rounded-xl text-xs font-semibold border" style={{background:"#007AFF20",color:"#007AFF",borderColor:"#007AFF40"}}>Puff 5€ offert</Btn>}
        {actifs===4&&<Btn onClick={()=>onToggle(client.id,"relance2")} cls="flex-1 py-2 rounded-xl text-xs font-semibold border" style={client.relance2?{background:"#8E8E9320",color:"#8E8E93",borderColor:"#8E8E9340"}:{background:"#FF950020",color:"#FF9500",borderColor:"#FF950040"}}>{client.relance2?"✓ Relancé":"Marquer relancé"}</Btn>}
        {actifs>=5&&!client.produitGratuitOffert&&<Btn onClick={()=>onToggle(client.id,"produitGratuitOffert")} cls="flex-1 py-2 rounded-xl text-xs font-semibold border" style={{background:"#34C75920",color:"#34C759",borderColor:"#34C75940"}}>Puff gratuit offert</Btn>}
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs" style={{color:"#8E8E93"}}><span>{actifs} filleuls actifs</span><span>{Math.min(actifs,5)}/5</span></div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{background:"#E5E5EA"}}><div className="h-full rounded-full transition-all duration-500" style={{width:`${Math.min(100,(actifs/5)*100)}%`,background:ps.color}}/></div>
        <div className="flex justify-between text-[10px]" style={{color:"#C7C7CC"}}><span>0</span><span>3 → 5€</span><span>5 → gratuit</span></div>
      </div>
    </div>}

    {/* Commandes */}
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-sm font-semibold" style={{color:"#3C3C43"}}>Commandes</span>
        <Btn onClick={()=>{setShowCmd(v=>!v);setShowParr(false);}} cls="text-sm font-medium" style={{color:"#007AFF"}}>{showCmd?"Annuler":"+ Nouvelle"}</Btn>
      </div>
      {showCmd&&<div className="bg-white rounded-2xl shadow-sm p-4 mb-3 space-y-4">
        <div>
          <div className="text-xs font-semibold mb-2" style={{color:"#8E8E93"}}>GOÛT</div>
          <div className="grid grid-cols-3 gap-2">
            {flavors.map(f=><Btn key={f.id} onClick={()=>setGout(f.id)} cls="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold border"
              style={gout===f.id?{background:f.bg,borderColor:f.color,color:f.color}:{background:"#F2F2F7",borderColor:"transparent",color:"#8E8E93"}}>
              <span className="text-xl leading-none">{f.emoji}</span>{f.label}
            </Btn>)}
          </div>
          {selF&&<div className="text-xs mt-2" style={{color:(stock[selF.id]||0)<qty?"#FF3B30":"#8E8E93"}}>Stock {selF.label} : <span className="font-semibold">{stock[selF.id]||0}</span>{qty>(stock[selF.id]||0)&&" — insuffisant ⚠"}</div>}
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="text-xs font-semibold mb-2" style={{color:"#8E8E93"}}>QUANTITÉ</div>
            <div className="flex items-center gap-2">
              <Btn onClick={()=>setQty(q=>Math.max(1,q-1))} cls="w-9 h-9 rounded-full flex items-center justify-center text-lg" style={{background:"#F2F2F7",color:"#007AFF"}}>−</Btn>
              <span className="w-8 text-center font-bold text-lg" style={{color:"#1C1C1E"}}>{qty}</span>
              <Btn onClick={()=>setQty(q=>q+1)} cls="w-9 h-9 rounded-full flex items-center justify-center text-lg" style={{background:"#F2F2F7",color:"#007AFF"}}>+</Btn>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold mb-2" style={{color:"#8E8E93"}}>DATE</div>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full rounded-xl px-3 py-2 outline-none" style={{background:"#F2F2F7",color:"#1C1C1E",fontSize:"16px"}}/>
          </div>
        </div>
        <Btn onClick={()=>setLivraison(l=>!l)} cls="w-full flex items-center justify-between px-4 py-3 rounded-xl border"
          style={livraison?{background:"#EBF5FF",borderColor:"#007AFF40",color:"#007AFF"}:{background:"#F2F2F7",borderColor:"transparent",color:"#3C3C43"}}>
          <div className="flex items-center gap-2"><span>🚚</span><span className="text-sm font-medium">Livraison +5€</span></div>
          <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={livraison?{background:"#007AFF",borderColor:"#007AFF"}:{borderColor:"#C7C7CC"}}>{livraison&&<span className="text-white text-xs font-bold">✓</span>}</div>
        </Btn>
        <div className="flex items-center justify-between px-1">
          <span className="text-sm" style={{color:"#8E8E93"}}>Prix commande</span>
          <span className="text-lg font-bold" style={{color:"#34C759"}}>{price}€</span>
        </div>
        <Btn onClick={submitCmd} disabled={qty>(stock[gout]||0)} cls="w-full py-3.5 rounded-2xl font-semibold text-sm text-white" style={{background:qty>(stock[gout]||0)?"#C7C7CC":"#007AFF"}}>Enregistrer la commande</Btn>
      </div>}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {client.commandes.length>0?[...client.commandes].reverse().map((cmd,i)=>{const f=flavors.find(fl=>fl.id===cmd.gout);return(
          <div key={i} className={R} style={{borderColor:"#F2F2F7"}}>
            <span className="text-2xl leading-none">{f?.emoji||"📦"}</span>
            <div className="flex-1"><div className="text-sm font-medium" style={{color:"#1C1C1E"}}>{f?.label||cmd.gout}{cmd.livraison?" · 🚚":""}</div><div className="text-xs" style={{color:"#8E8E93"}}>{fmtDate(cmd.date)}</div></div>
            <div className="text-right"><div className="text-sm font-semibold" style={{color:"#1C1C1E"}}>×{cmd.quantite}</div><div className="text-xs font-medium" style={{color:"#34C759"}}>{cmdCA(cmd)}€</div></div>
          </div>
        );}):(<div className="px-4 py-8 text-center text-sm" style={{color:"#C7C7CC"}}>Aucune commande</div>)}
      </div>
    </div>

    {/* Parrainage */}
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-sm font-semibold" style={{color:"#3C3C43"}}>Parrainage</span>
        <Btn onClick={()=>{setShowParr(v=>!v);setShowCmd(false);}} cls="text-sm font-medium" style={{color:"#007AFF"}}>{showParr?"Annuler":"+ Filleul"}</Btn>
      </div>
      {showParr&&<div className="bg-white rounded-2xl shadow-sm p-4 mb-3 space-y-3">
        <select value={parrId} onChange={e=>setParrId(e.target.value)} className="w-full px-4 py-3 rounded-xl outline-none" style={{background:"#F2F2F7",color:"#1C1C1E",fontSize:"16px"}}>
          <option value="">— Choisir un client —</option>
          {clients.filter(c=>c.id!==client.id&&c.parrainePar===null).map(c=><option key={c.id} value={c.id}>{c.prenom}</option>)}
        </select>
        <Btn onClick={submitParr} disabled={!parrId} cls="w-full py-3.5 rounded-2xl font-semibold text-sm text-white" style={{background:!parrId?"#C7C7CC":"#FF9500"}}>Enregistrer le parrainage</Btn>
      </div>}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        <div className={R} style={{borderColor:"#F2F2F7"}}><span className="text-xl" style={{color:"#007AFF"}}>👥</span><div className="flex-1 text-sm" style={{color:"#1C1C1E"}}>{actifs}/{client.parrainageFait.length} filleuls ont commandé</div></div>
        {foui.map(id=>{const f=getC(id);if(!f)return null;return<div key={id} className={R} style={{borderColor:"#F2F2F7"}}><div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{background:"linear-gradient(135deg,#34C759,#007AFF)"}}>{f.prenom.charAt(0)}</div><div className="flex-1 min-w-0"><div className="text-sm font-medium truncate" style={{color:"#1C1C1E"}}>{f.prenom}</div><div className="text-xs" style={{color:"#34C759"}}>{f.commandes.length} commande{f.commandes.length>1?"s":""}</div></div></div>;})}
        {fnon.map(id=>{const f=getC(id);if(!f)return null;return<div key={id} className={R} style={{borderColor:"#F2F2F7"}}><div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{background:"#F2F2F7",color:"#C7C7CC"}}>{f.prenom.charAt(0)}</div><div className="flex-1 min-w-0"><div className="text-sm truncate" style={{color:"#8E8E93"}}>{f.prenom}</div><div className="text-xs" style={{color:"#C7C7CC"}}>Pas encore commandé</div></div></div>;})}
        {client.parrainageFait.length===0&&<div className="px-4 py-6 text-center text-sm" style={{color:"#C7C7CC"}}>Aucun filleul</div>}
      </div>
    </div>
  </div>;
}

// ─── STOCK PAGE ───────────────────────────────────────────────────────────────
function StockPage({stock,flavors,onUpdate,onUpdateFlavors}){
  const[screen,setScreen]=useState(false);
  const[manage,setManage]=useState(false);
  const[newLabel,setNewLabel]=useState("");
  const[newEmoji,setNewEmoji]=useState("🍎");
  const[newColor,setNewColor]=useState("#007AFF");
  const[editId,setEditId]=useState(null);
  const[editLabel,setEditLabel]=useState("");

  const add=()=>{if(!newLabel.trim())return;const id=newLabel.toLowerCase().replace(/\s+/g,"_")+"_"+Date.now();onUpdateFlavors([...flavors,{id,label:newLabel.trim(),emoji:newEmoji,color:newColor,bg:newColor+"20"}]);setNewLabel("");setNewEmoji("🍎");setNewColor("#007AFF");};
  const del=id=>onUpdateFlavors(flavors.filter(f=>f.id!==id));
  const saveEdit=id=>{onUpdateFlavors(flavors.map(f=>f.id===id?{...f,label:editLabel}:f));setEditId(null);};
  // FIX: only count existing flavors
  const total=flavors.reduce((s,f)=>s+(stock[f.id]||0),0);
  const available=flavors.filter(f=>(stock[f.id]||0)>0);

  if(screen){
    const n=available.length;
    const ts=n<=3?"1.8rem":n<=5?"1.4rem":"1.1rem";
    const ns=n<=3?"3.5rem":n<=5?"2.8rem":"2rem";
    const py=n<=3?"1.5rem":n<=5?"1rem":"0.6rem";
    return<div className="fixed inset-0 z-50 flex flex-col" style={{background:"white"}}>
      <div className="flex justify-end px-5" style={{paddingTop:"env(safe-area-inset-top,44px)"}}>
        <Btn onClick={()=>setScreen(false)} cls="text-sm font-medium px-4 py-2 rounded-full mt-2" style={{background:"#F2F2F7",color:"#007AFF"}}>Fermer</Btn>
      </div>
      <div className="flex-1 flex flex-col justify-center px-8">
        {available.map((f,i)=><div key={f.id} className="flex items-center justify-between" style={{paddingTop:py,paddingBottom:py,borderBottom:i<available.length-1?"1px solid #F2F2F7":"none"}}>
          <div className="flex items-center gap-3"><span style={{fontSize:ts,lineHeight:1}}>{f.emoji}</span><span style={{fontSize:ts,fontWeight:700,color:"#1C1C1E"}}>{f.label}</span></div>
          <span style={{fontSize:ns,fontWeight:700,color:f.color}}>{stock[f.id]||0}</span>
        </div>)}
        {!available.length&&<div className="text-center text-lg font-medium" style={{color:"#C7C7CC"}}>Aucun stock</div>}
      </div>
    </div>;
  }

  return<div className="space-y-5 pb-28">
    <div className="flex items-center justify-between">
      <p className="text-sm" style={{color:"#8E8E93"}}>{total} puffs au total</p>
      <div className="flex gap-2">
        <Btn onClick={()=>setManage(v=>!v)} cls="px-3 py-2 rounded-xl text-sm font-medium" style={{background:"white",color:"#3C3C43",boxShadow:"0 1px 3px rgba(0,0,0,0.1)"}}>⚙️</Btn>
        <Btn onClick={()=>setScreen(true)} cls="px-3 py-2 rounded-xl text-sm font-medium" style={{background:"white",color:"#3C3C43",boxShadow:"0 1px 3px rgba(0,0,0,0.1)"}}>📋</Btn>
      </div>
    </div>

    {manage&&<div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
      <div className="text-sm font-semibold" style={{color:"#3C3C43"}}>Gérer les goûts</div>
      {flavors.map(f=><div key={f.id} className="flex items-center gap-2">
        <span className="text-xl flex-shrink-0 leading-none">{f.emoji}</span>
        {editId===f.id?<>
          <input value={editLabel} onChange={e=>setEditLabel(e.target.value)} className="flex-1 px-3 py-1.5 rounded-xl outline-none" style={{background:"#F2F2F7",color:"#1C1C1E",fontSize:"16px",WebkitUserSelect:"text",userSelect:"text"}}/>
          <Btn onClick={()=>saveEdit(f.id)} cls="text-xs font-semibold px-3 py-1.5 rounded-xl" style={{background:"#34C75920",color:"#34C759"}}>✓</Btn>
          <Btn onClick={()=>setEditId(null)} cls="text-xs px-2 py-1.5 rounded-xl" style={{background:"#F2F2F7",color:"#8E8E93"}}>✕</Btn>
        </>:<>
          <span className="flex-1 text-sm" style={{color:"#1C1C1E"}}>{f.label}</span>
          <Btn onClick={()=>{setEditId(f.id);setEditLabel(f.label);}} cls="text-xs px-3 py-1.5 rounded-xl" style={{background:"#007AFF20",color:"#007AFF"}}>Modifier</Btn>
          <Btn onClick={()=>del(f.id)} cls="text-xs px-2 py-1.5 rounded-xl" style={{background:"#FF3B3020",color:"#FF3B30"}}>✕</Btn>
        </>}
      </div>)}
      <div className="border-t pt-3" style={{borderColor:"#F2F2F7"}}>
        <div className="text-xs font-semibold mb-3" style={{color:"#8E8E93"}}>AJOUTER UN GOÛT</div>
        <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} placeholder="Nom du goût" className="w-full px-3 py-2.5 rounded-xl outline-none mb-3" style={{background:"#F2F2F7",color:"#1C1C1E",fontSize:"16px",WebkitUserSelect:"text",userSelect:"text"}}/>
        <div className="mb-3">
          <div className="text-xs font-semibold mb-2" style={{color:"#8E8E93"}}>EMOJI</div>
          <EmojiInput value={newEmoji} onChange={setNewEmoji}/>
        </div>
        <div className="flex gap-2 mb-3 flex-wrap">
          {FLAVOR_COLORS.map(c=><Btn key={c} onClick={()=>setNewColor(c)} cls="w-7 h-7 rounded-full border-2" style={{background:c,borderColor:newColor===c?"#1C1C1E":"transparent"}}/>)}
        </div>
        <Btn onClick={add} disabled={!newLabel.trim()} cls="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{background:newLabel.trim()?"#007AFF":"#C7C7CC"}}>
          Ajouter <span style={{lineHeight:1}}>{newEmoji}</span> {newLabel||"..."}
        </Btn>
      </div>
    </div>}

    <div className="grid grid-cols-2 gap-3">
      {flavors.map(f=>{const q=stock[f.id]||0;return(
        <div key={f.id} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="text-2xl leading-none">{f.emoji}</span><span className="text-sm font-semibold" style={{color:"#1C1C1E"}}>{f.label}</span></div>
            <span className="text-2xl font-bold" style={{color:f.color}}>{q}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{background:"#F2F2F7"}}><div className="h-full rounded-full transition-all" style={{width:`${Math.min(100,(q/20)*100)}%`,background:f.color}}/></div>
          <div className="flex gap-2">
            <Btn onClick={()=>onUpdate(f.id,-1)} disabled={q===0} cls="flex-1 py-2 rounded-xl text-sm font-semibold" style={{background:"#FFF1F0",color:"#FF3B30"}}>−1</Btn>
            <Btn onClick={()=>onUpdate(f.id,1)} cls="flex-1 py-2 rounded-xl text-sm font-semibold" style={{background:"#F0FDF4",color:"#34C759"}}>+1</Btn>
          </div>
        </div>
      );})}
    </div>
  </div>;
}

// ─── INFOS PAGE ───────────────────────────────────────────────────────────────
function InfosPage({voitures,setVoitures,trajets,setTrajets}){
  const[activeId,setActiveId]=useState(()=>{try{return parseInt(localStorage.getItem("dg_av")||"1");}catch{return 1;}});
  const[prices,setPrices]=useState({});
  const[loading,setLoading]=useState(false);
  const[showAddV,setShowAddV]=useState(false);
  const[nv,setNv]=useState({nom:"",conso:"",essence:"SP95"});
  const[km,setKm]=useState("");
  const[showHist,setShowHist]=useState(false);
  const[showReset,setShowReset]=useState(false);

  useEffect(()=>{localStorage.setItem("dg_av",activeId);},[activeId]);

  const fetchPrices=async()=>{
    setLoading(true);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:300,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:"Prix moyen en euros par litre aujourd'hui dans le Val-d'Oise (95) France pour SP95, SP98, E10, Diesel. Réponds uniquement avec ce JSON exact sans aucun autre texte: {\"SP95\":1.72,\"SP98\":1.89,\"E10\":1.65,\"Diesel\":1.58}"}]
        })
      });
      const data=await res.json();
      const text=data.content?.find(b=>b.type==="text")?.text||"";
      const m=text.match(/\{[^}]+\}/);
      if(m)setPrices(JSON.parse(m[0]));
      else setPrices({SP95:1.95,SP98:2.09,E10:1.88,Diesel:1.78});
    }catch{setPrices({SP95:1.95,SP98:2.09,E10:1.88,Diesel:1.78});}
    setLoading(false);
  };

  useEffect(()=>{fetchPrices();},[]);

  const voiture=voitures.find(v=>v.id===activeId)||voitures[0];
  const essPrice=voiture?prices[voiture.essence]:null;
  const coutKm=voiture&&essPrice?(voiture.conso/100)*essPrice:null;
  const totalEss=trajets.reduce((s,t)=>s+t.cout,0);

  const addV=()=>{if(!nv.nom.trim()||!nv.conso)return;const v={id:Date.now(),nom:nv.nom,conso:parseFloat(nv.conso),essence:nv.essence};setVoitures(p=>[...p,v]);setActiveId(v.id);setNv({nom:"",conso:"",essence:"SP95"});setShowAddV(false);};
  const enregTrajet=()=>{if(!km||!coutKm)return;const d=parseFloat(km);const c=parseFloat((d*coutKm).toFixed(2));setTrajets(p=>[{id:Date.now(),date:new Date().toISOString().split("T")[0],km:d,cout:c,voitureNom:voiture.nom,essence:voiture.essence,prixEssence:essPrice},...p]);setKm("");};
  const delTrajet=id=>setTrajets(p=>p.filter(t=>t.id!==id));

  const R="flex items-center gap-3 px-4 py-3.5 border-b last:border-0";

  return<div className="space-y-5 pb-28">
    {showReset&&<Sheet onClose={()=>setShowReset(false)}>
      <div className="text-center"><div className="text-lg font-bold" style={{color:"#1C1C1E"}}>Réinitialiser les trajets ?</div><div className="text-sm mt-1" style={{color:"#8E8E93"}}>Le total repassera à 0€. Irréversible.</div></div>
      <Btn onClick={()=>{setTrajets([]);setShowReset(false);}} cls="w-full py-4 rounded-2xl text-sm font-semibold text-white" style={{background:"#FF3B30"}}>Réinitialiser</Btn>
      <Btn onClick={()=>setShowReset(false)} cls="w-full py-4 rounded-2xl text-sm font-semibold" style={{background:"#F2F2F7",color:"#007AFF"}}>Annuler</Btn>
    </Sheet>}

    {/* Prix essence */}
    <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold" style={{color:"#3C3C43"}}>⛽ Prix carburant — Val-d'Oise</div>
        <Btn onClick={fetchPrices} cls="text-xs px-3 py-1.5 rounded-full font-medium" style={{background:"#007AFF15",color:"#007AFF"}}>{loading?"…":"Actualiser"}</Btn>
      </div>
      {Object.keys(prices).length>0?(
        <div className="grid grid-cols-2 gap-2">
          {ESSENCE_TYPES.map(type=><div key={type} className="rounded-xl px-3 py-2.5" style={{background:"#F2F2F7",border:voiture?.essence===type?"1.5px solid #007AFF":"1.5px solid transparent"}}>
            <div className="text-xs font-semibold" style={{color:"#8E8E93"}}>{type}</div>
            <div className="text-xl font-bold mt-0.5" style={{color:voiture?.essence===type?"#007AFF":"#1C1C1E"}}>{prices[type]?`${prices[type].toFixed(2)}€`:"—"}<span className="text-xs font-normal" style={{color:"#8E8E93"}}>/L</span></div>
          </div>)}
        </div>
      ):<div className="text-sm animate-pulse" style={{color:"#C7C7CC"}}>Chargement des prix en temps réel…</div>}
    </div>

    {/* Voitures */}
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-sm font-semibold" style={{color:"#3C3C43"}}>🚗 Mes voitures</span>
        <Btn onClick={()=>setShowAddV(v=>!v)} cls="text-sm font-medium" style={{color:"#007AFF"}}>{showAddV?"Annuler":"+ Ajouter"}</Btn>
      </div>
      {showAddV&&<div className="bg-white rounded-2xl shadow-sm p-4 mb-3 space-y-3">
        <input value={nv.nom} onChange={e=>setNv(p=>({...p,nom:e.target.value}))} placeholder="Modèle (ex: Peugeot 207)" className="w-full px-3 py-2.5 rounded-xl outline-none" style={{background:"#F2F2F7",color:"#1C1C1E",fontSize:"16px",WebkitUserSelect:"text",userSelect:"text"}}/>
        <input type="number" value={nv.conso} onChange={e=>setNv(p=>({...p,conso:e.target.value}))} placeholder="Consommation aux 100km (ex: 6.5)" className="w-full px-3 py-2.5 rounded-xl outline-none" style={{background:"#F2F2F7",color:"#1C1C1E",fontSize:"16px",WebkitUserSelect:"text",userSelect:"text"}}/>
        <div>
          <div className="text-xs font-semibold mb-2" style={{color:"#8E8E93"}}>TYPE D'ESSENCE</div>
          <div className="grid grid-cols-4 gap-2">
            {ESSENCE_TYPES.map(type=><Btn key={type} onClick={()=>setNv(p=>({...p,essence:type}))} cls="py-2 rounded-xl text-xs font-semibold border"
              style={nv.essence===type?{background:"#007AFF20",color:"#007AFF",borderColor:"#007AFF40"}:{background:"#F2F2F7",color:"#8E8E93",borderColor:"transparent"}}>
              {type}
            </Btn>)}
          </div>
          {prices[nv.essence]&&<div className="text-xs mt-1.5" style={{color:"#8E8E93"}}>Prix actuel : <span style={{color:"#007AFF",fontWeight:600}}>{prices[nv.essence].toFixed(2)}€/L</span></div>}
        </div>
        <Btn onClick={addV} disabled={!nv.nom.trim()||!nv.conso} cls="w-full py-3 rounded-2xl text-sm font-semibold text-white" style={{background:"#007AFF"}}>Enregistrer</Btn>
      </div>}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {voitures.map(v=><Btn key={v.id} onClick={()=>setActiveId(v.id)} cls={R+" w-full text-left"} style={{borderColor:"#F2F2F7"}}>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium" style={{color:"#1C1C1E"}}>{v.nom}</div>
            <div className="text-xs" style={{color:"#8E8E93"}}>{v.conso}L/100km · {v.essence}{prices[v.essence]?` · ${prices[v.essence].toFixed(2)}€/L`:""}</div>
          </div>
          {activeId===v.id&&<div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{background:"#007AFF"}}>✓</div>}
        </Btn>)}
      </div>
    </div>

    {/* Enregistrer trajet */}
    {voiture&&<div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
      <div className="text-sm font-semibold" style={{color:"#3C3C43"}}>📍 Enregistrer un trajet</div>
      <div className="rounded-xl px-3 py-2.5" style={{background:"#F2F2F7"}}>
        <div className="text-xs" style={{color:"#8E8E93"}}>Voiture : <span style={{color:"#1C1C1E",fontWeight:600}}>{voiture.nom}</span> · {voiture.essence}</div>
        {coutKm?<div className="text-xs mt-0.5" style={{color:"#8E8E93"}}>Coût au km : <span style={{color:"#FF9500",fontWeight:600}}>{coutKm.toFixed(3)}€</span></div>
          :<div className="text-xs mt-0.5" style={{color:"#C7C7CC"}}>Chargement du prix…</div>}
      </div>
      <div>
        <div className="text-xs font-semibold mb-2" style={{color:"#8E8E93"}}>DISTANCE (KM)</div>
        <input type="number" value={km} onChange={e=>setKm(e.target.value)} placeholder="ex: 12.5" className="w-full px-4 py-3 rounded-xl outline-none" style={{background:"#F2F2F7",color:"#1C1C1E",fontSize:"16px",WebkitUserSelect:"text",userSelect:"text"}}/>
      </div>
      {km&&parseFloat(km)>0&&coutKm&&<div className="flex items-center justify-between px-1">
        <span className="text-sm" style={{color:"#8E8E93"}}>Coût estimé</span>
        <span className="text-2xl font-bold" style={{color:"#FF3B30"}}>{(parseFloat(km)*coutKm).toFixed(2)}€</span>
      </div>}
      <Btn onClick={enregTrajet} disabled={!km||!coutKm} cls="w-full py-3.5 rounded-2xl text-sm font-semibold text-white" style={{background:!km||!coutKm?"#C7C7CC":"#007AFF"}}>Enregistrer le trajet</Btn>
    </div>}

    {/* Total */}
    {trajets.length>0&&<div className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between">
      <div>
        <div className="text-sm font-semibold" style={{color:"#3C3C43"}}>Total essence dépensé</div>
        <div className="text-xs" style={{color:"#8E8E93"}}>{trajets.length} trajet{trajets.length>1?"s":""}</div>
      </div>
      <div className="flex items-center gap-3">
        <Btn onClick={()=>setShowReset(true)} cls="text-xs px-3 py-1.5 rounded-full font-medium" style={{background:"#FF3B3015",color:"#FF3B30"}}>Réinitialiser</Btn>
        <div className="text-2xl font-bold" style={{color:"#FF3B30"}}>{totalEss.toFixed(2)}€</div>
      </div>
    </div>}

    {/* Historique */}
    {trajets.length>0&&<div>
      <Btn onClick={()=>setShowHist(v=>!v)} cls="flex items-center justify-between w-full px-1 mb-2">
        <span className="text-sm font-semibold" style={{color:"#3C3C43"}}>Historique des trajets</span>
        <span className="text-sm" style={{color:"#007AFF"}}>{showHist?"Masquer":"Voir tout"}</span>
      </Btn>
      {showHist&&<div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {trajets.map(t=><div key={t.id} className="flex items-center gap-3 px-4 py-3.5 border-b last:border-0" style={{borderColor:"#F2F2F7"}}>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium" style={{color:"#1C1C1E"}}>{t.km} km · {t.voitureNom}</div>
            <div className="text-xs" style={{color:"#8E8E93"}}>{fmtDate(t.date)} · {t.essence} {t.prixEssence?.toFixed(2)}€/L</div>
          </div>
          <div className="text-sm font-bold" style={{color:"#FF3B30"}}>{t.cout.toFixed(2)}€</div>
          <Btn onClick={()=>delTrajet(t.id)} cls="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{background:"#FF3B3015",color:"#FF3B30"}}>✕</Btn>
        </div>)}
      </div>}
    </div>}
  </div>;
}

// ─── STATS PAGE ───────────────────────────────────────────────────────────────
function StatsPage({clients,flavors}){
  const[sec,setSec]=useState(null);
  const allCmds=clients.flatMap(c=>c.commandes);
  const ws=allWeeks(clients);
  const lw=ws[ws.length-1]||getWeekKey(new Date().toISOString());
  const[wSel,setWSel]=useState(lw);
  const[wConv,setWConv]=useState(lw);

  const totalCA=allCmds.reduce((s,c)=>s+cmdCA(c),0);
  const totalB=allCmds.reduce((s,c)=>s+cmdBenef(c),0);
  const livCA=allCmds.filter(c=>c.livraison).length*5;
  const prodCA=totalCA-livCA;
  const caW={};allCmds.forEach(c=>{const w=getWeekKey(c.date);caW[w]=(caW[w]||0)+cmdCA(c);});
  const bestW=Object.entries(caW).sort((a,b)=>b[1]-a[1])[0];
  const wCmds=allCmds.filter(c=>getWeekKey(c.date)===wSel);
  const wCA=wCmds.reduce((s,c)=>s+cmdCA(c),0);
  const wLiv=wCmds.filter(c=>c.livraison).length*5;
  const wProd=wCA-wLiv;
  const wNc=clients.filter(c=>getWeekKey(c.dateInscription)===wSel).length;
  const tc=clients.length;
  const ca2=clients.filter(c=>c.commandes.length>0).length;
  const tCli=tc>0?parseFloat(((ca2/tc)*100).toFixed(1)):0;
  const wcA=clients.filter(c=>getWeekKey(c.dateInscription)===wConv);
  const wcAa=wcA.filter(c=>c.commandes.length>0).length;
  const tCliW=wcA.length>0?parseFloat(((wcAa/wcA.length)*100).toFixed(1)):0;
  const fils=clients.filter(c=>c.parrainePar!==null);
  const filsA=fils.filter(c=>c.commandes.length>0).length;
  const tFil=fils.length>0?parseFloat(((filsA/fils.length)*100).toFixed(1)):0;
  const wFil=fils.filter(c=>getWeekKey(c.dateInscription)===wConv);
  const wFilA=wFil.filter(c=>c.commandes.length>0).length;
  const tFilW=wFil.length>0?parseFloat(((wFilA/wFil.length)*100).toFixed(1)):0;
  const topParr=clients.filter(c=>filleulsActifs(c,clients)>=3);
  const fideles=clients.filter(c=>c.commandes.length>=2).length;
  const tFid=tc>0?parseFloat(((fideles/tc)*100).toFixed(1)):0;
  const gW=ws.slice(-8);const maxG=Math.max(...gW.map(w=>caW[w]||0),1);
  const W=ws.length?ws:[lw];

  const PBar=({val,color,label,sub})=><div className="space-y-1.5">
    <div className="flex justify-between"><span className="text-sm" style={{color:"#3C3C43"}}>{label}</span><span className="text-sm font-bold" style={{color}}>{val}%</span></div>
    <div className="h-2 rounded-full overflow-hidden" style={{background:"#F2F2F7"}}><div className="h-full rounded-full transition-all" style={{width:`${val}%`,background:color}}/></div>
    {sub&&<div className="text-xs" style={{color:"#C7C7CC"}}>{sub}</div>}
  </div>;

  if(sec==="conv_clients")return<SubView title="Conversion clients" onBack={()=>setSec(null)}>
    <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
      <div className="text-center py-2"><div className="text-5xl font-bold" style={{color:pctColor(tCli)}}>{tCli}%</div><div className="text-xs mt-1" style={{color:"#8E8E93"}}>{ca2} sur {tc} ont commandé</div></div>
      <PBar val={tCli} color={pctColor(tCli)} label="Global"/>
      <div className="border-t pt-3" style={{borderColor:"#F2F2F7"}}><WeekSel weeks={W} cur={wConv} onChange={setWConv}/><PBar val={tCliW} color={pctColor(tCliW)} label="Semaine" sub={`${wcAa}/${wcA.length} clients`}/></div>
    </div>
  </SubView>;

  if(sec==="conv_filleuls")return<SubView title="Conversion filleuls" onBack={()=>setSec(null)}>
    <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
      <div className="text-center py-2"><div className="text-5xl font-bold" style={{color:pctColor(tFil)}}>{tFil}%</div><div className="text-xs mt-1" style={{color:"#8E8E93"}}>{filsA} sur {fils.length} ont commandé</div></div>
      <PBar val={tFil} color={pctColor(tFil)} label="Global"/>
      <div className="border-t pt-3" style={{borderColor:"#F2F2F7"}}><WeekSel weeks={W} cur={wConv} onChange={setWConv}/><PBar val={tFilW} color={pctColor(tFilW)} label="Semaine" sub={`${wFilA}/${wFil.length} filleuls`}/></div>
    </div>
  </SubView>;

  if(sec==="fidelisation"){
    const nb=clients.map(c=>c.commandes.length);
    const mx=Math.max(...nb,1);
    const ct={};for(let i=0;i<=mx;i++)ct[i]=0;nb.forEach(n=>{ct[n]=(ct[n]||0)+1;});
    const labs=Object.keys(ct).map(Number).sort((a,b)=>a-b);
    const mxC=Math.max(...labs.map(l=>ct[l]),1);
    return<SubView title="Fidélisation" onBack={()=>setSec(null)}>
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between"><div className="text-sm" style={{color:"#8E8E93"}}>Clients fidèles (2+ cmd)</div><span className="text-2xl font-bold" style={{color:pctColor(tFid)}}>{tFid}%</span></div>
        <div className="space-y-2.5">
          {labs.map(l=>{const c=ct[l]||0;const p=mxC>0?(c/mxC)*100:0;const col=l===0?"#C7C7CC":l>=2?"#34C759":"#007AFF";return(
            <div key={l} className="flex items-center gap-2">
              <span className="text-xs text-right flex-shrink-0" style={{color:"#8E8E93",width:44}}>{l===0?"0 cmd":`${l} cmd`}</span>
              <div className="flex-1 rounded-full overflow-hidden" style={{background:"#F2F2F7",height:16}}><div className="h-full rounded-full transition-all duration-500" style={{width:`${Math.max(p,c>0?3:0)}%`,background:col}}/></div>
              <span className="text-xs font-bold flex-shrink-0 text-right" style={{color:c>0?"#3C3C43":"#C7C7CC",width:18}}>{c}</span>
            </div>
          );})}
        </div>
        <div className="flex gap-3">
          <span className="text-[10px] flex items-center gap-1" style={{color:"#8E8E93"}}><span className="inline-block w-2 h-2 rounded-sm" style={{background:"#C7C7CC"}}></span>0 cmd</span>
          <span className="text-[10px] flex items-center gap-1" style={{color:"#8E8E93"}}><span className="inline-block w-2 h-2 rounded-sm" style={{background:"#007AFF"}}></span>1 cmd</span>
          <span className="text-[10px] flex items-center gap-1" style={{color:"#8E8E93"}}><span className="inline-block w-2 h-2 rounded-sm" style={{background:"#34C759"}}></span>2+ cmds</span>
        </div>
      </div>
    </SubView>;
  }

  if(sec==="parrains")return<SubView title="Top parrains" onBack={()=>setSec(null)}>
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      {topParr.length>0?topParr.map(c=>{const a=filleulsActifs(c,clients);return<div key={c.id} className="flex items-center gap-3 px-4 py-3.5 border-b last:border-0" style={{borderColor:"#F2F2F7"}}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{background:"linear-gradient(135deg,#FF9500,#FF3B30)"}}>{c.prenom.charAt(0)}</div>
        <div className="flex-1"><div className="text-sm font-semibold" style={{color:"#1C1C1E"}}>{c.prenom}</div><div className="text-xs" style={{color:"#8E8E93"}}>{c.parrainageFait.length} filleuls</div></div>
        <div className="text-lg font-bold" style={{color:"#FF9500"}}>{a}✓</div>
      </div>;}):(<div className="py-8 text-center text-sm" style={{color:"#C7C7CC"}}>Aucun parrain avec 3+ filleuls actifs.</div>)}
    </div>
  </SubView>;

  if(sec==="arbre")return<div className="space-y-4 pb-28" {...useSwipeBack(()=>setSec(null))}>
    <div className="flex items-center gap-2 pt-2"><Btn onClick={()=>setSec(null)} cls="flex items-center gap-1 text-sm font-medium" style={{color:"#007AFF"}}><span className="text-lg">‹</span> Retour</Btn></div>
    <h2 className="text-2xl font-bold" style={{color:"#1C1C1E"}}>Arbre de parrainage</h2>
    <div className="bg-white rounded-2xl shadow-sm p-4">
      {clients.filter(c=>c.parrainePar===null).map(r=><TreeNode key={r.id} id={r.id} clients={clients} depth={0}/>)}
    </div>
  </div>;

  if(sec==="meilleurs"){
    const ranked=[...clients].sort((a,b)=>score(b,clients)-score(a,clients));
    const medals=["🥇","🥈","🥉"];
    return<SubView title="Meilleurs clients" onBack={()=>setSec(null)}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {ranked.map((c,i)=>{const sc=score(c,clients);const a=filleulsActifs(c,clients);return(
          <div key={c.id} className="flex items-center gap-3 px-4 py-3.5 border-b last:border-0" style={{borderColor:"#F2F2F7"}}>
            <div className="text-xl w-7 text-center flex-shrink-0">{medals[i]||<span className="text-xs font-bold" style={{color:"#C7C7CC"}}>#{i+1}</span>}</div>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
              style={{background:i===0?"linear-gradient(135deg,#FF9500,#FFCC00)":i===1?"linear-gradient(135deg,#8E8E93,#C7C7CC)":i===2?"linear-gradient(135deg,#FF6B35,#FF9500)":"linear-gradient(135deg,#007AFF,#34C759)"}}>
              {c.prenom.charAt(0)}
            </div>
            <div className="flex-1 min-w-0"><div className="text-sm font-semibold" style={{color:"#1C1C1E"}}>{c.prenom}</div><div className="text-xs" style={{color:"#8E8E93"}}>{c.commandes.length} cmd · {a} filleuls · {c.commandes.reduce((s,x)=>s+cmdCA(x),0)}€</div></div>
            <div className="text-base font-bold" style={{color:"#007AFF"}}>{sc}pts</div>
          </div>
        );})}
      </div>
      <div className="text-xs px-1" style={{color:"#C7C7CC"}}>Score = commandes ×2 + filleuls actifs ×3</div>
    </SubView>;
  }

  const P="bg-white rounded-2xl shadow-sm p-4 space-y-4";
  const bW=10;const svgW=gW.length*36;

  return<div className="space-y-5 pb-28">
    <div className={P}>
      <div className="text-xs font-semibold uppercase tracking-wide" style={{color:"#8E8E93"}}>Vue globale</div>
      <div className="grid grid-cols-2 gap-3">
        {[{l:"Clients",v:tc,c:"#007AFF"},{l:"Commandes",v:allCmds.length,c:"#34C759"},{l:"Unités",v:allCmds.reduce((s,c)=>s+c.quantite,0),c:"#FF9500"},{l:"Parrainages",v:clients.reduce((s,c)=>s+c.parrainageFait.length,0),c:"#AF52DE"}].map(s=>(
          <div key={s.l} className="rounded-xl p-3 text-center" style={{background:"#F2F2F7"}}><div className="text-2xl font-bold" style={{color:s.c}}>{s.v}</div><div className="text-xs mt-0.5" style={{color:"#8E8E93"}}>{s.l}</div></div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3" style={{background:"#F2F2F7"}}>
          <div className="text-xs font-semibold mb-1" style={{color:"#8E8E93"}}>CA TOTAL</div>
          <div className="text-2xl font-bold" style={{color:"#34C759"}}>{totalCA}€</div>
          <div className="flex gap-2 mt-1 flex-wrap"><span className="text-[10px]" style={{color:"#8E8E93"}}>🛍 {prodCA}€</span><span className="text-[10px]" style={{color:"#8E8E93"}}>🚚 {livCA}€</span></div>
        </div>
        <div className="rounded-xl p-3" style={{background:"#F2F2F7"}}>
          <div className="text-xs font-semibold mb-1" style={{color:"#8E8E93"}}>BÉNÉFICE</div>
          <div className="text-2xl font-bold" style={{color:"#FF9500"}}>{totalB.toFixed(0)}€</div>
          <div className="text-[10px] mt-1" style={{color:"#8E8E93"}}>Après coût ({COUT_PUFF}€/puff)</div>
        </div>
      </div>
      {bestW&&<div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{background:"#FFF7ED"}}>
        <div><div className="text-xs font-bold" style={{color:"#FF9500"}}>⭐ Meilleure semaine</div><div className="text-xs mt-0.5" style={{color:"#8E8E93"}}>{weekLabel(bestW[0])}</div></div>
        <div className="text-xl font-bold" style={{color:"#FF9500"}}>{bestW[1]}€</div>
      </div>}
    </div>

    <div className={P}>
      <div className="text-xs font-semibold uppercase tracking-wide" style={{color:"#8E8E93"}}>Par semaine</div>
      <WeekSel weeks={W} cur={wSel} onChange={setWSel}/>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3 text-center" style={{background:"#F2F2F7"}}><div className="text-2xl font-bold" style={{color:"#34C759"}}>{wCmds.length}</div><div className="text-xs mt-0.5" style={{color:"#8E8E93"}}>Ventes</div></div>
        <div className="rounded-xl p-3 text-center" style={{background:"#F2F2F7"}}><div className="text-2xl font-bold" style={{color:"#007AFF"}}>{wNc}</div><div className="text-xs mt-0.5" style={{color:"#8E8E93"}}>Nvx clients</div></div>
      </div>
      <div className="rounded-xl p-3" style={{background:"#F2F2F7"}}>
        <div className="text-xs font-semibold mb-1" style={{color:"#8E8E93"}}>CA CETTE SEMAINE</div>
        <div className="text-2xl font-bold" style={{color:"#34C759"}}>{wCA}€</div>
        <div className="flex gap-4 mt-1"><span className="text-xs" style={{color:"#8E8E93"}}>🛍 <span style={{color:"#1C1C1E",fontWeight:600}}>{wProd}€</span></span><span className="text-xs" style={{color:"#8E8E93"}}>🚚 <span style={{color:"#1C1C1E",fontWeight:600}}>{wLiv}€</span></span></div>
      </div>
      {bestW&&wSel===bestW[0]&&<div className="text-center text-sm font-semibold" style={{color:"#FF9500"}}>⭐ Votre meilleure semaine !</div>}
    </div>

    {/* Thin bars chart */}
    <div className={P}>
      <div className="text-xs font-semibold uppercase tracking-wide" style={{color:"#8E8E93"}}>Évolution CA</div>
      <svg width="100%" height="120" viewBox={`0 0 ${Math.max(svgW,200)} 120`} preserveAspectRatio="xMinYMin meet">
        {gW.map((w,i)=>{const val=caW[w]||0;const h=Math.max((val/maxG)*90,val>0?5:0);const iB=bestW&&w===bestW[0];const x=i*36+18;return(
          <g key={w}>
            <rect x={x-bW/2} y={100-h} width={bW} height={h} rx="3" fill={iB?"#FF9500":"#007AFF"} opacity={iB?1:0.6}/>
            {val>0&&<text x={x} y={94-h} textAnchor="middle" fontSize="8" fill="#8E8E93">{val}€</text>}
            <text x={x} y={114} textAnchor="middle" fontSize="8" fill="#C7C7CC">S{w.split("-W")[1]}</text>
          </g>
        );})}
      </svg>
    </div>

    {/* Ventes par goût */}
    <div className={P}>
      <div className="text-xs font-semibold uppercase tracking-wide" style={{color:"#8E8E93"}}>Ventes par goût</div>
      {[...flavors].sort((a,b)=>{const tA=allCmds.filter(c=>c.gout===a.id).reduce((s,c)=>s+c.quantite,0);const tB=allCmds.filter(c=>c.gout===b.id).reduce((s,c)=>s+c.quantite,0);return tB-tA;}).map((f,i)=>{
        const tot=allCmds.filter(c=>c.gout===f.id).reduce((s,c)=>s+c.quantite,0);
        const mF=Math.max(...flavors.map(fl=>allCmds.filter(c=>c.gout===fl.id).reduce((s,c)=>s+c.quantite,0)),1);
        return<div key={f.id} className="space-y-1.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">{i===0&&tot>0&&<span className="text-xs">🏆</span>}<span className="text-sm" style={{color:"#1C1C1E"}}><span style={{lineHeight:1}}>{f.emoji}</span> {f.label}</span></div>
            <span className="text-sm font-semibold" style={{color:f.color}}>{tot} unités</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{background:"#F2F2F7"}}><div className="h-full rounded-full transition-all" style={{width:`${(tot/mF)*100}%`,background:f.color}}/></div>
        </div>;
      })}
    </div>

    {/* Boutons style réglages iOS */}
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide mb-2 px-1" style={{color:"#8E8E93"}}>Analyses détaillées</div>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {[
          {id:"conv_clients",label:"Conversion clients",icon:"📈",sub:`${tCli}%`,subC:pctColor(tCli)},
          {id:"conv_filleuls",label:"Conversion filleuls",icon:"🤝",sub:`${tFil}%`,subC:pctColor(tFil)},
          {id:"fidelisation",label:"Fidélisation",icon:"💚",sub:`${tFid}%`,subC:pctColor(tFid)},
          {id:"parrains",label:"Top parrains",icon:"⭐",sub:`${topParr.length}`,subC:"#FF9500"},
          {id:"arbre",label:"Arbre de parrainage",icon:"🌳",sub:"",subC:"#007AFF"},
          {id:"meilleurs",label:"Meilleurs clients",icon:"🏆",sub:"",subC:"#FF9500"},
        ].map(item=><Btn key={item.id} onClick={()=>setSec(item.id)} cls="w-full flex items-center gap-3 px-4 py-3.5 text-left border-b last:border-0" style={{borderColor:"#F2F2F7"}}>
          <span className="text-xl w-8 flex-shrink-0">{item.icon}</span>
          <div className="flex-1 text-sm font-medium" style={{color:"#1C1C1E"}}>{item.label}</div>
          {item.sub&&<span className="text-sm font-semibold" style={{color:item.subC}}>{item.sub}</span>}
          <span style={{color:"#C7C7CC"}}>›</span>
        </Btn>)}
      </div>
    </div>
  </div>;
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const[clients,setClients]=useState(()=>{try{const s=localStorage.getItem("dg_clients");return s?JSON.parse(s):initClients;}catch{return initClients;}});
  const[stock,setStock]=useState(()=>{try{const s=localStorage.getItem("dg_stock");return s?JSON.parse(s):initStock;}catch{return initStock;}});
  const[flavors,setFlavors]=useState(()=>{try{const s=localStorage.getItem("dg_flavors");return s?JSON.parse(s):DEFAULT_FLAVORS;}catch{return DEFAULT_FLAVORS;}});
  const[voitures,setVoitures]=useState(()=>{try{const s=localStorage.getItem("dg_voitures");return s?JSON.parse(s):[{id:1,nom:"Peugeot 207",conso:6.5,essence:"SP95"}];}catch{return[{id:1,nom:"Peugeot 207",conso:6.5,essence:"SP95"}];}});
  const[trajets,setTrajets]=useState(()=>{try{const s=localStorage.getItem("dg_trajets");return s?JSON.parse(s):[];}catch{return[];}});
  const[tab,setTab]=useState("clients");
  const[search,setSearch]=useState("");
  const[selId,setSelId]=useState(null);
  const[notif,setNotif]=useState(null);
  const[delTarget,setDelTarget]=useState(null);
  const[nc,setNc]=useState({prenom:"",snap:"",telephone:"",adresse:"",parrainePar:""});
  const scrollRef=useRef(null);
  const[scrolled,setScrolled]=useState(false);

  useEffect(()=>{try{localStorage.setItem("dg_clients",JSON.stringify(clients));}catch{}},[clients]);
  useEffect(()=>{try{localStorage.setItem("dg_stock",JSON.stringify(stock));}catch{}},[stock]);
  useEffect(()=>{try{localStorage.setItem("dg_flavors",JSON.stringify(flavors));}catch{}},[flavors]);
  useEffect(()=>{try{localStorage.setItem("dg_voitures",JSON.stringify(voitures));}catch{}},[voitures]);
  useEffect(()=>{try{localStorage.setItem("dg_trajets",JSON.stringify(trajets));}catch{}},[trajets]);
  useEffect(()=>{setScrolled(false);if(scrollRef.current)scrollRef.current.scrollTop=0;},[tab,selId]);

  const notify=useCallback((msg,color="green")=>{setNotif({msg,color});setTimeout(()=>setNotif(null),2500);},[]);
  const filtered=useMemo(()=>search.trim()?clients.filter(c=>c.prenom.toLowerCase().includes(search.toLowerCase())||(c.snap||"").toLowerCase().includes(search.toLowerCase())):clients,[clients,search]);
  const sorted=useMemo(()=>[...filtered].sort((a,b)=>(needsAction(b,clients)?1:0)-(needsAction(a,clients)?1:0)),[filtered,clients]);
  const sel=clients.find(c=>c.id===selId);
  const toRel=clients.filter(c=>needsAction(c,clients));

  const updStock=(id,d)=>{setStock(p=>({...p,[id]:Math.max(0,(p[id]||0)+d)}));if(d>0)notify(`+${d} ${flavors.find(f=>f.id===id)?.label} ajouté`);};
  const updFlavors=nf=>{setFlavors(nf);setStock(p=>{const nx={...p};nf.forEach(f=>{if(!(f.id in nx))nx[f.id]=0;});return nx;});};
  const addCmd=(cid,cmd)=>{setClients(p=>p.map(c=>c.id===cid?{...c,commandes:[...c.commandes,{...cmd,id:Date.now()}]}:c));setStock(p=>({...p,[cmd.gout]:Math.max(0,(p[cmd.gout]||0)-cmd.quantite)}));notify(`✓ ${flavors.find(f=>f.id===cmd.gout)?.emoji} ×${cmd.quantite} — ${cmdCA(cmd)}€`);};
  const addParr=(cid,pid)=>{setClients(p=>p.map(c=>{if(c.id===cid)return{...c,parrainageFait:[...c.parrainageFait,pid]};if(c.id===pid)return{...c,parrainePar:cid};return c;}));notify("✓ Parrainage enregistré !");};
  const toggle=(cid,field)=>setClients(p=>p.map(c=>c.id===cid?{...c,[field]:!c[field]}:c));
  const delClient=(cid,keep)=>{setClients(p=>{const nx=p.filter(c=>c.id!==cid);return nx.map(c=>({...c,parrainageFait:c.parrainageFait.filter(id=>id!==cid),parrainePar:c.parrainePar===cid?null:c.parrainePar}));});notify(keep?"Client supprimé, historique conservé.":"Client supprimé.");setSelId(null);};
  const addClient=()=>{
    if(!nc.prenom.trim())return;
    const id=Date.now();const pid=nc.parrainePar?parseInt(nc.parrainePar):null;
    setClients(p=>{const cr={id,prenom:nc.prenom,snap:nc.snap,telephone:nc.telephone,adresse:nc.adresse,dateInscription:new Date().toISOString().split("T")[0],commandes:[],parrainageFait:[],parrainePar:pid,relance1:false,produit5Offert:false,relance2:false,produitGratuitOffert:false};const nx=[...p,cr];if(pid)return nx.map(c=>c.id===pid?{...c,parrainageFait:[...c.parrainageFait,id]}:c);return nx;});
    setNc({prenom:"",snap:"",telephone:"",adresse:"",parrainePar:""});notify("✓ Client ajouté !");setTab("clients");
  };

  const lpH=(cid)=>{let t;return{onMouseDown:()=>{t=setTimeout(()=>setDelTarget(cid),600);},onMouseUp:()=>clearTimeout(t),onMouseLeave:()=>clearTimeout(t),onTouchStart:()=>{t=setTimeout(()=>setDelTarget(cid),600);},onTouchEnd:()=>clearTimeout(t)};};

  const titles={clients:"Clients",stock:"Stock",stats:"Statistiques",infos:"Infos",ajouter:"Nouveau client"};
  const isDetail=tab==="clients"&&sel;
  const R="flex items-center gap-3 px-4 py-3.5 border-b last:border-0";

  return<div style={{background:"#F2F2F7",height:"100dvh",display:"flex",flexDirection:"column",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif",WebkitUserSelect:"none",userSelect:"none",WebkitTouchCallout:"none"}}>
    <style>{`input,select,textarea{font-size:16px!important;}*{-webkit-tap-highlight-color:transparent;}`}</style>

    {notif&&<div className="fixed left-4 right-4 z-50 px-4 py-3 rounded-2xl text-sm font-semibold text-center shadow-lg"
      style={{top:"calc(env(safe-area-inset-top,44px) + 8px)",background:notif.color==="red"?"#FF3B30":"#34C759",color:"white",zIndex:999}}>{notif.msg}</div>}

    {delTarget&&(()=>{const c=clients.find(x=>x.id===delTarget);return c?<DeleteClientModal client={c} onCancel={()=>setDelTarget(null)} onConfirm={k=>{delClient(c.id,k);setDelTarget(null);}}/>:null;})()}

    {/* Sticky header */}
    <div style={{paddingTop:"env(safe-area-inset-top,44px)",background:scrolled?"rgba(242,242,247,0.92)":"#F2F2F7",backdropFilter:scrolled?"blur(20px)":"none",borderBottom:scrolled?"0.5px solid #E5E5EA":"none",transition:"background 0.2s,border 0.2s",zIndex:30,flexShrink:0}}>
      <div className="px-5 pt-3 pb-2 flex items-baseline justify-between">
        {isDetail
          ?<Btn onClick={()=>setSelId(null)} cls="flex items-center gap-1 text-sm font-medium" style={{color:"#007AFF"}}><span className="text-lg">‹</span> Clients</Btn>
          :<h1 className="text-3xl font-bold" style={{color:"#1C1C1E",letterSpacing:"-0.5px"}}>{titles[tab]}</h1>}
        {tab==="clients"&&!sel&&toRel.length>0&&<span className="text-sm font-semibold px-2.5 py-1 rounded-full" style={{background:"#FF950020",color:"#FF9500"}}>{toRel.length} à relancer</span>}
      </div>
    </div>

    {/* Scrollable */}
    <div ref={scrollRef} onScroll={e=>setScrolled(e.target.scrollTop>10)} style={{flex:1,overflowY:"auto",paddingBottom:"calc(env(safe-area-inset-bottom,16px) + 72px)"}}>
      <div className="px-4 pt-1">

        {tab==="clients"&&!sel&&<div className="space-y-4 pb-4">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{background:"#E5E5EA"}}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="#8E8E93" strokeWidth="1.4"/><path d="M9.5 9.5L12 12" stroke="#8E8E93" strokeWidth="1.4" strokeLinecap="round"/></svg>
            <input type="text" placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)} className="flex-1 bg-transparent outline-none" style={{color:"#1C1C1E",WebkitUserSelect:"text",userSelect:"text",fontSize:"16px"}}/>
            {search&&<Btn onClick={()=>setSearch("")} style={{color:"#8E8E93",fontSize:14}}>✕</Btn>}
          </div>
          <div className="text-xs text-center" style={{color:"#C7C7CC"}}>Appui long pour supprimer un client</div>

          {!search&&toRel.length>0&&<div>
            <div className="text-xs font-semibold uppercase tracking-wide mb-2 px-1" style={{color:"#FF9500"}}>⚡ À relancer</div>
            <div className="rounded-2xl overflow-hidden bg-white shadow-sm">
              {toRel.map(c=>{const a=filleulsActifs(c,clients);return(
                <div key={c.id} onClick={()=>setSelId(c.id)} {...lpH(c.id)} className={R+" cursor-pointer"} style={{borderColor:"#F2F2F7"}}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{background:"linear-gradient(135deg,#FF9500,#FF3B30)"}}>{c.prenom.charAt(0)}</div>
                  <div className="flex-1 min-w-0"><div className="text-sm font-semibold" style={{color:"#1C1C1E"}}>{c.prenom}</div><div className="text-xs" style={{color:"#FF9500"}}>{a}/5 filleuls — à relancer !</div></div>
                  <span style={{color:"#C7C7CC"}}>›</span>
                </div>
              );})}
            </div>
          </div>}

          <div>
            {!search&&toRel.length>0&&<div className="text-xs font-semibold uppercase tracking-wide mb-2 px-1" style={{color:"#8E8E93"}}>Tous les clients</div>}
            <div className="rounded-2xl overflow-hidden bg-white shadow-sm">
              {sorted.filter(c=>search||!needsAction(c,clients)).map(c=>{
                const fav=getFav(c.commandes,flavors);const st=parrStatus(c,clients);const last=lastOrder(c.commandes);const ina=last&&daysSince(last.date)>15;
                return<div key={c.id} onClick={()=>setSelId(c.id)} {...lpH(c.id)} className={R+" cursor-pointer"} style={{borderColor:"#F2F2F7"}}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{background:"linear-gradient(135deg,#007AFF,#34C759)"}}>{c.prenom.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{color:"#1C1C1E"}}>{c.prenom}</div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-xs" style={{color:c.commandes.length>0?"#34C759":"#C7C7CC"}}>{c.commandes.length} cmd</span>
                      {fav&&<span className="text-xs leading-none">{fav.emoji}</span>}
                      {ina&&<span className="text-xs px-1.5 py-0.5 rounded-full" style={{background:"#FFF1F0",color:"#FF3B30"}}>ina</span>}
                      {st&&<span className="text-xs px-1.5 py-0.5 rounded-full" style={{background:`${st.color}15`,color:st.color}}>{st.label}</span>}
                    </div>
                  </div>
                  <span style={{color:"#C7C7CC"}}>›</span>
                </div>;
              })}
              {sorted.filter(c=>search||!needsAction(c,clients)).length===0&&<div className="px-4 py-8 text-center text-sm" style={{color:"#C7C7CC"}}>{search?"Aucun résultat":"Tous dans 'À relancer'"}</div>}
            </div>
          </div>
        </div>}

        {tab==="clients"&&sel&&<ClientDetail client={sel} clients={clients} stock={stock} flavors={flavors} onBack={()=>setSelId(null)} onAddCommande={addCmd} onAddParrainage={addParr} onToggle={toggle} onDelete={delClient}/>}
        {tab==="stock"&&<StockPage stock={stock} flavors={flavors} onUpdate={updStock} onUpdateFlavors={updFlavors}/>}
        {tab==="stats"&&<StatsPage clients={clients} flavors={flavors}/>}
        {tab==="infos"&&<InfosPage voitures={voitures} setVoitures={setVoitures} trajets={trajets} setTrajets={setTrajets}/>}

        {tab==="ajouter"&&<div className="space-y-5 pt-2 pb-4">
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {[{l:"Prénom *",k:"prenom",p:"Jean",t:"text"},{l:"Snap",k:"snap",p:"jean_snap",t:"text"},{l:"Téléphone",k:"telephone",p:"06 00 00 00 00",t:"tel"},{l:"Adresse",k:"adresse",p:"5 rue de la Paix, Paris",t:"text"}].map(f=>(
              <div key={f.k} className={R} style={{borderColor:"#F2F2F7"}}>
                <div className="w-24 text-sm flex-shrink-0" style={{color:"#3C3C43"}}>{f.l}</div>
                <input type={f.t} placeholder={f.p} value={nc[f.k]} onChange={e=>setNc(p=>({...p,[f.k]:e.target.value}))} className="flex-1 text-sm outline-none text-right bg-transparent" style={{color:"#1C1C1E",WebkitUserSelect:"text",userSelect:"text",fontSize:"16px"}}/>
              </div>
            ))}
            <div className={R} style={{borderColor:"transparent"}}>
              <div className="w-24 text-sm flex-shrink-0" style={{color:"#3C3C43"}}>Parrain</div>
              <select value={nc.parrainePar} onChange={e=>setNc(p=>({...p,parrainePar:e.target.value}))} className="flex-1 text-sm outline-none text-right bg-transparent" style={{color:nc.parrainePar?"#1C1C1E":"#C7C7CC",fontSize:"16px"}}>
                <option value="">Aucun</option>
                {clients.map(c=><option key={c.id} value={c.id}>{c.prenom}</option>)}
              </select>
            </div>
          </div>
          <Btn onClick={addClient} disabled={!nc.prenom.trim()} cls="w-full py-4 rounded-2xl font-semibold text-sm text-white" style={{background:!nc.prenom.trim()?"#C7C7CC":"#007AFF"}}>Ajouter le client</Btn>
        </div>}
      </div>
    </div>

    {/* Tab bar — SVG icons App Store style */}
    <div style={{background:"rgba(242,242,247,0.92)",backdropFilter:"blur(20px)",borderTop:"0.5px solid #E5E5EA",paddingBottom:"env(safe-area-inset-bottom,16px)",flexShrink:0,zIndex:40}}>
      <div className="flex justify-around px-1 pt-2 pb-1">
        {TABS.map(t=><Btn key={t.id} onClick={()=>{setTab(t.id);setSelId(null);}} cls="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl">
          {IC[t.id](tab===t.id)}
          <span className="text-[10px] font-medium" style={{color:tab===t.id?"#007AFF":"#8E8E93"}}>{t.label}</span>
        </Btn>)}
      </div>
    </div>
  </div>;
}
