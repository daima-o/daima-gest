import { useState, useMemo, useRef, useCallback, useEffect } from "react";

const DEFAULT_FLAVORS = [
  { id: "pomme",     label: "Pomme",     color: "#34C759", bg: "#F0FDF4", emoji: "🍎" },
  { id: "fraise",    label: "Fraise",    color: "#FF3B30", bg: "#FFF1F0", emoji: "🍓" },
  { id: "mangue",    label: "Mangue",    color: "#FF9500", bg: "#FFF7ED", emoji: "🥭" },
  { id: "citron",    label: "Citron",    color: "#FFCC00", bg: "#FEFCE8", emoji: "🍋" },
  { id: "framboise", label: "Framboise", color: "#AF52DE", bg: "#FAF5FF", emoji: "🫐" },
  { id: "peche",     label: "Pêche",     color: "#FF6B35", bg: "#FFF5F0", emoji: "🍑" },
];
const FLAVOR_COLORS = ["#34C759","#FF3B30","#FF9500","#FFCC00","#AF52DE","#FF6B35","#007AFF","#FF2D55","#5AC8FA","#4CD964"];
const COUT_PUFF = 5.33;
const PRIX_VENTE = 10;

const initClients = [
  { id: 1, prenom: "Sophie", snap: "sophiem", telephone: "06 12 34 56 78", adresse: "12 rue de la Paix, Paris", dateInscription: "2024-04-01", commandes: [{ id: 1, date: "2024-04-03", gout: "pomme", quantite: 2, livraison: false }, { id: 2, date: "2024-04-10", gout: "fraise", quantite: 1, livraison: true }, { id: 3, date: "2024-04-22", gout: "pomme", quantite: 1, livraison: false }], parrainageFait: [2, 3, 4, 5], parrainePar: null, relance1: true, produit5Offert: false, relance2: false, produitGratuitOffert: false },
  { id: 2, prenom: "Thomas", snap: "tleroux", telephone: "07 23 45 67 89", adresse: "5 avenue Victor Hugo, Lyon", dateInscription: "2024-04-05", commandes: [{ id: 1, date: "2024-04-08", gout: "mangue", quantite: 1, livraison: false }, { id: 2, date: "2024-04-28", gout: "mangue", quantite: 2, livraison: true }], parrainageFait: [5], parrainePar: 1, relance1: false, produit5Offert: false, relance2: false, produitGratuitOffert: false },
  { id: 3, prenom: "Camille", snap: "camille_d", telephone: "06 34 56 78 90", adresse: "", dateInscription: "2024-04-05", commandes: [], parrainageFait: [], parrainePar: 1, relance1: false, produit5Offert: false, relance2: false, produitGratuitOffert: false },
  { id: 4, prenom: "Julien", snap: "julienb07", telephone: "07 45 67 89 01", adresse: "8 boulevard Haussmann, Paris", dateInscription: "2024-04-08", commandes: [{ id: 1, date: "2024-04-15", gout: "citron", quantite: 2, livraison: false }], parrainageFait: [], parrainePar: 1, relance1: false, produit5Offert: false, relance2: false, produitGratuitOffert: false },
  { id: 5, prenom: "Marie", snap: "mariefont", telephone: "06 56 78 90 12", adresse: "", dateInscription: "2024-04-08", commandes: [{ id: 1, date: "2024-04-20", gout: "framboise", quantite: 1, livraison: true }], parrainageFait: [], parrainePar: 2, relance1: false, produit5Offert: false, relance2: false, produitGratuitOffert: false },
];
const initStock = Object.fromEntries(DEFAULT_FLAVORS.map(f => [f.id, 8]));

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getWeekKey(dateStr) {
  const d = new Date(dateStr); const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - jan1) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}
function weekLabel(key) {
  if (!key) return "";
  const [year, w] = key.split("-W");
  const jan1 = new Date(parseInt(year), 0, 1);
  const days = (parseInt(w) - 1) * 7;
  const mon = new Date(jan1.getTime() + (days - (jan1.getDay() || 7) + 1) * 86400000);
  const sun = new Date(mon.getTime() + 6 * 86400000);
  const fmt = d => d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  return `${fmt(mon)} – ${fmt(sun)}`;
}
function allWeeksFromClients(clients) {
  const keys = new Set();
  clients.forEach(c => { keys.add(getWeekKey(c.dateInscription)); c.commandes.forEach(cmd => keys.add(getWeekKey(cmd.date))); });
  return [...keys].sort();
}
const cmdCA = cmd => PRIX_VENTE + (cmd.livraison ? 5 : 0);
const cmdBenef = cmd => (PRIX_VENTE - COUT_PUFF) + (cmd.livraison ? 5 : 0);
function lastOrder(commandes) { if (!commandes.length) return null; return commandes.reduce((a, b) => a.date > b.date ? a : b); }
function daysSince(dateStr) { return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000); }
function getFav(commandes, flavors) {
  if (!commandes.length) return null;
  const counts = {}; commandes.forEach(c => { counts[c.gout] = (counts[c.gout] || 0) + c.quantite; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? flavors.find(f => f.id === top[0]) : null;
}
function filleulsActifsCount(client, clients) {
  return client.parrainageFait.filter(id => { const c = clients.find(x => x.id === id); return c && c.commandes.length > 0; }).length;
}
function fmtDate(str) { return new Date(str).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }); }
function clientScore(c, clients) { return c.commandes.length * 2 + filleulsActifsCount(c, clients) * 3; }
function pctColor(v) { return v >= 60 ? "#34C759" : "#FF3B30"; }
function getParrainageStatus(client, clients) {
  const a = filleulsActifsCount(client, clients);
  if (a >= 5 && client.produitGratuitOffert) return { color: "#8E8E93", label: "✓ Puff gratuit offert" };
  if (a >= 5) return { level: "gratuit", color: "#34C759", label: "🎁 Puff gratuit à offrir !" };
  if (a === 4 && client.relance2) return { color: "#8E8E93", label: "✓ Relancé 4/5" };
  if (a === 4) return { level: "relance2", color: "#FF9500", label: "⚡ À relancer — 4/5" };
  if (a >= 3 && client.produit5Offert) return { color: "#8E8E93", label: "✓ Puff 5€ offert" };
  if (a >= 3) return { level: "5eur", color: "#007AFF", label: "🏷 Puff à 5€ à offrir !" };
  if (a === 2 && client.relance1) return { color: "#8E8E93", label: "✓ Relancé 2/3" };
  if (a === 2) return { level: "relance1", color: "#FF9500", label: "⚡ À relancer — 2/3" };
  return null;
}
function needsAction(client, clients) {
  const a = filleulsActifsCount(client, clients);
  return (a === 2 && !client.relance1) || (a === 4 && !client.relance2);
}

// ─── LONG PRESS BUTTON ────────────────────────────────────────────────────────
function LPBtn({ onClick, children, className, style, disabled }) {
  const [pressed, setPressed] = useState(false);
  const t = useRef(null);
  const start = () => { setPressed(true); t.current = setTimeout(() => setPressed(false), 500); };
  const end = () => { setPressed(false); if (t.current) clearTimeout(t.current); };
  return (
    <button onClick={onClick} disabled={disabled} onMouseDown={start} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchEnd={end}
      className={className}
      style={{ ...style, transform: pressed ? "scale(0.94)" : "scale(1)", opacity: pressed ? 0.75 : disabled ? 0.4 : 1, transition: "transform 0.1s ease, opacity 0.1s ease" }}>
      {children}
    </button>
  );
}

// ─── WEEK SELECTOR ────────────────────────────────────────────────────────────
function WeekSelector({ weeks, current, onChange }) {
  const idx = weeks.indexOf(current);
  return (
    <div className="flex items-center justify-between my-2">
      <LPBtn onClick={() => idx > 0 && onChange(weeks[idx - 1])} disabled={idx === 0} className="w-8 h-8 rounded-full flex items-center justify-center text-xl" style={{ color: "#007AFF" }}>‹</LPBtn>
      <span className="text-xs font-semibold" style={{ color: "#3C3C43" }}>{weekLabel(current)}</span>
      <LPBtn onClick={() => idx < weeks.length - 1 && onChange(weeks[idx + 1])} disabled={idx === weeks.length - 1} className="w-8 h-8 rounded-full flex items-center justify-center text-xl" style={{ color: "#007AFF" }}>›</LPBtn>
    </div>
  );
}

// ─── DELETE MODAL ─────────────────────────────────────────────────────────────
function DeleteModal({ client, onConfirm, onCancel }) {
  const [keepHistory, setKeepHistory] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="w-full rounded-t-3xl p-5 space-y-4" style={{ background: "white" }}>
        <div className="w-10 h-1 rounded-full mx-auto" style={{ background: "#E5E5EA" }} />
        <div className="text-center"><div className="text-lg font-bold" style={{ color: "#1C1C1E" }}>Supprimer {client.prenom} ?</div><div className="text-sm mt-1" style={{ color: "#8E8E93" }}>Cette action est irréversible.</div></div>
        <LPBtn onClick={() => setKeepHistory(v => !v)} className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl" style={{ background: "#F2F2F7" }}>
          <div><div className="text-sm font-medium text-left" style={{ color: "#1C1C1E" }}>Garder l'historique des commandes</div><div className="text-xs text-left mt-0.5" style={{ color: "#8E8E93" }}>Le CA sera conservé dans les stats</div></div>
          <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center ml-3" style={keepHistory ? { background: "#007AFF", borderColor: "#007AFF" } : { borderColor: "#C7C7CC" }}>{keepHistory && <span className="text-white text-xs font-bold">✓</span>}</div>
        </LPBtn>
        <LPBtn onClick={() => onConfirm(keepHistory)} className="w-full py-4 rounded-2xl text-sm font-semibold text-white" style={{ background: "#FF3B30" }}>Supprimer</LPBtn>
        <LPBtn onClick={onCancel} className="w-full py-4 rounded-2xl text-sm font-semibold" style={{ background: "#F2F2F7", color: "#007AFF" }}>Annuler</LPBtn>
      </div>
    </div>
  );
}

