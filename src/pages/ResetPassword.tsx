import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { requestPasswordReset, verifyResetCode, resetPassword } from "../api/auth";
import Navbar from "../components/layout/Navbar";

/*
 ResetPassword.tsx
 Flujo completo de recuperación por código de verificación de 6 dígitos:
 1. Ingresar correo -> envía código al correo personal
 2. Ingresar código de 6 dígitos -> verifica el código
 3. Crear nueva contraseña -> actualiza en la base de datos
 4. Éxito -> redirige al inicio de sesión
*/

type Step = "EMAIL" | "CODE" | "NEW_PASSWORD" | "SUCCESS";

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("EMAIL");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(null);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Paso 1: Enviar código al correo
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const data = await requestPasswordReset(email);
      if (data?.code) {
        setDemoCode(data.code);
      }
      setSuccessMsg(`Código enviado al correo ${email}. Revisa tu bandeja de entrada o spam.`);
      setStep("CODE");
    } catch (err: any) {
      setError(err.message || "Error al enviar el código de recuperación.");
    } finally {
      setIsLoading(false);
    }
  };

  // Paso 2: Validar código de 6 dígitos
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (cleanCode.length !== 6) {
      setError("El código debe tener exactamente 6 dígitos.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await verifyResetCode(email, cleanCode);
      setStep("NEW_PASSWORD");
    } catch (err: any) {
      setError(err.message || "Código incorrecto o expirado. Por favor, verifica el código recibido.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reenviar código
  const handleResendCode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await requestPasswordReset(email);
      if (data?.code) {
        setDemoCode(data.code);
      }
      setSuccessMsg("Se ha generado y reenviado un nuevo código a tu correo.");
    } catch (err: any) {
      setError(err.message || "Error al reenviar el código.");
    } finally {
      setIsLoading(false);
    }
  };

  // Paso 3: Guardar nueva contraseña
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(email, code.trim(), newPassword);
      setStep("SUCCESS");
      setTimeout(() => {
        navigate("/login");
      }, 3500);
    } catch (err: any) {
      setError(err.message || "Error al actualizar la contraseña.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-[var(--Primary_0)] to-[var(--Primary_2)] flex flex-col justify-center items-center relative overflow-hidden py-12">
        {/* Elemento decorativo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[var(--Primary_3)] rounded-full opacity-15 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--Primary_4)] rounded-full opacity-10 blur-3xl"></div>
        </div>

        {/* Contenedor principal */}
        <div className="relative z-10 w-full max-w-md mx-8 sm:mx-6 md:mx-4">
          <div className="bg-white/90 backdrop-blur-md shadow-2xl border border-white/40 rounded-2xl p-8">

            {/* Mensajes de error o éxito superior */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                <span className="text-base">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {successMsg && step === "CODE" && (
              <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                <span className="text-base">ℹ️</span>
                <span>{successMsg}</span>
              </div>
            )}

            {/* ================= PASO 1: ENVIAR CÓDIGO ================= */}
            {step === "EMAIL" && (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-[var(--Primary_4)] to-[var(--Primary_5)] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-[var(--Primary_7)] mb-2">
                    ¿Olvidaste tu contraseña?
                  </h1>
                  <p className="text-sm text-gray-600">
                    Ingresa tu correo registrado y te enviaremos un código de 6 dígitos para restablecerla.
                  </p>
                </div>

                <form onSubmit={handleSendCode} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[var(--Primary_6)] mb-2">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@huriosrally.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--Primary_4)] transition bg-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!isEmailValid || isLoading}
                    className="w-full bg-gradient-to-r from-[var(--Primary_4)] to-[var(--Primary_5)] text-white py-3 px-4 rounded-lg font-medium hover:from-[var(--Primary_5)] hover:to-[var(--Primary_6)] transition shadow-lg disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Enviando código...
                      </div>
                    ) : (
                      "Enviar código al correo"
                    )}
                  </button>
                </form>

                <div className="text-center mt-6">
                  <Link
                    to="/login"
                    className="text-[var(--Primary_5)] hover:text-[var(--Primary_6)] text-sm font-medium transition inline-flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Volver al inicio de sesión
                  </Link>
                </div>
              </>
            )}

            {/* ================= PASO 2: INGRESAR CÓDIGO ================= */}
            {step === "CODE" && (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-[var(--Primary_7)] mb-2">
                    Ingresa el código
                  </h1>
                  <p className="text-sm text-gray-600">
                    Revisa tu correo personal. Te enviamos un código de 6 dígitos a <b>{email}</b>.
                  </p>
                </div>

                {/* Código de ayuda para la prueba/demostración */}
                {demoCode && (
                  <div className="mb-6 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-center text-xs text-blue-900 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-gray-600">Código de verificación: </span>
                      <strong className="font-mono text-base text-blue-700 font-bold ml-1">{demoCode}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCode(demoCode)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition cursor-pointer text-xs"
                    >
                      Autocompletar
                    </button>
                  </div>
                )}

                <form onSubmit={handleVerifyCode} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[var(--Primary_6)] mb-2 text-center">
                      Código de 6 dígitos
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="w-full text-center text-3xl font-mono tracking-[0.5em] py-3 px-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={code.trim().length !== 6 || isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition shadow-lg disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Validando código...
                      </div>
                    ) : (
                      "Verificar código"
                    )}
                  </button>
                </form>

                <div className="flex justify-between items-center mt-6 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("EMAIL");
                      setError(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 transition"
                  >
                    ← Cambiar correo
                  </button>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="text-blue-600 hover:text-blue-800 font-medium transition"
                  >
                    Reenviar código
                  </button>
                </div>
              </>
            )}

            {/* ================= PASO 3: NUEVA CONTRASEÑA ================= */}
            {step === "NEW_PASSWORD" && (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-[var(--Primary_7)] mb-2">
                    Nueva contraseña
                  </h1>
                  <p className="text-sm text-gray-600">
                    Código verificado. Escribe tu nueva contraseña segura.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-[var(--Primary_6)] mb-1">
                      Nueva contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 text-sm"
                      >
                        {showPassword ? "Ocultar" : "Mostrar"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--Primary_6)] mb-1">
                      Confirmar nueva contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite la nueva contraseña"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 text-sm"
                      >
                        {showConfirmPassword ? "Ocultar" : "Mostrar"}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || newPassword.length < 8 || !confirmPassword}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-xl font-medium transition shadow-lg disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Guardando contraseña...
                      </div>
                    ) : (
                      "Restablecer contraseña"
                    )}
                  </button>
                </form>
              </>
            )}

            {/* ================= PASO 4: ÉXITO ================= */}
            {step === "SUCCESS" && (
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  ¡Contraseña actualizada!
                </h2>
                <p className="text-gray-600 text-sm mb-6">
                  Tu contraseña se ha restablecido correctamente. Ya puedes acceder a tu cuenta.
                </p>
                <Link
                  to="/login"
                  className="w-full inline-block bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition text-center"
                >
                  Ir al inicio de sesión
                </Link>
                <p className="text-xs text-gray-400 mt-4">
                  Redirigiendo automáticamente en unos segundos...
                </p>
              </div>
            )}

          </div>
        </div>
      </main>
    </>
  );
};
