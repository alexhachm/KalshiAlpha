import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  getAllBindings,
  addBinding,
  updateBinding,
  removeBinding,
  getTemplates,
  addTemplate,
  updateTemplate as updateStoreTemplate,
  removeTemplate,
  getActiveProfileName,
  getProfiles,
  saveProfile,
  loadProfile,
  exportProfile,
  importProfile,
  subscribe,
  normalizeKeyCombo,
  setConfigActive,
} from '../services/hotkeyStore'
import { validateScript, COMMAND_REFERENCE } from '../services/hotkeyLanguage'
import './HotkeyManager.css'

const CATEGORIES = ['trading', 'navigation', 'scanner', 'custom']

function HotkeyManager() {
  const [bindings, setBindings] = useState(() => getAllBindings())
  const [templates, setTemplates] = useState(() => getTemplates())
  const [profiles, setProfiles] = useState(() => getProfiles())
  const [activeProfileName, setActiveProfileName] = useState(() => getActiveProfileName())
  const [selectedId, setSelectedId] = useState(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [error, setError] = useState(null)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [tplName, setTplName] = useState('')
  const [tplSize, setTplSize] = useState(1)
  const [tplType, setTplType] = useState('limit')
  const [tplTif, setTplTif] = useState('gtc')

  // Editor state
  const [editorKey, setEditorKey] = useState('')
  const [editorLabel, setEditorLabel] = useState('')
  const [editorScript, setEditorScript] = useState('')
  const [editorCategory, setEditorCategory] = useState('custom')
  const [capturing, setCapturing] = useState(false)
  const [validation, setValidation] = useState(null)
  const [keyConflict, setKeyConflict] = useState(null)

  const keyInputRef = useRef(null)
  const fileInputRef = useRef(null)

  // Block trading hotkeys while this config UI is mounted
  useEffect(() => {
    setConfigActive(true)
    return () => setConfigActive(false)
  }, [])

  // Subscribe to store changes
  useEffect(() => {
    return subscribe(() => {
      setBindings(getAllBindings())
      setTemplates(getTemplates())
      setProfiles(getProfiles())
      setActiveProfileName(getActiveProfileName())
    })
  }, [])

  // Populate editor when selection changes
  useEffect(() => {
    if (!selectedId) return
    const b = bindings.find((x) => x.id === selectedId)
    if (b) {
      setEditorKey(b.key)
      setEditorLabel(b.label)
      setEditorScript(b.script)
      setEditorCategory(b.category || 'custom')
      setValidation(validateScript(b.script))
      setKeyConflict(null)
    }
  }, [selectedId, bindings])

  // Real-time validation
  useEffect(() => {
    if (editorScript) {
      setValidation(validateScript(editorScript))
    } else {
      setValidation(null)
    }
  }, [editorScript])

  // Check key conflicts
  useEffect(() => {
    if (!editorKey) {
      setKeyConflict(null)
      return
    }
    const conflict = bindings.find(
      (b) => b.key === editorKey && b.id !== selectedId && b.active
    )
    setKeyConflict(conflict ? `"${editorKey}" already bound to "${conflict.label}"` : null)
  }, [editorKey, bindings, selectedId])

  // Key capture handler
  const handleKeyCapture = useCallback(
    (e) => {
      if (!capturing) return
      e.preventDefault()
      e.stopPropagation()
      const combo = normalizeKeyCombo(e)
      // Ignore bare modifiers
      if (['Ctrl', 'Alt', 'Shift', 'Meta'].includes(combo)) return
      setEditorKey(combo)
      setCapturing(false)
    },
    [capturing]
  )

  // Profile handlers
  const handleLoadProfile = (name) => {
    try {
      loadProfile(name)
      setActiveProfileName(name)
      setBindings(getAllBindings())
      setSelectedId(null)
      clearEditor()
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSaveProfile = () => {
    const name = prompt('Profile name:')
    if (!name) return
    try {
      saveProfile(name)
      setProfiles(getProfiles())
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleExport = () => {
    try {
      const json = exportProfile(activeProfileName)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hotkeys-${activeProfileName}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        importProfile(ev.target.result)
        setProfiles(getProfiles())
        setBindings(getAllBindings())
        setError(null)
      } catch (err) {
        setError(err.message)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Binding handlers
  const clearEditor = () => {
    setEditorKey('')
    setEditorLabel('')
    setEditorScript('')
    setEditorCategory('custom')
    setValidation(null)
    setKeyConflict(null)
    setCapturing(false)
  }

  const handleAddNew = () => {
    setSelectedId(null)
    clearEditor()
  }

  const handleSelect = (id) => {
    setSelectedId(id)
    setError(null)
  }

  const handleToggleActive = (id, currentActive) => {
    try {
      updateBinding(id, { active: !currentActive })
      setBindings(getAllBindings())
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = (id) => {
    removeBinding(id)
    setBindings(getAllBindings())
    if (selectedId === id) {
      setSelectedId(null)
      clearEditor()
    }
  }

  // Ctrl+S keyboard shortcut for save
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    document.addEventListener('keydown', handleGlobalKey)
    return () => document.removeEventListener('keydown', handleGlobalKey)
  })

  const handleExportReference = () => {
    const all = getAllBindings()

    // Group by category
    const grouped = {}
    for (const b of all) {
      const cat = b.category || 'custom'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(b)
    }

    // Plain-text version for clipboard
    const textLines = []
    for (const [cat, items] of Object.entries(grouped)) {
      textLines.push(`=== ${cat.toUpperCase()} ===`)
      for (const b of items) {
        textLines.push(`${b.key.padEnd(20)} ${(b.label || '').padEnd(30)} ${b.script}`)
      }
      textLines.push('')
    }
    const plainText = textLines.join('\n')

    // Build HTML table rows per category
    let tableHtml = ''
    for (const [cat, items] of Object.entries(grouped)) {
      tableHtml += `<tr class="cat-header"><td colspan="3">${cat.charAt(0).toUpperCase() + cat.slice(1)}</td></tr>`
      for (const b of items) {
        const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        tableHtml += `<tr><td class="key">${esc(b.key)}</td><td>${esc(b.label || '')}</td><td class="script">${esc(b.script)}</td></tr>`
      }
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Hotkey Reference Card</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; font-size: 13px; color: #111; background: #fff; padding: 24px; }
  h1 { font-size: 18px; margin-bottom: 16px; }
  .actions { margin-bottom: 16px; display: flex; gap: 8px; }
  button { padding: 6px 14px; border: 1px solid #999; background: #f5f5f5; cursor: pointer; border-radius: 3px; font-size: 13px; }
  button:hover { background: #e0e0e0; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f0f0f0; text-align: left; padding: 6px 8px; border: 1px solid #ccc; font-weight: 600; }
  td { padding: 5px 8px; border: 1px solid #ddd; vertical-align: top; }
  tr:nth-child(even) td { background: #fafafa; }
  tr.cat-header td { background: #e8e8e8; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
  td.key { font-family: monospace; white-space: nowrap; font-weight: 600; }
  td.script { font-family: monospace; font-size: 11px; color: #444; }
  @media print {
    .actions { display: none; }
    body { padding: 0; }
  }
</style>
</head>
<body>
<h1>Hotkey Reference Card</h1>
<div class="actions">
  <button onclick="window.print()">Print</button>
  <button id="copyBtn">Copy to Clipboard</button>
</div>
<table>
  <thead><tr><th>Key Combo</th><th>Label</th><th>Action / Script</th></tr></thead>
  <tbody>${tableHtml}</tbody>
</table>
<script>
  document.getElementById('copyBtn').addEventListener('click', function() {
    const text = ${JSON.stringify(plainText)};
    navigator.clipboard.writeText(text).then(function() {
      document.getElementById('copyBtn').textContent = 'Copied!';
      setTimeout(function() { document.getElementById('copyBtn').textContent = 'Copy to Clipboard'; }, 2000);
    }).catch(function() {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      document.getElementById('copyBtn').textContent = 'Copied!';
      setTimeout(function() { document.getElementById('copyBtn').textContent = 'Copy to Clipboard'; }, 2000);
    });
  });
</script>
</body>
</html>`

    const win = window.open('', '_blank', 'width=800,height=600')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }

  // Template handlers
  const clearTemplateEditor = () => {
    setEditingTemplate(null)
    setTplName('')
    setTplSize(1)
    setTplType('limit')
    setTplTif('gtc')
  }

  const handleEditTemplate = (t) => {
    setEditingTemplate(t.id)
    setTplName(t.name)
    setTplSize(t.size)
    setTplType(t.orderType)
    setTplTif(t.timeInForce)
  }

  const handleSaveTemplate = () => {
    if (!tplName.trim()) {
      setError('Template name is required')
      return
    }
    try {
      if (editingTemplate) {
        updateStoreTemplate(editingTemplate, {
          name: tplName.trim(),
          size: Math.max(1, Math.round(tplSize)),
          orderType: tplType,
          timeInForce: tplTif,
        })
      } else {
        addTemplate({
          name: tplName.trim(),
          size: Math.max(1, Math.round(tplSize)),
          orderType: tplType,
          timeInForce: tplTif,
        })
      }
      setTemplates(getTemplates())
      clearTemplateEditor()
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteTemplate = (id) => {
    removeTemplate(id)
    setTemplates(getTemplates())
    if (editingTemplate === id) clearTemplateEditor()
  }

  const handleSave = () => {
    if (!editorKey || !editorScript) {
      setError('Key combo and script are required')
      return
    }
    if (validation && !validation.valid) {
      setError('Fix script errors before saving')
      return
    }

    try {
      if (selectedId) {
        updateBinding(selectedId, {
          key: editorKey,
          label: editorLabel || editorScript,
          script: editorScript,
          category: editorCategory,
        })
      } else {
        const created = addBinding({
          key: editorKey,
          script: editorScript,
          label: editorLabel || editorScript,
          category: editorCategory,
        })
        setSelectedId(created.id)
      }
      setBindings(getAllBindings())
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="hk">
      {/* Profile Bar */}
      <div className="hk-profile-bar">
        <select
          className="hk-profile-select"
          value={activeProfileName}
          onChange={(e) => handleLoadProfile(e.target.value)}
        >
          {profiles.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        <button className="hk-btn" onClick={handleSaveProfile}>Save As</button>
        <button className="hk-btn" onClick={handleExport}>Export</button>
        <button className="hk-btn" onClick={handleImport}>Import</button>
        <button className="hk-btn" onClick={handleExportReference}>Export Reference</button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileImport}
        />
      </div>

      {error && <div className="hk-error">{error}</div>}

      {/* Two-column body */}
      <div className="hk-body">
        {/* Bindings List (left) */}
        <div className="hk-bindings">
          <div className="hk-bindings-header">
            <span className="hk-bindings-title">Bindings</span>
            <button className="hk-btn hk-btn--accent" onClick={handleAddNew}>+ Add</button>
          </div>
          <div className="hk-bindings-list">
            {bindings.map((b) => (
              <div
                key={b.id}
                className={`hk-binding-row ${selectedId === b.id ? 'hk-binding-row--selected' : ''}`}
                onClick={() => handleSelect(b.id)}
              >
                <input
                  type="checkbox"
                  className="hk-binding-check"
                  checked={b.active}
                  onChange={() => handleToggleActive(b.id, b.active)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="hk-binding-key">{b.key}</span>
                <span className="hk-binding-label">{b.label}</span>
                <button
                  className="hk-binding-delete"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(b.id)
                  }}
                  title="Delete"
                >
                  ×
                </button>
              </div>
            ))}
            {bindings.length === 0 && (
              <div className="hk-empty">No bindings. Click + Add to create one.</div>
            )}
          </div>
        </div>

        {/* Script Editor (right) */}
        <div className="hk-editor">
          <div className="hk-editor-title">
            {selectedId ? 'Edit Binding' : 'New Binding'}
          </div>

          {/* Key combo input */}
          <label className="hk-field-label">Key Combo</label>
          <div
            ref={keyInputRef}
            className={`hk-key-input ${capturing ? 'hk-key-input--capturing' : ''}`}
            tabIndex={0}
            onClick={() => setCapturing(true)}
            onKeyDown={handleKeyCapture}
            onBlur={() => setCapturing(false)}
          >
            {capturing ? 'Press keys...' : editorKey || 'Click to set key combo'}
          </div>
          {keyConflict && <div className="hk-warning">{keyConflict}</div>}

          {/* Label */}
          <label className="hk-field-label">Label</label>
          <input
            type="text"
            className="hk-text-input"
            placeholder="Descriptive name (optional)"
            value={editorLabel}
            onChange={(e) => setEditorLabel(e.target.value)}
          />

          {/* Script */}
          <label className="hk-field-label">Script</label>
          <textarea
            className="hk-script-input"
            placeholder="e.g. Buy=Route:LIMIT Price=Ask+0.05 Share=100 TIF=DAY"
            value={editorScript}
            onChange={(e) => setEditorScript(e.target.value)}
            spellCheck={false}
          />
          {validation && (
            <div className={`hk-validation ${validation.valid ? 'hk-validation--ok' : 'hk-validation--err'}`}>
              {validation.valid
                ? 'Script valid'
                : validation.errors.map((err, i) => <div key={i}>{err}</div>)}
            </div>
          )}

          {/* Category */}
          <label className="hk-field-label">Category</label>
          <select
            className="hk-category-select"
            value={editorCategory}
            onChange={(e) => setEditorCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>

          <button
            className="hk-btn hk-btn--accent hk-save-btn"
            onClick={handleSave}
            disabled={!editorKey || !editorScript || (validation && !validation.valid)}
          >
            {selectedId ? 'Update Binding' : 'Add Binding'}
          </button>
        </div>
      </div>

      {/* Order Templates Section */}
      <div className="hk-templates">
        <div className="hk-bindings-header">
          <span className="hk-bindings-title">Order Templates</span>
          <button className="hk-btn hk-btn--accent" onClick={clearTemplateEditor}>+ Add</button>
        </div>
        <div className="hk-templates-list">
          {templates.map((t) => (
            <div
              key={t.id}
              className={`hk-binding-row${editingTemplate === t.id ? ' hk-binding-row--selected' : ''}`}
              onClick={() => handleEditTemplate(t)}
            >
              <span className="hk-binding-key">{t.size}</span>
              <span className="hk-binding-label">{t.name}</span>
              <span className="hk-tpl-meta">{t.orderType} / {t.timeInForce}</span>
              <button
                className="hk-binding-delete"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteTemplate(t.id)
                }}
                title="Delete"
              >
                ×
              </button>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="hk-empty">No templates. Click + Add to create one.</div>
          )}
        </div>
        {/* Inline template editor */}
        <div className="hk-tpl-editor">
          <input
            type="text"
            className="hk-text-input"
            placeholder="Template name"
            value={tplName}
            onChange={(e) => setTplName(e.target.value)}
          />
          <div className="hk-tpl-fields">
            <label className="hk-field-label">Size</label>
            <input
              type="number"
              className="hk-text-input hk-tpl-size-input"
              min="1"
              value={tplSize}
              onChange={(e) => setTplSize(Math.max(1, Math.round(Number(e.target.value))))}
            />
            <label className="hk-field-label">Type</label>
            <select
              className="hk-category-select"
              value={tplType}
              onChange={(e) => setTplType(e.target.value)}
            >
              <option value="limit">Limit</option>
              <option value="market">Market</option>
            </select>
            <label className="hk-field-label">TIF</label>
            <select
              className="hk-category-select"
              value={tplTif}
              onChange={(e) => setTplTif(e.target.value)}
            >
              <option value="gtc">GTC</option>
              <option value="ioc">IOC</option>
              <option value="day">DAY</option>
            </select>
          </div>
          <button
            className="hk-btn hk-btn--accent"
            onClick={handleSaveTemplate}
            disabled={!tplName.trim()}
          >
            {editingTemplate ? 'Update Template' : 'Add Template'}
          </button>
        </div>
      </div>

      {/* Help Panel (bottom, collapsible) */}
      <div className={`hk-help ${helpOpen ? 'hk-help--open' : ''}`}>
        <div className="hk-help-header" onClick={() => setHelpOpen(!helpOpen)}>
          <span>Command Reference</span>
          <span className="hk-help-toggle">{helpOpen ? '\u25BC' : '\u25B6'}</span>
        </div>
        {helpOpen && (
          <div className="hk-help-body">
            <h4 className="hk-help-section-title">Commands</h4>
            {COMMAND_REFERENCE.commands.map((cmd) => (
              <div key={cmd.name} className="hk-help-cmd">
                <div className="hk-help-cmd-name">{cmd.name}</div>
                <div className="hk-help-cmd-syntax">{cmd.syntax}</div>
                <div className="hk-help-cmd-desc">{cmd.description}</div>
                {cmd.examples.length > 0 && (
                  <div className="hk-help-cmd-examples">
                    {cmd.examples.map((ex, i) => (
                      <code key={i} className="hk-help-example">{ex}</code>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <h4 className="hk-help-section-title">Variables</h4>
            <div className="hk-help-vars">
              {COMMAND_REFERENCE.variables.map((v) => (
                <div key={v.name} className="hk-help-var">
                  <code className="hk-help-var-name">{v.name}</code>
                  <span className="hk-help-var-desc">{v.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HotkeyManager