// ─── STATS SUB-VIEW WRAPPER ───────────────────────────────────────────────────
function SubView({ title, onBack, children }) {
  return (
    <div className="space-y-4 pb-28">
      <div className="flex items-center gap-2 pt-2">
        <LPBtn onClick={onBack} className="flex items-center gap-1 text-sm font-medium" style={{ color: "#007AFF" }}><span className="text-lg">‹</span> Stats</LPBtn>
      </div>
      <h2 className="text-2xl font-bold" style={{ color: "#1C1C1E" }}>{title}</h2>
      {children}
    </div>
  );
}

// ─── PARRAINAGE TREE ──────────────────────────────────────────────────────────
function TreeNode({ clientId, clients, depth = 0 }) {
  const c = clients.find(x => x.id === clientId);
  if (!c) return null;
  const actifs = filleulsActifsCount(c, clients);
  const colors = ["linear-gradient(135deg,#007AFF,#34C759)", "linear-gradient(135deg,#FF9500,#FF3B30)", "linear-gradient(135deg,#AF52DE,#007AFF)", "linear-gradient(135deg,#34C759,#FFCC00)"];
  return (
    <div style={{ marginLeft: depth * 20 }}>
      <div className="flex items-center gap-2.5 py-2">
        {depth > 0 && <div style={{ width: 12, height: 2, background: "#E5E5EA", flexShrink: 0 }} />}
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: colors[depth % colors.length] }}>{c.prenom.charAt(0)}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: "#1C1C1E" }}>{c.prenom}</div>
          <div className="text-xs" style={{ color: "#8E8E93" }}>{c.commandes.length} cmd · {actifs} filleuls actifs</div>
        </div>
        {c.commandes.length > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#F0FDF4", color: "#34C759" }}>Actif</span>}
      </div>
      {c.parrainageFait.map(fid => <TreeNode key={fid} clientId={fid} clients={clients} depth={depth + 1} />)}
    </div>
  );
}

function ParrainageTree({ clients, onBack }) {
  const roots = clients.filter(c => c.parrainePar === null);
  return (
    <SubView title="Arbre de parrainage" onBack={onBack}>
      <div className="bg-white rounded-2xl shadow-sm p-4">
        {roots.length > 0 ? roots.map(r => <TreeNode key={r.id} clientId={r.id} clients={clients} />) : (
          <div className="py-8 text-center text-sm" style={{ color: "#C7C7CC" }}>Aucun client.</div>
        )}
      </div>
    </SubView>
  );
}

