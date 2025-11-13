import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message || 'Unknown error' };
  }
  componentDidCatch(error, info) {
    console.error('Client-side exception:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: '#900', padding: 20 }}>
          <h3>Something went wrong</h3>
          <p>{this.state.errorMessage}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
