import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', this.props.componentName, error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const { componentName } = this.props
      const message = this.state.error?.message || String(this.state.error)
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: '8px',
          padding: '16px',
          color: 'var(--color-text-muted, #888)',
          fontSize: '12px',
          textAlign: 'center',
        }}>
          <div style={{ fontWeight: 600, color: 'var(--color-text, #ccc)' }}>
            Panel crashed — click to reload
          </div>
          {componentName && (
            <div style={{ opacity: 0.7 }}>{componentName}</div>
          )}
          <div style={{
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            opacity: 0.6,
            fontFamily: 'monospace',
          }}>
            {message}
          </div>
          <button
            onClick={this.handleRetry}
            style={{
              marginTop: '8px',
              padding: '4px 12px',
              cursor: 'pointer',
              background: 'var(--color-surface-2, #2a2a2a)',
              border: '1px solid var(--color-border, #444)',
              borderRadius: '4px',
              color: 'var(--color-text, #ccc)',
              fontSize: '11px',
            }}
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
