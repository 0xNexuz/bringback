import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  Handshake,
  LoaderCircle,
  PackageCheck,
  Plus,
  QrCode,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  createWalletClient,
  custom,
  formatEther,
  parseEther,
  type Address,
  type Hash,
} from "viem";
import { bringBackChain, explorerUrl, publicClient } from "./lib/chain";
import {
  borrowBondAbi,
  contractAddress,
  type ContractItem,
  type ItemStatus,
} from "./lib/contract";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

type DashboardTab = "lend" | "borrowed";
type Notice = { kind: "success" | "error" | "pending"; message: string; hash?: Hash };

function shortenAddress(address: string, size = 4) {
  return `${address.slice(0, size + 2)}…${address.slice(-size)}`;
}

function formatMon(value: bigint) {
  const amount = Number(formatEther(value));
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(amount);
}

function formatDuration(seconds: bigint) {
  const value = Number(seconds);
  if (value < 3600) return `${Math.round(value / 60)} min`;
  if (value < 86400) return `${Math.round(value / 3600)} hr`;
  const days = Math.round(value / 86400);
  return `${days} day${days === 1 ? "" : "s"}`;
}

function formatDue(timestamp: bigint) {
  if (timestamp === 0n) return "No active deadline";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(Number(timestamp) * 1000));
}

function getItemStatus(item: ContractItem): { label: string; tone: string } {
  if (item.status === 0) return { label: "Ready to lend", tone: "available" };
  if (item.status === 2) return { label: "Retired", tone: "retired" };
  if (Number(item.dueAt) * 1000 < Date.now()) return { label: "Overdue", tone: "overdue" };
  return { label: "On loan", tone: "borrowed" };
}

function parseSharedItemId() {
  const match = window.location.pathname.match(/^\/item\/(\d+)\/?$/);
  return match ? BigInt(match[1]) : undefined;
}

function normalizeItem(value: unknown): ContractItem {
  const item = value as {
    id: bigint;
    lender: Address;
    borrower: Address;
    name: string;
    bondAmount: bigint;
    loanDuration: bigint;
    dueAt: bigint;
    completedLoans: number;
    status: number;
  };
  return { ...item, status: item.status as ItemStatus };
}

