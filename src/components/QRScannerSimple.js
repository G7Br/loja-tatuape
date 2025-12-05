import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function QRScannerSimple({ onScan, onClose, isOpen }) {
  const { darkMode } = useTheme();
  const [hasPermission, setHasPermission] = useState(null);
  const [error, setError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment'
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
        };
        setHasPermission(true);
        setError('');
      }
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      setError('Erro ao acessar a câmera. Você pode digitar o código manualmente.');
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
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
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: darkMode ? '#1a1a1a' : '#ffffff',
        borderRadius: '12px',
        padding: '1.5rem',
        maxWidth: '90vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          marginBottom: '1rem'
        }}>
          <h3 style={{
            margin: 0,
            color: darkMode ? '#ffffff' : '#000000',
            fontSize: '1.2rem'
          }}>
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

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            color: '#dc2626',
            textAlign: 'center',
            width: '100%'
          }}>
            {error}
          </div>
        )}

        {hasPermission === null && (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: darkMode ? '#888' : '#666'
          }}>
            Solicitando permissão da câmera...
          </div>
        )}

        {hasPermission && (
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <video
              ref={videoRef}
              style={{
                width: '300px',
                height: '300px',
                objectFit: 'cover',
                borderRadius: '8px',
                backgroundColor: '#000'
              }}
              playsInline
              muted
              autoPlay
            />
            
            {/* Overlay de mira */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '200px',
              height: '200px',
              border: '2px solid #3b82f6',
              borderRadius: '8px',
              pointerEvents: 'none'
            }}>
              <div style={{
                position: 'absolute',
                top: '-2px',
                left: '-2px',
                width: '20px',
                height: '20px',
                borderTop: '4px solid #3b82f6',
                borderLeft: '4px solid #3b82f6'
              }} />
              <div style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '20px',
                height: '20px',
                borderTop: '4px solid #3b82f6',
                borderRight: '4px solid #3b82f6'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-2px',
                left: '-2px',
                width: '20px',
                height: '20px',
                borderBottom: '4px solid #3b82f6',
                borderLeft: '4px solid #3b82f6'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '20px',
                height: '20px',
                borderBottom: '4px solid #3b82f6',
                borderRight: '4px solid #3b82f6'
              }} />
            </div>
          </div>
        )}

        {/* Input manual para código */}
        <div style={{ width: '100%' }}>
          <p style={{
            textAlign: 'center',
            color: darkMode ? '#888' : '#666',
            fontSize: '0.9rem',
            marginBottom: '1rem'
          }}>
            {hasPermission ? 
              'Aponte a câmera para o QR code ou digite o código manualmente:' : 
              'Digite o código do produto:'
            }
          </p>
          
          <form onSubmit={handleManualSubmit} style={{ width: '100%' }}>
            <input
              type="text"
              placeholder="Digite o código do produto"
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
                background: manualCode.trim() ? '#3b82f6' : '#666',
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

        {hasPermission === false && (
          <button
            onClick={startCamera}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Tentar câmera novamente
          </button>
        )}
      </div>
    </div>
  );
}