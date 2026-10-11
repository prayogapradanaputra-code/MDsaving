'use client'

import { useEffect, useMemo, useState } from 'react'

type ViewKey = 'dashboard' | 'capture' | 'queue' | 'library' | 'presets' | 'settings'
type User = { id: number; name: string; email: string }
type Job = { id: number; title: string; source: string; mode: string; quality: string; progress: number; status: string; poster: string }
type Asset = { id: number; title: string; source: string; mode: string; quality: string; poster: string }
type Preset = { id: number; name: string; mode: string; quality: string }
type Stats = { assets: number; queue: number; presets: number; processed: number; storage: string }
type DetectPayload = {
  platform: string
  poster: string
  suggestedMode: 'video' | 'audio' | 'clip' | 'batch'
  suggestedQuality: 'Ultra' | 'Creator' | 'Audio HQ'
  format: string
  title: string
  description: string
}

const viewTitles: Record<ViewKey, string> = {
  dashboard: 'Overview',
  capture: 'Capture',
  queue: 'Queue',
  library: 'Library',
  presets: 'Presets',
  settings: 'Settings',
}

const emptyStats: Stats = { assets: 0, queue: 0, presets: 0, processed: 0, storage: '0 GB' }
const defaultPreview: DetectPayload = {
  platform: 'YouTube',
  poster: 'YT',
  suggestedMode: 'video',
  suggestedQuality: 'Ultra',
  format: 'MP4 master',
  title: 'YouTube source detected',
  description: 'Detected source siap diproses oleh Next.js + PostgreSQL stack.',
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function MDsavingApp() {
  const [booting, setBooting] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [authName, setAuthName] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')

  const [view, setView] = useState<ViewKey>('dashboard')
  const [jobs, setJobs] = useState<Job[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [presets, setPresets] = useState<Preset[]>([])
  const [stats, setStats] = useState<Stats>(emptyStats)
  const [url, setUrl] = useState('https://youtube.com/watch?v=creator-masterclass')
  const [mode, setMode] = useState<'video' | 'audio' | 'clip' | 'batch'>('video')
  const [quality, setQuality] = useState<'Ultra' | 'Creator' | 'Audio HQ'>('Ultra')
  const [preview, setPreview] = useState<DetectPayload>(defaultPreview)
  const [librarySearch, setLibrarySearch] = useState('')
  const [libraryFilter, setLibraryFilter] = useState('all')
  const [presetName, setPresetName] = useState('')
  const [presetMode, setPresetMode] = useState('video')
  const [presetQuality, setPresetQuality] = useState<'Ultra' | 'Creator' | 'Audio HQ'>('Creator')
  const [toast, setToast] = useState('')

  useEffect(() => {
    const boot = async () => {
      try {
        const result = await api<{ user: User }>('/api/auth/me')
        setUser(result.user)
      } catch {
        setUser(null)
      } finally {
        setBooting(false)
      }
    }
    boot()
  }, [])

  useEffect(() => {
    if (!user) return
    refreshAll().catch((error) => showToast(error instanceof Error ? error.message : 'Failed to load app'))
    const interval = setInterval(() => {
      refreshAll().catch(() => undefined)
    }, 2500)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    if (!user) return
    fetchAssetsOnly().catch(() => undefined)
  }, [librarySearch, libraryFilter, user])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(timer)
  }, [toast])

  async function api<T>(input: string, init?: RequestInit): Promise<T> {
    const response = await fetch(input, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      ...init,
    })
    if (!response.ok) {
      let message = `Request failed: ${response.status}`
      try {
        const payload = await response.json()
        if (payload.error) message = payload.error
      } catch {}
      throw new Error(message)
    }
    return response.json()
  }

  function showToast(message: string) {
    setToast(message)
  }

  async function refreshAll() {
    const params = new URLSearchParams()
    if (librarySearch.trim()) params.set('q', librarySearch.trim())
    if (libraryFilter !== 'all') params.set('mode', libraryFilter)

    const [jobsData, assetsData, presetsData, statsData] = await Promise.all([
      api<Job[]>('/api/jobs'),
      api<Asset[]>(`/api/assets?${params.toString()}`),
      api<Preset[]>('/api/presets'),
      api<Stats>('/api/stats'),
    ])

    setJobs(jobsData)
    setAssets(assetsData)
    setPresets(presetsData)
    setStats(statsData)
  }

  async function fetchAssetsOnly() {
    const params = new URLSearchParams()
    if (librarySearch.trim()) params.set('q', librarySearch.trim())
    if (libraryFilter !== 'all') params.set('mode', libraryFilter)
    const assetsData = await api<Asset[]>(`/api/assets?${params.toString()}`)
    setAssets(assetsData)
  }

  async function submitAuth() {
    const endpoint = authMode === 'signup' ? '/api/auth/signup' : '/api/auth/login'
    const payload = authMode === 'signup'
      ? { name: authName, email: authEmail, password: authPassword }
      : { email: authEmail, password: authPassword }

    const result = await api<{ user: User }>(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    setUser(result.user)
    setAuthPassword('')
    showToast(authMode === 'signup' ? 'Account created' : 'Logged in')
  }

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setJobs([])
    setAssets([])
    setPresets([])
    setStats(emptyStats)
    showToast('Logged out')
  }

  async function detectCurrent() {
    const payload = await api<DetectPayload>('/api/detect', {
      method: 'POST',
      body: JSON.stringify({ url }),
    })
    setPreview(payload)
    setMode(payload.suggestedMode)
    setQuality(payload.suggestedQuality)
    showToast(`${payload.platform} detected`)
  }

  async function createJob(instantSave: boolean) {
    await api('/api/jobs', {
      method: 'POST',
      body: JSON.stringify({ url, mode, quality, instantSave }),
    })
    await refreshAll()
    showToast(instantSave ? 'Instant save completed' : 'Added to queue')
  }

  async function processAll() {
    await api('/api/jobs/process-all', { method: 'POST' })
    await refreshAll()
    showToast('Queue processed')
  }

  async function clearQueue() {
    await api('/api/jobs/clear', { method: 'DELETE' })
    await refreshAll()
    showToast('Queue cleared')
  }

  async function createPreset() {
    if (!presetName.trim()) {
      showToast('Isi nama preset dulu')
      return
    }
    await api('/api/presets', {
      method: 'POST',
      body: JSON.stringify({ name: presetName, mode: presetMode, quality: presetQuality }),
    })
    setPresetName('')
    await refreshAll()
    showToast('Preset saved')
  }

  async function seedDemo() {
    await api('/api/seed-demo', { method: 'POST' })
    await refreshAll()
    showToast('Demo data loaded')
  }

  function applyPreset(preset: Preset) {
    setMode(preset.mode as typeof mode)
    setQuality(preset.quality as typeof quality)
    setView('capture')
    showToast(`Preset ${preset.name} applied`)
  }

  const dashboardJobs = useMemo(() => jobs.slice(0, 3), [jobs])
  const dashboardAssets = useMemo(() => assets.slice(0, 3), [assets])
  const topButtonLabel = view === 'capture' ? 'Instant save' : 'Open capture'

  if (booting) {
    return <div className="auth-shell"><div className="auth-card"><h1>MDsaving</h1><p>Loading app…</p></div></div>
  }

  if (!user) {
    return (
      <>
        <div className="auth-shell">
          <div className="auth-card">
            <span className="hero-chip">Account access</span>
            <h1>MDsaving</h1>
            <p className="auth-copy">Masuk atau buat akun untuk mengakses workspace media milikmu, preset, queue, dan asset library per-user.</p>
            <div className="auth-tabs">
              <button className={`chip ${authMode === 'signup' ? 'active' : ''}`} onClick={() => setAuthMode('signup')}>Sign up</button>
              <button className={`chip ${authMode === 'login' ? 'active' : ''}`} onClick={() => setAuthMode('login')}>Login</button>
            </div>
            <div className="stack form-stack">
              {authMode === 'signup' ? (
                <div>
                  <label className="field-label">Name</label>
                  <input className="app-input" value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Nama kamu" />
                </div>
              ) : null}
              <div>
                <label className="field-label">Email</label>
                <input className="app-input" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="email@domain.com" />
              </div>
              <div>
                <label className="field-label">Password</label>
                <input type="password" className="app-input" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Minimal 6 karakter" />
              </div>
              <button className="primary-button" onClick={() => submitAuth().catch((error) => showToast(error.message))}>
                {authMode === 'signup' ? 'Create account' : 'Login'}
              </button>
            </div>
          </div>
        </div>
        {toast ? <div className="toast show">{toast}</div> : null}
      </>
    )
  }

  return (
    <>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-logo">MD</div>
            <div>
              <h1>MDsaving</h1>
              <p>{user.name} • {user.email}</p>
            </div>
          </div>

          <nav className="nav">
            {(['dashboard', 'capture', 'queue', 'library', 'presets', 'settings'] as ViewKey[]).map((item) => (
              <button key={item} className={`nav-item ${view === item ? 'active' : ''}`} onClick={() => setView(item)}>
                <span>{viewTitles[item]}</span>
                <span className="nav-badge">
                  {item === 'queue' ? jobs.length : item === 'library' ? assets.length : item === 'presets' ? presets.length : item === 'settings' ? 'API' : item === 'capture' ? '+' : '01'}
                </span>
              </button>
            ))}
          </nav>

          <div className="sidebar-card">
            <h3>User workspace</h3>
            <p>Setiap akun sekarang punya queue, library, dan preset sendiri di database.</p>
            <button className="secondary-button" onClick={() => seedDemo().catch((error) => showToast(error.message))}>Load demo data</button>
          </div>
        </aside>

        <main className="main">
          <header className="topbar">
            <div>
              <span className="eyebrow">Authenticated workspace</span>
              <h2>{viewTitles[view]}</h2>
            </div>
            <div className="top-actions">
              <button className="ghost-button" onClick={async () => {
                try {
                  setUrl('https://instagram.com/reel/client-story-cut')
                  const payload = await api<DetectPayload>('/api/detect', {
                    method: 'POST',
                    body: JSON.stringify({ url: 'https://instagram.com/reel/client-story-cut' }),
                  })
                  setPreview(payload)
                  setMode(payload.suggestedMode)
                  setQuality(payload.suggestedQuality)
                  await api('/api/jobs', {
                    method: 'POST',
                    body: JSON.stringify({ url: 'https://instagram.com/reel/client-story-cut', mode: payload.suggestedMode, quality: payload.suggestedQuality, instantSave: true }),
                  })
                  await refreshAll()
                  showToast('Quick demo complete')
                } catch (error) {
                  showToast(error instanceof Error ? error.message : 'Quick demo failed')
                }
              }}>Quick demo</button>
              <button className="ghost-button" onClick={() => logout().catch((error) => showToast(error.message))}>Logout</button>
              <button className="primary-button" onClick={() => view === 'capture' ? createJob(true).catch((error) => showToast(error.message)) : setView('capture')}>{topButtonLabel}</button>
            </div>
          </header>

          <section className={`view ${view === 'dashboard' ? 'active' : ''}`}>
            <div className="hero-grid">
              <div className="panel hero-panel">
                <span className="hero-chip">User account enabled</span>
                <h3>Your premium media workflow now has real user accounts.</h3>
                <p>Queue, presets, dan asset library sekarang dipisahkan per user, jadi fondasinya sudah lebih dekat ke aplikasi production multi-user.</p>
                <div className="hero-actions">
                  <button className="primary-button" onClick={() => setView('capture')}>Start capture</button>
                  <button className="ghost-button" onClick={() => setView('library')}>Open library</button>
                </div>
                <div className="metric-row">
                  <div className="metric-card"><strong>{stats.assets}</strong><span>Assets saved</span></div>
                  <div className="metric-card"><strong>{stats.queue}</strong><span>Queue active</span></div>
                  <div className="metric-card"><strong>{stats.presets}</strong><span>Saved presets</span></div>
                </div>
              </div>
              <div className="panel compact-panel">
                <div className="panel-head">
                  <h3>Upgrade summary</h3>
                  <span className="chip small">Auth</span>
                </div>
                <ul className="feature-list compact">
                  <li>Sign up & login</li>
                  <li>Cookie session</li>
                  <li>Per-user jobs, assets, presets</li>
                  <li>Ready for deeper auth upgrade later</li>
                </ul>
              </div>
            </div>

            <div className="two-col-grid">
              <div className="panel">
                <div className="panel-head">
                  <h3>Recent queue</h3>
                  <button className="text-button" onClick={() => setView('queue')}>See all</button>
                </div>
                <div className="stack small-gap">
                  {dashboardJobs.length ? dashboardJobs.map((item) => <QueueCard key={item.id} item={item} />) : <div className="empty-state">Belum ada item di queue.</div>}
                </div>
              </div>
              <div className="panel">
                <div className="panel-head">
                  <h3>Latest library</h3>
                  <button className="text-button" onClick={() => setView('library')}>See all</button>
                </div>
                <div className="stack small-gap">
                  {dashboardAssets.length ? dashboardAssets.map((item) => <AssetCard key={item.id} item={item} compact />) : <div className="empty-state">Belum ada asset.</div>}
                </div>
              </div>
            </div>
          </section>

          <section className={`view ${view === 'capture' ? 'active' : ''}`}>
            <div className="capture-grid">
              <div className="panel capture-panel">
                <div className="panel-head">
                  <h3>Capture console</h3>
                  <span className="chip">Signed in</span>
                </div>
                <label className="field-label">Source URL</label>
                <div className="input-row">
                  <input className="app-input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste source URL" />
                  <button className="secondary-button" onClick={() => detectCurrent().catch((error) => showToast(error.message))}>Detect</button>
                </div>
                <div className="form-grid">
                  <div>
                    <label className="field-label">Mode</label>
                    <div className="chip-group">
                      {(['video', 'audio', 'clip', 'batch'] as const).map((item) => (
                        <button key={item} className={`chip ${mode === item ? 'active' : ''}`} onClick={() => setMode(item)}>{capitalize(item)}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="field-label">Quality</label>
                    <div className="quality-grid">
                      {(['Ultra', 'Creator', 'Audio HQ'] as const).map((item) => (
                        <button key={item} className={`quality-card ${quality === item ? 'active' : ''}`} onClick={() => setQuality(item)}>
                          <strong>{item}</strong>
                          <span>{item === 'Ultra' ? '4K / master' : item === 'Creator' ? '1080p / editing' : 'high bitrate'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="chip-group inline">
                  {presets.map((preset) => (
                    <button key={preset.id} className="chip" onClick={() => applyPreset(preset)}>{preset.name}</button>
                  ))}
                </div>
              </div>

              <div className="panel preview-panel">
                <div className="panel-head">
                  <h3>Preview</h3>
                  <span className="chip">{preview.platform}</span>
                </div>
                <div className="preview-card">
                  <div className="poster">{preview.poster}</div>
                  <div className="preview-body">
                    <h4>{preview.title}</h4>
                    <p>{preview.description}</p>
                    <div className="meta-grid">
                      <div className="meta-box"><span>Mode</span><strong>{capitalize(mode)}</strong></div>
                      <div className="meta-box"><span>Quality</span><strong>{quality}</strong></div>
                      <div className="meta-box"><span>Format</span><strong>{preview.format}</strong></div>
                      <div className="meta-box"><span>Platform</span><strong>{preview.platform}</strong></div>
                    </div>
                    <div className="action-row">
                      <button className="secondary-button" onClick={() => createJob(false).catch((error) => showToast(error.message))}>Add to queue</button>
                      <button className="primary-button" onClick={() => createJob(true).catch((error) => showToast(error.message))}>Instant save</button>
                    </div>
                  </div>
                </div>
                <p className="footnote">User account sekarang memisahkan workspace antar pengguna di database.</p>
              </div>
            </div>
          </section>

          <section className={`view ${view === 'queue' ? 'active' : ''}`}>
            <div className="panel full-height">
              <div className="panel-head">
                <h3>Queue manager</h3>
                <div className="top-actions-inline">
                  <button className="text-button" onClick={() => refreshAll().catch((error) => showToast(error.message))}>Refresh</button>
                  <button className="text-button" onClick={() => processAll().catch((error) => showToast(error.message))}>Process all</button>
                  <button className="text-button danger" onClick={() => clearQueue().catch((error) => showToast(error.message))}>Clear queue</button>
                </div>
              </div>
              <div className="stack">
                {jobs.length ? jobs.map((item) => <QueueCard key={item.id} item={item} />) : <div className="empty-state">Belum ada item di queue.</div>}
              </div>
            </div>
          </section>

          <section className={`view ${view === 'library' ? 'active' : ''}`}>
            <div className="panel full-height">
              <div className="panel-head wrap">
                <h3>Asset library</h3>
                <div className="library-toolbar">
                  <input className="app-input small-input" value={librarySearch} onChange={(e) => setLibrarySearch(e.target.value)} placeholder="Cari asset..." />
                  <select className="app-select" value={libraryFilter} onChange={(e) => setLibraryFilter(e.target.value)}>
                    <option value="all">Semua</option>
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                    <option value="clip">Clip</option>
                    <option value="batch">Batch</option>
                  </select>
                </div>
              </div>
              <div className="library-grid">
                {assets.length ? assets.map((item) => <AssetCard key={item.id} item={item} />) : <div className="empty-state">Belum ada asset yang cocok.</div>}
              </div>
            </div>
          </section>

          <section className={`view ${view === 'presets' ? 'active' : ''}`}>
            <div className="two-col-grid">
              <div className="panel">
                <div className="panel-head">
                  <h3>Preset library</h3>
                  <span className="chip">Per-user</span>
                </div>
                <div className="stack">
                  {presets.map((preset) => (
                    <div key={preset.id} className="preset-item">
                      <div className="preset-top">
                        <div className="preset-title">{preset.name}</div>
                        <button className="text-button" onClick={() => applyPreset(preset)}>Apply</button>
                      </div>
                      <div className="preset-meta"><span>{capitalize(preset.mode)}</span><span>•</span><span>{preset.quality}</span></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel">
                <div className="panel-head">
                  <h3>Create preset</h3>
                  <span className="chip">Account scoped</span>
                </div>
                <div className="stack form-stack">
                  <div>
                    <label className="field-label">Preset name</label>
                    <input className="app-input" value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="Mis. Client Preview" />
                  </div>
                  <div>
                    <label className="field-label">Mode</label>
                    <select className="app-select" value={presetMode} onChange={(e) => setPresetMode(e.target.value)}>
                      <option value="video">Video</option>
                      <option value="audio">Audio</option>
                      <option value="clip">Clip</option>
                      <option value="batch">Batch</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Quality</label>
                    <select className="app-select" value={presetQuality} onChange={(e) => setPresetQuality(e.target.value as typeof quality)}>
                      <option value="Ultra">Ultra</option>
                      <option value="Creator">Creator</option>
                      <option value="Audio HQ">Audio HQ</option>
                    </select>
                  </div>
                  <button className="primary-button" onClick={() => createPreset().catch((error) => showToast(error.message))}>Save preset</button>
                </div>
              </div>
            </div>
          </section>

          <section className={`view ${view === 'settings' ? 'active' : ''}`}>
            <div className="two-col-grid">
              <div className="panel">
                <div className="panel-head">
                  <h3>Auth notes</h3>
                  <span className="chip">Session</span>
                </div>
                <ul className="feature-list">
                  <li>Email + password account creation</li>
                  <li>Cookie session berbasis database</li>
                  <li>Jobs, assets, dan presets terisolasi per user</li>
                  <li>Siap untuk upgrade ke auth provider nanti</li>
                </ul>
              </div>
              <div className="panel">
                <div className="panel-head">
                  <h3>Next production step</h3>
                  <span className="chip">Upgrade path</span>
                </div>
                <ul className="feature-list">
                  <li>Tambah auth provider seperti Clerk/Auth.js</li>
                  <li>Tambahkan reset password dan verification</li>
                  <li>Tambahkan Redis/BullMQ untuk queue nyata</li>
                  <li>Tambahkan object storage dan billing</li>
                </ul>
              </div>
            </div>
          </section>
        </main>
      </div>

      {toast ? <div className="toast show">{toast}</div> : null}
    </>
  )
}

function QueueCard({ item }: { item: Job }) {
  return (
    <div className="queue-item">
      <div className="queue-top">
        <div className="queue-title">{item.title}</div>
        <div className={`status-tag ${item.status === 'Complete' ? 'done' : item.status === 'Failed' ? 'failed' : ''}`}>{item.status}</div>
      </div>
      <div className="queue-meta">
        <span>{item.source}</span>
        <span>•</span>
        <span>{capitalize(item.mode)}</span>
        <span>•</span>
        <span>{item.quality}</span>
      </div>
      <div className="progress"><div className="bar" style={{ width: `${item.progress}%` }} /></div>
    </div>
  )
}

function AssetCard({ item, compact = false }: { item: Asset; compact?: boolean }) {
  return (
    <div className="library-item">
      {!compact ? <div className="library-thumb">{item.poster}</div> : null}
      <div>
        <div className="library-top">
          <div className="library-title">{item.title}</div>
          <div className="status-tag done">Saved</div>
        </div>
        <div className="library-meta">
          <span>{item.source}</span>
          <span>•</span>
          <span>{capitalize(item.mode)}</span>
          <span>•</span>
          <span>{item.quality}</span>
        </div>
      </div>
    </div>
  )
}
