import logo from '../assets/images/logo.png'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navigationItems = [
    { label:'Dashboard', icon: 'M3 4h18v2H3zm0 4h18v2H3zm0 4h12v2H3zm0 4h16v2H3z' },
	{ label: 'Specifications', icon: 'M4 6h7l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z' },
]

function Sidebar() {
	const { user, logout } = useAuth()
	const navigate = useNavigate()

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
		<aside className="app-sidebar">
			<div className="sidebar-brand">
				<img className="sidebar-brand__logo" src={logo} alt="OneTech logo" />
			</div>

			<div className="sidebar-divider" />

			<nav className="sidebar-nav" aria-label="Main navigation">
				{navigationItems.map((item, index) => (
					<NavLink
						key={item.label}
						to={index === 1 ? '/specifications' : '/'}
						className={({ isActive }) =>
							`sidebar-nav__item ${isActive ? 'is-active' : ''}`
						}
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
				>
					<span className="sidebar-profile__avatar">{initials}</span>
					<span className="sidebar-profile__info">
						<strong className="sidebar-profile__name">{user?.name || 'Utilisateur'}</strong>
						<span className="sidebar-profile__email">{user?.email || ''}</span>
					</span>
				</button>

				<button type="button" className="sidebar-logout" onClick={handleLogout}>
					<svg className="sidebar-logout__icon" viewBox="0 0 24 24" aria-hidden="true">
						<path d="M16 17v-3H9v-4h7V7l5 5-5 5ZM14 2a2 2 0 0 1 2 2v2h-2V4H5v16h9v-2h2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
					</svg>
					Déconnexion
				</button>
			</div>
		</aside>
	)
}

export default Sidebar