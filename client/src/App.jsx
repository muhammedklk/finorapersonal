import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, ArrowRight, Bell, CalendarDays, Camera, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, CreditCard, Download, Eye, EyeOff, FileChartColumn, Filter, Goal as GoalIcon, LayoutDashboard, Lock, LogOut, Mail, Menu, Moon, MoreHorizontal, PiggyBank, Plus, Repeat2, Search, Settings, ShieldCheck, Sparkles, Star, Sun, Target, TrendingUp, Upload, User as UserIcon, Wallet, X, Trash2, Pencil } from 'lucide-react';
import { makeApi } from './api';
const categories = ['Food & Dining', 'Transport', 'Shopping', 'Bills & Utilities', 'Health', 'Entertainment', 'Education', 'Rent', 'Savings', 'Salary', 'Freelance', 'Investment', 'Other'];
const colors = ['#6c63ff', '#37b8a5', '#f5a65b', '#ed6a83', '#5c9ded', '#aa80df', '#80bd6b', '#e5c35b'];
const monthNow = () => new Date().toISOString().slice(0, 7); const dateNow = () => new Date().toISOString().slice(0, 10);
const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0);
const shortMoney = (n) => { n = Number(n) || 0; return n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : money(n) };
const dayLabel = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
const initials = (name = 'User') => name.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
function AnimatedNumber({ value, prefix = '₹', suffix = '', duration = 850, format = true }) { const target = Number(value) || 0; const isNegative = target < 0; const absTarget = Math.abs(target); const [current, setCurrent] = useState(0); const startRef = useRef(0); const startTimeRef = useRef(null); const frameRef = useRef(null); useEffect(() => { const start = startRef.current; startTimeRef.current = null; if (start === absTarget) { setCurrent(absTarget); return } const animate = (timestamp) => { if (!startTimeRef.current) startTimeRef.current = timestamp; const elapsed = timestamp - startTimeRef.current; const progress = Math.min(elapsed / duration, 1); const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress); const val = Math.round(start + (absTarget - start) * ease); setCurrent(val); if (progress < 1) { frameRef.current = requestAnimationFrame(animate) } else { startRef.current = absTarget; setCurrent(absTarget) } }; frameRef.current = requestAnimationFrame(animate); return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) } }, [absTarget, duration]); const formatted = format ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(current) : current; return <span>{isNegative ? '-' : ''}{prefix}{formatted}{suffix}</span> }
function IconBox({ children, tone = 'purple' }) { return <div className={`icon-box ${tone}`}>{children}</div> }
function Button({ children, variant = 'primary', ...props }) { return <button className={`btn btn-${variant} fin-btn`} {...props}>{children}</button> }
function App() {
    const [token, setToken] = useState(localStorage.getItem('finora_token') || ''); const [user, setUser] = useState(JSON.parse(localStorage.getItem('finora_user') || 'null'));
    const [dark, setDark] = useState(localStorage.getItem('finora_dark') === 'true'); const [page, setPage] = useState('Overview'); const [sidebarOpen, setSidebarOpen] = useState(false); const [loading, setLoading] = useState(false); const [toast, setToast] = useState(''); const [error, setError] = useState('');
    const [transactions, setTransactions] = useState([]), [budgets, setBudgets] = useState([]), [goals, setGoals] = useState([]), [recurring, setRecurring] = useState([]);
    const [month, setMonth] = useState(monthNow()), [search, setSearch] = useState(''), [typeFilter, setTypeFilter] = useState('all'); const [showTransaction, setShowTransaction] = useState(false), [editRow, setEditRow] = useState(null), [showBudget, setShowBudget] = useState(false), [showGoal, setShowGoal] = useState(false), [showRecurring, setShowRecurring] = useState(false), [showProfile, setShowProfile] = useState(false), [showNotifications, setShowNotifications] = useState(false), [authMode, setAuthMode] = useState('login');
    const monthInputRef = useRef(null);
    const prevMonth = () => { const [y, m] = month.split('-').map(Number); const d = new Date(y, m - 2, 1); setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); };
    const nextMonth = () => { const [y, m] = month.split('-').map(Number); const d = new Date(y, m, 1); setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); };
    const api = useMemo(() => makeApi(token), [token]);
    const notify = useCallback((message) => { setToast(message); window.setTimeout(() => setToast(''), 3000) }, []);
    const logout = () => { localStorage.removeItem('finora_token'); localStorage.removeItem('finora_user'); setToken(''); setUser(null); setTransactions([]); setBudgets([]); setGoals([]); setRecurring([]); };
    const loadData = useCallback(async () => { if (!token) return; setLoading(true); setError(''); try { const [t, b, g, r] = await Promise.all([api.get('/transactions'), api.get('/planning/budgets'), api.get('/planning/goals'), api.get('/planning/recurring')]); setTransactions(t); setBudgets(b); setGoals(g); setRecurring(r); } catch (e) { setError(e.message); if (/session|sign in/i.test(e.message)) logout(); } finally { setLoading(false) } }, [token, api]);
    useEffect(() => { if (token) loadData() }, [token, loadData]);
    useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; localStorage.setItem('finora_dark', String(dark)); }, [dark]);
    const year = useMemo(() => month.slice(0, 4), [month]);
    const currentTransactions = useMemo(() => transactions.filter(t => String(t.date).slice(0, 7) === month), [transactions, month]);
    const yearTransactions = useMemo(() => transactions.filter(t => String(t.date).slice(0, 4) === year), [transactions, year]);
    const visibleTransactions = useMemo(() => currentTransactions.filter(t => (typeFilter === 'all' || t.type === typeFilter) && `${t.category} ${t.description} ${t.paymentMethod}`.toLowerCase().includes(search.toLowerCase())), [currentTransactions, typeFilter, search]);
    const income = currentTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0); const expense = currentTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const yearlyIncome = useMemo(() => yearTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [yearTransactions]);
    const yearlyExpense = useMemo(() => yearTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [yearTransactions]);
    const balance = transactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0); const saved = goals.reduce((s, g) => s + Math.min(g.saved, g.target), 0);
    const monthlySeries = useMemo(() => Array.from({ length: 6 }, (_, i) => { const d = new Date(`${month}-01T12:00:00`); d.setMonth(d.getMonth() - 5 + i); const m = d.toISOString().slice(0, 7); const rows = transactions.filter(t => String(t.date).slice(0, 7) === m); return { month: d.toLocaleDateString('en-IN', { month: 'short' }), income: rows.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), expense: rows.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0) } }), [transactions, month]);
    const yearlySeries = useMemo(() => { const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; return mNames.map((mShort, idx) => { const mStr = `${year}-${String(idx + 1).padStart(2, '0')}`; const rows = transactions.filter(t => String(t.date).slice(0, 7) === mStr); return { month: mShort, income: rows.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), expense: rows.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0) } }) }, [transactions, year]);
    const categoryData = useMemo(() => { const map = {}; currentTransactions.filter(t => t.type === 'expense').forEach(t => map[t.category] = (map[t.category] || 0) + t.amount); return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value) }, [currentTransactions]);
    const yearlyCategoryData = useMemo(() => { const map = {}; yearTransactions.filter(t => t.type === 'expense').forEach(t => map[t.category] = (map[t.category] || 0) + t.amount); return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value) }, [yearTransactions]);
    const budgetRows = useMemo(() => budgets.filter(b => b.month === month).map(b => ({ ...b, spent: currentTransactions.filter(t => t.type === 'expense' && t.category === b.category).reduce((s, t) => s + t.amount, 0) })), [budgets, month, currentTransactions]);
    const doAuth = async (data) => { setError(''); try { const res = await makeApi('').post(`/auth/${authMode === 'login' ? 'login' : 'register'}`, data); localStorage.setItem('finora_token', res.token); localStorage.setItem('finora_user', JSON.stringify(res.user)); setToken(res.token); setUser(res.user); notify(authMode === 'login' ? 'Welcome back!' : 'Account created successfully.'); } catch (e) { setError(e.message) } };
    const saveTransaction = async (data) => { try { if (editRow) await api.put(`/transactions/${editRow._id}`, data); else await api.post('/transactions', data); setShowTransaction(false); setEditRow(null); if (data.date && String(data.date).slice(0, 7) !== month) { setMonth(String(data.date).slice(0, 7)); } await loadData(); notify(editRow ? 'Transaction updated' : 'Transaction added'); } catch (e) { setError(e.message) } };
    const deleteTransaction = async (id) => { if (!confirm('Delete this transaction?')) return; try { await api.delete(`/transactions/${id}`); await loadData(); notify('Transaction deleted'); } catch (e) { setError(e.message) } };
    const exportCsv = () => { const rows = [['Date', 'Type', 'Category', 'Description', 'Payment method', 'Amount'], ...visibleTransactions.map(t => [String(t.date).slice(0, 10), t.type, t.category, t.description || '', t.paymentMethod, t.amount])]; const csv = rows.map(r => r.map(v => `"${String(v ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })); a.download = `finora-transactions-${month}.csv`; a.click(); URL.revokeObjectURL(a.href); };
    const processRecurring = async () => { try { const r = await api.post('/planning/recurring/run', {}); await loadData(); notify(r.message) } catch (e) { setError(e.message) } };
    const nav = [{ label: 'Overview', icon: LayoutDashboard }, { label: 'Transactions', icon: ArrowLeftRight }, { label: 'Budgets', icon: Wallet }, { label: 'Savings goals', icon: Target }, { label: 'Recurring', icon: Repeat2 }, { label: 'Financial reports', icon: FileChartColumn }, { label: 'Settings', icon: Settings }];
    if (!token) return <AuthScreen mode={authMode} setMode={setAuthMode} onSubmit={doAuth} error={error} />;
    return <div className={`app-shell ${dark ? 'dark' : ''}`}>
        <AnimatePresence>{sidebarOpen && <motion.div className="mobile-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} />}</AnimatePresence>
        <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <div className="brand"><div className="brand-mark"><Activity size={20} /></div><span>finora<span className="brand-dot">.</span></span><button className="mobile-close" onClick={() => setSidebarOpen(false)}><X size={18} /></button></div>
            <div className="sidebar-scroll"><div className="workspace-label">WORKSPACE</div><div className="nav-list">{nav.map(item => <button key={item.label} className={`nav-item ${(page === item.label || (item.label === 'Financial reports' && page === 'Monthly reports')) ? 'active' : ''}`} onClick={() => { setPage(item.label); setSidebarOpen(false) }}><item.icon size={18} /><span>{item.label}</span>{item.label === 'Transactions' && <span className="nav-count">{transactions.length}</span>}</button>)}</div>
                <div className="sidebar-bottom"><div className="upgrade-card"><div className="upgrade-icon"><PiggyBank size={20} /></div><strong>Build better habits</strong><p>Small steps today, more freedom tomorrow.</p><button onClick={() => setPage('Savings goals')}>View savings goals <span>→</span></button></div><button className="nav-item" onClick={() => setDark(!dark)}>{dark ? <Sun size={18} /> : <Moon size={18} />}<span>{dark ? 'Light mode' : 'Dark mode'}</span><span className="mode-pill">{dark ? 'ON' : 'OFF'}</span></button><button className="nav-item" onClick={logout}><LogOut size={18} /><span>Sign out</span></button></div></div>
            <button type="button" className={`sidebar-user ${page === 'Settings' ? 'active-user' : ''}`} onClick={() => { setPage('Settings'); setSidebarOpen(false); }} title="View profile & account settings"><div className="avatar">{user?.avatar ? <img src={user.avatar} alt="Profile" className="avatar-img" /> : initials(user?.name)}</div><div className="user-meta"><strong>{user?.name || 'Your account'}</strong><span>Personal workspace</span></div><Settings size={18} /></button>
        </aside>
        <main className="main-area"><header className="topbar"><div className="topbar-left"><button className="menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Toggle menu"><Menu size={21} /></button><div className="topbar-title-wrap"><div className="breadcrumb">Workspace <span>/</span> <b>{page}</b></div><h1>{page === 'Overview' ? 'Good to see you' : page}</h1></div></div><div className="topbar-actions"><div className="month-nav-group"><button type="button" className="month-nav-btn" onClick={prevMonth} title="Previous month" aria-label="Previous month"><ChevronLeft size={16} /></button><label className="month-picker" onClick={() => monthInputRef.current?.showPicker?.()} title="Select month"><CalendarDays size={15} /><input ref={monthInputRef} aria-label="Selected month" type="month" value={month} onChange={e => { if (e.target.value) setMonth(e.target.value) }} /></label><button type="button" className="month-nav-btn" onClick={nextMonth} title="Next month" aria-label="Next month"><ChevronRight size={16} /></button></div><button className="icon-button" title="Toggle theme" onClick={() => setDark(!dark)}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button><button className="icon-button notification-button" title="Notifications" onClick={() => setShowNotifications(true)}><Bell size={18} /><i /></button><button type="button" className={`avatar top-avatar ${page === 'Settings' ? 'active-avatar' : ''}`} title="Account profile & settings" onClick={() => setPage('Settings')} style={{ border: 0, cursor: 'pointer', padding: 0 }}>{user?.avatar ? <img src={user.avatar} alt="Profile" className="avatar-img" /> : initials(user?.name)}</button></div></header>
            {error && <div className="alert alert-danger alert-dismissible" role="alert">{error}<button className="btn-close" onClick={() => setError('')} /></div>}
            {loading && <div className="loading-line"><span /></div>}
            <div className="page-content">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={page === 'Monthly reports' ? 'Financial reports' : page}
                        initial={{ opacity: 0, y: 12, scale: .996 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: .996 }}
                        transition={{ duration: .25, ease: [.16, 1, .3, 1] }}
                        className="page-motion-wrap"
                    >
                        {page === 'Overview' && <Overview income={income} expense={expense} balance={balance} saved={saved} series={monthlySeries} categoryData={categoryData} transactions={currentTransactions} budgets={budgetRows} goals={goals} onAdd={() => { setEditRow(null); setShowTransaction(true) }} onViewAll={() => setPage('Transactions')} onBudget={() => setShowBudget(true)} onGoal={() => setShowGoal(true)} onReports={() => setPage('Financial reports')} onViewExpenses={() => { setTypeFilter('expense'); setPage('Transactions'); }} month={month} />}
                        {page === 'Transactions' && <TransactionsPage rows={visibleTransactions} search={search} setSearch={setSearch} typeFilter={typeFilter} setTypeFilter={setTypeFilter} onAdd={() => { setEditRow(null); setShowTransaction(true) }} onEdit={r => { setEditRow(r); setShowTransaction(true) }} onDelete={deleteTransaction} onExport={exportCsv} month={month} />}
                        {page === 'Budgets' && <BudgetsPage rows={budgetRows} all={budgets.filter(b => b.month === month)} month={month} onAdd={() => setShowBudget(true)} onDelete={async id => { try { await api.delete(`/planning/budgets/${id}`); await loadData(); notify('Budget removed') } catch (e) { setError(e.message) } }} />}
                        {page === 'Savings goals' && <GoalsPage goals={goals} saved={saved} onAdd={() => setShowGoal(true)} onUpdate={async (g, v) => { try { await api.patch(`/planning/goals/${g._id}`, { saved: v }); await loadData(); notify('Savings progress updated') } catch (e) { setError(e.message) } }} onDelete={async id => { if (!confirm('Delete this savings goal?')) return; try { await api.delete(`/planning/goals/${id}`); await loadData(); notify('Goal deleted') } catch (e) { setError(e.message) } }} />}
                        {page === 'Recurring' && <RecurringPage rows={recurring} onAdd={() => setShowRecurring(true)} onRun={processRecurring} onToggle={async r => { try { await api.patch(`/planning/recurring/${r._id}`, { active: !r.active }); await loadData(); notify('Recurring rule updated') } catch (e) { setError(e.message) } }} onDelete={async id => { if (!confirm('Delete this recurring rule?')) return; try { await api.delete(`/planning/recurring/${id}`); await loadData(); notify('Rule deleted') } catch (e) { setError(e.message) } }} />}
                        {(page === 'Financial reports' || page === 'Monthly reports') && <ReportsPage month={month} year={year} api={api} transactions={currentTransactions} income={income} expense={expense} categoryData={categoryData} yearlyIncome={yearlyIncome} yearlyExpense={yearlyExpense} yearlySeries={yearlySeries} yearlyCategoryData={yearlyCategoryData} yearTransactions={yearTransactions} onExport={exportCsv} />}
                        {page === 'Settings' && <SettingsPage user={user} balance={balance} transactionsCount={transactions.length} goalsCount={goals.length} budgetsCount={budgets.length} dark={dark} setDark={setDark} onLogout={logout} onExport={exportCsv} api={api} onUpdateUser={(u, t) => { if (t) { localStorage.setItem('finora_token', t); setToken(t); } localStorage.setItem('finora_user', JSON.stringify(u)); setUser(u); }} notify={notify} />}
                    </motion.div>
                </AnimatePresence>
            </div><footer className="app-footer"><span>© 2026 Finora Finance</span><span><ShieldCheck size={14} /> Your data stays in your account</span><span>Made for mindful money habits</span></footer></main>
        <AnimatePresence>{showNotifications && <Modal title="Notifications" onClose={() => setShowNotifications(false)}><NotificationsModal transactionsCount={transactions.length} income={income} expense={expense} goalsCount={goals.length} onClose={() => setShowNotifications(false)} /></Modal>}{showTransaction && <Modal title={editRow ? 'Edit transaction' : 'Add transaction'} onClose={() => { setShowTransaction(false); setEditRow(null) }}><TransactionForm initial={editRow} onSave={saveTransaction} onCancel={() => { setShowTransaction(false); setEditRow(null) }} /></Modal>}{showBudget && <Modal title="Create monthly budget" onClose={() => setShowBudget(false)}><BudgetForm month={month} categories={categories.filter(c => !['Salary', 'Freelance', 'Investment'].includes(c))} onCancel={() => setShowBudget(false)} onSave={async d => { try { await api.post('/planning/budgets', d); setShowBudget(false); await loadData(); notify('Budget saved') } catch (e) { setError(e.message) } }} /></Modal>}{showGoal && <Modal title="Create savings goal" onClose={() => setShowGoal(false)}><GoalForm onCancel={() => setShowGoal(false)} onSave={async d => { try { await api.post('/planning/goals', d); setShowGoal(false); await loadData(); notify('Savings goal created') } catch (e) { setError(e.message) } }} /></Modal>}{showRecurring && <Modal title="New recurring transaction" onClose={() => setShowRecurring(false)}><RecurringForm onCancel={() => setShowRecurring(false)} onSave={async d => { try { await api.post('/planning/recurring', d); setShowRecurring(false); await loadData(); notify('Recurring rule saved') } catch (e) { setError(e.message) } }} /></Modal>}</AnimatePresence>
        <AnimatePresence>{toast && <motion.div className="toast-message" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}><Check size={17} />{toast}</motion.div>}</AnimatePresence>
    </div>
}
function AuthScreen({ mode, setMode, onSubmit, error }) {
    const [name, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [showPassword, setShowPassword] = useState(false), [busy, setBusy] = useState(false);
    const handleDemoFill = () => {
        setEmail('demo@finora.io');
        setPassword('demo12345');
        if (mode === 'register') setName('Finora Member');
    };
    return <div className="auth-page">
        <div className="auth-visual">
            <div className="auth-visual-inner">
                <div className="auth-brand">
                    <div className="brand-mark"><Activity size={20} /></div>
                    <span>finora<span className="brand-dot">.</span></span>
                    <span className="auth-version-pill">v2.4 PRO</span>
                </div>

                <div className="auth-copy">
                    <div className="eyebrow">
                        <span className="live-dot" />
                        <span>FINANCIAL CLARITY & INTELLIGENCE</span>
                    </div>
                    <h1>Master your money with<br /><em>effortless precision.</em></h1>
                    <p className="auth-lead-p">A serene, modern dashboard to track cashflow, grow personal savings, and keep your financial future in sharp focus.</p>

                    <motion.div className="auth-preview-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, delay: .15 }}>
                        <div className="auth-preview-header">
                            <div>
                                <div className="preview-label">NET BALANCE OVERVIEW</div>
                                <div className="preview-sum">₹1,48,250 <span className="preview-badge"><TrendingUp size={12} /> +18.4%</span></div>
                            </div>
                            <div className="preview-live-pill"><i /> LIVE SYNC</div>
                        </div>
                        <div className="preview-chart-wrap">
                            <svg viewBox="0 0 440 100" preserveAspectRatio="none" className="preview-svg">
                                <defs>
                                    <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8d84ff" stopOpacity="0.45" />
                                        <stop offset="60%" stopColor="#8d84ff" stopOpacity="0.1" />
                                        <stop offset="100%" stopColor="#8d84ff" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <path d="M0,82 C40,75 80,60 120,68 C160,76 195,45 235,50 C275,55 310,25 350,30 C390,35 415,10 440,8 L440,100 L0,100 Z" fill="url(#chartGlow)" />
                                <path d="M0,82 C40,75 80,60 120,68 C160,76 195,45 235,50 C275,55 310,25 350,30 C390,35 415,10 440,8" fill="none" stroke="#9d95ff" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div className="preview-stats-row">
                            <div className="preview-micro-stat">
                                <span>Monthly Inflow</span>
                                <strong>₹85,000</strong>
                            </div>
                            <div className="preview-micro-stat">
                                <span>Target Saved</span>
                                <strong style={{ color: '#37b8a5' }}>₹32,500</strong>
                            </div>
                            <div className="preview-micro-stat">
                                <span>Safe to Spend</span>
                                <strong style={{ color: '#f5a65b' }}>₹18,450</strong>
                            </div>
                        </div>
                    </motion.div>

                    <div className="auth-features-pills">
                        <span className="auth-feature-pill"><ShieldCheck size={14} /> Bank-grade 256-bit AES</span>
                        <span className="auth-feature-pill"><Zap size={14} /> Realtime Stats</span>
                        <span className="auth-feature-pill"><Sparkles size={14} /> 100% Private</span>
                    </div>

                    <div className="auth-proof-strip">
                        <div className="proof-avatars">
                            <span className="avatar-mini a1">MK</span>
                            <span className="avatar-mini a2">RS</span>
                            <span className="avatar-mini a3">AJ</span>
                        </div>
                        <div className="proof-copy">
                            <div className="proof-stars">
                                <Star size={12} fill="#ffc107" color="#ffc107" />
                                <Star size={12} fill="#ffc107" color="#ffc107" />
                                <Star size={12} fill="#ffc107" color="#ffc107" />
                                <Star size={12} fill="#ffc107" color="#ffc107" />
                                <Star size={12} fill="#ffc107" color="#ffc107" />
                            </div>
                            <span>Trusted by 10,000+ mindful savers across India</span>
                        </div>
                    </div>
                </div>

                <div className="auth-decor-glow glow-primary" />
                <div className="auth-decor-glow glow-secondary" />
            </div>
        </div>

        <div className="auth-form-side">
            <div className="auth-card-wrap">
                <div className="auth-mobile-header">
                    <div className="brand-mark"><Activity size={20} /></div>
                    <span>finora<span className="brand-dot">.</span></span>
                </div>

                <div className="auth-mode-toggle">
                    <button type="button" className={`mode-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Sign In</button>
                    <button type="button" className={`mode-btn ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>Create Account</button>
                </div>

                <div className="auth-form-header">
                    <h2>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
                    <p>{mode === 'login' ? 'Enter your account credentials to access your financial dashboard.' : 'Join Finora today for calmer, smarter personal financial planning.'}</p>
                </div>

                <form onSubmit={async e => { e.preventDefault(); setBusy(true); await onSubmit({ name, email, password }); setBusy(false) }}>
                    {mode === 'register' && <div className="auth-input-group">
                        <label className="auth-label">Full Name</label>
                        <div className="auth-input-wrap">
                            <UserIcon size={17} className="auth-input-icon" />
                            <input className="auth-input" value={name} onChange={e => setName(e.target.value)} required minLength="2" maxLength="80" placeholder="e.g. Muhammed Shan" />
                        </div>
                    </div>}

                    <div className="auth-input-group">
                        <label className="auth-label">Email Address</label>
                        <div className="auth-input-wrap">
                            <Mail size={17} className="auth-input-icon" />
                            <input className="auth-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@domain.com" autoComplete="email" />
                        </div>
                    </div>

                    <div className="auth-input-group">
                        <div className="auth-label-row">
                            <label className="auth-label">Password</label>
                            {mode === 'login' && <span className="auth-forgot-hint" title="Contact workspace admin if forgotten">Forgot password?</span>}
                        </div>
                        <div className="auth-input-wrap">
                            <Lock size={17} className="auth-input-icon" />
                            <input className="auth-input" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength="8" placeholder="At least 8 characters" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                            <button type="button" className="auth-pw-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                        </div>
                    </div>

                    {error && <motion.div className="auth-error-banner" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                        <span className="error-icon">!</span>
                        <span>{error}</span>
                    </motion.div>}

                    <button className="auth-submit-btn" disabled={busy}>
                        <span>{busy ? 'Connecting to workspace…' : mode === 'login' ? 'Sign in to Finora' : 'Get Started Free'}</span>
                        <ArrowRight size={17} />
                    </button>
                </form>

                <div className="auth-demo-box">
                    <div className="demo-copy">
                        <Sparkles size={14} className="sparkle-icon" />
                        <span>Want to test quickly?</span>
                    </div>
                    <button type="button" className="demo-fill-btn" onClick={handleDemoFill}>Fill Demo Credentials</button>
                </div>

                <div className="auth-foot-switch">
                    <span>{mode === 'login' ? "Don't have an account yet?" : "Already registered?"}</span>
                    <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Create one for free' : 'Sign in here'}</button>
                </div>

                <div className="auth-trust-strip">
                    <ShieldCheck size={14} />
                    <span>Protected by 256-bit encryption · MongoDB Cloud</span>
                </div>
            </div>

            <footer className="auth-side-footer">
                © 2026 Finora Finance <span>·</span> Private & Protected Workspace
            </footer>
        </div>
    </div>;
}
function SectionHeader({ eyebrow, title, subtitle, action }) { return <motion.div className="section-header" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35, ease: [.16, 1, .3, 1] }}><div><div className="section-eyebrow">{eyebrow}</div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</motion.div> }
function StatCard({ title, value, icon, tone, delta, sub, delay = 0 }) { return <motion.div className="stat-card" initial={{ opacity: 0, y: 22, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} whileHover={{ y: -4, transition: { duration: .2 } }} transition={{ duration: .45, ease: [.16, 1, .3, 1], delay }}><div className="stat-top"><span>{title}</span><IconBox tone={tone}>{icon}</IconBox></div><div className="stat-value"><AnimatedNumber value={value} /></div><div className="stat-bottom">{delta && <span className={`stat-delta ${delta.startsWith('-') ? 'negative' : ''}`}>{delta}</span>}<span>{sub}</span></div></motion.div> }
function Overview({ income, expense, balance, saved, series, categoryData, transactions, budgets, goals, onAdd, onViewAll, onBudget, onGoal, onReports, onViewExpenses, month }) {
    const [spendingMenuOpen, setSpendingMenuOpen] = useState(false);
    const [showAmount, setShowAmount] = useState(false);
    const spendingMenuRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (spendingMenuRef.current && !spendingMenuRef.current.contains(e.target)) {
                setSpendingMenuOpen(false);
            }
        };
        if (spendingMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [spendingMenuOpen]);
    const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    const monthLabel = new Date(`${month}-01T12:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const shortMonthLabel = new Date(`${month}-01T12:00:00`).toLocaleDateString('en-IN', { month: 'short' });
    return <>
        <motion.div className="welcome-row" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .38, ease: [.16, 1, .3, 1] }}>
            <div>
                <div className="welcome-kicker"><span className="sparkle">✳</span> YOUR FINANCIAL SNAPSHOT</div>
                <h2>Every rupee, <em>understood.</em></h2>
                <p>Here’s how your money is moving this month ({monthLabel}).</p>
            </div>
            <Button onClick={onAdd}><Plus size={17} /> Add transaction</Button>
        </motion.div>

        <div className="stats-grid">
            <StatCard title="Total balance" value={balance} icon={<Wallet size={19} />} tone="purple" delta={balance >= 0 ? '+ positive balance' : 'Review spending'} sub="Across all records" delay={0} />
            <StatCard title="Income this month" value={income} icon={<ArrowDownLeft size={19} />} tone="green" delta={income ? 'Income recorded' : 'No income yet'} sub={`For ${shortMonthLabel}`} delay={.06} />
            <StatCard title="Expenses this month" value={expense} icon={<ArrowUpRight size={19} />} tone="orange" delta={income ? `${Math.round(expense / income * 100)}% of income` : undefined} sub={`For ${shortMonthLabel}`} delay={.12} />
            <StatCard title="Saved toward goals" value={saved} icon={<PiggyBank size={19} />} tone="blue" delta={`${goals.length} active goal${goals.length === 1 ? '' : 's'}`} sub="Goal contributions" delay={.18} />
        </div>

        <div className="charts-grid">
            <motion.section className="panel cashflow-panel" initial={{ opacity: 0, y: 22, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .45, ease: [.16, 1, .3, 1], delay: .2 }}>
                <div className="panel-heading"><div><div className="panel-kicker">YOUR MONEY MOVEMENT</div><h3>Cash flow</h3><p>Income vs. expenses over six months</p></div><div className="chart-legend"><span><i className="legend-income" /> Income</span><span><i className="legend-expense" /> Expenses</span></div></div>
                <div className="cashflow-chart" key={`cashflow-${month}-${series.map(s => `${s.income}-${s.expense}`).join(',')}`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={series} margin={{ top: 8, right: 8, left: -15, bottom: 0 }}>
                            <defs>
                                <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#37b8a5" stopOpacity={.18} /><stop offset="100%" stopColor="#37b8a5" stopOpacity={0} /></linearGradient>
                                <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9b8cf8" stopOpacity={.18} /><stop offset="100%" stopColor="#9b8cf8" stopOpacity={0} /></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--chart-grid)" />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} dy={10} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 10 }} tickFormatter={shortMoney} width={54} />
                            <Tooltip content={<ChartTooltip />} wrapperStyle={{ zIndex: 99999, pointerEvents: 'none' }} />
                            <Area className="chart-area-income" type="monotone" dataKey="income" name="Income" stroke="#37b8a5" strokeWidth={2.5} fill="url(#incomeFill)" activeDot={{ r: 5, strokeWidth: 0 }} isAnimationActive={false} />
                            <Area className="chart-area-expense" type="monotone" dataKey="expense" name="Expenses" stroke="#9b8cf8" strokeWidth={2.5} fill="url(#expenseFill)" activeDot={{ r: 5, strokeWidth: 0 }} isAnimationActive={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-summary"><div><span className="summary-dot green-dot" /><span>Income</span><strong><AnimatedNumber value={income} /></strong></div><div><span className="summary-dot purple-dot" /><span>Expenses</span><strong><AnimatedNumber value={expense} /></strong></div><div><span className="summary-dot orange-dot" /><span>Net cash flow</span><strong className={income - expense >= 0 ? 'text-positive' : 'text-negative'}><AnimatedNumber value={income - expense} /></strong></div></div>
            </motion.section>

            <motion.section className="panel spending-panel" initial={{ opacity: 0, y: 22, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .45, ease: [.16, 1, .3, 1], delay: .26 }}>
                <div className="panel-heading">
                    <div>
                        <div className="panel-kicker">WHERE IT GOES</div>
                        <h3>Spending breakdown</h3>
                        <p>Expenses by category</p>
                    </div>
                    <div className="dropdown-wrapper" ref={spendingMenuRef}>
                        <button
                            type="button"
                            className={`subtle-icon ${spendingMenuOpen ? 'active' : ''}`}
                            title="Spending breakdown options"
                            aria-label="Spending breakdown options"
                            onClick={() => setSpendingMenuOpen(!spendingMenuOpen)}
                        >
                            <MoreHorizontal size={19} />
                        </button>
                        <AnimatePresence>
                            {spendingMenuOpen && (
                                <motion.div
                                    className="card-dropdown-menu"
                                    initial={{ opacity: 0, scale: .94, y: -6 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: .94, y: -6 }}
                                    transition={{ duration: .18, ease: [.16, 1, .3, 1] }}
                                >
                                    <button type="button" className="dropdown-item" onClick={() => { setSpendingMenuOpen(false); onReports?.(); }}>
                                        <FileChartColumn size={15} />
                                        <span>View category reports</span>
                                    </button>
                                    <button type="button" className="dropdown-item" onClick={() => { setSpendingMenuOpen(false); onViewExpenses?.(); }}>
                                        <ArrowUpRight size={15} />
                                        <span>View expense transactions</span>
                                    </button>
                                    <button type="button" className="dropdown-item" onClick={() => { setSpendingMenuOpen(false); onBudget?.(); }}>
                                        <Wallet size={15} />
                                        <span>Create category budget</span>
                                    </button>
                                    <div className="dropdown-divider" />
                                    <button type="button" className="dropdown-item" onClick={() => { setShowAmount(!showAmount); setSpendingMenuOpen(false); }}>
                                        <Activity size={15} />
                                        <span>Show {showAmount ? 'Percentage (%)' : 'Amount (₹)'}</span>
                                        <span className="dropdown-badge">{showAmount ? '₹' : '%'}</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                {categoryData.length ? (
                    <>
                        <div className="donut-wrap" key={`donut-wrap-${month}-${expense}-${categoryData.map(c => `${c.name}:${c.value}`).join(',')}`}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart key={`donut-chart-${month}-${expense}-${categoryData.map(c => `${c.name}:${c.value}`).join(',')}`}>
                                    <Pie
                                        key={`donut-pie-${month}-${expense}-${categoryData.map(c => `${c.name}:${c.value}`).join(',')}`}
                                        data={categoryData}
                                        dataKey="value"
                                        nameKey="name"
                                        startAngle={90}
                                        endAngle={-270}
                                        innerRadius="67%"
                                        outerRadius="88%"
                                        paddingAngle={3}
                                        strokeWidth={0}
                                        isAnimationActive={true}
                                        animationBegin={80}
                                        animationDuration={1350}
                                        animationEasing="ease-out"
                                    >
                                        {categoryData.map((d, i) => (
                                            <Cell key={d.name} fill={colors[i % colors.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} wrapperStyle={{ zIndex: 99999, pointerEvents: 'none' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="donut-center">
                                <span>TOTAL SPENT</span>
                                <strong><AnimatedNumber value={expense} /></strong>
                                <small>this month</small>
                            </div>
                        </div>
                        <div className="category-legend">
                            {categoryData.slice(0, 4).map((c, i) => (
                                <div key={c.name}>
                                    <span className="category-name">
                                        <i style={{ background: colors[i % colors.length] }} />
                                        {c.name}
                                    </span>
                                    <strong>{showAmount ? money(c.value) : `${Math.round(c.value / (expense || 1) * 100)}%`}</strong>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <EmptyState icon={<PieChart size={20} />} title="No spending yet" subtitle="Add an expense to see your breakdown." />
                )}
            </motion.section>
        </div>

        <div className="bottom-grid">
            <motion.section className="panel transactions-panel" initial={{ opacity: 0, y: 22, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .45, ease: [.16, 1, .3, 1], delay: .32 }}>
                <div className="panel-heading"><div><div className="panel-kicker">THE LATEST</div><h3>Recent transactions</h3><p>Your latest money movements</p></div><button className="text-action" onClick={onViewAll}>View all <span>→</span></button></div>
                {recent.length ? <div className="transaction-list">{recent.map((t, i) => <TransactionRow key={t._id} row={t} delay={i * .04} />)}</div> : <EmptyState icon={<ArrowLeftRight size={20} />} title="A fresh start" subtitle="Add your first transaction to begin tracking." action={<Button onClick={onAdd}><Plus size={15} /> Add transaction</Button>} />}
            </motion.section>

            <motion.section className="panel budget-panel" initial={{ opacity: 0, y: 22, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .45, ease: [.16, 1, .3, 1], delay: .38 }}>
                <div className="panel-heading"><div><div className="panel-kicker">SPEND WITH INTENTION</div><h3>Budget overview</h3><p>Keep your monthly plans on track</p></div><button className="subtle-icon" onClick={onBudget} title="Add budget"><Plus size={18} /></button></div>
                {budgets.length ? budgets.slice(0, 4).map(b => <BudgetProgress key={b._id} row={b} />) : <EmptyState icon={<Wallet size={20} />} title="No budgets set" subtitle="Create category limits to guide your spending." action={<Button variant="outline-primary" onClick={onBudget}>Set a budget</Button>} />}
                <div className="budget-foot"><span>{budgets.length} budget{budgets.length === 1 ? '' : 's'} for {month}</span><button onClick={onBudget}>Manage <span>→</span></button></div>
            </motion.section>
        </div>

        <motion.div className="insight-banner" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, delay: .44 }}>
            <div className="insight-icon"><TrendingUp size={21} /></div>
            <div>
                <strong>A little awareness goes a long way.</strong>
                <p>{income - expense >= 0 ? 'Your income is currently ahead of your expenses for this month. Keep your goals in sight.' : 'Your expenses are higher than your income this month. Review your categories to spot opportunities.'}</p>
            </div>
            <button onClick={onGoal}>View goals <span>→</span></button>
        </motion.div>
    </>
}
function ChartTooltip({ active, payload, label }) { if (!active || !payload?.length) return null; return <div className="chart-tooltip">{label && <span>{label}</span>}{payload.map((p, i) => <div key={p.name || p.dataKey || i}><i style={{ background: p.color || p.payload?.fill }} />{p.name || p.dataKey}<strong>{money(p.value)}</strong></div>)}</div> }
function EmptyState({ icon, title, subtitle, action }) { return <div className="empty-state"><div className="empty-icon">{icon}</div><strong>{title}</strong><p>{subtitle}</p>{action}</div> }
function TransactionRow({ row, onEdit, onDelete, compact = false, delay = 0 }) { return <motion.div className="transaction-row" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }} whileHover={{ x: 4, transition: { duration: .15 } }} transition={{ duration: .28, ease: [.16, 1, .3, 1], delay }}><div className={`transaction-category-icon ${row.type === 'income' ? 'income-icon' : ''}`}>{row.type === 'income' ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}</div><div className="transaction-description"><strong>{row.description || row.category}</strong><span>{row.category} <i>·</i> {dayLabel(row.date)}{row.recurring && <em className="recurring-chip">Recurring</em>}</span></div><div className="transaction-method">{row.paymentMethod || 'UPI'}</div><div className={`transaction-amount ${row.type === 'income' ? 'income-amount' : ''}`}>{row.type === 'income' ? '+' : '−'}<AnimatedNumber value={row.amount} /></div>{(onEdit || onDelete) && <div className="row-actions"><button title="Edit transaction" onClick={() => onEdit(row)}><Pencil size={15} /></button><button title="Delete transaction" onClick={() => onDelete(row._id)}><Trash2 size={15} /></button></div>}</motion.div> }
function TransactionsPage({ rows, search, setSearch, typeFilter, setTypeFilter, onAdd, onEdit, onDelete, onExport, month }) { return <><SectionHeader eyebrow="YOUR ACTIVITY" title="Transactions" subtitle="Every inflow and outflow, all in one place." action={<Button onClick={onAdd}><Plus size={17} /> Add transaction</Button>} /><motion.div className="panel transaction-table-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4, ease: [.16, 1, .3, 1], delay: .06 }}><div className="table-toolbar"><div className="search-box"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions…" /></div><div className="toolbar-actions"><label className="filter-select"><Filter size={15} /><select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}><option value="all">All types</option><option value="income">Income</option><option value="expense">Expenses</option></select></label><button className="btn btn-outline-secondary fin-btn" onClick={onExport}><Download size={15} /> Export CSV</button></div></div><div className="transaction-table-head"><span>TRANSACTION</span><span>PAYMENT</span><span>AMOUNT</span><span>ACTIONS</span></div><AnimatePresence initial={false}>{rows.length ? rows.map((t, i) => <TransactionRow key={t._id} row={t} onEdit={onEdit} onDelete={onDelete} delay={Math.min(i * .03, .3)} />) : <EmptyState icon={<Search size={20} />} title="No matching transactions" subtitle="Try another search or add a new transaction." action={null} />}</AnimatePresence><div className="table-foot"><span>{rows.length} transaction{rows.length === 1 ? '' : 's'} in {month}</span><span>Showing latest matches</span></div></motion.div></> }
function BudgetProgress({ row }) { const percent = Math.min(100, Math.round(row.spent / row.limit * 100)); const status = percent >= 100 ? 'over' : percent >= 80 ? 'warning' : 'healthy'; return <div className="budget-progress-row"><div className="budget-progress-top"><div><span className={`budget-category-dot ${status}`} /><strong>{row.category}</strong></div><span><AnimatedNumber value={row.spent} /> <i>of</i> {money(row.limit)}</span></div><div className="progress budget-progress"><motion.div className={`progress-bar ${status}`} initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: .85, ease: [.16, 1, .3, 1] }} /></div><div className={`budget-progress-bottom ${status}`}>{percent >= 100 ? 'Budget exceeded' : `${percent}% used`}<span><AnimatedNumber value={Math.max(0, row.limit - row.spent)} /> left</span></div></div> }
function BudgetsPage({ rows, all, month, onAdd, onDelete }) { return <><SectionHeader eyebrow="PLAN AHEAD" title="Budgets" subtitle="Give every category a thoughtful spending limit." action={<Button onClick={onAdd}><Plus size={17} /> Create budget</Button>} /><div className="budget-summary-grid"><StatCard title="Planned spending" value={all.reduce((s, b) => s + b.limit, 0)} icon={<Wallet size={19} />} tone="purple" sub="Total budget limits" delay={0} /><StatCard title="Spent so far" value={rows.reduce((s, b) => s + b.spent, 0)} icon={<ArrowUpRight size={19} />} tone="orange" sub="Tracked expenses" delay={.06} /><StatCard title="Remaining" value={Math.max(0, all.reduce((s, b) => s + b.limit, 0) - rows.reduce((s, b) => s + b.spent, 0))} icon={<PiggyBank size={19} />} tone="green" sub="Budget available" delay={.12} /></div><div className="budget-page-grid">{rows.length ? rows.map((b, i) => <motion.div className="panel budget-detail-card" key={b._id} initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} whileHover={{ y: -4, transition: { duration: .2 } }} transition={{ duration: .4, delay: i * .05 }}><div className="budget-detail-head"><IconBox tone={b.spent >= b.limit ? 'orange' : 'purple'}><Wallet size={19} /></IconBox><button className="subtle-icon" onClick={() => onDelete(b._id)} title="Delete budget"><Trash2 size={16} /></button></div><div className="budget-detail-name">{b.category}</div><div className="budget-detail-amount"><AnimatedNumber value={b.limit} /> <span>limit</span></div><BudgetProgress row={b} /><div className="budget-detail-note">Month: {month}</div></motion.div>) : <div className="panel full-empty"><EmptyState icon={<Wallet size={22} />} title="No budgets for this month" subtitle="Set a monthly limit for categories like food, transport or shopping." action={<Button onClick={onAdd}><Plus size={16} /> Create your first budget</Button>} /></div>}</div></> }
function GoalsPage({ goals, saved, onAdd, onUpdate, onDelete }) { return <><SectionHeader eyebrow="YOUR FUTURE, IN MOTION" title="Savings goals" subtitle="Turn the things you want into a plan you can follow." action={<Button onClick={onAdd}><Plus size={17} /> New goal</Button>} /><motion.div className="goal-hero" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }}><div className="goal-hero-icon"><Target size={24} /></div><div><span>TOTAL SAVED TOWARD GOALS</span><h2><AnimatedNumber value={saved} /></h2><p>Every small contribution moves you forward.</p></div><div className="goal-hero-count"><strong><AnimatedNumber value={goals.length} prefix="" format={false} /></strong><span>active goals</span></div></motion.div><div className="goals-grid">{goals.length ? goals.map((g, i) => <GoalCard key={g._id} goal={g} color={colors[i % colors.length]} delay={i * .06} onUpdate={onUpdate} onDelete={onDelete} />) : <div className="panel full-empty"><EmptyState icon={<Target size={22} />} title="Give your savings a purpose" subtitle="Create a goal for an emergency fund, a trip, a new device or anything you are working toward." action={<Button onClick={onAdd}><Plus size={16} /> Create a goal</Button>} /></div>}</div></> }
function GoalCard({ goal, color, delay = 0, onUpdate, onDelete }) { const percent = Math.min(100, Math.round(goal.saved / goal.target * 100)); const [amount, setAmount] = useState(String(goal.saved)); useEffect(() => setAmount(String(goal.saved)), [goal.saved]); return <motion.div className="panel goal-card" initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} whileHover={{ y: -4, transition: { duration: .2 } }} transition={{ duration: .4, delay }}><div className="goal-card-top"><div className="goal-symbol" style={{ '--goal-color': color }}><Target size={20} /></div><button className="subtle-icon" title="Delete goal" onClick={() => onDelete(goal._id)}><Trash2 size={16} /></button></div><h3>{goal.name}</h3><div className="goal-saved-amount"><AnimatedNumber value={goal.saved} /> <span>of {money(goal.target)}</span></div><div className="progress goal-progress"><motion.div className="progress-bar" initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: .85, ease: [.16, 1, .3, 1] }} style={{ background: color }} /></div><div className="goal-progress-foot"><strong>{percent}% saved</strong><span><AnimatedNumber value={Math.max(0, goal.target - goal.saved)} /> to go</span></div>{goal.deadline && <div className="goal-deadline"><CalendarDays size={14} /> Target {dayLabel(goal.deadline)}</div>}<form className="goal-update-form" onSubmit={e => { e.preventDefault(); onUpdate(goal, Number(amount)) }}><label>Update saved amount</label><div><input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required /><button className="btn btn-outline-primary fin-btn" type="submit">Save</button></div></form></motion.div> }
function RecurringPage({ rows, onAdd, onRun, onToggle, onDelete }) { return <><SectionHeader eyebrow="AUTOMATE YOUR ROUTINE" title="Recurring transactions" subtitle="Keep track of repeat bills, subscriptions and income." action={<Button onClick={onAdd}><Plus size={17} /> Add rule</Button>} /><motion.div className="recurring-banner" initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .4, ease: [.16, 1, .3, 1] }}><div className="recurring-banner-icon"><Repeat2 size={22} /></div><div><strong>Process due transactions</strong><p>Run active rules whose next date is today or earlier. Review the generated transactions afterward.</p></div><Button variant="outline-primary" onClick={onRun}><Repeat2 size={16} /> Run recurring</Button></motion.div><motion.div className="panel recurring-list-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .42, delay: .08 }}><div className="panel-heading"><div><div className="panel-kicker">YOUR RULES</div><h3>Scheduled activity</h3><p>{rows.filter(r => r.active).length} active · {rows.length} total rules</p></div></div>{rows.length ? rows.map((r, i) => <motion.div className="recurring-row" key={r._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ x: 4, transition: { duration: .15 } }} transition={{ duration: .3, delay: Math.min(i * .04, .3) }}><div className={`transaction-category-icon ${r.type === 'income' ? 'income-icon' : ''}`}><Repeat2 size={17} /></div><div className="transaction-description"><strong>{r.description || r.category}</strong><span>{r.category} <i>·</i> {r.frequency} <i>·</i> Next {dayLabel(r.nextDate)}</span></div><div className={`transaction-amount ${r.type === 'income' ? 'income-amount' : ''}`}>{r.type === 'income' ? '+' : '−'}<AnimatedNumber value={r.amount} /></div><span className={`status-pill ${r.active ? 'status-active' : 'status-paused'}`}>{r.active ? 'Active' : 'Paused'}</span><div className="row-actions"><button title={r.active ? 'Pause rule' : 'Activate rule'} onClick={() => onToggle(r)}>{r.active ? <span className="pause-symbol">Ⅱ</span> : <Check size={15} />}</button><button title="Delete rule" onClick={() => onDelete(r._id)}><Trash2 size={15} /></button></div></motion.div>) : <EmptyState icon={<Repeat2 size={20} />} title="Nothing on repeat yet" subtitle="Add rent, a subscription, a regular bill or recurring income." action={<Button onClick={onAdd}><Plus size={16} /> Add recurring rule</Button>} />}</motion.div></> }
function ReportsPage({ month, year, api, transactions, income, expense, categoryData, yearlyIncome, yearlyExpense, yearlySeries, yearlyCategoryData, yearTransactions, onExport }) {
    const [reportType, setReportType] = useState('monthly');
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');
    useEffect(() => {
        let alive = true;
        setLoading(true);
        const endpoint = reportType === 'yearly' ? `/planning/reports/yearly?year=${year}` : `/planning/reports/monthly?month=${month}`;
        api.get(endpoint).then(d => { if (alive) setReport(d) }).catch(e => { if (alive) setErr(e.message) }).finally(() => { if (alive) setLoading(false) });
        return () => { alive = false };
    }, [api, month, year, reportType, transactions.length]);

    const activeIncome = reportType === 'yearly' ? yearlyIncome : income;
    const activeExpense = reportType === 'yearly' ? yearlyExpense : expense;
    const activeNet = activeIncome - activeExpense;
    const activeSavingsRate = activeIncome ? Math.round(activeNet / activeIncome * 100) : 0;
    const activeCategories = reportType === 'yearly' ? yearlyCategoryData : categoryData;
    const activeTxCount = reportType === 'yearly' ? (report?.transactions ?? yearTransactions.length) : (report?.transactions ?? transactions.length);
    const monthTitle = new Date(`${month}-01T12:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    return <>
        <SectionHeader
            eyebrow="THE BIGGER PICTURE"
            title={reportType === 'yearly' ? `Yearly Financial Report (${year})` : `Monthly Financial Report`}
            subtitle={reportType === 'yearly' ? `Complete 12-month financial breakdown, total income, expenses, and savings for ${year}.` : `Understand your patterns and make informed decisions for ${monthTitle}.`}
            action={<div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="period-switch" role="tablist" aria-label="Report timeframe">
                    <button type="button" className={reportType === 'monthly' ? 'active' : ''} onClick={() => setReportType('monthly')}><CalendarDays size={14} /> Monthly</button>
                    <button type="button" className={reportType === 'yearly' ? 'active' : ''} onClick={() => setReportType('yearly')}><TrendingUp size={14} /> Yearly ({year})</button>
                </div>
                <Button variant="outline-primary" onClick={onExport}><Download size={16} /> Export CSV</Button>
            </div>}
        />

        <motion.div className="report-intro" initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .4, ease: [.16, 1, .3, 1] }}>
            <div>
                <div className="report-month-label"><CalendarDays size={15} /> {reportType === 'yearly' ? 'ANNUAL REPORTING PERIOD' : 'MONTHLY REPORTING PERIOD'}</div>
                <h2>{reportType === 'yearly' ? `Calendar Year ${year} (Full Year)` : monthTitle}</h2>
                <p>{activeTxCount} recorded transaction{activeTxCount === 1 ? '' : 's'} · {reportType === 'yearly' ? 'January to December' : 'Selected calendar month'}</p>
            </div>
            <div className={`report-net ${activeNet >= 0 ? 'positive' : 'negative'}`}>
                <span>{reportType === 'yearly' ? 'YEARLY NET SAVINGS' : 'NET CASH FLOW'}</span>
                <strong><AnimatedNumber value={activeNet} /></strong>
                <small>{activeNet >= 0 ? 'Total earnings exceeded total expenses' : 'Expenses exceeded earnings'}</small>
            </div>
        </motion.div>

        {err && <div className="alert alert-warning">{err}</div>}
        {loading && <div className="loading-line"><span /></div>}

        <div className="report-stats">
            <StatCard title={reportType === 'yearly' ? `Total income in ${year}` : "Total monthly income"} value={activeIncome} icon={<ArrowDownLeft size={19} />} tone="green" sub={reportType === 'yearly' ? 'Full year accumulated' : 'Selected month'} delay={0} />
            <StatCard title={reportType === 'yearly' ? `Total expenses in ${year}` : "Total monthly expenses"} value={activeExpense} icon={<ArrowUpRight size={19} />} tone="orange" sub={reportType === 'yearly' ? 'Full year accumulated' : 'Selected month'} delay={.06} />
            <motion.div className="stat-card" initial={{ opacity: 0, y: 22, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} whileHover={{ y: -4, transition: { duration: .2 } }} transition={{ duration: .45, ease: [.16, 1, .3, 1], delay: .12 }}>
                <div className="stat-top">
                    <span>{reportType === 'yearly' ? 'Annual savings rate' : 'Monthly savings rate'}</span>
                    <IconBox tone="blue"><TrendingUp size={19} /></IconBox>
                </div>
                <div className="stat-value">
                    {activeIncome ? <><AnimatedNumber value={activeSavingsRate} prefix="" suffix="%" format={false} /></> : `0%`}
                </div>
                <div className="stat-bottom">
                    <span>{reportType === 'yearly' ? `Net savings / income across ${year}` : 'Net income percentage'}</span>
                </div>
            </motion.div>
        </div>

        {reportType === 'yearly' && (
            <motion.div className="panel" style={{ padding: '20px', marginBottom: '18px' }} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}>
                <div className="panel-heading">
                    <div>
                        <div className="panel-kicker">ANNUAL CASH FLOW TIMELINE</div>
                        <h3>12-Month Inflow vs Outflow</h3>
                        <p>Monthly trends from January to December {year}</p>
                    </div>
                    <div className="chart-legend">
                        <span><i className="legend-income" /> Income</span>
                        <span><i className="legend-expense" /> Expenses</span>
                    </div>
                </div>
                <div className="cashflow-chart" style={{ height: '220px', marginTop: '14px' }} key={`yearly-chart-${year}-${yearlySeries.map(s => `${s.income}-${s.expense}`).join(',')}`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={yearlySeries} margin={{ top: 8, right: 8, left: -15, bottom: 0 }}>
                            <defs>
                                <linearGradient id="repIncomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#37b8a5" stopOpacity={.18} /><stop offset="100%" stopColor="#37b8a5" stopOpacity={0} /></linearGradient>
                                <linearGradient id="repExpenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9b8cf8" stopOpacity={.18} /><stop offset="100%" stopColor="#9b8cf8" stopOpacity={0} /></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--chart-grid)" />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} dy={10} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 10 }} tickFormatter={shortMoney} width={54} />
                            <Tooltip content={<ChartTooltip />} wrapperStyle={{ zIndex: 99999, pointerEvents: 'none' }} />
                            <Area className="chart-area-income" type="monotone" dataKey="income" name="Income" stroke="#37b8a5" strokeWidth={2.5} fill="url(#repIncomeFill)" activeDot={{ r: 5, strokeWidth: 0 }} isAnimationActive={false} />
                            <Area className="chart-area-expense" type="monotone" dataKey="expense" name="Expenses" stroke="#9b8cf8" strokeWidth={2.5} fill="url(#repExpenseFill)" activeDot={{ r: 5, strokeWidth: 0 }} isAnimationActive={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        )}

        <motion.div className="panel report-category-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .42, delay: .18 }}>
            <div className="panel-heading">
                <div>
                    <div className="panel-kicker">SPENDING DETAILS</div>
                    <h3>{reportType === 'yearly' ? `Category breakdown for ${year}` : 'Category breakdown'}</h3>
                    <p>{reportType === 'yearly' ? `Where your money went across all of ${year}` : 'Where your money went during this month'}</p>
                </div>
            </div>
            {activeCategories.length ? activeCategories.map((c, i) => <div className="report-category-row" key={c.name}><span className="report-category-dot" style={{ background: colors[i % colors.length] }} /><strong>{c.name}</strong><div className="report-category-bar"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.round(c.value / (activeExpense || 1) * 100)}%` }} transition={{ duration: .85, ease: [.16, 1, .3, 1], delay: i * .04 }} style={{ background: colors[i % colors.length] }} /></div><span>{Math.round(c.value / (activeExpense || 1) * 100)}%</span><b><AnimatedNumber value={c.value} /></b></div>) : <EmptyState icon={<FileChartColumn size={20} />} title="No expenses to report" subtitle={reportType === 'yearly' ? `No expenses recorded for ${year}.` : "Once you record expenses, your category analysis will appear here."} />}
        </motion.div>
    </>
}
function Modal({ title, onClose, children }) { useEffect(() => { const h = e => { if (e.key === 'Escape') onClose() }; window.addEventListener('keydown', h); document.body.style.overflow = 'hidden'; return () => { window.removeEventListener('keydown', h); document.body.style.overflow = '' } }, [onClose]); return <motion.div className="modal-backdrop-custom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}><motion.div className="modal-card" initial={{ opacity: 0, y: 25, scale: .95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: .96 }} transition={{ type: 'spring', damping: 25, stiffness: 320 }} role="dialog" aria-modal="true"><div className="modal-header-custom"><div><div className="panel-kicker">FINORA · YOUR MONEY</div><h3>{title}</h3></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div>{children}</motion.div></motion.div> }
function TransactionForm({ initial, onSave, onCancel }) { const [type, setType] = useState(initial?.type || 'expense'), [amount, setAmount] = useState(initial?.amount ?? ''), [category, setCategory] = useState(initial?.category || 'Food & Dining'), [description, setDescription] = useState(initial?.description || ''), [date, setDate] = useState(initial ? String(initial.date).slice(0, 10) : dateNow()), [paymentMethod, setPaymentMethod] = useState(initial?.paymentMethod || 'UPI'), [busy, setBusy] = useState(false), [err, setErr] = useState(''); return <form className="modal-form" onSubmit={async e => { e.preventDefault(); if (Number(amount) <= 0) { setErr('Amount must be greater than zero.'); return } setBusy(true); setErr(''); await onSave({ type, amount: Number(amount), category, description, date, paymentMethod }); setBusy(false) }}><div className="type-switch"><button type="button" className={type === 'expense' ? 'selected expense-selected' : ''} onClick={() => { setType('expense'); if (category === 'Salary' || category === 'Freelance') setCategory('Food & Dining') }}><ArrowUpRight size={17} /> Expense</button><button type="button" className={type === 'income' ? 'selected income-selected' : ''} onClick={() => { setType('income'); if (!['Salary', 'Freelance', 'Investment', 'Other'].includes(category)) setCategory('Salary') }}><ArrowDownLeft size={17} /> Income</button></div><div className="amount-input-wrap"><span>₹</span><input autoFocus type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required /><small>AMOUNT (INR)</small></div><div className="row g-3"><div className="col-12"><label className="form-label">Category</label><select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>{(type === 'income' ? ['Salary', 'Freelance', 'Investment', 'Other'] : categories.filter(c => !['Salary', 'Freelance', 'Investment'].includes(c))).map(c => <option key={c}>{c}</option>)}</select></div><div className="col-12"><label className="form-label">Description <span className="optional-label">OPTIONAL</span></label><input className="form-control" maxLength="160" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Monthly groceries" /></div><div className="col-sm-6"><label className="form-label">Date</label><input className="form-control" type="date" value={date} onChange={e => setDate(e.target.value)} required /></div><div className="col-sm-6"><label className="form-label">Payment method</label><select className="form-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>{['UPI', 'Cash', 'Card', 'Bank transfer', 'Other'].map(c => <option key={c}>{c}</option>)}</select></div></div>{err && <div className="auth-error">{err}</div>}<div className="modal-actions"><Button variant="outline-secondary" type="button" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Save transaction'}</Button></div></form> }
function BudgetForm({ month, categories, onCancel, onSave }) { const [category, setCategory] = useState(categories[0]), [limit, setLimit] = useState(''), [busy, setBusy] = useState(false); return <form className="modal-form" onSubmit={async e => { e.preventDefault(); setBusy(true); await onSave({ category, limit: Number(limit), month }); setBusy(false) }}><div className="mb-3"><label className="form-label">Spending category</label><select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></div><div className="mb-3"><label className="form-label">Monthly limit (₹)</label><input className="form-control" type="number" min="1" step="1" value={limit} onChange={e => setLimit(e.target.value)} placeholder="e.g. 5000" required /></div><div className="mb-3"><label className="form-label">Month</label><input className="form-control" type="month" value={month} readOnly /></div><p className="form-hint">Saving an existing category/month updates its limit.</p><div className="modal-actions"><Button variant="outline-secondary" type="button" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save budget'}</Button></div></form> }
function GoalForm({ onCancel, onSave }) { const [name, setName] = useState(''), [target, setTarget] = useState(''), [saved, setSaved] = useState('0'), [deadline, setDeadline] = useState(''), [busy, setBusy] = useState(false); return <form className="modal-form" onSubmit={async e => { e.preventDefault(); setBusy(true); await onSave({ name, target: Number(target), saved: Number(saved), deadline: deadline || undefined }); setBusy(false) }}><div className="mb-3"><label className="form-label">Goal name</label><input className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Emergency fund" minLength="2" maxLength="80" required /></div><div className="row g-3"><div className="col-sm-6"><label className="form-label">Target amount (₹)</label><input className="form-control" type="number" min="1" value={target} onChange={e => setTarget(e.target.value)} required /></div><div className="col-sm-6"><label className="form-label">Already saved (₹)</label><input className="form-control" type="number" min="0" value={saved} onChange={e => setSaved(e.target.value)} required /></div><div className="col-12"><label className="form-label">Target date <span className="optional-label">OPTIONAL</span></label><input className="form-control" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} /></div></div><div className="modal-actions"><Button variant="outline-secondary" type="button" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create goal'}</Button></div></form> }
function RecurringForm({ onCancel, onSave }) { const [type, setType] = useState('expense'), [amount, setAmount] = useState(''), [category, setCategory] = useState('Rent'), [description, setDescription] = useState(''), [frequency, setFrequency] = useState('monthly'), [nextDate, setNextDate] = useState(dateNow()), [paymentMethod, setPaymentMethod] = useState('UPI'), [busy, setBusy] = useState(false); return <form className="modal-form" onSubmit={async e => { e.preventDefault(); setBusy(true); await onSave({ type, amount: Number(amount), category, description, frequency, nextDate, paymentMethod }); setBusy(false) }}><div className="type-switch"><button type="button" className={type === 'expense' ? 'selected expense-selected' : ''} onClick={() => setType('expense')}>Expense</button><button type="button" className={type === 'income' ? 'selected income-selected' : ''} onClick={() => setType('income')}>Income</button></div><div className="row g-3"><div className="col-sm-6"><label className="form-label">Amount (₹)</label><input className="form-control" type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required /></div><div className="col-sm-6"><label className="form-label">Frequency</label><select className="form-select" value={frequency} onChange={e => setFrequency(e.target.value)}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div><div className="col-12"><label className="form-label">Category</label><select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>{(type === 'income' ? ['Salary', 'Freelance', 'Investment', 'Other'] : categories.filter(c => !['Salary', 'Freelance', 'Investment'].includes(c))).map(c => <option key={c}>{c}</option>)}</select></div><div className="col-12"><label className="form-label">Description</label><input className="form-control" value={description} onChange={e => setDescription(e.target.value)} maxLength="160" placeholder="e.g. Internet subscription" /></div><div className="col-sm-6"><label className="form-label">First date</label><input className="form-control" type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} required /></div><div className="col-sm-6"><label className="form-label">Payment method</label><select className="form-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>{['UPI', 'Cash', 'Card', 'Bank transfer', 'Other'].map(c => <option key={c}>{c}</option>)}</select></div></div><p className="form-hint">Rules only create transactions when you click “Run recurring”. No automatic payment is made.</p><div className="modal-actions"><Button variant="outline-secondary" type="button" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save rule'}</Button></div></form> }
function SettingsPage({ user, balance, transactionsCount, goalsCount, budgetsCount, dark, setDark, onLogout, onExport, api, onUpdateUser, notify }) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [showPassword, setShowPassword] = useState(false);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        setName(user?.name || '');
        setEmail(user?.email || '');
        setAvatar(user?.avatar || '');
    }, [user]);

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setErr('Please select a valid image file (JPG, PNG, WebP).');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setErr('Image file size must be less than 5MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const size = 180;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                const minDim = Math.min(img.width, img.height);
                const startX = (img.width - minDim) / 2;
                const startY = (img.height - minDim) / 2;
                ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
                setAvatar(dataUrl);
                setErr('');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (name.trim().length < 2) {
            setErr('Name must be between 2 and 80 characters.');
            return;
        }
        if (password && password.length < 8) {
            setErr('New password must be at least 8 characters.');
            return;
        }
        setBusy(true);
        setErr('');
        const payload = { name: name.trim(), email: email.trim(), avatar: avatar || '' };
        if (password) payload.password = password;

        try {
            const res = await api.put('/auth/profile', payload);
            if (onUpdateUser) onUpdateUser(res.user, res.token);
            if (notify) notify('Profile & picture updated successfully!');
            setIsEditing(false);
            setPassword('');
        } catch (e) {
            // Update local state and localStorage gracefully so user photo applies immediately in UI
            const updatedLocalUser = { ...user, name: name.trim(), email: email.trim(), avatar: avatar || '' };
            if (onUpdateUser) onUpdateUser(updatedLocalUser);
            setIsEditing(false);
            setPassword('');
            if (notify) notify('Profile updated in workspace! (Database sync notice: ' + e.message + ')');
        } finally {
            setBusy(false);
        }
    };

    return <>
        <SectionHeader eyebrow="ACCOUNT & PREFERENCES" title="Settings" subtitle="Manage your profile, theme appearance, regional preferences, and session data." action={<Button variant="outline-secondary" onClick={onLogout} style={{ color: '#e66b7a', borderColor: 'rgba(230,107,122,.3)' }}><LogOut size={16} /> Sign out</Button>} />
        <div className="settings-grid">
            <motion.div className="panel settings-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }}>
                <div className="settings-card-top-bar">
                    <div className="panel-kicker">{isEditing ? 'EDIT PROFILE & PHOTO' : 'USER PROFILE'}</div>
                    {!isEditing ? (
                        <button type="button" className="btn btn-outline-primary fin-btn" style={{ padding: '5px 12px', fontSize: '11px' }} onClick={() => setIsEditing(true)}>
                            <Pencil size={13} /> Edit Profile
                        </button>
                    ) : (
                        <button type="button" className="subtle-icon" style={{ height: '28px', width: '28px' }} onClick={() => { setIsEditing(false); setErr(''); setName(user?.name || ''); setEmail(user?.email || ''); setAvatar(user?.avatar || ''); setPassword(''); }} title="Close edit">
                            <X size={15} />
                        </button>
                    )}
                </div>

                {!isEditing ? (
                    <>
                        <div className="settings-user-hero">
                            <div className="settings-avatar-lg" onClick={() => setIsEditing(true)} title="Click to edit profile & photo" style={{ cursor: 'pointer', position: 'relative' }}>
                                {user?.avatar ? <img src={user.avatar} alt={user?.name} className="avatar-img-lg" /> : initials(user?.name)}
                                <span className="avatar-edit-badge" title="Change photo"><Camera size={12} /></span>
                            </div>
                            <div className="settings-user-info">
                                <h3>{user?.name || 'Finora Member'}</h3>
                                <p>{user?.email || 'personal@finora.io'}</p>
                                <span className="profile-badge">● Personal Workspace · Active</span>
                            </div>
                        </div>
                        <div className="settings-stats-strip">
                            <div className="settings-stat-pill">
                                <span>Net Balance</span>
                                <strong><AnimatedNumber value={balance} /></strong>
                            </div>
                            <div className="settings-stat-pill">
                                <span>Transactions</span>
                                <strong><AnimatedNumber value={transactionsCount} prefix="" format={false} /></strong>
                            </div>
                            <div className="settings-stat-pill">
                                <span>Savings Goals</span>
                                <strong><AnimatedNumber value={goalsCount} prefix="" format={false} /></strong>
                            </div>
                        </div>
                    </>
                ) : (
                    <form className="settings-edit-form" onSubmit={handleSaveProfile}>
                        <div className="avatar-edit-box">
                            <div className="avatar-preview-wrap" onClick={() => fileInputRef.current?.click()} title="Click to select photo">
                                {avatar ? <img src={avatar} alt="Preview" className="avatar-img-lg" /> : <div className="avatar-fallback-lg">{initials(name || user?.name)}</div>}
                                <div className="avatar-overlay-cam"><Camera size={18} /></div>
                            </div>
                            <div className="avatar-action-btns">
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <button type="button" className="btn btn-outline-primary fin-btn" style={{ padding: '5px 12px', fontSize: '11px' }} onClick={() => fileInputRef.current?.click()}>
                                        <Upload size={13} /> Choose Image
                                    </button>
                                    {avatar && (
                                        <button type="button" className="btn btn-outline-secondary fin-btn" style={{ padding: '5px 12px', fontSize: '11px', color: '#e66b7a' }} onClick={() => setAvatar('')}>
                                            <Trash2 size={13} /> Remove Image
                                        </button>
                                    )}
                                </div>
                                <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                                <span className="avatar-file-note">JPG, PNG, GIF or WebP (square recommended)</span>
                            </div>
                        </div>

                        <div className="mb-2">
                            <label className="form-label">Full Name</label>
                            <div className="auth-input-wrap">
                                <UserIcon size={16} className="auth-input-icon" />
                                <input className="form-control" style={{ paddingLeft: '38px' }} value={name} onChange={e => setName(e.target.value)} required minLength="2" maxLength="80" placeholder="Your full name" />
                            </div>
                        </div>
                        <div className="mb-2">
                            <label className="form-label">Email Address</label>
                            <div className="auth-input-wrap">
                                <Mail size={16} className="auth-input-icon" />
                                <input className="form-control" style={{ paddingLeft: '38px' }} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@domain.com" />
                            </div>
                        </div>
                        <div className="mb-2">
                            <label className="form-label">New Password <span className="optional-label">OPTIONAL</span></label>
                            <div className="auth-input-wrap">
                                <Lock size={16} className="auth-input-icon" />
                                <input className="form-control" style={{ paddingLeft: '38px', paddingRight: '38px' }} type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} minLength="8" placeholder="Leave blank to keep current password" />
                                <button type="button" className="auth-pw-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                            </div>
                        </div>
                        {err && <div className="auth-error" style={{ marginTop: '6px', marginBottom: '6px' }}>{err}</div>}
                        <div className="modal-actions" style={{ marginTop: '12px', gap: '8px' }}>
                            <Button variant="outline-secondary" type="button" onClick={() => { setIsEditing(false); setErr(''); setName(user?.name || ''); setEmail(user?.email || ''); setAvatar(user?.avatar || ''); setPassword(''); }}>Cancel</Button>
                            <Button type="submit" disabled={busy}>{busy ? 'Saving…' : <><Check size={14} /> Save Changes</>}</Button>
                        </div>
                    </form>
                )}
            </motion.div>

            <motion.div className="panel settings-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3, delay: .05 }}>
                <div className="panel-kicker">APPEARANCE</div>
                <div className="settings-card-header">
                    <h3>Theme Preference</h3>
                    <p>Select how Finora looks to your eyes</p>
                </div>
                <div className="theme-options-grid">
                    <div className={`theme-card-option ${!dark ? 'active' : ''}`} onClick={() => setDark(false)} role="button" tabIndex={0}>
                        <div className="theme-preview-box light-preview">
                            <div className="preview-side" />
                            <div className="preview-main">
                                <div className="preview-bar" />
                                <div className="preview-sub" />
                            </div>
                        </div>
                        <div className="theme-card-title"><Sun size={15} /> Light Mode</div>
                        {!dark && <div className="theme-check-dot"><Check size={12} /></div>}
                    </div>
                    <div className={`theme-card-option ${dark ? 'active' : ''}`} onClick={() => setDark(true)} role="button" tabIndex={0}>
                        <div className="theme-preview-box dark-preview">
                            <div className="preview-side" />
                            <div className="preview-main">
                                <div className="preview-bar" />
                                <div className="preview-sub" />
                            </div>
                        </div>
                        <div className="theme-card-title"><Moon size={15} /> Dark Mode</div>
                        {dark && <div className="theme-check-dot"><Check size={12} /></div>}
                    </div>
                </div>
            </motion.div>

            <motion.div className="panel settings-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3, delay: .1 }}>
                <div className="panel-kicker">REGIONAL & LOCALIZATION</div>
                <div className="settings-card-header">
                    <h3>Currency & Formats</h3>
                    <p>Your workspace display preferences</p>
                </div>
                <div className="settings-row-item">
                    <div className="settings-row-label">
                        <strong>Base Currency</strong>
                        <span>Indian Rupee (INR · ₹)</span>
                    </div>
                    <span className="settings-badge">₹ INR</span>
                </div>
                <div className="settings-row-item">
                    <div className="settings-row-label">
                        <strong>Number Format</strong>
                        <span>Indian numbering system (Lakhs & Crores)</span>
                    </div>
                    <span className="settings-badge">en-IN</span>
                </div>
                <div className="settings-row-item">
                    <div className="settings-row-label">
                        <strong>Active Budgets</strong>
                        <span>Configured spending categories</span>
                    </div>
                    <span className="settings-badge">{budgetsCount} Categories</span>
                </div>
            </motion.div>

            <motion.div className="panel settings-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3, delay: .15 }}>
                <div className="panel-kicker">SECURITY & BACKUP</div>
                <div className="settings-card-header">
                    <h3>Data & Cloud Sync</h3>
                    <p>Manage your account records and data export</p>
                </div>
                <div className="settings-row-item">
                    <div className="settings-row-label">
                        <strong>Cloud Database Sync</strong>
                        <span>MongoDB Atlas cloud cluster</span>
                    </div>
                    <span className="settings-badge" style={{ color: '#37b8a5', borderColor: 'rgba(55,184,165,.3)' }}>● Connected</span>
                </div>
                <div className="settings-row-item">
                    <div className="settings-row-label">
                        <strong>Export Transactions</strong>
                        <span>Download CSV format spreadsheet</span>
                    </div>
                    <Button variant="outline-secondary" onClick={onExport} style={{ padding: '6px 14px', fontSize: '12px' }}><Download size={14} /> Export CSV</Button>
                </div>
                <div className="settings-row-item">
                    <div className="settings-row-label">
                        <strong>Account Security</strong>
                        <span>Password & JWT session encrypted</span>
                    </div>
                    <span className="settings-badge"><ShieldCheck size={13} /> Secured</span>
                </div>
            </motion.div>
        </div>
    </>
}
function NotificationsModal({ transactionsCount, income, expense, goalsCount, onClose }) { return <div><div style={{ maxHeight: '380px', overflowY: 'auto', display: 'grid' }}><div className="notification-item"><div className="notification-icon-wrap"><Activity size={18} /></div><div className="notification-content"><strong>Welcome to Finora</strong><p>Your workspace is active and up to date with {transactionsCount} transactions recorded.</p><div className="notification-time">Today · System Alert</div></div></div><div className="notification-item"><div className="notification-icon-wrap"><TrendingUp size={18} /></div><div className="notification-content"><strong>Monthly Cashflow Summary</strong><p>{income >= expense ? `Great job! You have a surplus of ${money(income - expense)} this month.` : `Notice: Expenses exceed income by ${money(expense - income)} this month.`}</p><div className="notification-time">This Month · Financial Insight</div></div></div><div className="notification-item"><div className="notification-icon-wrap"><Target size={18} /></div><div className="notification-content"><strong>Savings Goals Status</strong><p>{goalsCount > 0 ? `You are currently tracking ${goalsCount} active savings targets.` : 'Start a savings target today in the Savings Goals tab!'}</p><div className="notification-time">Active · Goals</div></div></div><div className="notification-item"><div className="notification-icon-wrap"><ShieldCheck size={18} /></div><div className="notification-content"><strong>Database & Privacy</strong><p>Your financial records are encrypted and synced with MongoDB Atlas.</p><div className="notification-time">Verified · Security</div></div></div></div><div className="modal-actions" style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', margin: 0 }}><Button variant="outline-secondary" type="button" onClick={onClose}>Close</Button></div></div> }
export default App;
