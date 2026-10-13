import { useState, useEffect } from 'react';
import AppRoutes from "./routes/AppRoutes";
import { LoadingScreen } from './components/ui/LoadingScreen';
import WhatsAppButton from './components/whatsapp/WhatsAppButton';

function App() {
  const [showLoading, setShowLoading] = useState(true);
  const [hasShownLoading, setHasShownLoading] = useState(false);

  useEffect(() => {
    // Verificar si ya se mostró la pantalla de carga en esta sesión
    const loadingShown = sessionStorage.getItem('loadingShown');
    if (loadingShown === 'true') {
      setShowLoading(false);
      setHasShownLoading(true);
    }
  }, []);

  const handleLoadingComplete = () => {
    setShowLoading(false);
    setHasShownLoading(true);
    // Guardar que ya se mostró en esta sesión
    sessionStorage.setItem('loadingShown', 'true');
  };

  return (
    <>
      {showLoading && !hasShownLoading && (
        <LoadingScreen onLoadingComplete={handleLoadingComplete} />
      )}
      <AppRoutes />

      {/* Botón flotante de WhatsApp — visible en toda la web */}
      {!showLoading && <WhatsAppButton />}
    </>
  );
}

export default App;