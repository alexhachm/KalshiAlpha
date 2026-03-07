import React, { useMemo } from 'react'
import { GripVertical, Plus, Trash2, RotateCcw } from 'lucide-react'
import './GridSettingsPanel.css'

const FONT_SIZES = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
]

const OPERATORS = ['>', '<', '>=', '<=', '==', '!=']

/**
 * Reusable grid settings sub-panel.
 * Renders inside a parent settings overlay/panel.
 *
 * Props: all grid state/handlers from useGridCustomization + columnDefs (optional label override).
 */
function GridSettingsPanel({
  columns,
  toggleColumn,
  resetColumns,
  fontSize,
  setFontSize,
  rowHeight,
  setRowHeight,
  bgColor,
  setBgColor,
  textColor,
  setTextColor,
  colorRules,
  addColorRule,
  removeColorRule,
  updateColorRule,
  dragState,
  onDragStart,
  onDragOver,
  onDragEnd,
}) {
  const numericColumns = useMemo(() => columns.filter((c) => c.numeric), [columns])

  return (
    <div className="grid-settings">
      {/* --- Columns Section --- */}
      <div className="gs-section">
        <div className="gs-section-header">
          <span className="gs-section-title">Columns</span>
          <button className="gs-reset-btn" onClick={resetColumns} title="Reset column order & visibility">
            <RotateCcw size={12} />
          </button>
        </div>
        <div className="gs-column-list">
          {columns.map((col, idx) => {
            const isDragging = dragState.dragging && dragState.dragIndex === idx
            const isOver = dragState.dragging && dragState.overIndex === idx
            return (
              <div
                key={col.key}
                className={`gs-column-item${isDragging ? ' gs-column-dragging' : ''}${isOver ? ' gs-column-over' : ''}`}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragOver={(e) => { e.preventDefault(); onDragOver(idx) }}
                onDragEnd={onDragEnd}
              >
                <span className="gs-drag-handle"><GripVertical size={12} /></span>
                <label className="gs-column-label">
                  <input
                    type="checkbox"
                    className="gs-checkbox"
                    checked={col.visible}
                    onChange={() => toggleColumn(col.key)}
                  />
                  {col.label}
                </label>
              </div>
            )
          })}
        </div>
      </div>

      {/* --- Appearance Section --- */}
      <div className="gs-section">
        <span className="gs-section-title">Appearance</span>
        <div className="gs-row">
          <span className="gs-label">Font size</span>
          <select
            className="gs-select"
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
          >
            {FONT_SIZES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="gs-row">
          <span className="gs-label">Row height</span>
          <div className="gs-slider-row">
            <input
              type="range"
              className="gs-slider"
              min={18}
              max={40}
              value={rowHeight}
              onChange={(e) => setRowHeight(Number(e.target.value))}
            />
            <span className="gs-slider-value">{rowHeight}px</span>
          </div>
        </div>
        <div className="gs-row">
          <span className="gs-label">Background</span>
          <div className="gs-color-row">
            <input
              type="color"
              className="gs-color-picker"
              value={bgColor || '#1e1e1e'}
              onChange={(e) => setBgColor(e.target.value)}
              aria-label="Grid background color"
            />
            {bgColor && (
              <button className="gs-clear-color" onClick={() => setBgColor('')} title="Clear">
                &times;
              </button>
            )}
          </div>
        </div>
        <div className="gs-row">
          <span className="gs-label">Text color</span>
          <div className="gs-color-row">
            <input
              type="color"
              className="gs-color-picker"
              value={textColor || '#e0e0e0'}
              onChange={(e) => setTextColor(e.target.value)}
              aria-label="Grid text color"
            />
            {textColor && (
              <button className="gs-clear-color" onClick={() => setTextColor('')} title="Clear">
                &times;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- Conditional Formatting Section --- */}
      <div className="gs-section">
        <div className="gs-section-header">
          <span className="gs-section-title">Conditional Formatting</span>
          <button className="gs-add-rule-btn" onClick={addColorRule} title="Add rule">
            <Plus size={12} /> Add Rule
          </button>
        </div>
        {colorRules.length === 0 && (
          <div className="gs-empty-rules">No rules. Click "Add Rule" to highlight rows based on column values.</div>
        )}
        {colorRules.map((rule) => (
          <div key={rule.id} className="gs-rule">
            <select
              className="gs-select gs-rule-col"
              value={rule.column}
              onChange={(e) => updateColorRule(rule.id, { column: e.target.value })}
            >
              <option value="">Column...</option>
              {numericColumns.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
            <select
              className="gs-select gs-rule-op"
              value={rule.operator}
              onChange={(e) => updateColorRule(rule.id, { operator: e.target.value })}
            >
              {OPERATORS.map((op) => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
            <input
              type="number"
              className="gs-rule-value"
              value={rule.value}
              onChange={(e) => updateColorRule(rule.id, { value: e.target.value })}
              placeholder="0"
            />
            <input
              type="color"
              className="gs-color-picker gs-rule-color"
              value={rule.bgColor || '#1e1e1e'}
              onChange={(e) => updateColorRule(rule.id, { bgColor: e.target.value })}
              title="Row background"
            />
            <input
              type="color"
              className="gs-color-picker gs-rule-color"
              value={rule.textColor || '#e0e0e0'}
              onChange={(e) => updateColorRule(rule.id, { textColor: e.target.value })}
              title="Text color"
            />
            <button className="gs-remove-rule" onClick={() => removeColorRule(rule.id)} title="Remove rule">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default React.memo(GridSettingsPanel)
