import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import jsQR from 'jsqr';

export default function QRScanner({ onScan, onClose, isOpen }) {
  const { darkMode } = useTheme();
  const [hasPermission, setHasPermission] = useState(null);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

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
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setHasPermission(true);
        startScanning();
      }
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      setError('Erro ao acessar a câmera. Verifique as permissões.');
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
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
        onScan(code.data);
        stopCamera();
      }
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
      justifyContent: 'center'
    }}>
      <div style={{
        background: darkMode ? '#1a1a1a' : '#ffffff',
        borderRadius: '12px',
        padding: '1.5rem',
        maxWidth: '90vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
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
            textAlign: 'center'
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

        {hasPermission === false && (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: darkMode ? '#888' : '#666'
          }}>
            <p>Permissão da câmera negada.</p>
            <button
              onClick={startCamera}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {hasPermission && (
          <div style={{ position: 'relative' }}>
            <video
              ref={videoRef}
              style={{
                width: '300px',
                height: '300px',
                objectFit: 'cover',
                borderRadius: '8px'
              }}
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
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

        <p style={{
          marginTop: '1rem',
          textAlign: 'center',
          color: darkMode ? '#888' : '#666',
          fontSize: '0.9rem'
        }}>
          Aponte a câmera para o QR code do produto
        </p>
      </div>
    </div>
  );
}