function App() {
  const [account, setAccount] = useState<Address>();
  const [tab, setTab] = useState<DashboardTab>("lend");
  const [lenderItems, setLenderItems] = useState<ContractItem[]>([]);
  const [borrowedItems, setBorrowedItems] = useState<ContractItem[]>([]);
  const [sharedItem, setSharedItem] = useState<ContractItem>();
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice>();
  const [showCreate, setShowCreate] = useState(false);
  const [qrItem, setQrItem] = useState<ContractItem>();
  const [now, setNow] = useState(Date.now());
  const sharedItemId = useMemo(parseSharedItemId, []);

  const walletClient = useMemo(() => {
    if (!window.ethereum) return undefined;
    return createWalletClient({ chain: bringBackChain, transport: custom(window.ethereum) });
  }, []);

  const ensureCorrectNetwork = useCallback(async () => {
    if (!window.ethereum) throw new Error("Install a wallet such as MetaMask to continue.");
    const chainHex = `0x${bringBackChain.id.toString(16)}`;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainHex }],
      });
    } catch (error) {
      const code = (error as { code?: number }).code;
      if (code !== 4902) throw error;
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: chainHex,
            chainName: bringBackChain.name,
            nativeCurrency: bringBackChain.nativeCurrency,
            rpcUrls: bringBackChain.rpcUrls.default.http,
            blockExplorerUrls: [explorerUrl],
          },
        ],
      });
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      await ensureCorrectNetwork();
      const accounts = (await window.ethereum!.request({ method: "eth_requestAccounts" })) as Address[];
      setAccount(accounts[0]);
    } catch (error) {
      setNotice({ kind: "error", message: error instanceof Error ? error.message : "Wallet connection failed." });
    }
  }, [ensureCorrectNetwork]);

  const readItem = useCallback(async (itemId: bigint) => {
    if (!contractAddress) return undefined;
    const value = await publicClient.readContract({
      address: contractAddress,
      abi: borrowBondAbi,
      functionName: "getItem",
      args: [itemId],
    });
    return normalizeItem(value);
  }, []);

  const refresh = useCallback(async () => {
    if (!contractAddress) return;
    setLoading(true);
    try {
      if (sharedItemId) setSharedItem(await readItem(sharedItemId));
      if (account) {
        const [lenderIds, borrowerIds] = await Promise.all([
          publicClient.readContract({
            address: contractAddress,
            abi: borrowBondAbi,
            functionName: "getLenderItemIds",
            args: [account],
          }),
          publicClient.readContract({
            address: contractAddress,
            abi: borrowBondAbi,
            functionName: "getBorrowerItemIds",
            args: [account],
          }),
        ]);
        const uniqueBorrowerIds = [...new Set(borrowerIds.map(String))].map(BigInt);
        const [owned, borrowed] = await Promise.all([
          Promise.all(lenderIds.map(readItem)),
          Promise.all(uniqueBorrowerIds.map(readItem)),
        ]);
        setLenderItems(owned.filter(Boolean) as ContractItem[]);
        setBorrowedItems(
          (borrowed.filter(Boolean) as ContractItem[]).filter(
            (item) => item.borrower.toLowerCase() === account.toLowerCase(),
          ),
        );
      }
    } catch (error) {
      setNotice({ kind: "error", message: error instanceof Error ? error.message : "Could not read contract data." });
    } finally {
      setLoading(false);
    }
  }, [account, readItem, sharedItemId]);

  useEffect(() => {
    void refresh();
    const poll = window.setInterval(() => void refresh(), 15_000);
    return () => window.clearInterval(poll);
  }, [refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!window.ethereum?.on) return;
    const onAccounts = (...args: unknown[]) => setAccount((args[0] as Address[])[0]);
    const onChain = () => window.location.reload();
    window.ethereum.on("accountsChanged", onAccounts);
    window.ethereum.on("chainChanged", onChain);
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", onAccounts);
      window.ethereum?.removeListener?.("chainChanged", onChain);
    };
  }, []);

  const transact = useCallback(
    async (label: string, functionName: "createItem" | "borrowItem" | "confirmReturn" | "claimOverdueBond" | "retireItem", args: readonly unknown[], value?: bigint) => {
      if (!account || !walletClient) {
        await connect();
        return;
      }
      if (!contractAddress) {
        setNotice({ kind: "error", message: "The contract address has not been configured yet." });
        return;
      }
      try {
        await ensureCorrectNetwork();
        setNotice({ kind: "pending", message: `${label} — confirm the transaction in your wallet.` });
        const hash = await walletClient.writeContract({
          account,
          address: contractAddress,
          abi: borrowBondAbi,
          functionName,
          args,
          value,
          chain: bringBackChain,
        } as never);
        setNotice({ kind: "pending", message: `${label} — waiting for Monad confirmation.`, hash });
        await publicClient.waitForTransactionReceipt({ hash });
        setNotice({ kind: "success", message: `${label} complete.`, hash });
        await refresh();
      } catch (error) {
        const raw = error instanceof Error ? error.message : "Transaction failed.";
        setNotice({ kind: "error", message: raw.split("\n")[0] });
      }
    },
    [account, connect, ensureCorrectNetwork, refresh, walletClient],
  );

  const createItem = async (name: string, bond: string, duration: number) => {
    await transact("Item created", "createItem", [name, parseEther(bond), BigInt(duration)]);
    setShowCreate(false);
  };

  const unavailableCount = lenderItems.filter((item) => item.status === 1).length;
  const overdueCount = lenderItems.filter(
    (item) => item.status === 1 && Number(item.dueAt) * 1000 < now,
  ).length;

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="BringBack home">
          <span className="brand-mark"><RotateCcw strokeWidth={2.6} /></span>
          <span>BringBack</span>
        </a>
        <div className="network-chip"><span />{bringBackChain.testnet ? "Monad testnet" : "Monad mainnet"}</div>
        <button className="wallet-button" onClick={connect}>
          <Wallet size={17} />
          {account ? shortenAddress(account) : "Connect wallet"}
        </button>
      </header>

      {!sharedItemId && (
        <main>
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow"><Sparkles size={15} /> Built for things that wander</div>
              <h1>Your stuff should <em>come back.</em></h1>
              <p>Turn any charger, book, or power bank into a QR-tagged loan backed by a small, refundable MON bond.</p>
              <div className="hero-actions">
                <button className="primary-button" onClick={() => account ? setShowCreate(true) : void connect()}>
                  {account ? "Tag an item" : "Start lending"}<ArrowRight size={18} />
                </button>
                <a className="text-link" href="#how-it-works">See how it works <ArrowDownRight size={17} /></a>
              </div>
              <div className="trust-row">
                <span><ShieldCheck size={17} /> Non-custodial</span>
                <span><RefreshCw size={17} /> Instant refunds</span>
                <span><Handshake size={17} /> Made for people you know</span>
              </div>
            </div>

            <div className="hero-object" aria-label="Example BringBack item tag">
              <div className="object-shadow" />
              <div className="tag-card">
                <div className="tag-hole" />
                <div className="tag-topline"><span>BRINGBACK TAG</span><span>#0042</span></div>
                <div className="tag-item-icon">⚡</div>
                <h2>65W USB-C charger</h2>
                <div className="tag-meta">
                  <div><small>RETURN BOND</small><strong>0.10 MON</strong></div>
                  <div><small>DUE IN</small><strong>2 days</strong></div>
                </div>
                <div className="tag-qr"><QrCode size={62} strokeWidth={1.5} /><span>SCAN TO BORROW</span></div>
              </div>
              <div className="scribble">No more “who has my charger?”</div>
            </div>
          </section>

          <section className="dashboard-section" id="dashboard">
            <div className="section-heading">
              <div><span className="section-kicker">YOUR LENDING DESK</span><h2>Keep tabs without nagging.</h2></div>
              {account && <button className="primary-button compact" onClick={() => setShowCreate(true)}><Plus size={17} /> Tag an item</button>}
            </div>

            {!contractAddress && <SetupBanner />}

            {!account ? (
              <div className="connect-panel">
                <div className="connect-icon"><Wallet size={28} /></div>
                <div><h3>Open your lending desk</h3><p>Connect a Monad wallet to create item tags and see live loans.</p></div>
                <button className="primary-button" onClick={connect}>Connect wallet <ChevronRight size={18} /></button>
              </div>
            ) : (
              <>
                <div className="stats-row">
                  <Stat label="Tagged items" value={lenderItems.length} detail="All-time" />
                  <Stat label="Out right now" value={unavailableCount} detail="Active loans" />
                  <Stat label="Need attention" value={overdueCount} detail="Past deadline" tone={overdueCount ? "alert" : undefined} />
                </div>
                <div className="desk">
                  <div className="tabs" role="tablist">
                    <button className={tab === "lend" ? "active" : ""} onClick={() => setTab("lend")}>Things I lend <span>{lenderItems.length}</span></button>
                    <button className={tab === "borrowed" ? "active" : ""} onClick={() => setTab("borrowed")}>Things I borrowed <span>{borrowedItems.length}</span></button>
                    <button className="refresh-button" aria-label="Refresh contract data" onClick={() => void refresh()}><RefreshCw size={16} className={loading ? "spinning" : ""} /></button>
                  </div>
                  <div className="item-grid">
                    {(tab === "lend" ? lenderItems : borrowedItems).map((item) => (
                      <ItemCard
                        key={item.id.toString()}
                        item={item}
                        ownerView={tab === "lend"}
                        onQr={() => setQrItem(item)}
                        onReturn={() => void transact("Return confirmed", "confirmReturn", [item.id])}
                        onClaim={() => void transact("Overdue bond claimed", "claimOverdueBond", [item.id])}
                        onRetire={() => void transact("Item retired", "retireItem", [item.id])}
                      />
                    ))}
                    {!loading && (tab === "lend" ? lenderItems : borrowedItems).length === 0 && (
                      <EmptyState borrowed={tab === "borrowed"} onCreate={() => setShowCreate(true)} />
                    )}
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="how-section" id="how-it-works">
            <div className="how-intro"><span className="section-kicker">HOW IT WORKS</span><h2>One tiny bond.<br />Zero awkward reminders.</h2></div>
            <div className="steps">
              <Step number="01" icon={<QrCode />} title="Tag it" text="Name your item, choose a return bond and print or share its QR code." />
              <Step number="02" icon={<Handshake />} title="Lend it" text="Your friend scans, connects their wallet and locks the exact bond on Monad." />
              <Step number="03" icon={<PackageCheck />} title="Get it back" text="Confirm the return and the contract sends their bond straight back." />
            </div>
          </section>
        </main>
      )}

      {Boolean(sharedItemId) && (
        <BorrowPage
          item={sharedItem}
          account={account}
          loading={loading}
          onConnect={connect}
          onBorrow={(item) => void transact("Bond locked", "borrowItem", [item.id], item.bondAmount)}
        />
      )}

      <footer><div className="brand mini"><span className="brand-mark"><RotateCcw /></span><span>BringBack</span></div><p>Built on Monad. Designed for the things your friends “forgot” they borrowed.</p></footer>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onSubmit={createItem} />}
      {qrItem && <QrModal item={qrItem} onClose={() => setQrItem(undefined)} />}
      {notice && <Toast notice={notice} onClose={() => setNotice(undefined)} />}
    </div>
  );
}

