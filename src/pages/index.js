import React, { useState } from 'react';
import { QRScanner } from '@yudiel/react-qr-scanner';

export default function Home() {
  const [ocrText, setOcrText] = useState('');
  const [expiry, setExpiry] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle QR code scan (for Ministry CR verification)
  const handleQr = (result) => {
    if (result) {
      window.open(result, '_blank');
    }
  };

  // Handle file/image upload
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', 'ara');
    formData.append('isOverlayRequired', 'false');
    formData.append('apikey', 'K89620932088957'); // Replace by your OCR.Space API Key (get free at https://ocr.space/ocrapi)

    const res = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    const text = data?.ParsedResults?.[0]?.ParsedText || '';
    setOcrText(text);

    // Extract expiry with regex
    const regex = /وتنتهي صلاحية الشهاد(?:ة|ات) في[:\s]*([\d\/\-]+)/;
    const match = text.match(regex);
    setExpiry(match ? match[1] : 'Not found');
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 550, margin: 'auto', padding: 20 }}>
      <h2>Saudi CR Certificate Parser &amp; QR Scanner MVP</h2>
      <h4>Step 1: Scan CR QR Code (opens Ministry verification link)</h4>
      <QRScanner onScan={handleQr} />
      <hr />
      <h4>Step 2: Upload CR Certificate Image</h4>
      <input type="file" accept="image/*,.pdf" onChange={handleUpload} disabled={loading} />
      {loading && <div>Processing image, please wait...</div>}
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
  );
}
