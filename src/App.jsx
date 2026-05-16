import { useState, useMemo, useRef, useCallback, useEffect } from "react";


// ─── DEFAULT FLAVORS ──────────────────────────────────────────────────────────
const DEFAULT_FLAVORS = [
  { id: "pomme",     label: "Pomme",     color: "#34C759", bg: "#F0FDF4", emoji: "🍎" },
  { id: "fraise",    label: "Fraise",    color: "#FF3B30", bg: "#FFF1F0", emoji: "🍓" },
  { id: "mangue",    label: "Mangue",    color: "#FF9500", bg: "#FFF7ED", emoji: "🥭" },
  { id: "citron",    label: "Citron",    color: "#FFCC00", bg: "#FEFCE8", emoji: "🍋" },
  { id: "framboise", label: "Framboise", color: "#AF52DE", bg: "#FAF5FF", emoji: "🫐" },
  { id: "peche",     label: "Pêche",     color: "#FF6B35", bg: "#FFF5F0", emoji: "🍑" },
];
const FLAVOR_COLORS = ["#34C759","#FF3B30","#FF9500","#FFCC00","#AF52DE","#FF6B35","#007AFF","#FF2D55","#5AC8FA","#4CD964"];
const FLAVOR_EMOJIS = ["🍎","🍓","🥭","🍋","🫐","🍑","🍇","🍈","🍊","🍉","🍌","🍍","🥝","🍒","🫒"];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getWeekKey(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay() || 7;
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
  clients.forEach(c => {
    keys.add(getWeekKey(c.dateInscription));
    c.commandes.forEach(cmd => keys.add(getWeekKey(cmd.date)));
  });
  return [...keys].sort();
}
const cmdCA = cmd => 10 + (cmd.livraison ? 5 : 0);
const totalCA = commandes => commandes.reduce((s, c) => s + cmdCA(c), 0);
function lastOrder(commandes) {
  if (!commandes.length) return null;
  return commandes.reduce((a, b) => (a.date > b.date ? a : b));
}
function daysSince(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}
function getFav(commandes, flavors) {
  if (!commandes.length) return null;
  const counts = {};
  commandes.forEach(c => { counts[c.gout] = (counts[c.gout] || 0) + c.quantite; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? flavors.find(f => f.id === top[0]) : null;
}
function filleulsActifsCount(client, clients) {
  return client.parrainageFait.filter(id => {
    const c = clients.find(x => x.id === id);
    return c && c.commandes.length > 0;
  }).length;
}
function fmtDate(str) {
  return new Date(str).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function getParrainageStatus(client, clients) {
  const actifs = filleulsActifsCount(client, clients);
  if (actifs >= 5 && client.produitGratuitOffert) return { level: "gratuit-done", color: "#8E8E93", label: "✓ Puff gratuit offert" };
  if (actifs >= 5) return { level: "gratuit", color: "#34C759", label: "🎁 Puff gratuit à offrir !" };
  if (actifs === 4 && client.relance2) return { level: "relance2-done", color: "#8E8E93", label: "✓ Relancé 4/5" };
  if (actifs === 4) return { level: "relance2", color: "#FF9500", label: "⚡ À relancer — 4/5" };
  if (actifs >= 3 && client.produit5Offert) return { level: "5eur-done", color: "#8E8E93", label: "✓ Puff 5€ offert" };
  if (actifs >= 3) return { level: "5eur", color: "#007AFF", label: "🏷 Puff à 5€ à offrir !" };
  if (actifs === 2 && client.relance1) return { level: "relance1-done", color: "#8E8E93", label: "✓ Relancé 2/3" };
  if (actifs === 2) return { level: "relance1", color: "#FF9500", label: "⚡ À relancer — 2/3" };
  return null;
}
function needsAction(client, clients) {
  const actifs = filleulsActifsCount(client, clients);
  return (actifs === 2 && !client.relance1) || (actifs === 4 && !client.relance2);
}

// ─── INIT DATA ────────────────────────────────────────────────────────────────
const initClients = [
  {
    id: 1, prenom: "Sophie", snap: "sophiem", telephone: "06 12 34 56 78", adresse: "12 rue de la Paix, Paris",
    dateInscription: "2024-04-01",
    commandes: [
      { id: 1, date: "2024-04-03", gout: "pomme", quantite: 2, livraison: false },
      { id: 2, date: "2024-04-10", gout: "fraise", quantite: 1, livraison: true },
      { id: 3, date: "2024-04-22", gout: "pomme", quantite: 1, livraison: false },
    ],
    parrainageFait: [2, 3, 4, 5], parrainePar: null,
    relance1: true, produit5Offert: false, relance2: false, produitGratuitOffert: false,
  },
  {
    id: 2, prenom: "Thomas", snap: "tleroux", telephone: "07 23 45 67 89", adresse: "5 avenue Victor Hugo, Lyon",
    dateInscription: "2024-04-05",
    commandes: [
      { id: 1, date: "2024-04-08", gout: "mangue", quantite: 1, livraison: false },
      { id: 2, date: "2024-04-28", gout: "mangue", quantite: 2, livraison: true },
    ],
    parrainageFait: [5], parrainePar: 1,
    relance1: false, produit5Offert: false, relance2: false, produitGratuitOffert: false,
  },
  {
    id: 3, prenom: "Camille", snap: "camille_d", telephone: "06 34 56 78 90", adresse: "",
    dateInscription: "2024-04-05",
    commandes: [], parrainageFait: [], parrainePar: 1,
    relance1: false, produit5Offert: false, relance2: false, produitGratuitOffert: false,
  },
  {
    id: 4, prenom: "Julien", snap: "julienb07", telephone: "07 45 67 89 01", adresse: "8 boulevard Haussmann, Paris",
    dateInscription: "2024-04-08",
    commandes: [{ id: 1, date: "2024-04-15", gout: "citron", quantite: 2, livraison: false }],
    parrainageFait: [], parrainePar: 1,
    relance1: false, produit5Offert: false, relance2: false, produitGratuitOffert: false,
  },
  {
    id: 5, prenom: "Marie", snap: "mariefont", telephone: "06 56 78 90 12", adresse: "",
    dateInscription: "2024-04-08",
    commandes: [{ id: 1, date: "2024-04-20", gout: "framboise", quantite: 1, livraison: true }],
    parrainageFait: [], parrainePar: 2,
    relance1: false, produit5Offert: false, relance2: false, produitGratuitOffert: false,
  },
];
const initStock = Object.fromEntries(DEFAULT_FLAVORS.map(f => [f.id, 8]));

// ─── LONG PRESS HOOK ──────────────────────────────────────────────────────────
function useLongPress(onLongPress, ms = 600) {
  const timer = useRef(null);
  const start = useCallback((e) => {
    timer.current = setTimeout(() => onLongPress(e), ms);
  }, [onLongPress, ms]);
  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return { onMouseDown: start, onMouseUp: clear, onMouseLeave: clear, onTouchStart: start, onTouchEnd: clear };
}

// ─── CAROUSEL ─────────────────────────────────────────────────────────────────
function Carousel({ panels }) {
  const [idx, setIdx] = useState(0);
  const startX = useRef(null);
  const onStart = e => { startX.current = e.touches ? e.touches[0].clientX : e.clientX; };
  const onEnd = e => {
    if (startX.current === null) return;
    const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const diff = startX.current - endX;
    if (Math.abs(diff) > 35) setIdx(i => Math.max(0, Math.min(panels.length - 1, i + (diff > 0 ? 1 : -1))));
    startX.current = null;
  };
  return (
    <div>
      <div className="overflow-hidden rounded-2xl" onMouseDown={onStart} onMouseUp={onEnd} onTouchStart={onStart} onTouchEnd={onEnd} style={{ userSelect: "none" }}>
        <div className="flex transition-transform duration-300 ease-out" style={{ transform: `translateX(-${idx * 100}%)` }}>
          {panels.map((p, i) => <div key={i} className="min-w-full">{p}</div>)}
        </div>
      </div>
      <div className="flex justify-center gap-1.5 mt-3">
        {panels.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} className="rounded-full transition-all duration-200"
            style={{ width: i === idx ? 20 : 6, height: 6, background: i === idx ? "#007AFF" : "#C7C7CC" }} />
        ))}
      </div>
    </div>
  );
}

