import { useEffect, useId, useState } from 'react';
import { Menu, Waves, X } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { cx } from '../../lib/cx';
import { useAuth } from '../../features/auth/AuthProvider';

interface AppHeaderProps {
  variant?: 'default' | 'hero';
}

export function AppHeader({ variant = 'default' }: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const navId = useId();

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setLogoutError('');
    try {
      await logout();
      closeMenu();
      navigate('/', { replace: true });
    } catch {
      setLogoutError('Não foi possível encerrar a sessão. Tente novamente.');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className={cx('site-header', variant === 'hero' && 'site-header--hero')}>
      <div className="container site-header__inner">
        <Link className="brand" to="/" onClick={closeMenu}>
          <span className="brand__mark" aria-hidden="true">
            <Waves />
          </span>
          <span className="brand__name">Preenchimento Automático</span>
        </Link>

        <button
          type="button"
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls={navId}
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          <span>{menuOpen ? 'Fechar menu' : 'Menu'}</span>
        </button>

        <nav
          id={navId}
          className={cx('site-nav', menuOpen && 'site-nav--open')}
          aria-label="Navegação principal"
        >
          <NavLink to="/" end className="site-nav__link" onClick={closeMenu}>
            Início
          </NavLink>
          {session.status === 'authenticated' ? (
            <NavLink to="/minha-conta" className="site-nav__link" onClick={closeMenu}>
              Minha conta
            </NavLink>
          ) : session.status === 'guest' ? (
            <NavLink to="/entrar" className="site-nav__link" onClick={closeMenu}>
              Entrar
            </NavLink>
          ) : session.status === 'unavailable' ? (
            <NavLink to="/entrar" className="site-nav__link" onClick={closeMenu}>
              Verificar sessão
            </NavLink>
          ) : null}
          <NavLink to="/creditos" className="site-nav__link" onClick={closeMenu}>
            Créditos
          </NavLink>
          {session.status === 'authenticated' ? (
            <button type="button" className="site-nav__link site-nav__button"
              disabled={signingOut} onClick={() => void signOut()}>
              {signingOut ? 'Saindo…' : 'Sair'}
            </button>
          ) : null}
          {logoutError ? <span className="site-nav__error" role="alert">{logoutError}</span> : null}
        </nav>
      </div>
    </header>
  );
}
