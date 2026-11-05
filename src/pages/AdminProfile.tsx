import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import { ButtonAdmin } from "../components/ui/ButtonAdmin";
import { getUserProfile, updateUserProfile, type UserProfile as UserProfileType } from "../api/user";
import { getToken } from "../utils/token";
import { useAdminSessionTimeout } from "../hooks/useAdminSessionTimeout";
import { ProfileAvatar } from "../components/user/ProfileAvatar";
import { downloadExportReport, type ExportType } from "../api/exports";

export function AdminProfile() {
    const navigate = useNavigate();
    useAdminSessionTimeout(); // Temporizador de 2 minutos de inactividad
    const [profile, setProfile] = useState<UserProfileType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [exportingType, setExportingType] = useState<ExportType | null>(null);

    // Formulario - solo nombre y email
    const [fullName, setFullName] = useState("");

    useEffect(() => {
        // Verificar autenticación
        if (!getToken()) {
            navigate("/login");
            return;
        }

        // Cargar perfil
        loadProfile();
    }, [navigate]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getUserProfile();
            setProfile(data);
            setFullName(data.fullName || "");
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Error al cargar el perfil");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError(null);
            setSuccessMessage(null);

            await updateUserProfile({
                fullName,
            });

            setSuccessMessage("Perfil actualizado correctamente");
            setEditing(false);

            // Recargar perfil
            await loadProfile();

            // Ocultar mensaje después de 3 segundos
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Error al actualizar el perfil");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditing(false);
        setFullName(profile?.fullName || "");
        setError(null);
    };

    const handleExport = async (type: ExportType) => {
        try {
            setExportingType(type);
            setError(null);
            const fileName = await downloadExportReport(type);
            setSuccessMessage(`Reporte descargado correctamente: ${fileName}`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Error al exportar");
            }
        } finally {
            setExportingType(null);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <main className="min-h-screen bg-[var(--Primary_0)] flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--Primary_5)]"></div>
                        <p className="mt-4 text-gray-600">Cargando perfil...</p>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-[var(--Primary_0)] py-8">
                <div className="max-w-4xl mx-auto px-4">

                    {/* Header */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {/* Avatar con subida de imagen */}
                                <ProfileAvatar
                                    imageUrl={profile?.profileImage}
                                    onImageUpdate={async (_newImageUrl) => {
                                        // La imagen ya fue guardada en el backend por uploadProfileImage
                                        // Solo recargamos el perfil para reflejar el cambio
                                        await loadProfile();
                                    }}
                                    size="large"
                                />
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {profile?.fullName || "Administrador"}
                                    </h1>
                                    <p className="text-gray-600">{profile?.email}</p>
                                    {profile?.createdAt && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            Miembro desde {new Date(profile.createdAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {!editing && (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="px-4 py-2 bg-[var(--Primary_5)] text-white rounded-md hover:bg-[#1e4a6f] transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                    Editar perfil
                                </button>
                            )}
                        </div>
                    </div>

                    <section className="flex gap-4 mb-6 flex-wrap justify-between">
                        <ButtonAdmin label="INVENTARIO" route="/inventario" />
                        <ButtonAdmin label="BOLETAS/FACTURAS" route="/boletas-facturas" />
                        <ButtonAdmin label="CLASIFICADOR DE CONSULTAS" route="/clasificador-ml" />
                    </section>

                    {/* Botones de exportación */}
                    <section className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Exportar Reportes</h2>
                        <div className="flex gap-4 flex-wrap">
                            <button
                                onClick={() => handleExport('clients')}
                                disabled={exportingType !== null}
                                className="flex-1 min-w-[200px] px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed "
                            >
                                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                {exportingType === "clients" ? "Exportando..." : "Exportar Clientes"}
                            </button>
                            <button
                                onClick={() => handleExport('sales')}
                                disabled={exportingType !== null}
                                className="flex-1 min-w-[200px] px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                            >
                                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                {exportingType === "sales" ? "Exportando..." : "Exportar Ventas"}
                            </button>
                            <button
                                onClick={() => handleExport('products')}
                                disabled={exportingType !== null}
                                className="flex-1 min-w-[200px] px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                            >
                                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                {exportingType === "products" ? "Exportando..." : "Exportar Productos"}
                            </button>
                        </div>
                    </section>

                    {/* Mensajes */}
                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            {successMessage}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    {/* Formulario */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Información personal</h2>

                        <form onSubmit={handleSave} className="space-y-6">
                            {/* Email (solo lectura) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Correo electrónico
                                </label>
                                <input
                                    type="email"
                                    value={profile?.email || ""}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-1">El correo no se puede modificar</p>
                            </div>

                            {/* Nombre completo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre completo
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    disabled={!editing}
                                    placeholder="Ingresa tu nombre completo"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--Primary_5)] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                                />
                            </div>

                            {/* Botones */}
                            {editing && (
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 px-6 py-3 bg-[var(--Primary_5)] text-white rounded-md hover:bg-[#1e4a6f] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {saving ? "Guardando..." : "Guardar cambios"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        disabled={saving}
                                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </main>
        </>
    );
}
