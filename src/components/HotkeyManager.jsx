import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  getAllBindings,
  addBinding,
  updateBinding,
  removeBinding,
  getProfiles,
  saveProfile,
  loadProfile,
  exportProfile,
  importProfile,
  subscribe,
  normalizeKeyCombo,
} from '../services/hotkeyStore'
import { validateScript, COMMAND_REFERENCE } from '../services/hotkeyLanguage'
import './HotkeyManager.css'

const CATEGORIES = ['trading', 'navigation', 'scanner', 'custom']

function HotkeyManager() {
  const [bindings, setBindings] = useState(() => getAllBindings())
  const [profiles, setProfiles] = useState(() => getProfiles())
  const [activeProfileName, setActiveProfileName] = useState('Default')
  const [selectedId, setSelectedId] = useState(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [error, setError] = useState(null)

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

  // Subscribe to store changes
  useEffect(() => {
    return subscribe(() => {
      setBindings(getAllBindings())
      setProfiles(getProfiles())
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

  // STUB: Hotkey documentation export — generate printable reference card
  // SOURCE: Internal — getAllBindings() data
  // IMPLEMENT WHEN: Users request printable hotkey reference
  // STEPS:
  //   1. Group bindings by category
  //   2. Generate HTML table with key combo, label, script columns
  //   3. Open in new window with print-friendly CSS
  //   4. Add "Print" button that calls window.print()

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