function SetupBanner() {
  return <div className="setup-banner"><span>Builder preview</span><p>Deploy <code>BorrowBond.sol</code> and set <code>VITE_CONTRACT_ADDRESS</code> to activate live transactions.</p></div>;
}

function Stat({ label, value, detail, tone }: { label: string; value: number; detail: string; tone?: string }) {
  return <div className={`stat-card ${tone || ""}`}><span>{label}</span><strong>{String(value).padStart(2, "0")}</strong><small>{detail}</small></div>;
}

function Step({ number, icon, title, text }: { number: string; icon: React.ReactNode; title: string; text: string }) {
  return <article className="step-card"><div className="step-head"><span>{number}</span><i>{icon}</i></div><h3>{title}</h3><p>{text}</p></article>;
}

function EmptyState({ borrowed, onCreate }: { borrowed: boolean; onCreate: () => void }) {
  return <div className="empty-state"><div>{borrowed ? <Handshake size={30} /> : <QrCode size={30} />}</div><h3>{borrowed ? "Nothing borrowed right now" : "Tag your first item"}</h3><p>{borrowed ? "Loans you accept will appear here automatically." : "Give something you lend a refundable return bond."}</p>{!borrowed && <button className="secondary-button" onClick={onCreate}><Plus size={16} /> Create a tag</button>}</div>;
}

