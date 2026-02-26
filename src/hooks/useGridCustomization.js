// Shared hook for grid column visibility, ordering, resizing, appearance, and conditional formatting.
// Persists to localStorage under key `gridCustom_${toolId}`.

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

const LS_PREFIX = 'gridCustom_';
const SAVE_DEBOUNCE_MS = 300;

function loadState(toolId, defaultColumns) {
  const key = LS_PREFIX + toolId;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const saved = JSON.parse(raw);
      // Merge saved columns with defaults — preserve saved order/visibility but add any new columns
      const savedKeys = new Set((saved.columns || []).map((c) => c.key));
      const merged = (saved.columns || []).map((sc) => {
        const def = defaultColumns.find((d) => d.key === sc.key);
        return def ? { ...def, ...sc } : sc;
      });
      // Append any new default columns not in saved state
      defaultColumns.forEach((d) => {
        if (!savedKeys.has(d.key)) {
          merged.push({ ...d, visible: true, width: undefined });
        }
      });
      return {
        columns: merged,
        fontSize: saved.fontSize || 'medium',
        rowHeight: saved.rowHeight || 24,
        bgColor: saved.bgColor || '',
        textColor: saved.textColor || '',
        colorRules: saved.colorRules || [],
      };
    }
  } catch { /* ignore corrupt data */ }

  return {
    columns: defaultColumns.map((c) => ({ ...c, visible: true, width: undefined })),
    fontSize: 'medium',
    rowHeight: 24,
    bgColor: '',
    textColor: '',
    colorRules: [],
  };
}

let _ruleIdCounter = Date.now();
function nextRuleId() {
  return String(++_ruleIdCounter);
}

/**
 * Grid customization hook.
 *
 * @param {string} toolId - Unique tool/window identifier for localStorage scoping
 * @param {Array<{key:string, label:string, align?:string, numeric?:boolean}>} defaultColumns
 * @returns Grid customization state and handlers
 */
export function useGridCustomization(toolId, defaultColumns) {
  const [state, setState] = useState(() => loadState(toolId, defaultColumns));
  const [dragState, setDragState] = useState({ dragging: false, dragIndex: -1, overIndex: -1 });
  const saveTimerRef = useRef(null);

  // Debounced save to localStorage
  useEffect(() => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(LS_PREFIX + toolId, JSON.stringify(state));
      } catch { /* ignore */ }
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(saveTimerRef.current);
  }, [toolId, state]);

  // --- Column handlers ---

  const toggleColumn = useCallback((key) => {
    setState((prev) => ({
      ...prev,
      columns: prev.columns.map((c) =>
        c.key === key ? { ...c, visible: !c.visible } : c
      ),
    }));
  }, []);

  const reorderColumns = useCallback((fromIndex, toIndex) => {
    setState((prev) => {
      const cols = [...prev.columns];
      const [moved] = cols.splice(fromIndex, 1);
      cols.splice(toIndex, 0, moved);
      return { ...prev, columns: cols };
    });
  }, []);

  const resizeColumn = useCallback((key, width) => {
    setState((prev) => ({
      ...prev,
      columns: prev.columns.map((c) =>
        c.key === key ? { ...c, width } : c
      ),
    }));
  }, []);

  const resetColumns = useCallback(() => {
    setState((prev) => ({
      ...prev,
      columns: defaultColumns.map((c) => ({ ...c, visible: true, width: undefined })),
    }));
  }, [defaultColumns]);

  // --- Appearance handlers ---

  const setFontSize = useCallback((fontSize) => {
    setState((prev) => ({ ...prev, fontSize }));
  }, []);

  const setRowHeight = useCallback((rowHeight) => {
    setState((prev) => ({ ...prev, rowHeight }));
  }, []);

  const setBgColor = useCallback((bgColor) => {
    setState((prev) => ({ ...prev, bgColor }));
  }, []);

  const setTextColor = useCallback((textColor) => {
    setState((prev) => ({ ...prev, textColor }));
  }, []);

  // --- Conditional formatting handlers ---

  const addColorRule = useCallback(() => {
    setState((prev) => ({
      ...prev,
      colorRules: [
        ...prev.colorRules,
        { id: nextRuleId(), column: '', operator: '>', value: '', bgColor: '', textColor: '' },
      ],
    }));
  }, []);

  const removeColorRule = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      colorRules: prev.colorRules.filter((r) => r.id !== id),
    }));
  }, []);

  const updateColorRule = useCallback((id, updates) => {
    setState((prev) => ({
      ...prev,
      colorRules: prev.colorRules.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    }));
  }, []);

  // --- Drag handlers ---

  const onDragStart = useCallback((index) => {
    setDragState({ dragging: true, dragIndex: index, overIndex: index });
  }, []);

  const onDragOver = useCallback((index) => {
    setDragState((prev) => (prev.dragging ? { ...prev, overIndex: index } : prev));
  }, []);

  const onDragEnd = useCallback(() => {
    setDragState((prev) => {
      if (prev.dragging && prev.dragIndex !== prev.overIndex) {
        // Trigger reorder
        setState((s) => {
          const cols = [...s.columns];
          const [moved] = cols.splice(prev.dragIndex, 1);
          cols.splice(prev.overIndex, 0, moved);
          return { ...s, columns: cols };
        });
      }
      return { dragging: false, dragIndex: -1, overIndex: -1 };
    });
  }, []);

  // --- Derived values ---

  const visibleColumns = useMemo(
    () => state.columns.filter((c) => c.visible),
    [state.columns]
  );

  const getRowStyle = useCallback(
    (rowData) => {
      const style = {};

      // Apply base colors
      if (state.bgColor) style.backgroundColor = state.bgColor;
      if (state.textColor) style.color = state.textColor;

      // Apply conditional formatting rules (last matching rule wins)
      for (const rule of state.colorRules) {
        if (!rule.column || rule.value === '' || !rule.operator) continue;
        const cellVal = Number(rowData[rule.column]);
        const ruleVal = Number(rule.value);
        if (isNaN(cellVal) || isNaN(ruleVal)) continue;

        let match = false;
        switch (rule.operator) {
          case '>': match = cellVal > ruleVal; break;
          case '<': match = cellVal < ruleVal; break;
          case '>=': match = cellVal >= ruleVal; break;
          case '<=': match = cellVal <= ruleVal; break;
          case '==': match = cellVal === ruleVal; break;
          case '!=': match = cellVal !== ruleVal; break;
        }

        if (match) {
          if (rule.bgColor) style.backgroundColor = rule.bgColor;
          if (rule.textColor) style.color = rule.textColor;
        }
      }

      return Object.keys(style).length > 0 ? style : undefined;
    },
    [state.bgColor, state.textColor, state.colorRules]
  );

  return {
    // Column state
    columns: state.columns,
    toggleColumn,
    reorderColumns,
    resizeColumn,
    resetColumns,

    // Appearance
    fontSize: state.fontSize,
    setFontSize,
    rowHeight: state.rowHeight,
    setRowHeight,
    bgColor: state.bgColor,
    setBgColor,
    textColor: state.textColor,
    setTextColor,

    // Conditional formatting
    colorRules: state.colorRules,
    addColorRule,
    removeColorRule,
    updateColorRule,

    // Drag
    dragState,
    onDragStart,
    onDragOver,
    onDragEnd,

    // Derived
    visibleColumns,
    getRowStyle,
  };
}