// ─── WEEK SELECTOR ────────────────────────────────────────────────────────────
function WeekSelector({ weeks, current, onChange }) {
  const idx = weeks.indexOf(current);
  return (
    <div className="flex items-center justify-between my-2">
      <button onClick={() => idx > 0 && onChange(weeks[idx - 1])} disabled={idx === 0}
        className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-25 text-xl" style={{ color: "#007AFF" }}>‹</button>
      <span className="text-xs font-semibold text-center" style={{ color: "#3C3C43" }}>{weekLabel(current)}</span>
      <button onClick={() => idx < weeks.length - 1 && onChange(weeks[idx + 1])} disabled={idx === weeks.length - 1}
        className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-25 text-xl" style={{ color: "#007AFF" }}>›</button>
    </div>
  );
}

// ─── DELETE CLIENT MODAL ──────────────────────────────────────────────────────
function DeleteClientModal({ client, onConfirm, onCancel }) {
  const [keepHistory, setKeepHistory] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="w-full rounded-t-3xl p-5 space-y-4" style={{ background: "white" }}>
        <div className="w-10 h-1 rounded-full mx-auto" style={{ background: "#E5E5EA" }} />
        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: "#1C1C1E" }}>Supprimer {client.prenom} ?</div>
          <div className="text-sm mt-1" style={{ color: "#8E8E93" }}>Cette action est irréversible.</div>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ background: "#F2F2F7" }}>
          <button onClick={() => setKeepHistory(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5">
            <div>
              <div className="text-sm font-medium text-left" style={{ color: "#1C1C1E" }}>Garder l'historique des commandes</div>
              <div className="text-xs text-left mt-0.5" style={{ color: "#8E8E93" }}>Le CA sera conservé dans les stats</div>
            </div>
            <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center ml-3 flex-shrink-0"
              style={keepHistory ? { background: "#007AFF", borderColor: "#007AFF" } : { borderColor: "#C7C7CC" }}>
              {keepHistory && <span className="text-white text-xs font-bold">✓</span>}
            </div>
          </button>
        </div>
        <button onClick={() => onConfirm(keepHistory)}
          className="w-full py-4 rounded-2xl text-sm font-semibold text-white" style={{ background: "#FF3B30" }}>
          Supprimer
        </button>
        <button onClick={onCancel}
          className="w-full py-4 rounded-2xl text-sm font-semibold" style={{ background: "#F2F2F7", color: "#007AFF" }}>
          Annuler
        </button>
      </div>
    </div>
  );
}

