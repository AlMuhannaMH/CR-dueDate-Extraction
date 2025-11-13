import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import disables SSR to prevent server-side errors
const QRScanner = dynamic(
  () => import('@yudiel/react-qr-scanner').then((mod) => mod.default ?? mod),
  { ssr: false }
);

// Simple error boundary to catch client runtime errors
class ErrorBoundary extends React.Component {
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

export default function Home() {
  const [ocrText, setOcrText] = useState('');
  const [expiry, setExpiry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQr = (result) => {
    if (result) window.open(result, '_blank');
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    setOcrText('');
    setExpiry('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', 'ara');
      formData.append('isOverlayRequired', 'false');
      formData.append('apikey', 'K89620932088957'); // Your OCR.Space key

      const res = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      const text = data?.ParsedResults?.[0]?.ParsedText || '';
      if (!text) throw new Error('No text found. Check image quality and format.');
      setOcrText(text);

      const regex = /وتنتهي صلاحية الشهاد(?:ة|ات) في[:\s]*([\d\/\-]+)/;
      const match = text.match(regex);
      setExpiry(match ? match[1] : 'Not found');
    } catch (err) {
      setError('OCR failed: ' + (err.message || err));
      setOcrText('');
      setExpiry('');
    }
    setLoading(false);
  };

  return (
    <ErrorBoundary>
      <div style={{ maxWidth: 550, margin: 'auto', padding: 20 }}>
        <h2>Saudi CR Certificate Parser &amp; QR Scanner MVP</h2>
        <h4>Step 1: Scan CR QR Code (opens Ministry verification link)</h4>
        <QRScanner onScan={handleQr} />
        <hr />
        <h4>Step 2: Upload CR Certificate Image</h4>
        <input type="file" accept="image/*,.pdf" onChange={handleUpload} disabled={loading} />
        {loading && <div>Processing image, please wait...</div>}
        {error && (
          <div style={{ color: '#900', marginTop: 12 }}>{error}</div>
        )}
        {ocrText && (
          <div>
            <h4>Extracted Text</h4>
            <pre style={{ background: '#f4f4f4', padding: 12, borderRadius: 6 }}>{ocrText}</pre>
            <h4>Extracted Expiry</h4>
            <div style={{ fontSize: 18, color: expiry !== 'Not found' ? '#098' : '#900' }}>{expiry}</div>
          </div>
        )}
        <footer style={{ marginTop: 30, fontSize: 13, color: '#888', textAlign: 'center' }}>
          MVP by Perplexity AI — All cloud, no local env required.
        </footer>
      </div>
    </ErrorBoundary>
  );
}