// ─── MEILLEURS CLIENTS ────────────────────────────────────────────────────────
function MeilleursClients({ clients, onBack }) {
  const ranked = [...clients].sort((a, b) => clientScore(b, clients) - clientScore(a, clients));
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <SubView title="Meilleurs clients" onBack={onBack}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {ranked.map((c, i) => {
          const score = clientScore(c, clients);
          const actifs = filleulsActifsCount(c, clients);
          return (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3.5 border-b last:border-0" style={{ borderColor: "#F2F2F7" }}>
              <div className="text-xl w-7 text-center flex-shrink-0">{medals[i] || <span className="text-sm font-bold" style={{ color: "#C7C7CC" }}>#{i + 1}</span>}</div>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ background: i === 0 ? "linear-gradient(135deg,#FF9500,#FFCC00)" : i === 1 ? "linear-gradient(135deg,#8E8E93,#C7C7CC)" : i === 2 ? "linear-gradient(135deg,#FF6B35,#FF9500)" : "linear-gradient(135deg,#007AFF,#34C759)" }}>
                {c.prenom.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold" style={{ color: "#1C1C1E" }}>{c.prenom}</div>
                <div className="text-xs" style={{ color: "#8E8E93" }}>{c.commandes.length} cmd · {actifs} filleuls · {c.commandes.reduce((s, x) => s + cmdCA(x), 0)}€</div>
              </div>
              <div className="text-base font-bold" style={{ color: "#007AFF" }}>{score}pts</div>
            </div>
          );
        })}
      </div>
      <div className="text-xs px-1" style={{ color: "#C7C7CC" }}>Score = commandes ×2 + filleuls actifs ×3</div>
    </SubView>
  );
}

// ─── CLIENT DETAIL ────────────────────────────────────────────────────────────
function ClientDetail({ client, clients, stock, flavors, onBack, onAddCommande, onAddParrainage, onToggle, onDelete }) {
  const [showCmd, setShowCmd] = useState(false);
  const [showParr, setShowParr] = useState(false);
  const [showDel, setShowDel] = useState(false);
  const [gout, setGout] = useState(flavors[0]?.id || "");
  const [qty, setQty] = useState(1);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [livraison, setLivraison] = useState(false);
  const [parrId, setParrId] = useState("");
  const [copied, setCopied] = useState(false);
  const [snapCopied, setSnapCopied] = useState(false);
  const [mapPopup, setMapPopup] = useState(false);
  const pressTimer = useRef(null);
  const didLong = useRef(false);

  const getC = id => clients.find(c => c.id === id);
  const parrain = client.parrainePar ? getC(client.parrainePar) : null;
  const fav = getFav(client.commandes, flavors);
  const last = lastOrder(client.commandes);
  const inactive = last && daysSince(last.date) > 15;
  const actifs = filleulsActifsCount(client, clients);
  const parrStatus = getParrainageStatus(client, clients);
  const filleulsOui = client.parrainageFait.filter(id => getC(id)?.commandes.length > 0);
  const filleulsNon = client.parrainageFait.filter(id => !getC(id)?.commandes.length);
  const ca = client.commandes.reduce((s, c) => s + cmdCA(c), 0);
  const benef = client.commandes.reduce((s, c) => s + cmdBenef(c), 0);
  const totalUnites = client.commandes.reduce((s, c) => s + c.quantite, 0);
  const selF = flavors.find(f => f.id === gout);
  const cmdPrice = PRIX_VENTE + (livraison ? 5 : 0);

  const handleAddrClick = () => { if (didLong.current) { didLong.current = false; return; } if (!client.adresse) return; navigator.clipboard?.writeText(client.adresse); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const addrStart = () => { didLong.current = false; pressTimer.current = setTimeout(() => { didLong.current = true; setMapPopup(true); }, 600); };
  const addrEnd = () => { if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; } };
  const copySnap = () => { navigator.clipboard?.writeText(client.snap); setSnapCopied(true); setTimeout(() => setSnapCopied(false), 2000); };
  const submitCmd = () => { onAddCommande(client.id, { gout, quantite: qty, date, livraison }); setShowCmd(false); setQty(1); setLivraison(false); };
  const submitParr = () => { if (!parrId) return; onAddParrainage(client.id, parseInt(parrId)); setShowParr(false); setParrId(""); };
  const ROW = "flex items-center gap-3 px-4 py-3.5 border-b last:border-0";

  return (
    <div className="space-y-5 pb-28" style={{ background: "#F2F2F7", minHeight: "100vh" }}>
      {showDel && <DeleteModal client={client} onCancel={() => setShowDel(false)} onConfirm={(k) => { onDelete(client.id, k); setShowDel(false); }} />}
      {mapPopup && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setMapPopup(false)}>
          <div className="w-full rounded-t-3xl p-5 space-y-3" style={{ background: "white" }} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto" style={{ background: "#E5E5EA" }} />
            <div className="text-sm font-semibold text-center" style={{ color: "#1C1C1E" }}>Ouvrir avec</div>
            <div className="text-xs text-center px-4 py-2 rounded-xl" style={{ background: "#F2F2F7", color: "#8E8E93" }}>📍 {client.adresse}</div>
            <LPBtn onClick={() => { window.open(`https://waze.com/ul?q=${encodeURIComponent(client.adresse)}`, "_blank"); setMapPopup(false); }} className="w-full py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2" style={{ background: "#007AFF15", color: "#007AFF", border: "1px solid #007AFF30" }}>🔵 Waze</LPBtn>
            <LPBtn onClick={() => { window.open(`https://maps.google.com/?q=${encodeURIComponent(client.adresse)}`, "_blank"); setMapPopup(false); }} className="w-full py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2" style={{ background: "#34C75915", color: "#34C759", border: "1px solid #34C75930" }}>🟢 Google Maps</LPBtn>
            <LPBtn onClick={() => setMapPopup(false)} className="w-full py-3.5 rounded-2xl text-sm font-semibold" style={{ background: "#F2F2F7", color: "#8E8E93" }}>Annuler</LPBtn>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 pb-1">
        <LPBtn onClick={onBack} className="flex items-center gap-1 text-sm font-medium" style={{ color: "#007AFF" }}><span className="text-lg">‹</span> Clients</LPBtn>
        <LPBtn onClick={() => setShowDel(true)} className="text-sm font-medium px-3 py-1.5 rounded-full" style={{ color: "#FF3B30", background: "#FFF1F0" }}>Supprimer</LPBtn>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-2xl shadow-sm p-5" style={{ WebkitUserSelect: "none", userSelect: "none" }}>
        <div className="flex gap-4 items-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0" style={{ background: "linear-gradient(135deg,#007AFF,#34C759)" }}>{client.prenom.charAt(0)}</div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-xl" style={{ color: "#1C1C1E" }}>{client.prenom}</div>
            {client.snap && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm" style={{ color: "#FFCC00" }}>👻 {client.snap}</span>
                <LPBtn onClick={copySnap} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: snapCopied ? "#34C75920" : "#F2F2F7", color: snapCopied ? "#34C759" : "#8E8E93" }}>{snapCopied ? "Copié ✓" : "Copier"}</LPBtn>
              </div>
            )}
            {client.telephone && <div className="text-sm" style={{ color: "#8E8E93" }}>{client.telephone}</div>}
          </div>
        </div>
        {client.adresse && (
          <button onMouseDown={addrStart} onMouseUp={addrEnd} onMouseLeave={addrEnd} onTouchStart={addrStart} onTouchEnd={addrEnd} onClick={handleAddrClick}
            className="mt-3 w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left"
            style={{ background: copied ? "#F0FDF4" : "#F2F2F7", WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none" }}>
            <span>📍</span>
            <span className="text-xs flex-1" style={{ color: copied ? "#34C759" : "#3C3C43" }}>{copied ? "Adresse copiée ✓" : client.adresse}</span>
            <span className="text-[10px]" style={{ color: "#C7C7CC" }}>Tap · Hold</span>
          </button>
        )}
        <div className="flex gap-2 mt-3 flex-wrap">
          <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: client.commandes.length > 0 ? "#F0FDF4" : "#F2F2F7", color: client.commandes.length > 0 ? "#34C759" : "#8E8E93" }}>{client.commandes.length > 0 ? "● Actif" : "○ Inscrit"}</span>
          {inactive && <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#FFF1F0", color: "#FF3B30" }}>Inactif {daysSince(last.date)}j</span>}
          {client.parrainePar && <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#EBF5FF", color: "#007AFF" }}>Filleul de {parrain?.prenom}</span>}
        </div>
        <div className="text-xs mt-2" style={{ color: "#C7C7CC" }}>Inscrit le {fmtDate(client.dateInscription)}</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[{ label: "Commandes", val: client.commandes.length, color: "#34C759" }, { label: "CA total", val: `${ca}€`, color: "#007AFF" }, { label: "Bénéfice", val: `${benef.toFixed(0)}€`, color: "#FF9500" }].map(s => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm p-4 text-center">
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.val}</div>
            <div className="text-[10px] mt-0.5" style={{ color: "#8E8E93" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {(fav || last) && (
        <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center gap-3">
          {fav && <span className="text-2xl">{fav.emoji}</span>}
          <div className="flex-1">{fav && <div className="text-sm font-semibold" style={{ color: "#1C1C1E" }}>Préféré : <span style={{ color: fav.color }}>{fav.label}</span></div>}{last && <div className="text-xs" style={{ color: "#8E8E93" }}>Dernier achat : {fmtDate(last.date)}</div>}</div>
        </div>
      )}

      {/* Parrainage status */}
      {parrStatus && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: `${parrStatus.color}15`, border: `1px solid ${parrStatus.color}30` }}>
          <div className="text-sm font-semibold" style={{ color: parrStatus.color }}>{parrStatus.label}</div>
          <div className="flex gap-2 flex-wrap">
            {actifs === 2 && <LPBtn onClick={() => onToggle(client.id, "relance1")} className="flex-1 py-2 rounded-xl text-xs font-semibold border" style={client.relance1 ? { background: "#8E8E9320", color: "#8E8E93", borderColor: "#8E8E9340" } : { background: "#FF950020", color: "#FF9500", borderColor: "#FF950040" }}>{client.relance1 ? "✓ Relancé" : "Marquer relancé"}</LPBtn>}
            {actifs >= 3 && !client.produit5Offert && <LPBtn onClick={() => onToggle(client.id, "produit5Offert")} className="flex-1 py-2 rounded-xl text-xs font-semibold border" style={{ background: "#007AFF20", color: "#007AFF", borderColor: "#007AFF40" }}>Puff 5€ offert</LPBtn>}
            {actifs === 4 && <LPBtn onClick={() => onToggle(client.id, "relance2")} className="flex-1 py-2 rounded-xl text-xs font-semibold border" style={client.relance2 ? { background: "#8E8E9320", color: "#8E8E93", borderColor: "#8E8E9340" } : { background: "#FF950020", color: "#FF9500", borderColor: "#FF950040" }}>{client.relance2 ? "✓ Relancé" : "Marquer relancé"}</LPBtn>}
            {actifs >= 5 && !client.produitGratuitOffert && <LPBtn onClick={() => onToggle(client.id, "produitGratuitOffert")} className="flex-1 py-2 rounded-xl text-xs font-semibold border" style={{ background: "#34C75920", color: "#34C759", borderColor: "#34C75940" }}>Puff gratuit offert</LPBtn>}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs" style={{ color: "#8E8E93" }}><span>{actifs} filleuls actifs</span><span>{Math.min(actifs, 5)}/5</span></div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E5EA" }}><div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (actifs / 5) * 100)}%`, background: parrStatus.color }} /></div>
            <div className="flex justify-between text-[10px]" style={{ color: "#C7C7CC" }}><span>0</span><span>3 → 5€</span><span>5 → gratuit</span></div>
          </div>
        </div>
      )}

      {/* Commandes */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-sm font-semibold" style={{ color: "#3C3C43" }}>Commandes</span>
          <LPBtn onClick={() => { setShowCmd(v => !v); setShowParr(false); }} className="text-sm font-medium" style={{ color: "#007AFF" }}>{showCmd ? "Annuler" : "+ Nouvelle"}</LPBtn>
        </div>
        {showCmd && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-3 space-y-4">
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: "#8E8E93" }}>GOÛT</div>
              <div className="grid grid-cols-3 gap-2">
                {flavors.map(f => (
                  <LPBtn key={f.id} onClick={() => setGout(f.id)} className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold border"
                    style={gout === f.id ? { background: f.bg, borderColor: f.color, color: f.color } : { background: "#F2F2F7", borderColor: "transparent", color: "#8E8E93" }}>
                    <span className="text-xl">{f.emoji}</span>{f.label}
                  </LPBtn>
                ))}
              </div>
              {selF && <div className="text-xs mt-2" style={{ color: (stock[selF.id] || 0) < qty ? "#FF3B30" : "#8E8E93" }}>Stock {selF.label} : <span className="font-semibold">{stock[selF.id] || 0}</span>{qty > (stock[selF.id] || 0) && " — insuffisant ⚠"}</div>}
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="text-xs font-semibold mb-2" style={{ color: "#8E8E93" }}>QUANTITÉ</div>
                <div className="flex items-center gap-2">
                  <LPBtn onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-full flex items-center justify-center text-lg" style={{ background: "#F2F2F7", color: "#007AFF" }}>−</LPBtn>
                  <span className="w-8 text-center font-bold text-lg" style={{ color: "#1C1C1E" }}>{qty}</span>
                  <LPBtn onClick={() => setQty(q => q + 1)} className="w-9 h-9 rounded-full flex items-center justify-center text-lg" style={{ background: "#F2F2F7", color: "#007AFF" }}>+</LPBtn>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold mb-2" style={{ color: "#8E8E93" }}>DATE</div>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full text-sm rounded-xl px-3 py-2 outline-none" style={{ background: "#F2F2F7", color: "#1C1C1E" }} />
              </div>
            </div>
            <LPBtn onClick={() => setLivraison(l => !l)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl border"
              style={livraison ? { background: "#EBF5FF", borderColor: "#007AFF40", color: "#007AFF" } : { background: "#F2F2F7", borderColor: "transparent", color: "#3C3C43" }}>
              <div className="flex items-center gap-2"><span>🚚</span><span className="text-sm font-medium">Livraison +5€</span></div>
              <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={livraison ? { background: "#007AFF", borderColor: "#007AFF" } : { borderColor: "#C7C7CC" }}>{livraison && <span className="text-white text-xs font-bold">✓</span>}</div>
            </LPBtn>
            <div className="flex items-center justify-between px-1">
              <span className="text-sm" style={{ color: "#8E8E93" }}>Prix commande</span>
              <span className="text-lg font-bold" style={{ color: "#34C759" }}>{cmdPrice}€</span>
            </div>
            <LPBtn onClick={submitCmd} disabled={qty > (stock[gout] || 0)} className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white" style={{ background: qty > (stock[gout] || 0) ? "#C7C7CC" : "#007AFF" }}>Enregistrer la commande</LPBtn>
          </div>
        )}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {client.commandes.length > 0 ? [...client.commandes].reverse().map((cmd, i) => {
            const f = flavors.find(fl => fl.id === cmd.gout);
            return (
              <div key={i} className={ROW} style={{ borderColor: "#F2F2F7" }}>
                <span className="text-2xl">{f?.emoji || "📦"}</span>
                <div className="flex-1"><div className="text-sm font-medium" style={{ color: "#1C1C1E" }}>{f?.label || cmd.gout}{cmd.livraison ? " · 🚚" : ""}</div><div className="text-xs" style={{ color: "#8E8E93" }}>{fmtDate(cmd.date)}</div></div>
                <div className="text-right"><div className="text-sm font-semibold" style={{ color: "#1C1C1E" }}>×{cmd.quantite}</div><div className="text-xs font-medium" style={{ color: "#34C759" }}>{cmdCA(cmd)}€</div></div>
              </div>
            );
          }) : <div className="px-4 py-8 text-center text-sm" style={{ color: "#C7C7CC" }}>Aucune commande</div>}
        </div>
      </div>

      {/* Parrainage */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-sm font-semibold" style={{ color: "#3C3C43" }}>Parrainage</span>
          <LPBtn onClick={() => { setShowParr(v => !v); setShowCmd(false); }} className="text-sm font-medium" style={{ color: "#007AFF" }}>{showParr ? "Annuler" : "+ Filleul"}</LPBtn>
        </div>
        {showParr && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-3 space-y-3">
            <select value={parrId} onChange={e => setParrId(e.target.value)} className="w-full text-sm px-4 py-3 rounded-xl outline-none" style={{ background: "#F2F2F7", color: "#1C1C1E" }}>
              <option value="">— Choisir un client —</option>
              {clients.filter(c => c.id !== client.id && c.parrainePar === null).map(c => <option key={c.id} value={c.id}>{c.prenom}</option>)}
            </select>
            <LPBtn onClick={submitParr} disabled={!parrId} className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white" style={{ background: !parrId ? "#C7C7CC" : "#FF9500" }}>Enregistrer le parrainage</LPBtn>
          </div>
        )}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className={ROW} style={{ borderColor: "#F2F2F7" }}><span className="text-xl" style={{ color: "#007AFF" }}>👥</span><div className="flex-1 text-sm" style={{ color: "#1C1C1E" }}>{actifs}/{client.parrainageFait.length} filleuls ont commandé</div></div>
          {filleulsOui.map(id => { const f = getC(id); if (!f) return null; return (<div key={id} className={ROW} style={{ borderColor: "#F2F2F7" }}><div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: "linear-gradient(135deg,#34C759,#007AFF)" }}>{f.prenom.charAt(0)}</div><div className="flex-1 min-w-0"><div className="text-sm font-medium truncate" style={{ color: "#1C1C1E" }}>{f.prenom}</div><div className="text-xs" style={{ color: "#34C759" }}>{f.commandes.length} commande{f.commandes.length > 1 ? "s" : ""}</div></div></div>); })}
          {filleulsNon.map(id => { const f = getC(id); if (!f) return null; return (<div key={id} className={ROW} style={{ borderColor: "#F2F2F7" }}><div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: "#F2F2F7", color: "#C7C7CC" }}>{f.prenom.charAt(0)}</div><div className="flex-1 min-w-0"><div className="text-sm truncate" style={{ color: "#8E8E93" }}>{f.prenom}</div><div className="text-xs" style={{ color: "#C7C7CC" }}>Pas encore commandé</div></div></div>); })}
          {client.parrainageFait.length === 0 && <div className="px-4 py-6 text-center text-sm" style={{ color: "#C7C7CC" }}>Aucun filleul</div>}
        </div>
      </div>
    </div>
  );
}

