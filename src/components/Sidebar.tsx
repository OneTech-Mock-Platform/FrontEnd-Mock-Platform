import logo from '../assets/images/logo.png'
import { NavLink } from 'react-router-dom'

const navigationItems = [
    { label:'Dashboard', icon: 'M3 4h18v2H3zm0 4h18v2H3zm0 4h12v2H3zm0 4h16v2H3z' },
	{ label: 'Specifications', icon: 'M4 6h7l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z' },
]

function Sidebar() {
	return (
		<aside className="app-sidebar">
			<div className="sidebar-brand">
			{/* 	<img className="sidebar-brand__logo" src={logo} alt="OneTech logo" /> */}
			<div className="sidebar-brand__text">
					<strong>OneTech</strong>
				</div>
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
			</div>
		</aside>
	)
}

export default Sidebar