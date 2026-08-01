import { useEffect, useState } from 'react'
import logo from '../assets/images/logo.png'
import { NavLink, useNavigate } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navigationItems = [
	{ label: 'Dashboard', to: '/', icon: 'M3 4h18v2H3zm0 4h18v2H3zm0 4h12v2H3zm0 4h16v2H3z' },
	{ label: 'Specifications', to: '/specifications', icon: 'M4 6h7l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z' },
	{ label: 'Profil', to: '/profile', icon: 'M12 12a4.5 4.5 0 1 0-4.5-4.5A4.51 4.51 0 0 0 12 12Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z' },
]

const COLLAPSE_STORAGE_KEY = 'sidebar-collapsed'

function Sidebar() {
	const { user, logout } = useAuth()
	const navigate = useNavigate()
	const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_STORAGE_KEY) === '1')

	useEffect(() => {
		document.body.classList.toggle('sidebar-collapsed', collapsed)
		localStorage.setItem(COLLAPSE_STORAGE_KEY, collapsed ? '1' : '0')
		return () => {
			document.body.classList.remove('sidebar-collapsed')
		}
	}, [collapsed])

	const initials = (user?.name || user?.email || 'U')
		.split(' ')
		.map((part) => part.charAt(0))
		.slice(0, 2)
		.join('')
		.toUpperCase()

	const handleLogout = () => {
		logout()
		navigate('/signIn')
	}

	return (
		<aside className={`app-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
			<div className="sidebar-brand">
				{collapsed ? (
					<span className="sidebar-brand__mark" aria-label="OneTech">OT</span>
				) : (
					<img className="sidebar-brand__logo" src={logo} alt="OneTech logo" />
				)}
			</div>

			<button
				type="button"
				className="sidebar-toggle"
				onClick={() => setCollapsed((v) => !v)}
				aria-pressed={collapsed}
				aria-label={collapsed ? 'Étendre le menu' : 'Réduire le menu'}
				title={collapsed ? 'Étendre le menu' : 'Réduire le menu'}
			>
				{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
				{!collapsed && <span>Réduire</span>}
			</button>

			<div className="sidebar-divider" />

			<nav className="sidebar-nav" aria-label="Main navigation">
				{navigationItems.map((item) => (
					<NavLink
						key={item.label}
						to={item.to}
						end={item.to === '/'}
						className={({ isActive }) =>
							`sidebar-nav__item ${isActive ? 'is-active' : ''}`
						}
						title={item.label}
						aria-label={item.label}
					>
						<svg className="sidebar-nav__icon" viewBox="0 0 24 24" aria-hidden="true">
							<path d={item.icon} />
						</svg>
						<span className="sidebar-nav__label">{item.label}</span>
					</NavLink>
				))}
			</nav>

			<div className="sidebar-footer">
				<div className="sidebar-divider" />

				<button
					type="button"
					className="sidebar-profile"
					onClick={() => navigate('/profile')}
					title={`${user?.name || 'Utilisateur'}${user?.email ? ' · ' + user.email : ''}`}
					aria-label={`Profil de ${user?.name || 'Utilisateur'}`}
				>
					<span className="sidebar-profile__avatar">{initials}</span>
					<span className="sidebar-profile__info">
						<strong className="sidebar-profile__name">{user?.name || 'Utilisateur'}</strong>
						<span className="sidebar-profile__email">{user?.email || ''}</span>
					</span>
				</button>

				<button
					type="button"
					className="sidebar-logout"
					onClick={handleLogout}
					title="Déconnexion"
					aria-label="Déconnexion"
				>
					<svg className="sidebar-logout__icon" viewBox="0 0 24 24" aria-hidden="true">
						<path d="M16 17v-3H9v-4h7V7l5 5-5 5ZM14 2a2 2 0 0 1 2 2v2h-2V4H5v16h9v-2h2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
					</svg>
					<span>Déconnexion</span>
				</button>
			</div>
		</aside>
	)
}

export default Sidebar
