import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, getRole } from '../utils/token';
import { getUserProfile } from '../api/user';

/**
 * Hook para proteger rutas según el rol del usuario
 * Redirige a admins que intenten acceder a rutas de compra
 */
export function useRoleProtection(protectedRoute: 'products' | 'cart' | 'checkout' | 'payment') {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      const token = getToken();
      
      // Si no hay token, permitir acceso (el usuario no está logueado)
      if (!token) {
        return;
      }

      // Obtener rol
      let userRole = getRole();
      
      // Si no hay rol en localStorage, obtenerlo del backend
      if (!userRole) {
        try {
          const profile = await getUserProfile();
          userRole = profile.role || 'CLIENTE';
        } catch (error) {
          console.error('Error al obtener perfil:', error);
          return;
        }
      }

      // Si es admin, redirigir a su perfil
      if (userRole === 'ADMINISTRADOR') {
        navigate('/admin-profile', { replace: true });
      }
    };

    checkAccess();
  }, [navigate, protectedRoute]);
}
