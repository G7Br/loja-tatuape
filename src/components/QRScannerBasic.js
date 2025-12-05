import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function QRScannerBasic({ onScan, onClose, isOpen }) {
  const { darkMode } = useTheme();
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const videoRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true
      });
      
      setStream(mediaStream);
      setError('');
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(console.error);
        };
      }
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      setError('Câmera não disponível. Use o campo manual.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: darkMode ? '#1a1a1a' : '#ffffff',
        borderRadius: '12px',
        padding: '1.5rem',
        width: '100%',
        maxWidth: '400px',
        color: darkMode ? '#ffffff' : '#000000'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
            📱 Scanner QR Code
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: darkMode ? '#ffffff' : '#000000'
            }}
          >
            ✕
          </button>
        </div>

        {/* Câmera */}
        {stream && (
          <div style={{ 
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '280px',
                height: '280px',
                objectFit: 'cover',
                borderRadius: '8px',
                border: '2px solid #3b82f6',
                backgroundColor: '#000'
              }}
            />
          </div>
        )}
        
        {/* Status */}
        {!stream && !error && (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: darkMode ? '#888' : '#666'
          }}>
            Iniciando câmera...
          </div>
        )}

        {/* Erro */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            color: '#dc2626',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Input Manual */}
        <form onSubmit={handleManualSubmit}>
          <p style={{
            textAlign: 'center',
            fontSize: '0.9rem',
            marginBottom: '1rem',
            color: darkMode ? '#888' : '#666'
          }}>
            {stream ? 'Aponte para o QR code ou digite o código:' : 'Digite o código do produto:'}
          </p>
          
          <input
            type="text"
            placeholder="Código do produto"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              background: darkMode ? '#2a2a2a' : '#f8f9fa',
              border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
              borderRadius: '8px',
              color: darkMode ? '#ffffff' : '#000000',
              fontSize: '16px',
              marginBottom: '1rem'
            }}
          />
          
          <button
            type="submit"
            disabled={!manualCode.trim()}
            style={{
              width: '100%',
              padding: '12px',
              background: manualCode.trim() ? '#10b981' : '#666',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: manualCode.trim() ? 'pointer' : 'not-allowed',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            Adicionar Produto
          </button>
        </form>
      </div>
    </div>
  );
}