import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/layout.css';

const navItems = [
  { to: '/', label: 'Заказы' },
  { to: '/clients', label: 'Клиенты' },
  { to: '/product-types', label: 'Типы изделий' },
  { to: '/materials', label: 'Материалы' },
];

export function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>Ювелирная мастерская</h1>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button type="button" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