// ─── STOCK PAGE ───────────────────────────────────────────────────────────────
function StockPage({ stock, flavors, onUpdate, onUpdateFlavors }) {
  const [screenMode, setScreenMode] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("🍎");
  const [newColor, setNewColor] = useState("#007AFF");
  const [editId, setEditId] = useState(null);
  const [editLabel, setEditLabel] = useState("");

  const addFlavor = () => {
    if (!newLabel.trim()) return;
    const id = newLabel.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();
    onUpdateFlavors([...flavors, { id, label: newLabel.trim(), emoji: newEmoji, color: newColor, bg: newColor + "20" }]);
    setNewLabel(""); setNewEmoji("🍎"); setNewColor("#007AFF");
  };
  const deleteFlavor = id => onUpdateFlavors(flavors.filter(f => f.id !== id));
  const saveEdit = id => { onUpdateFlavors(flavors.map(f => f.id === id ? { ...f, label: editLabel } : f)); setEditId(null); };

  // FIX: total only counts flavors in current list
  const total = flavors.reduce((s, f) => s + (stock[f.id] || 0), 0);
  const available = flavors.filter(f => (stock[f.id] || 0) > 0);

  if (screenMode) {
    const n = available.length;
    const tSz = n <= 3 ? "1.8rem" : n <= 5 ? "1.4rem" : "1.1rem";
    const nSz = n <= 3 ? "3.5rem" : n <= 5 ? "2.8rem" : "2rem";
    const py = n <= 3 ? "1.5rem" : n <= 5 ? "1rem" : "0.6rem";
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "white" }}>
        <div className="flex justify-end px-5" style={{ paddingTop: "env(safe-area-inset-top, 44px)" }}>
          <LPBtn onClick={() => setScreenMode(false)} className="text-sm font-medium px-4 py-2 rounded-full mt-2" style={{ background: "#F2F2F7", color: "#007AFF" }}>Fermer</LPBtn>
        </div>
        <div className="flex-1 flex flex-col justify-center px-8">
          {available.map((f, i) => (
            <div key={f.id} className="flex items-center justify-between" style={{ paddingTop: py, paddingBottom: py, borderBottom: i < available.length - 1 ? "1px solid #F2F2F7" : "none" }}>
              <div className="flex items-center gap-3"><span style={{ fontSize: tSz }}>{f.emoji}</span><span style={{ fontSize: tSz, fontWeight: 700, color: "#1C1C1E" }}>{f.label}</span></div>
              <span style={{ fontSize: nSz, fontWeight: 700, color: f.color }}>{stock[f.id] || 0}</span>
            </div>
          ))}
          {!available.length && <div className="text-center text-lg font-medium" style={{ color: "#C7C7CC" }}>Aucun stock</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-28">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "#1C1C1E" }}>Stock</h2>
          <p className="text-sm" style={{ color: "#8E8E93" }}>{total} puffs au total</p>
        </div>
        <div className="flex gap-2">
          <LPBtn onClick={() => setManageMode(v => !v)} className="px-3 py-2 rounded-xl text-sm font-medium" style={{ background: "white", color: "#3C3C43", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>⚙️</LPBtn>
          <LPBtn onClick={() => setScreenMode(true)} className="px-3 py-2 rounded-xl text-sm font-medium" style={{ background: "white", color: "#3C3C43", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>📋</LPBtn>
        </div>
      </div>

      {manageMode && (
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div className="text-sm font-semibold" style={{ color: "#3C3C43" }}>Gérer les goûts</div>
          {flavors.map(f => (
            <div key={f.id} className="flex items-center gap-2">
              <span className="text-xl flex-shrink-0">{f.emoji}</span>
              {editId === f.id ? (
                <>
                  <input value={editLabel} onChange={e => setEditLabel(e.target.value)} className="flex-1 text-sm px-3 py-1.5 rounded-xl outline-none" style={{ background: "#F2F2F7", color: "#1C1C1E", WebkitUserSelect: "text", userSelect: "text" }} />
                  <LPBtn onClick={() => saveEdit(f.id)} className="text-xs font-semibold px-3 py-1.5 rounded-xl" style={{ background: "#34C75920", color: "#34C759" }}>✓</LPBtn>
                  <LPBtn onClick={() => setEditId(null)} className="text-xs px-2 py-1.5 rounded-xl" style={{ background: "#F2F2F7", color: "#8E8E93" }}>✕</LPBtn>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm" style={{ color: "#1C1C1E" }}>{f.label}</span>
                  <LPBtn onClick={() => { setEditId(f.id); setEditLabel(f.label); }} className="text-xs px-3 py-1.5 rounded-xl" style={{ background: "#007AFF20", color: "#007AFF" }}>Modifier</LPBtn>
                  <LPBtn onClick={() => deleteFlavor(f.id)} className="text-xs px-2 py-1.5 rounded-xl" style={{ background: "#FF3B3020", color: "#FF3B30" }}>✕</LPBtn>
                </>
              )}
            </div>
          ))}
          <div className="border-t pt-3" style={{ borderColor: "#F2F2F7" }}>
            <div className="text-xs font-semibold mb-2" style={{ color: "#8E8E93" }}>AJOUTER UN GOÛT</div>
            <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Nom du goût" className="w-full text-sm px-3 py-2 rounded-xl outline-none mb-3" style={{ background: "#F2F2F7", color: "#1C1C1E", WebkitUserSelect: "text", userSelect: "text" }} />
            <div className="space-y-1.5 mb-3">
              <div className="text-xs font-semibold" style={{ color: "#8E8E93" }}>EMOJI(S)</div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: "#F2F2F7" }}>{newEmoji || "?"}</div>
                <div className="flex-1">
                  <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)} placeholder="Colle ton emoji ici 🍎" className="w-full text-sm px-3 py-2.5 rounded-xl outline-none" style={{ background: "#F2F2F7", color: "#1C1C1E", WebkitUserSelect: "text", userSelect: "text" }} />
                  <div className="text-[10px] mt-1" style={{ color: "#C7C7CC" }}>1, 2, 3 emojis · Genmoji Apple ✓</div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mb-3 flex-wrap">
              {FLAVOR_COLORS.map(c => <LPBtn key={c} onClick={() => setNewColor(c)} className="w-7 h-7 rounded-full border-2" style={{ background: c, borderColor: newColor === c ? "#1C1C1E" : "transparent" }} />)}
            </div>
            <LPBtn onClick={addFlavor} disabled={!newLabel.trim()} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: newLabel.trim() ? "#007AFF" : "#C7C7CC" }}>
              Ajouter {newEmoji} {newLabel || "..."}
            </LPBtn>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {flavors.map(f => {
          const q = stock[f.id] || 0;
          return (
            <div key={f.id} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="text-2xl">{f.emoji}</span><span className="text-sm font-semibold" style={{ color: "#1C1C1E" }}>{f.label}</span></div>
                <span className="text-2xl font-bold" style={{ color: f.color }}>{q}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F2F2F7" }}><div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (q / 20) * 100)}%`, background: f.color }} /></div>
              <div className="flex gap-2">
                <LPBtn onClick={() => onUpdate(f.id, -1)} disabled={q === 0} className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{ background: "#FFF1F0", color: "#FF3B30" }}>−1</LPBtn>
                <LPBtn onClick={() => onUpdate(f.id, 1)} className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{ background: "#F0FDF4", color: "#34C759" }}>+1</LPBtn>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── INFOS PAGE ───────────────────────────────────────────────────────────────
function InfosPage({ voitures, setVoitures, trajets, setTrajets }) {
  const [activeVoiture, setActiveVoiture] = useState(() => { try { return parseInt(localStorage.getItem("dg_active_voiture") || "1"); } catch { return 1; } });
  const [essencePrice, setEssencePrice] = useState(null);
  const [loadingEssence, setLoadingEssence] = useState(false);
  const [showAddVoiture, setShowAddVoiture] = useState(false);
  const [newVoiture, setNewVoiture] = useState({ nom: "", conso: "", essence: "SP95" });
  const [km, setKm] = useState("");
  const [showHistorique, setShowHistorique] = useState(false);

  useEffect(() => { localStorage.setItem("dg_active_voiture", activeVoiture); }, [activeVoiture]);

  const fetchEssence = async () => {
    setLoadingEssence(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 100,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: "Prix moyen actuel du litre de SP95 en France en euros aujourd'hui. Réponds uniquement avec le nombre décimal, exemple: 1.72" }]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      const match = text.match(/(\d+[.,]\d+)/);
      setEssencePrice(match ? parseFloat(match[1].replace(",", ".")) : 1.95);
    } catch { setEssencePrice(1.95); }
    setLoadingEssence(false);
  };

  useEffect(() => { fetchEssence(); }, []);

  const voiture = voitures.find(v => v.id === activeVoiture) || voitures[0];
  const coutKm = voiture && essencePrice ? (voiture.conso / 100) * essencePrice : null;
  const totalEssence = trajets.reduce((s, t) => s + t.cout, 0);

  const enregistrerTrajet = () => {
    if (!km || !voiture || !coutKm) return;
    const distance = parseFloat(km);
    const cout = parseFloat((distance * coutKm).toFixed(2));
    setTrajets(prev => [{ id: Date.now(), date: new Date().toISOString().split("T")[0], km: distance, cout, voitureNom: voiture.nom, prixEssence: essencePrice }, ...prev]);
    setKm("");
  };

  const addVoiture = () => {
    if (!newVoiture.nom.trim() || !newVoiture.conso) return;
    const v = { id: Date.now(), nom: newVoiture.nom, conso: parseFloat(newVoiture.conso), essence: newVoiture.essence };
    setVoitures(prev => [...prev, v]);
    setActiveVoiture(v.id);
    setNewVoiture({ nom: "", conso: "", essence: "SP95" });
    setShowAddVoiture(false);
  };

  const ROW = "flex items-center gap-3 px-4 py-3.5 border-b last:border-0";

  return (
    <div className="space-y-5 pb-28">
      {/* Prix essence */}
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold" style={{ color: "#3C3C43" }}>⛽ Prix essence actuel</div>
          <LPBtn onClick={fetchEssence} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: "#007AFF15", color: "#007AFF" }}>{loadingEssence ? "…" : "Actualiser"}</LPBtn>
        </div>
        {essencePrice ? (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold" style={{ color: "#FF9500" }}>{essencePrice.toFixed(2)}€</span>
            <span className="text-sm" style={{ color: "#8E8E93" }}>/ litre · SP95</span>
          </div>
        ) : <div className="text-sm animate-pulse" style={{ color: "#C7C7CC" }}>Chargement…</div>}
      </div>

      {/* Voitures */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-sm font-semibold" style={{ color: "#3C3C43" }}>🚗 Mes voitures</span>
          <LPBtn onClick={() => setShowAddVoiture(v => !v)} className="text-sm font-medium" style={{ color: "#007AFF" }}>{showAddVoiture ? "Annuler" : "+ Ajouter"}</LPBtn>
        </div>
        {showAddVoiture && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-3 space-y-3">
            <input value={newVoiture.nom} onChange={e => setNewVoiture(p => ({ ...p, nom: e.target.value }))} placeholder="Modèle (ex: Peugeot 207)" className="w-full text-sm px-3 py-2.5 rounded-xl outline-none" style={{ background: "#F2F2F7", color: "#1C1C1E", WebkitUserSelect: "text", userSelect: "text" }} />
            <input type="number" value={newVoiture.conso} onChange={e => setNewVoiture(p => ({ ...p, conso: e.target.value }))} placeholder="Consommation aux 100km (ex: 6.5)" className="w-full text-sm px-3 py-2.5 rounded-xl outline-none" style={{ background: "#F2F2F7", color: "#1C1C1E", WebkitUserSelect: "text", userSelect: "text" }} />
            <select value={newVoiture.essence} onChange={e => setNewVoiture(p => ({ ...p, essence: e.target.value }))} className="w-full text-sm px-3 py-2.5 rounded-xl outline-none" style={{ background: "#F2F2F7", color: "#1C1C1E" }}>
              <option>SP95</option><option>SP98</option><option>Diesel</option><option>E10</option>
            </select>
            <LPBtn onClick={addVoiture} disabled={!newVoiture.nom.trim() || !newVoiture.conso} className="w-full py-3 rounded-2xl text-sm font-semibold text-white" style={{ background: "#007AFF" }}>Enregistrer</LPBtn>
          </div>
        )}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {voitures.map(v => (
            <LPBtn key={v.id} onClick={() => setActiveVoiture(v.id)} className={ROW + " w-full text-left"} style={{ borderColor: "#F2F2F7" }}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: "#1C1C1E" }}>{v.nom}</div>
                <div className="text-xs" style={{ color: "#8E8E93" }}>{v.conso}L/100km · {v.essence}</div>
              </div>
              {activeVoiture === v.id && <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "#007AFF" }}>✓</div>}
            </LPBtn>
          ))}
        </div>
      </div>

      {/* Enregistrer trajet */}
      {voiture && coutKm && (
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <div className="text-sm font-semibold" style={{ color: "#3C3C43" }}>📍 Enregistrer un trajet</div>
          <div className="rounded-xl px-3 py-2.5" style={{ background: "#F2F2F7" }}>
            <div className="text-xs" style={{ color: "#8E8E93" }}>Voiture : <span style={{ color: "#1C1C1E", fontWeight: 600 }}>{voiture.nom}</span></div>
            <div className="text-xs mt-0.5" style={{ color: "#8E8E93" }}>Coût au km : <span style={{ color: "#FF9500", fontWeight: 600 }}>{coutKm.toFixed(3)}€</span></div>
          </div>
          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: "#8E8E93" }}>DISTANCE (KM)</div>
            <input type="number" value={km} onChange={e => setKm(e.target.value)} placeholder="ex: 12.5" className="w-full text-sm px-4 py-3 rounded-xl outline-none" style={{ background: "#F2F2F7", color: "#1C1C1E", WebkitUserSelect: "text", userSelect: "text" }} />
          </div>
          {km && parseFloat(km) > 0 && (
            <div className="flex items-center justify-between px-1">
              <span className="text-sm" style={{ color: "#8E8E93" }}>Coût estimé</span>
              <span className="text-2xl font-bold" style={{ color: "#FF3B30" }}>{(parseFloat(km) * coutKm).toFixed(2)}€</span>
            </div>
          )}
          <LPBtn onClick={enregistrerTrajet} disabled={!km} className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white" style={{ background: !km ? "#C7C7CC" : "#007AFF" }}>Enregistrer le trajet</LPBtn>
        </div>
      )}

      {/* Total essence */}
      {trajets.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold" style={{ color: "#3C3C43" }}>Total essence dépensé</div>
            <div className="text-xs" style={{ color: "#8E8E93" }}>{trajets.length} trajet{trajets.length > 1 ? "s" : ""}</div>
          </div>
          <div className="text-2xl font-bold" style={{ color: "#FF3B30" }}>{totalEssence.toFixed(2)}€</div>
        </div>
      )}

      {/* Historique */}
      {trajets.length > 0 && (
        <div>
          <LPBtn onClick={() => setShowHistorique(v => !v)} className="flex items-center justify-between w-full px-1 mb-2">
            <span className="text-sm font-semibold" style={{ color: "#3C3C43" }}>Historique des trajets</span>
            <span className="text-sm" style={{ color: "#007AFF" }}>{showHistorique ? "Masquer" : "Voir tout"}</span>
          </LPBtn>
          {showHistorique && (
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              {trajets.map(t => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3.5 border-b last:border-0" style={{ borderColor: "#F2F2F7" }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: "#1C1C1E" }}>{t.km} km · {t.voitureNom}</div>
                    <div className="text-xs" style={{ color: "#8E8E93" }}>{fmtDate(t.date)} · {t.prixEssence?.toFixed(2)}€/L</div>
                  </div>
                  <div className="text-sm font-bold" style={{ color: "#FF3B30" }}>{t.cout.toFixed(2)}€</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── STATS PAGE ───────────────────────────────────────────────────────────────
function StatsPage({ clients, flavors }) {
  const [section, setSection] = useState(null);
  const allCmds = clients.flatMap(c => c.commandes);
  const weeks = allWeeksFromClients(clients);
  const lastWeek = weeks[weeks.length - 1] || getWeekKey(new Date().toISOString());
  const [weekSel, setWeekSel] = useState(lastWeek);
  const [weekConv, setWeekConv] = useState(lastWeek);

  const totalCAAll = allCmds.reduce((s, c) => s + cmdCA(c), 0);
  const totalBenefAll = allCmds.reduce((s, c) => s + cmdBenef(c), 0);
  const totalLivCA = allCmds.filter(c => c.livraison).length * 5;
  const totalProdCA = totalCAAll - totalLivCA;
  const caByWeek = {};
  allCmds.forEach(c => { const w = getWeekKey(c.date); caByWeek[w] = (caByWeek[w] || 0) + cmdCA(c); });
  const bestWeekEntry = Object.entries(caByWeek).sort((a, b) => b[1] - a[1])[0];
  const weekCmds = allCmds.filter(c => getWeekKey(c.date) === weekSel);
  const weekCAVal = weekCmds.reduce((s, c) => s + cmdCA(c), 0);
  const weekLivCA = weekCmds.filter(c => c.livraison).length * 5;
  const weekProdCA = weekCAVal - weekLivCA;
  const weekNewClients = clients.filter(c => getWeekKey(c.dateInscription) === weekSel).length;
  const totalClients = clients.length;
  const clientsActifs = clients.filter(c => c.commandes.length > 0).length;
  const tauxCliGlobal = totalClients > 0 ? parseFloat(((clientsActifs / totalClients) * 100).toFixed(1)) : 0;
  const weekCliAll = clients.filter(c => getWeekKey(c.dateInscription) === weekConv);
  const weekCliActifs = weekCliAll.filter(c => c.commandes.length > 0).length;
  const tauxCliWeek = weekCliAll.length > 0 ? parseFloat(((weekCliActifs / weekCliAll.length) * 100).toFixed(1)) : 0;
  const allFilleuls = clients.filter(c => c.parrainePar !== null);
  const filleulsActifsG = allFilleuls.filter(c => c.commandes.length > 0).length;
  const tauxFilGlobal = allFilleuls.length > 0 ? parseFloat(((filleulsActifsG / allFilleuls.length) * 100).toFixed(1)) : 0;
  const weekFil = allFilleuls.filter(c => getWeekKey(c.dateInscription) === weekConv);
  const weekFilActifs = weekFil.filter(c => c.commandes.length > 0).length;
  const tauxFilWeek = weekFil.length > 0 ? parseFloat(((weekFilActifs / weekFil.length) * 100).toFixed(1)) : 0;
  const topParrains = clients.filter(c => filleulsActifsCount(c, clients) >= 3);
  const fideles = clients.filter(c => c.commandes.length >= 2).length;
  const tauxFid = totalClients > 0 ? parseFloat(((fideles / totalClients) * 100).toFixed(1)) : 0;
  const graphWeeks = weeks.slice(-8);
  const maxG = Math.max(...graphWeeks.map(w => caByWeek[w] || 0), 1);
  const W = weeks.length ? weeks : [lastWeek];

  const ProgressBar = ({ val, color, label, sub }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between"><span className="text-sm" style={{ color: "#3C3C43" }}>{label}</span><span className="text-sm font-bold" style={{ color }}>{val}%</span></div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F2F2F7" }}><div className="h-full rounded-full transition-all" style={{ width: `${val}%`, background: color }} /></div>
      {sub && <div className="text-xs" style={{ color: "#C7C7CC" }}>{sub}</div>}
    </div>
  );

  // Sub-sections
  if (section === "conv_clients") return (
    <SubView title="Conversion clients" onBack={() => setSection(null)}>
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
        <div className="text-center py-2"><div className="text-5xl font-bold" style={{ color: pctColor(tauxCliGlobal) }}>{tauxCliGlobal}%</div><div className="text-xs mt-1" style={{ color: "#8E8E93" }}>{clientsActifs} sur {totalClients} ont commandé</div></div>
        <ProgressBar val={tauxCliGlobal} color={pctColor(tauxCliGlobal)} label="Global" />
        <div className="border-t pt-3" style={{ borderColor: "#F2F2F7" }}>
          <WeekSelector weeks={W} current={weekConv} onChange={setWeekConv} />
          <ProgressBar val={tauxCliWeek} color={pctColor(tauxCliWeek)} label="Semaine" sub={`${weekCliActifs}/${weekCliAll.length} clients`} />
        </div>
      </div>
    </SubView>
  );

  if (section === "conv_filleuls") return (
    <SubView title="Conversion filleuls" onBack={() => setSection(null)}>
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
        <div className="text-center py-2"><div className="text-5xl font-bold" style={{ color: pctColor(tauxFilGlobal) }}>{tauxFilGlobal}%</div><div className="text-xs mt-1" style={{ color: "#8E8E93" }}>{filleulsActifsG} sur {allFilleuls.length} ont commandé</div></div>
        <ProgressBar val={tauxFilGlobal} color={pctColor(tauxFilGlobal)} label="Global" />
        <div className="border-t pt-3" style={{ borderColor: "#F2F2F7" }}>
          <WeekSelector weeks={W} current={weekConv} onChange={setWeekConv} />
          <ProgressBar val={tauxFilWeek} color={pctColor(tauxFilWeek)} label="Semaine" sub={`${weekFilActifs}/${weekFil.length} filleuls`} />
        </div>
      </div>
    </SubView>
  );

  if (section === "fidelisation") {
    const nbCmdByClient = clients.map(c => c.commandes.length);
    const maxCmds = Math.max(...nbCmdByClient, 1);
    const counts = {};
    for (let i = 0; i <= maxCmds; i++) counts[i] = 0;
    nbCmdByClient.forEach(n => { counts[n] = (counts[n] || 0) + 1; });
    const labels = Object.keys(counts).map(Number).sort((a, b) => a - b);
    const maxCount = Math.max(...labels.map(l => counts[l]), 1);
    return (
      <SubView title="Fidélisation" onBack={() => setSection(null)}>
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm" style={{ color: "#8E8E93" }}>Clients fidèles (2+ cmd)</div>
            <span className="text-2xl font-bold" style={{ color: pctColor(tauxFid) }}>{tauxFid}%</span>
          </div>
          <div className="space-y-2.5">
            {labels.map(l => {
              const count = counts[l] || 0;
              const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
              const color = l === 0 ? "#C7C7CC" : l >= 2 ? "#34C759" : "#007AFF";
              return (
                <div key={l} className="flex items-center gap-2">
                  <span className="text-xs text-right flex-shrink-0" style={{ color: "#8E8E93", width: 44 }}>{l === 0 ? "0 cmd" : `${l} cmd`}</span>
                  <div className="flex-1 rounded-full overflow-hidden" style={{ background: "#F2F2F7", height: 16 }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%`, background: color }} />
                  </div>
                  <span className="text-xs font-bold flex-shrink-0 text-right" style={{ color: count > 0 ? "#3C3C43" : "#C7C7CC", width: 18 }}>{count}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3">
            <span className="text-[10px] flex items-center gap-1" style={{ color: "#8E8E93" }}><span className="inline-block w-2 h-2 rounded-sm" style={{ background: "#C7C7CC" }}></span>0 cmd</span>
            <span className="text-[10px] flex items-center gap-1" style={{ color: "#8E8E93" }}><span className="inline-block w-2 h-2 rounded-sm" style={{ background: "#007AFF" }}></span>1 cmd</span>
            <span className="text-[10px] flex items-center gap-1" style={{ color: "#8E8E93" }}><span className="inline-block w-2 h-2 rounded-sm" style={{ background: "#34C759" }}></span>2+ cmds</span>
          </div>
        </div>
      </SubView>
    );
  }

  if (section === "parrains") return (
    <SubView title="Top parrains" onBack={() => setSection(null)}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {topParrains.length > 0 ? topParrains.map(c => {
          const a = filleulsActifsCount(c, clients);
          return <div key={c.id} className="flex items-center gap-3 px-4 py-3.5 border-b last:border-0" style={{ borderColor: "#F2F2F7" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg,#FF9500,#FF3B30)" }}>{c.prenom.charAt(0)}</div>
            <div className="flex-1"><div className="text-sm font-semibold" style={{ color: "#1C1C1E" }}>{c.prenom}</div><div className="text-xs" style={{ color: "#8E8E93" }}>{c.parrainageFait.length} filleuls total</div></div>
            <div className="text-lg font-bold" style={{ color: "#FF9500" }}>{a}✓</div>
          </div>;
        }) : <div className="py-8 text-center text-sm" style={{ color: "#C7C7CC" }}>Aucun parrain avec 3+ filleuls actifs.</div>}
      </div>
    </SubView>
  );

  if (section === "arbre") return <ParrainageTree clients={clients} onBack={() => setSection(null)} />;
  if (section === "meilleurs") return <MeilleursClients clients={clients} onBack={() => setSection(null)} />;

  // Main stats view
  const P = "bg-white rounded-2xl shadow-sm p-4 space-y-4";
  return (
    <div className="space-y-5 pb-28">
      <h2 className="text-2xl font-bold pt-2" style={{ color: "#1C1C1E" }}>Statistiques</h2>

      {/* Vue globale */}
      <div className={P}>
        <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8E8E93" }}>Vue globale</div>
        <div className="grid grid-cols-2 gap-3">
          {[{ l: "Clients", v: totalClients, c: "#007AFF" }, { l: "Commandes", v: allCmds.length, c: "#34C759" }, { l: "Unités", v: allCmds.reduce((s, c) => s + c.quantite, 0), c: "#FF9500" }, { l: "Parrainages", v: clients.reduce((s, c) => s + c.parrainageFait.length, 0), c: "#AF52DE" }].map(s => (
            <div key={s.l} className="rounded-xl p-3 text-center" style={{ background: "#F2F2F7" }}>
              <div className="text-2xl font-bold" style={{ color: s.c }}>{s.v}</div>
              <div className="text-xs mt-0.5" style={{ color: "#8E8E93" }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3" style={{ background: "#F2F2F7" }}>
            <div className="text-xs font-semibold mb-1" style={{ color: "#8E8E93" }}>CA TOTAL</div>
            <div className="text-2xl font-bold" style={{ color: "#34C759" }}>{totalCAAll}€</div>
            <div className="flex gap-2 mt-1 flex-wrap">
              <span className="text-[10px]" style={{ color: "#8E8E93" }}>🛍 {totalProdCA}€</span>
              <span className="text-[10px]" style={{ color: "#8E8E93" }}>🚚 {totalLivCA}€</span>
            </div>
          </div>
          <div className="rounded-xl p-3" style={{ background: "#F2F2F7" }}>
            <div className="text-xs font-semibold mb-1" style={{ color: "#8E8E93" }}>BÉNÉFICE</div>
            <div className="text-2xl font-bold" style={{ color: "#FF9500" }}>{totalBenefAll.toFixed(0)}€</div>
            <div className="text-[10px] mt-1" style={{ color: "#8E8E93" }}>Après coût ({COUT_PUFF}€/puff)</div>
          </div>
        </div>
        {bestWeekEntry && (
          <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: "#FFF7ED" }}>
            <div><div className="text-xs font-bold" style={{ color: "#FF9500" }}>⭐ Meilleure semaine</div><div className="text-xs mt-0.5" style={{ color: "#8E8E93" }}>{weekLabel(bestWeekEntry[0])}</div></div>
            <div className="text-xl font-bold" style={{ color: "#FF9500" }}>{bestWeekEntry[1]}€</div>
          </div>
        )}
      </div>

      {/* Par semaine */}
      <div className={P}>
        <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8E8E93" }}>Par semaine</div>
        <WeekSelector weeks={W} current={weekSel} onChange={setWeekSel} />
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3 text-center" style={{ background: "#F2F2F7" }}><div className="text-2xl font-bold" style={{ color: "#34C759" }}>{weekCmds.length}</div><div className="text-xs mt-0.5" style={{ color: "#8E8E93" }}>Ventes</div></div>
          <div className="rounded-xl p-3 text-center" style={{ background: "#F2F2F7" }}><div className="text-2xl font-bold" style={{ color: "#007AFF" }}>{weekNewClients}</div><div className="text-xs mt-0.5" style={{ color: "#8E8E93" }}>Nvx clients</div></div>
        </div>
        <div className="rounded-xl p-3" style={{ background: "#F2F2F7" }}>
          <div className="text-xs font-semibold mb-1" style={{ color: "#8E8E93" }}>CA CETTE SEMAINE</div>
          <div className="text-2xl font-bold" style={{ color: "#34C759" }}>{weekCAVal}€</div>
          <div className="flex gap-4 mt-1">
            <span className="text-xs" style={{ color: "#8E8E93" }}>🛍 <span style={{ color: "#1C1C1E", fontWeight: 600 }}>{weekProdCA}€</span></span>
            <span className="text-xs" style={{ color: "#8E8E93" }}>🚚 <span style={{ color: "#1C1C1E", fontWeight: 600 }}>{weekLivCA}€</span></span>
          </div>
        </div>
        {bestWeekEntry && weekSel === bestWeekEntry[0] && <div className="text-center text-sm font-semibold" style={{ color: "#FF9500" }}>⭐ Votre meilleure semaine !</div>}
      </div>

      {/* Graphique */}
      <div className={P}>
        <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8E8E93" }}>Évolution CA</div>
        <div style={{ height: 130 }}>
          <svg width="100%" height="130" viewBox={`0 0 ${Math.max(graphWeeks.length, 1) * 44} 130`} preserveAspectRatio="none">
            {graphWeeks.map((w, i) => {
              const val = caByWeek[w] || 0; const h = Math.max((val / maxG) * 105, val > 0 ? 8 : 0);
              const isBest = bestWeekEntry && w === bestWeekEntry[0];
              return <g key={w}>
                <rect x={i * 44 + 6} y={120 - h} width={32} height={h} rx="6" fill={isBest ? "#FF9500" : "#007AFF"} opacity={isBest ? 1 : 0.55} />
                {val > 0 && <text x={i * 44 + 22} y={114 - h} textAnchor="middle" fontSize="9" fill="#8E8E93">{val}€</text>}
                <text x={i * 44 + 22} y={128} textAnchor="middle" fontSize="9" fill="#C7C7CC">S{w.split("-W")[1]}</text>
              </g>;
            })}
          </svg>
        </div>
      </div>

      {/* Ventes par goût */}
      <div className={P}>
        <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8E8E93" }}>Ventes par goût</div>
        {[...flavors].sort((a, b) => {
          const tA = allCmds.filter(c => c.gout === a.id).reduce((s, c) => s + c.quantite, 0);
          const tB = allCmds.filter(c => c.gout === b.id).reduce((s, c) => s + c.quantite, 0);
          return tB - tA;
        }).map((f, i) => {
          const tot = allCmds.filter(c => c.gout === f.id).reduce((s, c) => s + c.quantite, 0);
          const maxF = Math.max(...flavors.map(fl => allCmds.filter(c => c.gout === fl.id).reduce((s, c) => s + c.quantite, 0)), 1);
          return <div key={f.id} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">{i === 0 && tot > 0 && <span className="text-xs">🏆</span>}<span className="text-sm" style={{ color: "#1C1C1E" }}>{f.emoji} {f.label}</span></div>
              <span className="text-sm font-semibold" style={{ color: f.color }}>{tot} unités</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F2F2F7" }}><div className="h-full rounded-full transition-all" style={{ width: `${(tot / maxF) * 100}%`, background: f.color }} /></div>
          </div>;
        })}
      </div>

      {/* Boutons iOS style réglages */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide mb-2 px-1" style={{ color: "#8E8E93" }}>Analyses détaillées</div>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {[
            { id: "conv_clients", label: "Conversion clients", icon: "📈", sub: `${tauxCliGlobal}%`, subColor: pctColor(tauxCliGlobal) },
            { id: "conv_filleuls", label: "Conversion filleuls", icon: "🤝", sub: `${tauxFilGlobal}%`, subColor: pctColor(tauxFilGlobal) },
            { id: "fidelisation", label: "Fidélisation", icon: "💚", sub: `${tauxFid}%`, subColor: pctColor(tauxFid) },
            { id: "parrains", label: "Top parrains", icon: "⭐", sub: `${topParrains.length}`, subColor: "#FF9500" },
            { id: "arbre", label: "Arbre de parrainage", icon: "🌳", sub: "", subColor: "#007AFF" },
            { id: "meilleurs", label: "Meilleurs clients", icon: "🏆", sub: "", subColor: "#FF9500" },
          ].map(item => (
            <LPBtn key={item.id} onClick={() => setSection(item.id)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left border-b last:border-0" style={{ borderColor: "#F2F2F7" }}>
              <span className="text-xl w-8 flex-shrink-0">{item.icon}</span>
              <div className="flex-1 text-sm font-medium" style={{ color: "#1C1C1E" }}>{item.label}</div>
              {item.sub && <span className="text-sm font-semibold" style={{ color: item.subColor }}>{item.sub}</span>}
              <span style={{ color: "#C7C7CC" }}>›</span>
            </LPBtn>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "clients", label: "Clients", icon: "👥" },
  { id: "stock", label: "Stock", icon: "📦" },
  { id: "stats", label: "Stats", icon: "📊" },
  { id: "infos", label: "Infos", icon: "ℹ️" },
  { id: "ajouter", label: "Ajouter", icon: "➕" },
];

export default function App() {
  const [clients, setClients] = useState(() => { try { const s = localStorage.getItem("dg_clients"); return s ? JSON.parse(s) : initClients; } catch { return initClients; } });
  const [stock, setStock] = useState(() => { try { const s = localStorage.getItem("dg_stock"); return s ? JSON.parse(s) : initStock; } catch { return initStock; } });
  const [flavors, setFlavors] = useState(() => { try { const s = localStorage.getItem("dg_flavors"); return s ? JSON.parse(s) : DEFAULT_FLAVORS; } catch { return DEFAULT_FLAVORS; } });
  const [voitures, setVoitures] = useState(() => { try { const s = localStorage.getItem("dg_voitures"); return s ? JSON.parse(s) : [{ id: 1, nom: "Peugeot 207", conso: 6.5, essence: "SP95" }]; } catch { return [{ id: 1, nom: "Peugeot 207", conso: 6.5, essence: "SP95" }]; } });
  const [trajets, setTrajets] = useState(() => { try { const s = localStorage.getItem("dg_trajets"); return s ? JSON.parse(s) : []; } catch { return []; } });
  const [tab, setTab] = useState("clients");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [notif, setNotif] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [newClient, setNewClient] = useState({ prenom: "", snap: "", telephone: "", adresse: "", parrainePar: "" });

  useEffect(() => { try { localStorage.setItem("dg_clients", JSON.stringify(clients)); } catch {} }, [clients]);
  useEffect(() => { try { localStorage.setItem("dg_stock", JSON.stringify(stock)); } catch {} }, [stock]);
  useEffect(() => { try { localStorage.setItem("dg_flavors", JSON.stringify(flavors)); } catch {} }, [flavors]);
  useEffect(() => { try { localStorage.setItem("dg_voitures", JSON.stringify(voitures)); } catch {} }, [voitures]);
  useEffect(() => { try { localStorage.setItem("dg_trajets", JSON.stringify(trajets)); } catch {} }, [trajets]);

  const notify = useCallback((msg, color = "green") => { setNotif({ msg, color }); setTimeout(() => setNotif(null), 2500); }, []);
  const filtered = useMemo(() => search.trim() ? clients.filter(c => c.prenom.toLowerCase().includes(search.toLowerCase()) || (c.snap || "").toLowerCase().includes(search.toLowerCase())) : clients, [clients, search]);
  const sortedFiltered = useMemo(() => [...filtered].sort((a, b) => (needsAction(b, clients) ? 1 : 0) - (needsAction(a, clients) ? 1 : 0)), [filtered, clients]);
  const selected = clients.find(c => c.id === selectedId);
  const toRelance = clients.filter(c => needsAction(c, clients));

  const handleUpdateStock = (flavorId, delta) => { setStock(prev => ({ ...prev, [flavorId]: Math.max(0, (prev[flavorId] || 0) + delta) })); if (delta > 0) notify(`+${delta} ${flavors.find(f => f.id === flavorId)?.label} ajouté`); };
  const handleUpdateFlavors = (newFlavors) => { setFlavors(newFlavors); setStock(prev => { const next = { ...prev }; newFlavors.forEach(f => { if (!(f.id in next)) next[f.id] = 0; }); return next; }); };
  const handleAddCommande = (clientId, cmd) => { setClients(prev => prev.map(c => c.id === clientId ? { ...c, commandes: [...c.commandes, { ...cmd, id: Date.now() }] } : c)); setStock(prev => ({ ...prev, [cmd.gout]: Math.max(0, (prev[cmd.gout] || 0) - cmd.quantite) })); notify(`✓ ${flavors.find(f => f.id === cmd.gout)?.emoji} ×${cmd.quantite} — ${cmdCA(cmd)}€`); };
  const handleAddParrainage = (clientId, parrId) => { setClients(prev => prev.map(c => { if (c.id === clientId) return { ...c, parrainageFait: [...c.parrainageFait, parrId] }; if (c.id === parrId) return { ...c, parrainePar: clientId }; return c; })); notify("✓ Parrainage enregistré !"); };
  const handleToggle = (clientId, field) => setClients(prev => prev.map(c => c.id === clientId ? { ...c, [field]: !c[field] } : c));
  const handleDeleteClient = (clientId, keepHistory) => { setClients(prev => { const next = prev.filter(c => c.id !== clientId); return next.map(c => ({ ...c, parrainageFait: c.parrainageFait.filter(id => id !== clientId), parrainePar: c.parrainePar === clientId ? null : c.parrainePar })); }); notify(keepHistory ? "Client supprimé, historique conservé." : "Client supprimé."); setSelectedId(null); };
  const handleAddClient = () => {
    if (!newClient.prenom.trim()) return;
    const id = Date.now();
    const parrainId = newClient.parrainePar ? parseInt(newClient.parrainePar) : null;
    setClients(prev => { const created = { id, prenom: newClient.prenom, snap: newClient.snap, telephone: newClient.telephone, adresse: newClient.adresse, dateInscription: new Date().toISOString().split("T")[0], commandes: [], parrainageFait: [], parrainePar: parrainId, relance1: false, produit5Offert: false, relance2: false, produitGratuitOffert: false }; const next = [...prev, created]; if (parrainId) return next.map(c => c.id === parrainId ? { ...c, parrainageFait: [...c.parrainageFait, id] } : c); return next; });
    setNewClient({ prenom: "", snap: "", telephone: "", adresse: "", parrainePar: "" });
    notify("✓ Client ajouté !"); setTab("clients");
  };

  const longPressHandlers = (clientId) => {
    let timer;
    return {
      onMouseDown: () => { timer = setTimeout(() => setDeleteTarget(clientId), 600); },
      onMouseUp: () => clearTimeout(timer), onMouseLeave: () => clearTimeout(timer),
      onTouchStart: () => { timer = setTimeout(() => setDeleteTarget(clientId), 600); },
      onTouchEnd: () => clearTimeout(timer),
    };
  };

  const ROW = "flex items-center gap-3 px-4 py-3.5 border-b last:border-0";

  return (
    <div style={{ background: "#F2F2F7", minHeight: "100dvh", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif", WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none" }}>
      {notif && (
        <div className="fixed left-4 right-4 z-50 px-4 py-3 rounded-2xl text-sm font-semibold text-center shadow-lg"
          style={{ top: "calc(env(safe-area-inset-top, 44px) + 8px)", background: notif.color === "red" ? "#FF3B30" : "#34C759", color: "white" }}>
          {notif.msg}
        </div>
      )}
      {deleteTarget && (() => { const c = clients.find(x => x.id === deleteTarget); return c ? <DeleteModal client={c} onCancel={() => setDeleteTarget(null)} onConfirm={(keep) => { handleDeleteClient(c.id, keep); setDeleteTarget(null); }} /> : null; })()}

      <div style={{ paddingTop: "env(safe-area-inset-top, 44px)" }}>
        {!selectedId && (
          <div className="px-5 pt-4 pb-2 flex items-baseline justify-between">
            <h1 className="text-3xl font-bold" style={{ color: "#1C1C1E", letterSpacing: "-0.5px" }}>
              {tab === "clients" ? "Clients" : tab === "stock" ? "Stock" : tab === "stats" ? "Statistiques" : tab === "infos" ? "Infos" : "Nouveau client"}
            </h1>
            {tab === "clients" && toRelance.length > 0 && (
              <span className="text-sm font-semibold px-2.5 py-1 rounded-full" style={{ background: "#FF950020", color: "#FF9500" }}>{toRelance.length} à relancer</span>
            )}
          </div>
        )}

        <div className="px-4 overflow-y-auto" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 20px) + 80px)" }}>
          {tab === "clients" && !selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "#E5E5EA" }}>
                <span style={{ color: "#8E8E93" }}>🔍</span>
                <input type="text" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" style={{ color: "#1C1C1E", WebkitUserSelect: "text", userSelect: "text" }} />
                {search && <LPBtn onClick={() => setSearch("")} style={{ color: "#8E8E93" }}>✕</LPBtn>}
              </div>
              <div className="text-xs text-center" style={{ color: "#C7C7CC" }}>Appui long sur un client pour le supprimer</div>
              {!search && toRelance.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide mb-2 px-1" style={{ color: "#FF9500" }}>⚡ À relancer</div>
                  <div className="rounded-2xl overflow-hidden bg-white shadow-sm">
                    {toRelance.map(c => {
                      const actifs = filleulsActifsCount(c, clients);
                      return (
                        <div key={c.id} onClick={() => setSelectedId(c.id)} {...longPressHandlers(c.id)} className={ROW + " cursor-pointer"} style={{ borderColor: "#F2F2F7" }}>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg,#FF9500,#FF3B30)" }}>{c.prenom.charAt(0)}</div>
                          <div className="flex-1 min-w-0"><div className="text-sm font-semibold" style={{ color: "#1C1C1E" }}>{c.prenom}</div><div className="text-xs" style={{ color: "#FF9500" }}>{actifs}/5 filleuls — à relancer !</div></div>
                          <span style={{ color: "#C7C7CC" }}>›</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div>
                {!search && toRelance.length > 0 && <div className="text-xs font-semibold uppercase tracking-wide mb-2 px-1" style={{ color: "#8E8E93" }}>Tous les clients</div>}
                <div className="rounded-2xl overflow-hidden bg-white shadow-sm">
                  {sortedFiltered.filter(c => search || !needsAction(c, clients)).map(c => {
                    const fav = getFav(c.commandes, flavors);
                    const status = getParrainageStatus(c, clients);
                    const last = lastOrder(c.commandes);
                    const inactive = last && daysSince(last.date) > 15;
                    return (
                      <div key={c.id} onClick={() => setSelectedId(c.id)} {...longPressHandlers(c.id)} className={ROW + " cursor-pointer"} style={{ borderColor: "#F2F2F7" }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg,#007AFF,#34C759)" }}>{c.prenom.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold" style={{ color: "#1C1C1E" }}>{c.prenom}</div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-xs" style={{ color: c.commandes.length > 0 ? "#34C759" : "#C7C7CC" }}>{c.commandes.length} cmd</span>
                            {fav && <span className="text-xs">{fav.emoji}</span>}
                            {inactive && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#FFF1F0", color: "#FF3B30" }}>ina</span>}
                            {status && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${status.color}15`, color: status.color }}>{status.label}</span>}
                          </div>
                        </div>
                        <span style={{ color: "#C7C7CC" }}>›</span>
                      </div>
                    );
                  })}
                  {sortedFiltered.filter(c => search || !needsAction(c, clients)).length === 0 && (
                    <div className="px-4 py-8 text-center text-sm" style={{ color: "#C7C7CC" }}>{search ? "Aucun résultat" : "Tous dans 'À relancer'"}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === "clients" && selected && (
            <ClientDetail client={selected} clients={clients} stock={stock} flavors={flavors}
              onBack={() => setSelectedId(null)} onAddCommande={handleAddCommande}
              onAddParrainage={handleAddParrainage} onToggle={handleToggle} onDelete={handleDeleteClient} />
          )}

          {tab === "stock" && <StockPage stock={stock} flavors={flavors} onUpdate={handleUpdateStock} onUpdateFlavors={handleUpdateFlavors} />}
          {tab === "stats" && <StatsPage clients={clients} flavors={flavors} />}
          {tab === "infos" && <InfosPage voitures={voitures} setVoitures={setVoitures} trajets={trajets} setTrajets={setTrajets} />}

          {tab === "ajouter" && (
            <div className="space-y-5 pt-2">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                {[
                  { label: "Prénom *", key: "prenom", placeholder: "Jean", type: "text" },
                  { label: "Snap", key: "snap", placeholder: "jean_snap", type: "text" },
                  { label: "Téléphone", key: "telephone", placeholder: "06 00 00 00 00", type: "tel" },
                  { label: "Adresse", key: "adresse", placeholder: "5 rue de la Paix, Paris", type: "text" },
                ].map(f => (
                  <div key={f.key} className={ROW} style={{ borderColor: "#F2F2F7" }}>
                    <div className="w-24 text-sm flex-shrink-0" style={{ color: "#3C3C43" }}>{f.label}</div>
                    <input type={f.type} placeholder={f.placeholder} value={newClient[f.key]} onChange={e => setNewClient(p => ({ ...p, [f.key]: e.target.value }))} className="flex-1 text-sm outline-none text-right bg-transparent" style={{ color: "#1C1C1E", WebkitUserSelect: "text", userSelect: "text" }} />
                  </div>
                ))}
                <div className={ROW} style={{ borderColor: "transparent" }}>
                  <div className="w-24 text-sm flex-shrink-0" style={{ color: "#3C3C43" }}>Parrain</div>
                  <select value={newClient.parrainePar} onChange={e => setNewClient(p => ({ ...p, parrainePar: e.target.value }))} className="flex-1 text-sm outline-none text-right bg-transparent" style={{ color: newClient.parrainePar ? "#1C1C1E" : "#C7C7CC" }}>
                    <option value="">Aucun</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.prenom}</option>)}
                  </select>
                </div>
              </div>
              <LPBtn onClick={handleAddClient} disabled={!newClient.prenom.trim()} className="w-full py-4 rounded-2xl font-semibold text-sm text-white" style={{ background: !newClient.prenom.trim() ? "#C7C7CC" : "#007AFF" }}>
                Ajouter le client
              </LPBtn>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t" style={{ background: "rgba(242,242,247,0.92)", backdropFilter: "blur(20px)", borderColor: "#E5E5EA", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
        <div className="flex justify-around px-1 pt-2 pb-1">
          {TABS.map(t => (
            <LPBtn key={t.id} onClick={() => { setTab(t.id); setSelectedId(null); }} className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl">
              <span className="text-xl leading-none">{t.icon}</span>
              <span className="text-[10px] font-medium" style={{ color: tab === t.id ? "#007AFF" : "#8E8E93" }}>{t.label}</span>
            </LPBtn>
          ))}
        </div>
      </div>
    </div>
  );
}
