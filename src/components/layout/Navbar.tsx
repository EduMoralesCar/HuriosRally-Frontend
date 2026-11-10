import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { getToken, clearToken, getRole } from "../../utils/token";
import {
  getStoredNotifications,
  getReadNotificationIds,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  syncFromBackendFeed,
  type AppNotification,
} from "../../api/realtimeSync";

const categories = [
  { id: 1, name: "Motor" },
  { id: 2, name: "Neumáticos" },
  { id: 3, name: "Carrocería" },
  { id: 4, name: "Filtros" },
  { id: 5, name: "Suspensión" },
  { id: 6, name: "Frenos" },
  { id: 7, name: "Eléctrico" },
  { id: 8, name: "Accesorios" },
  { id: 9, name: "Transmisión" },
  { id: 10, name: "Lubricantes" },
];

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [liveToast, setLiveToast] = useState<AppNotification | null>(null);

  const { totalItems } = useCart();
  const navigate = useNavigate();
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const lastTopNotifIdRef = useRef<string | null>(null);

  const isAuthenticated = !!getToken();
  const isAdmin = getRole() === "ADMINISTRADOR";

  const refreshNotifications = () => {
    const list = getStoredNotifications();
    const readSet = getReadNotificationIds(isAdmin);
    setNotifications(list);
    setReadIds(readSet);

    if (list.length > 0) {
      const newest = list[0];
      if (
        lastTopNotifIdRef.current &&
        lastTopNotifIdRef.current !== newest.id &&
        !readSet.has(newest.id)
      ) {
        setLiveToast(newest);
        setTimeout(() => {
          setLiveToast((prev) => (prev?.id === newest.id ? null : prev));
        }, 5500);
      }
      lastTopNotifIdRef.current = newest.id;
    }
  };

  useEffect(() => {
    refreshNotifications();
    void syncFromBackendFeed();

    const handleRealtimeEvent = () => refreshNotifications();
    const handleStorageEvent = () => refreshNotifications();

    window.addEventListener("hurios-realtime-updated", handleRealtimeEvent);
    window.addEventListener("storage", handleStorageEvent);

    const interval = setInterval(() => {
      void syncFromBackendFeed();
    }, 4000);

    return () => {
      window.removeEventListener(
        "hurios-realtime-updated",
        handleRealtimeEvent,
      );
      window.removeEventListener("storage", handleStorageEvent);
      clearInterval(interval);
    };
  }, [isAdmin]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
      if (
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(event.target as Node)
      ) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearToken();
    localStorage.removeItem("huriosRally_cart");
    setUserDropdownOpen(false);
    navigate("/login");
  };

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id, isAdmin);
    setNotifDropdownOpen(false);
    setLiveToast(null);
    const targetLink = isAdmin
      ? notif.linkAdmin || "/admin-profile"
      : notif.linkClient ||
        (notif.productId ? `/products?productId=${notif.productId}` : "/products");
    navigate(targetLink);
  };

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  return (
    <header className="w-full bg-[var(--Primary_5)] text-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <img
            src="/assets/imgs/logo.webp"
            alt="Hurios Rally"
            className="h-14 sm:h-15 w-auto"
          />
        </Link>

        {/* Navegación Desktop */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
          <Link to="/" className="hover:underline">
            Inicio
          </Link>
          <Link to="/products" className="hover:underline">
            Productos
          </Link>

          {/* Dropdown Categorías */}
          <div className="relative">
            <button
              onClick={() => setCatsOpen((v) => !v)}
              onMouseEnter={() => setCatsOpen(true)}
              onMouseLeave={() => setCatsOpen(false)}
              className="flex items-center gap-1 cursor-pointer"
              aria-expanded={catsOpen}
            >
              Categorías
              <svg
                className="w-4 h-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06-.02L10 10.67l3.71-3.48a.75.75 0 111.04 1.08l-4.25 4a.75.75 0 01-1.04 0l-4.25-4a.75.75 0 01-.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <ul
              onMouseEnter={() => setCatsOpen(true)}
              onMouseLeave={() => setCatsOpen(false)}
              className={`absolute top-full left-0 mt-2 w-48 bg-white text-gray-800 rounded shadow-md transform transition-all ${
                catsOpen
                  ? "opacity-100 scale-100 visible"
                  : "opacity-0 scale-95 invisible"
              }`}
              style={{ zIndex: 60 }}
            >
              {categories.map((cat) => (
                <li key={cat.id} className="px-4 py-2 hover:bg-gray-100">
                  <Link
                    to={`/category/${cat.id}`}
                    className="block"
                    onClick={() => setCatsOpen(false)}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <Link to="/about" className="hover:underline">
            Nosotros
          </Link>

          {isAuthenticated && isAdmin && (
            <Link
              to="/admin-profile"
              className="px-3 py-1 rounded bg-white/15 hover:bg-white/25 text-xs font-semibold tracking-wide transition"
            >
              Dashboard Admin
            </Link>
          )}
        </nav>

        {/* Acciones: Carrito + Notificaciones + Perfil + Menú Móvil */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Carrito — solo para clientes */}
          {!isAdmin && (
            <Link
              to="/cart"
              className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white text-[#27557a] hover:scale-105 transition flex-shrink-0 relative"
              aria-label={`Carrito de compras (${totalItems} items)`}
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[11px] rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>
          )}

          {/* Campana de Notificaciones — Al lado del icono de perfil con el mismo diseño circular y contraste */}
          <div className="relative" ref={notifDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setNotifDropdownOpen((v) => !v);
                setUserDropdownOpen(false);
              }}
              aria-label="Notificaciones"
              title="Notificaciones en tiempo real"
              className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white text-[#27557a] hover:scale-105 transition flex-shrink-0 cursor-pointer relative"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[11px] rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 text-gray-800">
                <div className="px-4 py-3 bg-[var(--Primary_5)] text-white flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold">
                      {isAdmin
                        ? "Alertas de Gestión (Administrador)"
                        : "Notificaciones y Novedades"}
                    </h3>
                    <p className="text-[11px] text-blue-100">
                      Actualización en tiempo real
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllNotificationsAsRead(isAdmin)}
                      className="text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded font-medium cursor-pointer"
                    >
                      Marcar leídas
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500">
                      No tienes notificaciones pendientes.
                    </div>
                  ) : (
                    notifications.slice(0, 15).map((notif) => {
                      const isUnread = !readIds.has(notif.id);
                      const title = isAdmin
                        ? notif.titleAdmin
                        : notif.titleClient;
                      const message = isAdmin
                        ? notif.messageAdmin
                        : notif.messageClient;

                      return (
                        <button
                          key={notif.id}
                          type="button"
                          onClick={() => handleNotificationClick(notif)}
                          className={`w-full text-left px-4 py-3 transition flex items-start gap-3 cursor-pointer ${
                            isUnread
                              ? "bg-blue-50/70 hover:bg-blue-50"
                              : "bg-white hover:bg-gray-50"
                          }`}
                        >
                          <div className="mt-0.5 h-8 w-8 rounded-full bg-[#27557a]/10 text-[#27557a] flex items-center justify-center shrink-0">
                            {notif.type === "NEW_SALE" ? (
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                              </svg>
                            ) : notif.type === "NEW_REVIEW" ? (
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                            ) : (
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-bold text-gray-900 truncate">
                                {title}
                              </p>
                              {isUnread && (
                                <span className="w-2 h-2 rounded-full bg-[#27557a] shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                              {message}
                            </p>
                            <span className="text-[10px] text-gray-400 mt-1 block">
                              {notif.createdAt} · Clic para abrir
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dropdown de Usuario */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => {
                setUserDropdownOpen(!userDropdownOpen);
                setNotifDropdownOpen(false);
              }}
              aria-label={
                isAuthenticated ? "Menú de usuario" : "Iniciar sesión"
              }
              className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white text-[#27557a] hover:scale-105 transition flex-shrink-0 cursor-pointer"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" />
              </svg>
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                {!isAuthenticated ? (
                  <Link
                    to="/login"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
                    </svg>
                    <span className="font-medium">Iniciar sesión</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      to={isAdmin ? "/admin-profile" : "/user-profile"}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span>
                        {isAdmin ? "Dashboard y Perfil" : "Ver perfil"}
                      </span>
                    </Link>

                    {!isAdmin && (
                      <Link
                        to="/my-orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span>Mis pedidos</span>
                      </Link>
                    )}

                    <Link
                      to="/reset-password"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <rect
                          x="3"
                          y="11"
                          width="18"
                          height="11"
                          rx="2"
                          ry="2"
                        />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span>Restablecer contraseña</span>
                    </Link>

                    <hr className="my-2 border-gray-200" />

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors w-full text-left cursor-pointer"
                    >
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                      </svg>
                      <span>Cerrar sesión</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Botón Hamburger Móvil */}
          <button
            className="lg:hidden p-1.5 sm:p-2 rounded text-white/90 hover:bg-white/10 flex-shrink-0 cursor-pointer"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M4 6h16M4 12h16M4 18h16"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Aviso emergente en tiempo real (Toast) cuando llega una notificación nueva */}
      {liveToast && (
        <div className="fixed top-20 right-4 z-50 max-w-sm w-full bg-white text-gray-900 rounded-lg shadow-xl border-l-4 border-[#27557a] p-4 flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-[#27557a] text-white flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div
            className="flex-1 cursor-pointer"
            onClick={() => handleNotificationClick(liveToast)}
          >
            <p className="text-xs font-bold text-[#27557a]">
              {isAdmin ? liveToast.titleAdmin : liveToast.titleClient}
            </p>
            <p className="text-xs text-gray-700 mt-0.5">
              {isAdmin ? liveToast.messageAdmin : liveToast.messageClient}
            </p>
            <span className="text-[11px] font-semibold text-[#27557a] underline mt-1 inline-block">
              Ver ahora →
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLiveToast(null)}
            className="text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Menú Móvil Responsivo */}
      <div
        className={`lg:hidden bg-[var(--Primary_5)] text-white border-t border-white/10 ${
          menuOpen ? "block" : "hidden"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 pb-4">
          <nav className="flex flex-col gap-2">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="py-2 border-b border-white/10"
            >
              Inicio
            </Link>
            <Link
              to="/products"
              onClick={() => setMenuOpen(false)}
              className="py-2 border-b border-white/10"
            >
              Productos
            </Link>

            <details className="py-2 border-b border-white/10">
              <summary className="cursor-pointer">Categorías</summary>
              <ul className="pl-4 mt-2 space-y-1">
                {categories.map((c) => (
                  <li key={c.id} className="py-1">
                    <Link
                      to={`/category/${c.id}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>

            <Link
              to="/about"
              onClick={() => setMenuOpen(false)}
              className="py-2 border-b border-white/10"
            >
              Nosotros
            </Link>
            <Link
              to={
                !isAuthenticated
                  ? "/login"
                  : isAdmin
                    ? "/admin-profile"
                    : "/user-profile"
              }
              onClick={() => setMenuOpen(false)}
              className="py-2"
            >
              {!isAuthenticated
                ? "Iniciar Sesión"
                : isAdmin
                  ? "Dashboard Administrador"
                  : "Mi Perfil y Pedidos"}
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
