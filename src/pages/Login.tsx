import { Input } from "../components/ui/Input";
import { ButtonState } from "../components/ui/ButtonState";
import { useEffect, useState } from "react";
import { loginUser } from "../api/auth";
import { clearToken, consumeAuthMessage, saveRole, saveToken } from "../utils/token";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import ButtonShowPsd from "../components/ui/ButtonShowPwd";

export function Login() {

  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [verContra,setVerContra]=useState(false)

  useEffect(() => {
    const authMessage = consumeAuthMessage();
    if (authMessage) {
      setError(authMessage);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await loginUser({ email: correo, password: clave});
      // res: { token, role }
      clearToken();
      saveToken(res.token);
      saveRole(res.role);
      if (res.role === "ADMINISTRADOR") {
        navigate("/admin-profile");
      } else {
        navigate("/");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error al iniciar sesión");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
  const isPasswordMatch = clave.length >= 8;
  const isFormValid = isEmailValid && isPasswordMatch;

  return (
    <>
    <Navbar/>
    <main className="min-h-screen bg-gradient-to-br from-[var(--Primary_0)] via-[var(--Primary_1)] to-[var(--Primary_2)] flex flex-col justify-center items-center relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-[var(--Primary_3)] rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[var(--Primary_4)] rounded-full opacity-15 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--Primary_2)] rounded-full opacity-10 blur-2xl"></div>
      </div>

      {/* Contenedor principal del formulario */}
      <div className="relative z-10 w-full max-w-md mx-8 sm:mx-6 md:mx-4">
        <div className="bg-white/90 backdrop-blur-sm shadow-2xl border border-white/20 rounded-2xl p-6 sm:p-8 md:p-10">
          {/* Header con logo */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <img 
                src="/assets/imgs/logo.webp" 
                className="h-20 w-auto mx-auto drop-shadow-lg" 
                alt="Hurios Rally Logo" 
              />
            </div>
            <h1 className="text-2xl font-bold text-[var(--Primary_7)] mb-2">
              Bienvenido de vuelta
            </h1>
            <p className="text-[var(--Primary_5)] text-sm">
              Inicia sesión en tu cuenta
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selección de rol */}
            
              <div className="space-y-4">
                <div className="space-y-4">
                  <Input 
                    label="Correo electrónico" 
                    type="email" 
                    placeholder="ejemplo@gmail.com" 
                    onChange={(e) => setCorreo(e.target.value)} 
                  />
                  <Input
                    label="Contraseña"
                    type={verContra ? "text" : "password"}
                    placeholder="********"
                    onChange={(e) => setClave(e.target.value)}
                    rightIcon={
                      <ButtonShowPsd
                        onClick={() => setVerContra(prev => !prev)}
                        aria-label={verContra ? "Ocultar contraseña" : "Ver contraseña"}
                        className="bg-transparent border-0 cursor-pointer text-inherit p-0 flex items-center"
                        >
                        <span className="material-symbols-outlined"  translate="no">
                          {verContra ? "visibility" : "visibility_off"}
                        </span>
                      </ButtonShowPsd>
                    }
                  />
                </div>

                {/* Error message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Botón principal */}
                <div className="space-y-4">
      <ButtonState 
        initialText="Iniciar sesión" 
        successText="¡Ingreso exitoso!" 
        loadingText="Verificando..."
        disabled={!isFormValid || isSubmitting} 
        clicked={isSubmitting} 
      />

  {/* Crear cuenta - color más notorio */}
  <a 
    href="/register" 
    className="block w-full text-center bg-orange-500 text-white py-3 rounded-lg cursor-pointer hover:bg-orange-600 transition-all duration-300 font-semibold shadow-md"
  >
    Crear cuenta nueva
  </a>
</div>

                {/* Enlace de recuperación */}
                <div className="text-center">
                  <Link 
                    to="/reset-password" 
                    className="text-[var(--Primary_5)] hover:text-[var(--Primary_6)] text-sm font-medium transition-colors duration-200 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </div>
            
          </form>
        </div>

        {/* Footer decorativo */}
        <div className="text-center mt-8">
          <p className="text-[var(--Primary_5)] text-sm">
            Repuestos y accesorios de calidad
          </p>
        </div>
      </div>
    </main>
    </>
  );
}