// ─── CLIENT DETAIL ────────────────────────────────────────────────────────────
function ClientDetail({ client, clients, stock, flavors, onBack, onAddCommande, onAddParrainage, onToggle, onDelete }) {
  const [showCmd, setShowCmd] = useState(false);
  const [showParr, setShowParr] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [gout, setGout] = useState(flavors[0]?.id || "");
  const [qty, setQty] = useState(1);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [livraison, setLivraison] = useState(false);
  const [parrId, setParrId] = useState("");
  const [copied, setCopied] = useState(false);
  const pressTimer = useRef(null);

  const getC = id => clients.find(c => c.id === id);
  const parrain = client.parrainePar ? getC(client.parrainePar) : null;
  const fav = getFav(client.commandes, flavors);
  const last = lastOrder(client.commandes);
  const inactive = last && daysSince(last.date) > 15;
  const actifs = filleulsActifsCount(client, clients);
  const parrStatus = getParrainageStatus(client, clients);
  const filleulsOui = client.parrainageFait.filter(id => getC(id)?.commandes.length > 0);
  const filleulsNon = client.parrainageFait.filter(id => !getC(id)?.commandes.length);
  const ca = totalCA(client.commandes);
  const totalUnites = client.commandes.reduce((s, c) => s + c.quantite, 0);
  const selF = flavors.find(f => f.id === gout);
  const cmdPrice = 10 + (livraison ? 5 : 0);

  const handleAddressPress = () => {
    if (!client.adresse) return;
    navigator.clipboard?.writeText(client.adresse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleAddressLongPress = () => {
    if (!client.adresse) return;
    const encoded = encodeURIComponent(client.adresse);
    window.open(`https://waze.com/ul?q=${encoded}`, "_blank");
  };
  const addrPressStart = () => { pressTimer.current = setTimeout(handleAddressLongPress, 600); };
  const addrPressEnd = (e) => {
    if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; }
  };

  const submitCmd = () => {
    onAddCommande(client.id, { gout, quantite: qty, date, livraison });
    setShowCmd(false); setQty(1); setLivraison(false);
  };
  const submitParr = () => {
    if (!parrId) return;
    onAddParrainage(client.id, parseInt(parrId));
    setShowParr(false); setParrId("");
  };

  const ios = { card: "bg-white rounded-2xl shadow-sm", row: "flex items-center gap-3 px-4 py-3.5 border-b last:border-0" };

  return (
    <div className="space-y-5 pb-28" style={{ background: "#F2F2F7", minHeight: "100vh" }}>
      {showDeleteModal && (
        <DeleteClientModal client={client} onCancel={() => setShowDeleteModal(false)} onConfirm={(keep) => { onDelete(client.id, keep); setShowDeleteModal(false); }} />
      )}

      <div className="flex items-center justify-between pt-3 pb-1">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium" style={{ color: "#007AFF" }}>
          <span className="text-lg">‹</span> Clients
        </button>
        <button onClick={() => setShowDeleteModal(true)} className="text-sm font-medium px-3 py-1.5 rounded-full" style={{ color: "#FF3B30", background: "#FFF1F0" }}>
          Supprimer
        </button>
      </div>

      {/* Profile */}
      <div className={ios.card + " p-5"}>
        <div className="flex gap-4 items-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #007AFF, #34C759)" }}>
            {client.prenom.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-xl leading-tight" style={{ color: "#1C1C1E" }}>{client.prenom}</div>
            {client.snap && <div className="text-sm mt-0.5" style={{ color: "#FFCC00" }}>👻 {client.snap}</div>}
            {client.telephone && <div className="text-sm" style={{ color: "#8E8E93" }}>{client.telephone}</div>}
          </div>
        </div>

        {/* Adresse */}
        {client.adresse && (
          <button
            onMouseDown={addrPressStart} onMouseUp={addrPressEnd} onMouseLeave={addrPressEnd}
            onTouchStart={addrPressStart} onTouchEnd={addrPressEnd}
            onClick={handleAddressPress}
            className="mt-3 w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left"
            style={{ background: copied ? "#F0FDF4" : "#F2F2F7" }}>
            <span>📍</span>
            <span className="text-xs flex-1" style={{ color: copied ? "#34C759" : "#3C3C43" }}>
              {copied ? "Adresse copiée ✓" : client.adresse}
            </span>
            <span className="text-xs" style={{ color: "#C7C7CC" }}>Tap: copier · Hold: Waze</span>
          </button>
        )}

        <div className="flex gap-2 mt-3 flex-wrap">
          <span className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: client.commandes.length > 0 ? "#F0FDF4" : "#F2F2F7", color: client.commandes.length > 0 ? "#34C759" : "#8E8E93" }}>
            {client.commandes.length > 0 ? "● Actif" : "○ Inscrit"}
          </span>
          {inactive && <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#FFF1F0", color: "#FF3B30" }}>Inactif {daysSince(last.date)}j</span>}
          {client.parrainePar && <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#EBF5FF", color: "#007AFF" }}>Filleul de {parrain?.prenom}</span>}
        </div>
        <div className="text-xs mt-2" style={{ color: "#C7C7CC" }}>Inscrit le {fmtDate(client.dateInscription)}</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Commandes", val: client.commandes.length, color: "#34C759" },
          { label: "Unités", val: totalUnites, color: "#007AFF" },
          { label: "CA total", val: `${ca}€`, color: "#FF9500" },
        ].map(s => (
          <div key={s.label} className={ios.card + " p-4 text-center"}>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.val}</div>
            <div className="text-xs mt-0.5" style={{ color: "#8E8E93" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {(fav || last) && (
        <div className={ios.card + " px-4 py-3 flex items-center gap-3"}>
          {fav && <span className="text-2xl">{fav.emoji}</span>}
          <div className="flex-1">
            {fav && <div className="text-sm font-semibold" style={{ color: "#1C1C1E" }}>Préféré : <span style={{ color: fav.color }}>{fav.label}</span></div>}
            {last && <div className="text-xs" style={{ color: "#8E8E93" }}>Dernier achat : {fmtDate(last.date)}</div>}
          </div>
        </div>
      )}

      {/* Parrainage status */}
      {parrStatus && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: `${parrStatus.color}15`, border: `1px solid ${parrStatus.color}30` }}>
          <div className="text-sm font-semibold" style={{ color: parrStatus.color }}>{parrStatus.label}</div>
          <div className="flex gap-2 flex-wrap">
            {actifs === 2 && <button onClick={() => onToggle(client.id, "relance1")} className="flex-1 py-2 rounded-xl text-xs font-semibold border"
              style={client.relance1 ? { background: "#8E8E9320", color: "#8E8E93", borderColor: "#8E8E9340" } : { background: "#FF950020", color: "#FF9500", borderColor: "#FF950040" }}>
              {client.relance1 ? "✓ Relancé" : "Marquer relancé"}
            </button>}
            {actifs >= 3 && !client.produit5Offert && <button onClick={() => onToggle(client.id, "produit5Offert")} className="flex-1 py-2 rounded-xl text-xs font-semibold border"
              style={{ background: "#007AFF20", color: "#007AFF", borderColor: "#007AFF40" }}>Puff 5€ offert</button>}
            {actifs === 4 && <button onClick={() => onToggle(client.id, "relance2")} className="flex-1 py-2 rounded-xl text-xs font-semibold border"
              style={client.relance2 ? { background: "#8E8E9320", color: "#8E8E93", borderColor: "#8E8E9340" } : { background: "#FF950020", color: "#FF9500", borderColor: "#FF950040" }}>
              {client.relance2 ? "✓ Relancé" : "Marquer relancé"}
            </button>}
            {actifs >= 5 && !client.produitGratuitOffert && <button onClick={() => onToggle(client.id, "produitGratuitOffert")} className="flex-1 py-2 rounded-xl text-xs font-semibold border"
              style={{ background: "#34C75920", color: "#34C759", borderColor: "#34C75940" }}>Puff gratuit offert</button>}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs" style={{ color: "#8E8E93" }}>
              <span>{actifs} filleuls actifs</span><span>{Math.min(actifs, 5)}/5</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E5EA" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (actifs / 5) * 100)}%`, background: parrStatus.color }} />
            </div>
            <div className="flex justify-between text-[10px]" style={{ color: "#C7C7CC" }}>
              <span>0</span><span>3 → puff 5€</span><span>5 → gratuit</span>
            </div>
          </div>
        </div>
      )}

      {/* Commandes */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-sm font-semibold" style={{ color: "#3C3C43" }}>Commandes</span>
          <button onClick={() => { setShowCmd(v => !v); setShowParr(false); }} className="text-sm font-medium" style={{ color: "#007AFF" }}>
            {showCmd ? "Annuler" : "+ Nouvelle"}
          </button>
        </div>
        {showCmd && (
          <div className={ios.card + " p-4 mb-3 space-y-4"}>
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: "#8E8E93" }}>GOÛT</div>
              <div className="grid grid-cols-3 gap-2">
                {flavors.map(f => (
                  <button key={f.id} onClick={() => setGout(f.id)}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold border transition-all"
                    style={gout === f.id ? { background: f.bg, borderColor: f.color, color: f.color } : { background: "#F2F2F7", borderColor: "transparent", color: "#8E8E93" }}>
                    <span className="text-xl">{f.emoji}</span>{f.label}
                  </button>
                ))}
              </div>
              {selF && <div className="text-xs mt-2" style={{ color: stock[selF.id] < qty ? "#FF3B30" : "#8E8E93" }}>
                Stock {selF.label} : <span className="font-semibold">{stock[selF.id] || 0}</span>
                {qty > (stock[selF.id] || 0) && " — insuffisant ⚠"}
              </div>}
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="text-xs font-semibold mb-2" style={{ color: "#8E8E93" }}>QUANTITÉ</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-full flex items-center justify-center text-lg" style={{ background: "#F2F2F7", color: "#007AFF" }}>−</button>
                  <span className="w-8 text-center font-bold text-lg" style={{ color: "#1C1C1E" }}>{qty}</span>
                  <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 rounded-full flex items-center justify-center text-lg" style={{ background: "#F2F2F7", color: "#007AFF" }}>+</button>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold mb-2" style={{ color: "#8E8E93" }}>DATE</div>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full text-sm rounded-xl px-3 py-2 outline-none" style={{ background: "#F2F2F7", color: "#1C1C1E" }} />
              </div>
            </div>
            <button onClick={() => setLivraison(l => !l)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all"
              style={livraison ? { background: "#EBF5FF", borderColor: "#007AFF40", color: "#007AFF" } : { background: "#F2F2F7", borderColor: "transparent", color: "#3C3C43" }}>
              <div className="flex items-center gap-2"><span>🚚</span><span className="text-sm font-medium">Livraison +5€</span></div>
              <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={livraison ? { background: "#007AFF", borderColor: "#007AFF" } : { borderColor: "#C7C7CC" }}>
                {livraison && <span className="text-white text-xs font-bold">✓</span>}
              </div>
            </button>
            <div className="flex items-center justify-between px-1">
              <span className="text-sm" style={{ color: "#8E8E93" }}>Prix commande</span>
              <span className="text-lg font-bold" style={{ color: "#34C759" }}>{cmdPrice}€</span>
            </div>
            <button onClick={submitCmd} disabled={qty > (stock[gout] || 0)} className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white"
              style={{ background: qty > (stock[gout] || 0) ? "#C7C7CC" : "#007AFF" }}>Enregistrer la commande</button>
          </div>
        )}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {client.commandes.length > 0 ? [...client.commandes].reverse().map((cmd, i) => {
            const f = flavors.find(fl => fl.id === cmd.gout);
            return (
              <div key={i} className={ios.row} style={{ borderColor: "#F2F2F7" }}>
                <span className="text-2xl">{f?.emoji || "📦"}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: "#1C1C1E" }}>{f?.label || cmd.gout}{cmd.livraison ? " · 🚚" : ""}</div>
                  <div className="text-xs" style={{ color: "#8E8E93" }}>{fmtDate(cmd.date)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold" style={{ color: "#1C1C1E" }}>×{cmd.quantite}</div>
                  <div className="text-xs font-medium" style={{ color: "#34C759" }}>{cmdCA(cmd)}€</div>
                </div>
              </div>
            );
          }) : <div className="px-4 py-8 text-center text-sm" style={{ color: "#C7C7CC" }}>Aucune commande</div>}
        </div>
      </div>

      {/* Parrainage */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-sm font-semibold" style={{ color: "#3C3C43" }}>Parrainage</span>
          <button onClick={() => { setShowParr(v => !v); setShowCmd(false); }} className="text-sm font-medium" style={{ color: "#007AFF" }}>
            {showParr ? "Annuler" : "+ Filleul"}
          </button>
        </div>
        {showParr && (
          <div className={ios.card + " p-4 mb-3 space-y-3"}>
            <select value={parrId} onChange={e => setParrId(e.target.value)} className="w-full text-sm px-4 py-3 rounded-xl outline-none" style={{ background: "#F2F2F7", color: "#1C1C1E" }}>
              <option value="">— Choisir un client —</option>
              {clients.filter(c => c.id !== client.id && c.parrainePar === null).map(c => <option key={c.id} value={c.id}>{c.prenom}</option>)}
            </select>
            <button onClick={submitParr} disabled={!parrId} className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white" style={{ background: !parrId ? "#C7C7CC" : "#FF9500" }}>Enregistrer le parrainage</button>
          </div>
        )}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className={ios.row} style={{ borderColor: "#F2F2F7" }}>
            <span className="text-xl" style={{ color: "#007AFF" }}>👥</span>
            <div className="flex-1 text-sm" style={{ color: "#1C1C1E" }}>{actifs}/{client.parrainageFait.length} filleuls ont commandé</div>
          </div>
          {filleulsOui.map(id => { const f = getC(id); if (!f) return null; return (
            <div key={id} className={ios.row} style={{ borderColor: "#F2F2F7" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: "linear-gradient(135deg, #34C759, #007AFF)" }}>{f.prenom.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: "#1C1C1E" }}>{f.prenom}</div>
                <div className="text-xs" style={{ color: "#34C759" }}>{f.commandes.length} commande{f.commandes.length > 1 ? "s" : ""}</div>
              </div>
            </div>
          ); })}
          {filleulsNon.map(id => { const f = getC(id); if (!f) return null; return (
            <div key={id} className={ios.row} style={{ borderColor: "#F2F2F7" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: "#F2F2F7", color: "#C7C7CC" }}>{f.prenom.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate" style={{ color: "#8E8E93" }}>{f.prenom}</div>
                <div className="text-xs" style={{ color: "#C7C7CC" }}>Pas encore commandé</div>
              </div>
            </div>
          ); })}
          {client.parrainageFait.length === 0 && <div className="px-4 py-6 text-center text-sm" style={{ color: "#C7C7CC" }}>Aucun filleul</div>}
        </div>
      </div>
    </div>
  );
}

