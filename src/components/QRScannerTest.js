import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import jsQR from 'jsqr';

export default function QRScannerTest({ onScan, onClose, isOpen }) {
  const { darkMode } = useTheme();
  const [status, setStatus] = useState('Iniciando...');
  const [manualCode, setManualCode] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      initCamera();
    }
  }, [isOpen]);

  const initCamera = async () => {
    setStatus('Solicitando permissão...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }
      });
      setStatus('Câmera ativada!');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          startScanning();
        };
      }
    } catch (error) {
      setStatus(`Erro: ${error.message}`);
    }
  };

  const startScanning = () => {
    if (scanIntervalRef.current) return;
    
    scanIntervalRef.current = setInterval(() => {
      scanQRCode();
    }, 500);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        setStatus('QR Code detectado!');
        onScan(code.data);
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
          scanIntervalRef.current = null;
        }
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  };

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

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
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h3 style={{ margin: 0 }}>QR Scanner</h3>
          <button onClick={onClose} style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: darkMode ? '#ffffff' : '#000000'
          }}>
            ✕
          </button>
        </div>

        <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
          Status: {status}
        </div>

        <div style={{ 
          position: 'relative', 
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
              width: '300px',
              height: '300px',
              objectFit: 'cover',
              borderRadius: '8px',
              backgroundColor: '#000'
            }}
          />
          
          {/* Molde de mira */}
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
        
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <form onSubmit={handleSubmit}>
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
            style={{
              width: '100%',
              padding: '12px',
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
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