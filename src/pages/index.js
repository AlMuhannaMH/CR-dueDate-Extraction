import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Dynamic, SSR-disabled import for browser-only QRScanner
const QRScanner = dynamic(
  () => import('@yudiel/react-qr-scanner'),
  { ssr: false }
);

export default function Home() {
  const [ocrText, setOcrText] = useState('');
  const [expiry, setExpiry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle QR code scan (opens Ministry CR verification link)
  const handleQr = (result) => {
    try {
      if (result) window.open(result, '_blank');
    } catch (err) {
      setError('QR Scan failed: ' + (err.message || err));
    }
  };

  // Handle CR certificate image upload
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
