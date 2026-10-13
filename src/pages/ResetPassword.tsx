import React, { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../api/auth";
import Navbar from "../components/layout/Navbar";

/*
 ResetPassword.tsx
 - Página para resetear la contraseña
*/

export const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await requestPasswordReset(email);
      if (data?.token) {
        setResetToken(data.token);
      }
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Error al enviar el enlace");
    } finally {
      setIsLoading(false);
    }
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-[var(--Primary_0)] to-[var(--Primary_2)] flex flex-col justify-center items-center relative overflow-hidden">
      {/* Elemento decorativo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[var(--Primary_3)] rounded-full opacity-15 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--Primary_4)] rounded-full opacity-10 blur-3xl"></div>
      </div>

      {/* Contenedor principal */}
      <div className="relative z-10 w-full max-w-md mx-8 sm:mx-6 md:mx-4">
        <div className="bg-white/85 backdrop-blur-sm shadow-xl border border-white/30 rounded-2xl p-8">
          
          {!isSubmitted ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[var(--Primary_4)] to-[var(--Primary_5)] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-[var(--Primary_7)] mb-2">
                  ¿Olvidaste tu contraseña?
                </h1>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--Primary_6)] mb-2">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@gmail.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--Primary_4)] focus:border-transparent transition-all duration-200 bg-white/90"
                    required
                  />
                </div>

                {/* Error message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!isEmailValid || isLoading}
                  className="w-full bg-gradient-to-r from-[var(--Primary_4)] to-[var(--Primary_5)] text-white py-3 px-4 rounded-lg font-medium hover:from-[var(--Primary_5)] hover:to-[var(--Primary_6)] transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Enviando...
                    </div>
                  ) : (
                    "Enviar enlace de recuperación"
                  )}
                </button>
              </form>

              {/* Enlace de regreso */}
              <div className="text-center mt-6">
                <a 
                  href="/login" 
                  className="text-[var(--Primary_5)] hover:text-[var(--Primary_6)] text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Volver al inicio de sesión
                </a>
              </div>
            </>
          ) : (
            /* Estado de Éxito */
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[var(--Primary_7)] mb-2">
                ¡Solicitud generada con éxito!
              </h2>
              <p className="text-[var(--Primary_5)] text-sm mb-6">
                Puedes restablecer tu contraseña directamente ahora mismo con el siguiente botón:
              </p>

              {resetToken && (
                <Link
                  to={`/new-password?token=${resetToken}&email=${encodeURIComponent(email)}`}
                  className="w-full mb-4 inline-block bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition duration-200 text-center"
                >
                  🔑 Restablecer mi contraseña ahora
                </Link>
              )}

              <div className="mt-3">
                <Link 
                  to="/login" 
                  className="inline-flex items-center text-[var(--Primary_5)] hover:text-[var(--Primary_6)] text-sm font-medium transition-colors duration-200"
                >
                  Volver al inicio de sesión
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
    </>
  );
};