// ─── STOCK PAGE ───────────────────────────────────────────────────────────────
function StockPage({ stock, flavors, onUpdate, onUpdateFlavors }) {
  const [screenMode, setScreenMode] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [captured, setCaptured] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [manageFlavors, setManageFlavors] = useState(false);
  const [newFlavorLabel, setNewFlavorLabel] = useState("");
  const [newFlavorEmoji, setNewFlavorEmoji] = useState("🍎");
  const [newFlavorColor, setNewFlavorColor] = useState("#007AFF");
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
      setScanning(true); setCaptured(null); setConfirmed(false);
    } catch { alert("Impossible d'accéder à la caméra."); }
  };
  const stopCamera = () => { streamRef.current?.getTracks().forEach(t => t.stop()); setScanning(false); };

  const capture = async () => {
    const v = videoRef.current, c = canvasRef.current; if (!v || !c) return;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    const b64 = c.toDataURL("image/jpeg", 0.8).split(",")[1];
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 50,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: b64 } },
            { type: "text", text: `Quel goût est ce produit parmi : ${flavors.map(f => f.label).join(", ")} ? Réponds UNIQUEMENT avec le nom exact du goût, rien d'autre. Si inconnu, réponds "inconnu".` }
          ]}]
        })
      });
      const data = await res.json();
      const text = (data.content?.[0]?.text || "inconnu").trim().toLowerCase();
      const match = flavors.find(f => f.label.toLowerCase() === text);
      setCaptured({ flavor: match || null, raw: text }); setQty(1);
    } catch { setCaptured({ flavor: null, raw: "erreur" }); }
    setLoading(false);
  };

  const validate = () => {
    if (!captured?.flavor) return;
    onUpdate(captured.flavor.id, qty);
    setConfirmed(true); setCaptured(null); setQty(1);
    setTimeout(() => setConfirmed(false), 1500);
  };

  const addFlavor = () => {
    if (!newFlavorLabel.trim()) return;
    const id = newFlavorLabel.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();
    onUpdateFlavors([...flavors, { id, label: newFlavorLabel.trim(), emoji: newFlavorEmoji, color: newFlavorColor, bg: newFlavorColor + "20" }]);
    setNewFlavorLabel(""); setNewFlavorEmoji("🍎"); setNewFlavorColor("#007AFF");
  };
  const deleteFlavor = (id) => onUpdateFlavors(flavors.filter(f => f.id !== id));
  const saveEdit = (id) => {
    onUpdateFlavors(flavors.map(f => f.id === id ? { ...f, label: editLabel } : f));
    setEditingId(null);
  };

  const total = Object.values(stock).reduce((a, b) => a + b, 0);
  const available = flavors.filter(f => (stock[f.id] || 0) > 0);

  // Optimized screen mode - fits all without scrolling
  if (screenMode) {
    const count = available.length;
    const fontSize = count <= 3 ? "text-4xl" : count <= 5 ? "text-3xl" : "text-2xl";
    const qtySize = count <= 3 ? "text-6xl" : count <= 5 ? "text-5xl" : "text-4xl";
    const py = count <= 3 ? "py-6" : count <= 5 ? "py-4" : "py-2";
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "white" }}>
        <div className="flex justify-end px-5" style={{ paddingTop: "env(safe-area-inset-top, 44px)" }}>
          <button onClick={() => setScreenMode(false)} className="text-sm font-medium px-4 py-2 rounded-full mt-2" style={{ background: "#F2F2F7", color: "#007AFF" }}>Fermer</button>
        </div>
        <div className="flex-1 flex flex-col justify-center px-8">
          {available.map((f, i) => (
            <div key={f.id} className={`flex items-center justify-between ${py} ${i < available.length - 1 ? "border-b" : ""}`} style={{ borderColor: "#F2F2F7" }}>
              <div className="flex items-center gap-3">
                <span className={fontSize}>{f.emoji}</span>
                <span className={`font-bold ${fontSize}`} style={{ color: "#1C1C1E" }}>{f.label}</span>
              </div>
              <span className={`font-bold ${qtySize}`} style={{ color: f.color }}>{stock[f.id] || 0}</span>
            </div>
          ))}
          {!available.length && <div className="text-center text-lg font-medium" style={{ color: "#C7C7CC" }}>Aucun stock disponible</div>}
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
          <button onClick={() => setManageFlavors(v => !v)} className="px-3 py-2 rounded-xl text-sm font-medium" style={{ background: "white", color: "#3C3C43", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>⚙️</button>
          <button onClick={() => setScreenMode(true)} className="px-3 py-2 rounded-xl text-sm font-medium" style={{ background: "white", color: "#3C3C43", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>📋</button>
          <button onClick={scanning ? stopCamera : startCamera} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: scanning ? "#FF3B30" : "#007AFF" }}>
            {scanning ? "✕" : "📷"}
          </button>
        </div>
      </div>

      {/* Manage flavors */}
      {manageFlavors && (
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div className="text-sm font-semibold" style={{ color: "#3C3C43" }}>Gérer les goûts</div>
          {flavors.map(f => (
            <div key={f.id} className="flex items-center gap-2">
              <span className="text-xl flex-shrink-0">{f.emoji}</span>
              {editingId === f.id ? (
                <>
                  <input value={editLabel} onChange={e => setEditLabel(e.target.value)} className="flex-1 text-sm px-3 py-1.5 rounded-xl outline-none" style={{ background: "#F2F2F7", color: "#1C1C1E" }} />
                  <button onClick={() => saveEdit(f.id)} className="text-xs font-semibold px-3 py-1.5 rounded-xl" style={{ background: "#34C75920", color: "#34C759" }}>✓</button>
                  <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1.5 rounded-xl" style={{ background: "#F2F2F7", color: "#8E8E93" }}>✕</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm" style={{ color: "#1C1C1E" }}>{f.label}</span>
                  <button onClick={() => { setEditingId(f.id); setEditLabel(f.label); }} className="text-xs px-3 py-1.5 rounded-xl" style={{ background: "#007AFF20", color: "#007AFF" }}>Modifier</button>
                  <button onClick={() => deleteFlavor(f.id)} className="text-xs px-2 py-1.5 rounded-xl" style={{ background: "#FF3B3020", color: "#FF3B30" }}>✕</button>
                </>
              )}
            </div>
          ))}
          <div className="border-t pt-3" style={{ borderColor: "#F2F2F7" }}>
            <div className="text-xs font-semibold mb-2" style={{ color: "#8E8E93" }}>AJOUTER UN GOÛT</div>
            <div className="flex gap-2 mb-2">
              <input value={newFlavorLabel} onChange={e => setNewFlavorLabel(e.target.value)} placeholder="Nom du goût" className="flex-1 text-sm px-3 py-2 rounded-xl outline-none" style={{ background: "#F2F2F7", color: "#1C1C1E" }} />
            </div>
            <div className="flex gap-2 mb-2 flex-wrap">
              {FLAVOR_EMOJIS.slice(0, 8).map(em => (
                <button key={em} onClick={() => setNewFlavorEmoji(em)} className="text-xl p-1 rounded-lg" style={{ background: newFlavorEmoji === em ? "#007AFF20" : "transparent" }}>{em}</button>
              ))}
            </div>
            <div className="flex gap-2 mb-3 flex-wrap">
              {FLAVOR_COLORS.map(c => (
                <button key={c} onClick={() => setNewFlavorColor(c)} className="w-7 h-7 rounded-full border-2" style={{ background: c, borderColor: newFlavorColor === c ? "#1C1C1E" : "transparent" }} />
              ))}
            </div>
            <button onClick={addFlavor} disabled={!newFlavorLabel.trim()} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: newFlavorLabel.trim() ? "#007AFF" : "#C7C7CC" }}>
              Ajouter {newFlavorEmoji} {newFlavorLabel || "..."}
            </button>
          </div>
        </div>
      )}

      {/* Scanner */}
      {scanning && (
        <div className="rounded-2xl overflow-hidden bg-white shadow-sm">
          <div className="relative">
            <video ref={videoRef} autoPlay playsInline className="w-full" style={{ maxHeight: 230, objectFit: "cover" }} />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-44 h-44 rounded-2xl" style={{ border: "2px solid #007AFF", boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)" }} />
            </div>
          </div>
          {!captured && !loading && <div className="p-4"><button onClick={capture} className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white" style={{ background: "#007AFF" }}>📸 Capturer</button></div>}
          {loading && <div className="p-4 text-center text-sm py-6" style={{ color: "#8E8E93" }}>Analyse IA…</div>}
          {confirmed && <div className="p-4 text-center font-semibold py-6" style={{ color: "#34C759" }}>✓ Ajouté ! Prêt pour le suivant.</div>}
          {captured && (
            <div className="p-5 space-y-4">
              {captured.flavor ? (
                <>
                  <div className="text-center">
                    <div className="text-6xl mb-2">{captured.flavor.emoji}</div>
                    <div className="text-3xl font-bold" style={{ color: captured.flavor.color }}>{captured.flavor.label}</div>
                    <div className="text-xs mt-1" style={{ color: "#8E8E93" }}>Goût détecté</div>
                  </div>
                  <div className="flex items-center justify-center gap-5">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ background: "#F2F2F7", color: "#007AFF" }}>−</button>
                    <span className="text-3xl font-bold w-10 text-center" style={{ color: "#1C1C1E" }}>{qty}</span>
                    <button onClick={() => setQty(q => q + 1)} className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ background: "#F2F2F7", color: "#007AFF" }}>+</button>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setCaptured(null)} className="flex-1 py-3 rounded-2xl text-sm font-semibold" style={{ background: "#F2F2F7", color: "#3C3C43" }}>Reprendre</button>
                    <button onClick={validate} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white" style={{ background: captured.flavor.color }}>Valider +{qty}</button>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-3 py-2">
                  <div className="text-sm" style={{ color: "#8E8E93" }}>Non reconnu : <span style={{ color: "#1C1C1E" }}>{captured.raw}</span></div>
                  <button onClick={() => setCaptured(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium" style={{ background: "#F2F2F7", color: "#007AFF" }}>Réessayer</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stock grid */}
      <div className="grid grid-cols-2 gap-3">
        {flavors.map(f => {
          const q = stock[f.id] || 0;
          return (
            <div key={f.id} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{f.emoji}</span>
                  <span className="text-sm font-semibold" style={{ color: "#1C1C1E" }}>{f.label}</span>
                </div>
                <span className="text-2xl font-bold" style={{ color: f.color }}>{q}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F2F2F7" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (q / 20) * 100)}%`, background: f.color }} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => onUpdate(f.id, -1)} disabled={q === 0} className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-30" style={{ background: "#FFF1F0", color: "#FF3B30" }}>−1</button>
                <button onClick={() => onUpdate(f.id, 1)} className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{ background: "#F0FDF4", color: "#34C759" }}>+1</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── STATS PAGE ───────────────────────────────────────────────────────────────
function StatsPage({ clients, flavors }) {
  const allCmds = clients.flatMap(c => c.commandes);
  const weeks = allWeeksFromClients(clients);
  const lastWeek = weeks[weeks.length - 1] || getWeekKey(new Date().toISOString());
  const [weekSel, setWeekSel] = useState(lastWeek);
  const [weekConv, setWeekConv] = useState(lastWeek);

  const totalCAAll = allCmds.reduce((s, c) => s + cmdCA(c), 0);
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
  const tauxCliGlobal = totalClients > 0 ? Math.round((clientsActifs / totalClients) * 100) : 0;
  const weekCliAll = clients.filter(c => getWeekKey(c.dateInscription) === weekConv);
  const weekCliActifs = weekCliAll.filter(c => c.commandes.length > 0).length;
  const tauxCliWeek = weekCliAll.length > 0 ? Math.round((weekCliActifs / weekCliAll.length) * 100) : 0;
  const allFilleuls = clients.filter(c => c.parrainePar !== null);
  const filleulsActifsG = allFilleuls.filter(c => c.commandes.length > 0).length;
  const tauxFilGlobal = allFilleuls.length > 0 ? Math.round((filleulsActifsG / allFilleuls.length) * 100) : 0;
  const weekFil = allFilleuls.filter(c => getWeekKey(c.dateInscription) === weekConv);
  const weekFilActifs = weekFil.filter(c => c.commandes.length > 0).length;
  const tauxFilWeek = weekFil.length > 0 ? Math.round((weekFilActifs / weekFil.length) * 100) : 0;
  const topParrains = clients.filter(c => filleulsActifsCount(c, clients) >= 3);
  const graphWeeks = weeks.slice(-8);
  const maxG = Math.max(...graphWeeks.map(w => caByWeek[w] || 0), 1);

  const Bar = ({ val, color, label, sub }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between"><span className="text-sm" style={{ color: "#3C3C43" }}>{label}</span><span className="text-sm font-bold" style={{ color }}>{val}%</span></div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F2F2F7" }}><div className="h-full rounded-full transition-all" style={{ width: `${val}%`, background: color }} /></div>
      {sub && <div className="text-xs" style={{ color: "#C7C7CC" }}>{sub}</div>}
    </div>
  );

  const P = "bg-white rounded-2xl shadow-sm p-4 space-y-4";
  return (
    <div className="space-y-5 pb-28">
      <h2 className="text-2xl font-bold pt-2" style={{ color: "#1C1C1E" }}>Statistiques</h2>
      <Carousel panels={[
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
          <div className="rounded-xl p-4" style={{ background: "#F2F2F7" }}>
            <div className="text-xs font-semibold mb-1" style={{ color: "#8E8E93" }}>CA TOTAL</div>
            <div className="text-3xl font-bold" style={{ color: "#34C759" }}>{totalCAAll}€</div>
            <div className="flex gap-4 mt-2">
              <span className="text-xs" style={{ color: "#8E8E93" }}>🛍 <span style={{ color: "#1C1C1E", fontWeight: 600 }}>{totalProdCA}€</span></span>
              <span className="text-xs" style={{ color: "#8E8E93" }}>🚚 <span style={{ color: "#1C1C1E", fontWeight: 600 }}>{totalLivCA}€</span></span>
            </div>
          </div>
          {bestWeekEntry && <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: "#FFF7ED" }}>
            <div><div className="text-xs font-bold" style={{ color: "#FF9500" }}>⭐ Meilleure semaine</div><div className="text-xs mt-0.5" style={{ color: "#8E8E93" }}>{weekLabel(bestWeekEntry[0])}</div></div>
            <div className="text-xl font-bold" style={{ color: "#FF9500" }}>{bestWeekEntry[1]}€</div>
          </div>}
        </div>,
        <div className={P}>
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8E8E93" }}>Par semaine</div>
          {weeks.length > 0 ? <>
            <WeekSelector weeks={weeks} current={weekSel} onChange={setWeekSel} />
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3 text-center" style={{ background: "#F2F2F7" }}><div className="text-2xl font-bold" style={{ color: "#34C759" }}>{weekCmds.length}</div><div className="text-xs mt-0.5" style={{ color: "#8E8E93" }}>Ventes</div></div>
              <div className="rounded-xl p-3 text-center" style={{ background: "#F2F2F7" }}><div className="text-2xl font-bold" style={{ color: "#007AFF" }}>{weekNewClients}</div><div className="text-xs mt-0.5" style={{ color: "#8E8E93" }}>Nvx clients</div></div>
            </div>
            <div className="rounded-xl p-4" style={{ background: "#F2F2F7" }}>
              <div className="text-xs font-semibold mb-1" style={{ color: "#8E8E93" }}>CA CETTE SEMAINE</div>
              <div className="text-3xl font-bold" style={{ color: "#34C759" }}>{weekCAVal}€</div>
              <div className="flex gap-4 mt-2">
                <span className="text-xs" style={{ color: "#8E8E93" }}>🛍 <span style={{ color: "#1C1C1E", fontWeight: 600 }}>{weekProdCA}€</span></span>
                <span className="text-xs" style={{ color: "#8E8E93" }}>🚚 <span style={{ color: "#1C1C1E", fontWeight: 600 }}>{weekLivCA}€</span></span>
              </div>
            </div>
            {bestWeekEntry && weekSel === bestWeekEntry[0] && <div className="text-center text-sm font-semibold" style={{ color: "#FF9500" }}>⭐ Votre meilleure semaine !</div>}
          </> : <p className="text-sm" style={{ color: "#C7C7CC" }}>Aucune commande encore.</p>}
        </div>,
        <div className={P}>
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8E8E93" }}>Évolution CA</div>
          <div style={{ height: 130 }}>
            <svg width="100%" height="130" viewBox={`0 0 ${Math.max(graphWeeks.length, 1) * 44} 130`} preserveAspectRatio="none">
              {graphWeeks.map((w, i) => {
                const val = caByWeek[w] || 0;
                const h = Math.max((val / maxG) * 105, val > 0 ? 8 : 0);
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
      ]} />
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8E8E93" }}>Ventes par goût</div>
        {flavors.map(f => {
          const tot = allCmds.filter(c => c.gout === f.id).reduce((s, c) => s + c.quantite, 0);
          const maxF = Math.max(...flavors.map(fl => allCmds.filter(c => c.gout === fl.id).reduce((s, c) => s + c.quantite, 0)), 1);
          return <div key={f.id} className="space-y-1.5">
            <div className="flex justify-between"><span className="text-sm" style={{ color: "#1C1C1E" }}>{f.emoji} {f.label}</span><span className="text-sm font-semibold" style={{ color: f.color }}>{tot} unités</span></div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F2F2F7" }}><div className="h-full rounded-full transition-all" style={{ width: `${(tot / maxF) * 100}%`, background: f.color }} /></div>
          </div>;
        })}
      </div>
      <Carousel panels={[
        <div className={P}>
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8E8E93" }}>Conversion clients</div>
          <div className="text-center py-1"><div className="text-5xl font-bold" style={{ color: "#007AFF" }}>{tauxCliGlobal}%</div><div className="text-xs mt-1" style={{ color: "#8E8E93" }}>{clientsActifs} sur {totalClients} ont commandé</div></div>
          <Bar val={tauxCliGlobal} color="#007AFF" label="Global" />
          <div className="border-t pt-3" style={{ borderColor: "#F2F2F7" }}>
            <WeekSelector weeks={weeks.length ? weeks : [lastWeek]} current={weekConv} onChange={setWeekConv} />
            <Bar val={tauxCliWeek} color="#007AFF" label="Semaine" sub={`${weekCliActifs}/${weekCliAll.length} clients`} />
          </div>
        </div>,
        <div className={P}>
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8E8E93" }}>Conversion filleuls</div>
          <div className="text-center py-1"><div className="text-5xl font-bold" style={{ color: "#FF9500" }}>{tauxFilGlobal}%</div><div className="text-xs mt-1" style={{ color: "#8E8E93" }}>{filleulsActifsG} sur {allFilleuls.length} ont commandé</div></div>
          <Bar val={tauxFilGlobal} color="#FF9500" label="Global" />
          <div className="border-t pt-3" style={{ borderColor: "#F2F2F7" }}>
            <WeekSelector weeks={weeks.length ? weeks : [lastWeek]} current={weekConv} onChange={setWeekConv} />
            <Bar val={tauxFilWeek} color="#FF9500" label="Semaine" sub={`${weekFilActifs}/${weekFil.length} filleuls`} />
          </div>
        </div>,
        <div className={P}>
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8E8E93" }}>Parrains 3+ filleuls actifs</div>
          {topParrains.length > 0 ? topParrains.map(c => {
            const a = filleulsActifsCount(c, clients);
            return <div key={c.id} className="flex items-center gap-3 py-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg, #FF9500, #FF3B30)" }}>{c.prenom.charAt(0)}</div>
              <div className="flex-1 min-w-0"><div className="text-sm font-semibold" style={{ color: "#1C1C1E" }}>{c.prenom}</div><div className="text-xs" style={{ color: "#8E8E93" }}>{c.parrainageFait.length} filleuls total</div></div>
              <div className="text-lg font-bold" style={{ color: "#FF9500" }}>{a}✓</div>
            </div>;
          }) : <div className="py-6 text-center text-sm" style={{ color: "#C7C7CC" }}>Aucun parrain avec 3+ filleuls actifs.</div>}
        </div>
      ]} />
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "clients", label: "Clients", icon: "👥" },
  { id: "stock", label: "Stock", icon: "📦" },
  { id: "stats", label: "Stats", icon: "📊" },
  { id: "ajouter", label: "Ajouter", icon: "➕" },
];

export default function App() {
  const [clients, setClients] = useState(() => {
  try { const s = localStorage.getItem('dg_clients'); return s ? JSON.parse(s) : initClients; } catch { return initClients; }
});
const [stock, setStock] = useState(() => {
  try { const s = localStorage.getItem('dg_stock'); return s ? JSON.parse(s) : initStock; } catch { return initStock; }
});
const [flavors, setFlavors] = useState(() => {
  try { const s = localStorage.getItem('dg_flavors'); return s ? JSON.parse(s) : DEFAULT_FLAVORS; } catch { return DEFAULT_FLAVORS; }
});
const [tab, setTab] = useState("clients");
const [search, setSearch] = useState("");
const [selectedId, setSelectedId] = useState(null);
const [notif, setNotif] = useState(null);
const [deleteTarget, setDeleteTarget] = useState(null);
const [newClient, setNewClient] = useState({ prenom: "", snap: "", telephone: "", adresse: "", parrainePar: "" });
  
useEffect(() => { try { localStorage.setItem('dg_clients', JSON.stringify(clients)); } catch {} }, [clients]);
useEffect(() => { try { localStorage.setItem('dg_stock', JSON.stringify(stock)); } catch {} }, [stock]);
useEffect(() => { try { localStorage.setItem('dg_flavors', JSON.stringify(flavors)); } catch {} }, [flavors]);

  const notify = useCallback((msg, color = "green") => {
    setNotif({ msg, color });
    setTimeout(() => setNotif(null), 2500);
  }, []);

  const filtered = useMemo(() =>
    search.trim() ? clients.filter(c => c.prenom.toLowerCase().includes(search.toLowerCase()) || (c.snap || "").toLowerCase().includes(search.toLowerCase())) : clients,
    [clients, search]);

  const sortedFiltered = useMemo(() => [...filtered].sort((a, b) => (needsAction(b, clients) ? 1 : 0) - (needsAction(a, clients) ? 1 : 0)), [filtered, clients]);
  const selected = clients.find(c => c.id === selectedId);
  const toRelance = clients.filter(c => needsAction(c, clients));

  const handleUpdateStock = (flavorId, delta) => {
    setStock(prev => ({ ...prev, [flavorId]: Math.max(0, (prev[flavorId] || 0) + delta) }));
    if (delta > 0) notify(`+${delta} ${flavors.find(f => f.id === flavorId)?.label} ajouté`);
  };

  const handleUpdateFlavors = (newFlavors) => {
    setFlavors(newFlavors);
    const newStock = { ...stock };
    newFlavors.forEach(f => { if (!(f.id in newStock)) newStock[f.id] = 0; });
    setStock(newStock);
  };

  const handleAddCommande = (clientId, cmd) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, commandes: [...c.commandes, { ...cmd, id: Date.now() }] } : c));
    setStock(prev => ({ ...prev, [cmd.gout]: Math.max(0, (prev[cmd.gout] || 0) - cmd.quantite) }));
    notify(`✓ ${flavors.find(f => f.id === cmd.gout)?.emoji} ×${cmd.quantite} — ${cmdCA(cmd)}€`);
  };

  const handleAddParrainage = (clientId, parrId) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) return { ...c, parrainageFait: [...c.parrainageFait, parrId] };
      if (c.id === parrId) return { ...c, parrainePar: clientId };
      return c;
    }));
    notify("✓ Parrainage enregistré !");
  };

  const handleToggle = (clientId, field) => setClients(prev => prev.map(c => c.id === clientId ? { ...c, [field]: !c[field] } : c));

  const handleDeleteClient = (clientId, keepHistory) => {
    setClients(prev => {
      const filtered = prev.filter(c => c.id !== clientId);
      // Remove from parrainageFait of others, reset parrainePar of filleuls
      return filtered.map(c => ({
        ...c,
        parrainageFait: c.parrainageFait.filter(id => id !== clientId),
        parrainePar: c.parrainePar === clientId ? null : c.parrainePar,
      }));
    });
    if (keepHistory) notify("Client supprimé, historique conservé.");
    else notify("Client et historique supprimés.");
    setSelectedId(null);
  };

  const handleAddClient = () => {
    if (!newClient.prenom.trim()) return;
    const id = Date.now();
    const parrainId = newClient.parrainePar ? parseInt(newClient.parrainePar) : null;
    setClients(prev => {
      const created = { id, prenom: newClient.prenom, snap: newClient.snap, telephone: newClient.telephone, adresse: newClient.adresse, dateInscription: new Date().toISOString().split("T")[0], commandes: [], parrainageFait: [], parrainePar: parrainId, relance1: false, produit5Offert: false, relance2: false, produitGratuitOffert: false };
      const next = [...prev, created];
      if (parrainId) return next.map(c => c.id === parrainId ? { ...c, parrainageFait: [...c.parrainageFait, id] } : c);
      return next;
    });
    setNewClient({ prenom: "", snap: "", telephone: "", adresse: "", parrainePar: "" });
    notify("✓ Client ajouté !");
    setTab("clients");
  };

  // Long press on client row
  const longPressHandlers = (clientId) => {
    let timer;
    return {
      onMouseDown: () => { timer = setTimeout(() => setDeleteTarget(clientId), 600); },
      onMouseUp: () => clearTimeout(timer),
      onMouseLeave: () => clearTimeout(timer),
      onTouchStart: () => { timer = setTimeout(() => setDeleteTarget(clientId), 600); },
      onTouchEnd: () => clearTimeout(timer),
    };
  };

  const ios = { row: "flex items-center gap-3 px-4 py-3.5 border-b last:border-0" };

  return (
    <div style={{ background: "#F2F2F7", minHeight: "100dvh", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" }}>
      {notif && (
        <div className="fixed top-14 left-4 right-4 z-50 px-4 py-3 rounded-2xl text-sm font-semibold text-center shadow-lg"
          style={{ background: notif.color === "red" ? "#FF3B30" : "#34C759", color: "white", zIndex: 100 }}>
          {notif.msg}
        </div>
      )}

      {/* Long press delete modal from list */}
      {deleteTarget && (() => {
        const c = clients.find(x => x.id === deleteTarget);
        return c ? <DeleteClientModal client={c} onCancel={() => setDeleteTarget(null)} onConfirm={(keep) => { handleDeleteClient(c.id, keep); setDeleteTarget(null); }} /> : null;
      })()}

      <div style={{ paddingTop: "env(safe-area-inset-top, 44px)" }}>
        {!selectedId && (
          <div className="px-5 pt-4 pb-2 flex items-baseline justify-between">
            <h1 className="text-3xl font-bold" style={{ color: "#1C1C1E", letterSpacing: "-0.5px" }}>
              {tab === "clients" ? "Clients" : tab === "stock" ? "Stock" : tab === "stats" ? "Statistiques" : "Nouveau client"}
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
                <input type="text" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" style={{ color: "#1C1C1E" }} />
                {search && <button onClick={() => setSearch("")} style={{ color: "#8E8E93" }}>✕</button>}
              </div>
              <div className="text-xs" style={{ color: "#C7C7CC" }}>Appui long sur un client pour le supprimer</div>

              {!search && toRelance.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide mb-2 px-1" style={{ color: "#FF9500" }}>⚡ À relancer</div>
                  <div className="rounded-2xl overflow-hidden bg-white shadow-sm">
                    {toRelance.map(c => {
                      const actifs = filleulsActifsCount(c, clients);
                      return (
                        <div key={c.id} onClick={() => setSelectedId(c.id)} {...longPressHandlers(c.id)}
                          className={ios.row + " active:bg-gray-50 cursor-pointer"} style={{ borderColor: "#F2F2F7" }}>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg, #FF9500, #FF3B30)" }}>{c.prenom.charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold" style={{ color: "#1C1C1E" }}>{c.prenom}</div>
                            <div className="text-xs" style={{ color: "#FF9500" }}>{actifs}/5 filleuls — à relancer !</div>
                          </div>
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
                      <div key={c.id} onClick={() => setSelectedId(c.id)} {...longPressHandlers(c.id)}
                        className={ios.row + " active:bg-gray-50 cursor-pointer"} style={{ borderColor: "#F2F2F7" }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg, #007AFF, #34C759)" }}>{c.prenom.charAt(0)}</div>
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
                  {!search && sortedFiltered.filter(c => !needsAction(c, clients)).length === 0 && toRelance.length > 0 && (
                    <div className="px-4 py-6 text-center text-sm" style={{ color: "#C7C7CC" }}>Tous les clients sont dans "À relancer"</div>
                  )}
                  {!filtered.length && <div className="px-4 py-8 text-center text-sm" style={{ color: "#C7C7CC" }}>Aucun résultat</div>}
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

          {tab === "ajouter" && (
            <div className="space-y-5 pt-2">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                {[
                  { label: "Prénom *", key: "prenom", placeholder: "Jean", type: "text" },
                  { label: "Snap", key: "snap", placeholder: "jean_snap", type: "text" },
                  { label: "Téléphone", key: "telephone", placeholder: "06 00 00 00 00", type: "tel" },
                  { label: "Adresse", key: "adresse", placeholder: "5 rue de la Paix, Paris", type: "text" },
                ].map((f, i, arr) => (
                  <div key={f.key} className="flex items-center gap-3 px-4 py-3.5 border-b last:border-0" style={{ borderColor: "#F2F2F7" }}>
                    <div className="w-24 text-sm flex-shrink-0" style={{ color: "#3C3C43" }}>{f.label}</div>
                    <input type={f.type} placeholder={f.placeholder} value={newClient[f.key]}
                      onChange={e => setNewClient(p => ({ ...p, [f.key]: e.target.value }))}
                      className="flex-1 text-sm outline-none text-right bg-transparent" style={{ color: "#1C1C1E" }} />
                  </div>
                ))}
                <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderColor: "#F2F2F7" }}>
                  <div className="w-24 text-sm flex-shrink-0" style={{ color: "#3C3C43" }}>Parrain</div>
                  <select value={newClient.parrainePar} onChange={e => setNewClient(p => ({ ...p, parrainePar: e.target.value }))} className="flex-1 text-sm outline-none text-right bg-transparent" style={{ color: newClient.parrainePar ? "#1C1C1E" : "#C7C7CC" }}>
                    <option value="">Aucun</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.prenom}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={handleAddClient} disabled={!newClient.prenom.trim()} className="w-full py-4 rounded-2xl font-semibold text-sm text-white" style={{ background: !newClient.prenom.trim() ? "#C7C7CC" : "#007AFF" }}>
                Ajouter le client
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t" style={{ background: "rgba(242,242,247,0.92)", backdropFilter: "blur(20px)", borderColor: "#E5E5EA", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
        <div className="flex justify-around px-2 pt-2 pb-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSelectedId(null); }} className="flex flex-col items-center gap-0.5 px-5 py-1 rounded-xl transition-all">
              <span className="text-2xl leading-none">{t.icon}</span>
              <span className="text-[10px] font-medium" style={{ color: tab === t.id ? "#007AFF" : "#8E8E93" }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