function ItemCard({ item, ownerView, onQr, onReturn, onClaim, onRetire }: { item: ContractItem; ownerView: boolean; onQr: () => void; onReturn: () => void; onClaim: () => void; onRetire: () => void }) {
  const status = getItemStatus(item);
  const overdue = item.status === 1 && Number(item.dueAt) * 1000 < Date.now();
  return <article className="item-card">
    <div className="item-card-head"><span className={`status-pill ${status.tone}`}><i />{status.label}</span><span className="item-number">#{item.id.toString().padStart(4, "0")}</span></div>
    <div className="item-title"><div>{item.name.toLowerCase().includes("book") ? "📘" : item.name.toLowerCase().includes("charger") ? "⚡" : "📦"}</div><h3>{item.name}</h3></div>
    <div className="item-details">
      <div><small>RETURN BOND</small><strong>{formatMon(item.bondAmount)} MON</strong></div>
      <div><small>{item.status === 1 ? "DUE" : "LOAN WINDOW"}</small><strong>{item.status === 1 ? formatDue(item.dueAt) : formatDuration(item.loanDuration)}</strong></div>
    </div>
    {item.status === 1 && <div className="borrower-line"><span>{ownerView ? "With" : "From"}</span><strong>{shortenAddress(ownerView ? item.borrower : item.lender, 5)}</strong></div>}
    <div className="card-actions">
      {ownerView && item.status === 0 && <><button className="secondary-button" onClick={onQr}><QrCode size={16} /> Share QR</button><button className="icon-button" title="Retire item" onClick={onRetire}><X size={16} /></button></>}
      {ownerView && item.status === 1 && <><button className="secondary-button success" onClick={onReturn}><Check size={16} /> Confirm return</button>{overdue && <button className="danger-button" onClick={onClaim}>Claim bond</button>}</>}
      {!ownerView && item.status === 1 && <span className="waiting-note"><Clock3 size={15} /> Waiting for lender to confirm return</span>}
    </div>
  </article>;
}

function CreateModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (name: string, bond: string, duration: number) => Promise<void> }) {
  const [name, setName] = useState("");
  const [bond, setBond] = useState("0.1");
  const [duration, setDuration] = useState(172800);
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || Number(bond) <= 0) return;
    setSubmitting(true);
    await onSubmit(name.trim(), bond, duration);
    setSubmitting(false);
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="create-title"><button className="modal-close" onClick={onClose}><X /></button><span className="modal-kicker">NEW BRINGBACK TAG</span><h2 id="create-title">What are you lending?</h2><p className="modal-copy">Set a small bond that comes straight back when you confirm the return.</p><form onSubmit={submit}>
    <label>ITEM NAME<input autoFocus maxLength={64} placeholder="e.g. 65W USB-C charger" value={name} onChange={(event) => setName(event.target.value)} required /></label>
    <div className="form-grid"><label>RETURN BOND<div className="input-suffix"><input type="number" min="0.0001" step="0.0001" value={bond} onChange={(event) => setBond(event.target.value)} required /><span>MON</span></div></label><label>RETURN WINDOW<select value={duration} onChange={(event) => setDuration(Number(event.target.value))}><option value={3600}>1 hour</option><option value={86400}>1 day</option><option value={172800}>2 days</option><option value={604800}>7 days</option><option value={2592000}>30 days</option></select></label></div>
    <div className="bond-note"><ShieldCheck size={17} /><span>The contract holds the bond. BringBack can never move it.</span></div>
    <button className="primary-button full" type="submit" disabled={submitting || !name.trim()}>{submitting ? <LoaderCircle className="spinning" size={18} /> : <Plus size={18} />} Create item tag</button>
  </form></div></div>;
}

function QrModal({ item, onClose }: { item: ContractItem; onClose: () => void }) {
  const url = `${window.location.origin}/item/${item.id}`;
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 1500); };
  return <div className="modal-backdrop"><div className="modal qr-modal"><button className="modal-close" onClick={onClose}><X /></button><span className="modal-kicker">ITEM #{item.id.toString().padStart(4, "0")}</span><h2>Scan to borrow</h2><div className="qr-frame"><QRCodeSVG value={url} size={210} level="H" bgColor="#ffffff" fgColor="#14211b" /></div><h3>{item.name}</h3><p>{formatMon(item.bondAmount)} MON refundable bond · {formatDuration(item.loanDuration)}</p><button className="secondary-button full" onClick={copy}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? "Copied" : "Copy borrow link"}</button></div></div>;
}

function BorrowPage({ item, account, loading, onConnect, onBorrow }: { item?: ContractItem; account?: Address; loading: boolean; onConnect: () => void; onBorrow: (item: ContractItem) => void }) {
  if (loading && !item) return <main className="borrow-page"><LoaderCircle className="spinning" size={32} /></main>;
  if (!item) return <main className="borrow-page"><div className="borrow-card"><div className="borrow-illustration">?</div><h1>Item not found</h1><p>This tag may be invalid or the contract is not configured.</p><a className="secondary-button" href="/">Back to BringBack</a></div></main>;
  const status = getItemStatus(item);
  const canBorrow = item.status === 0 && account?.toLowerCase() !== item.lender.toLowerCase();
  return <main className="borrow-page"><div className="borrow-layout"><div className="borrow-card"><div className="borrow-card-top"><span className={`status-pill ${status.tone}`}><i />{status.label}</span><span>#{item.id.toString().padStart(4, "0")}</span></div><div className="borrow-illustration">{item.name.toLowerCase().includes("charger") ? "⚡" : "📦"}</div><span className="modal-kicker">YOU'RE BORROWING</span><h1>{item.name}</h1><p>From <strong>{shortenAddress(item.lender, 6)}</strong></p><div className="borrow-terms"><div><small>REFUNDABLE BOND</small><strong>{formatMon(item.bondAmount)} MON</strong></div><div><small>RETURN WITHIN</small><strong>{formatDuration(item.loanDuration)}</strong></div></div>{!account ? <button className="primary-button full" onClick={onConnect}><Wallet size={18} /> Connect to borrow</button> : canBorrow ? <button className="primary-button full" onClick={() => onBorrow(item)}><Handshake size={18} /> Lock bond & borrow</button> : <div className="unavailable-note">{account.toLowerCase() === item.lender.toLowerCase() ? "This is your item tag." : "This item is not available right now."}</div>}<a href={`${explorerUrl}/address/${contractAddress || ZERO_ADDRESS}`} target="_blank" rel="noreferrer" className="contract-link">View the bond contract <ExternalLink size={14} /></a></div><div className="borrow-assurance"><ShieldCheck size={24} /><h2>Your bond has one job.</h2><p>It stays in the BorrowBond contract until the lender confirms the item came back. Then it returns directly to your wallet.</p><div className="assurance-flow"><span>Your wallet</span><ArrowRight /><span>BorrowBond</span><ArrowRight /><span>Back to you</span></div></div></div></main>;
}

function Toast({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  return <div className={`toast ${notice.kind}`}>{notice.kind === "pending" ? <LoaderCircle className="spinning" /> : notice.kind === "success" ? <Check /> : <X />}<div><strong>{notice.kind === "pending" ? "Working on it" : notice.kind === "success" ? "All done" : "Something went wrong"}</strong><p>{notice.message}</p>{notice.hash && <a href={`${explorerUrl}/tx/${notice.hash}`} target="_blank" rel="noreferrer">View transaction <ExternalLink size={13} /></a>}</div><button onClick={onClose}><X size={15} /></button></div>;
}

export default App;
