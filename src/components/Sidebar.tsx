import logo from '../assets/images/logo.png'
import { NavLink } from 'react-router-dom'

const navigationItems = [
/* 	{ label: 'Projects', icon: 'M4 6h7l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z' }, */
    { label:'Dashboard', icon: 'M3 4h18v2H3zm0 4h18v2H3zm0 4h12v2H3zm0 4h16v2H3z' },
	{ label: 'Specifications', icon: 'M4 6h7l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z' },
	/* { label: 'Mock Servers', icon: 'M4 6h16v12H4zm2 2v8h12V8z' }, */
	/*{ label: 'AI Assistant', icon: 'M12 3a4 4 0 0 1 4 4v1h1a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-1v1a4 4 0 0 1-4 4 4 4 0 0 1-4-4v-1H7a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3h1V7a4 4 0 0 1 4-4Zm0 2a2 2 0 0 0-2 2v1h4V7a2 2 0 0 0-2-2Zm-5 5a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1v-7H7Zm10 0h-1v7h1a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1Z' },*/
]

function Sidebar() {
	return (
		<aside className="app-sidebar bg-dark-blue">
			<div className="sidebar-brand">
				<img className="sidebar-brand__logo" src={logo} alt="OneTech logo" />
				<div className="sidebar-brand__text">
					<strong>OneTech</strong>
				</div>
			</div>

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
			{/* 	<button type="button" className="sidebar-footer__cta btn btn-orange w-100 fw-semibold">
					+ New Project
				</button>
				<button type="button" className="sidebar-footer__settings">
					<span className="sidebar-nav__icon" aria-hidden="true">
						<svg viewBox="0 0 24 24">
							<path d="M19.14 12.94a7.1 7.1 0 0 0 .05-.94 7.1 7.1 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.63l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.28 7.28 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.43h-3.84a.5.5 0 0 0-.5.43l-.36 2.54c-.58.22-1.12.54-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L2.8 7.85a.5.5 0 0 0 .12.63l2.03 1.58c-.03.31-.05.62-.05.94s.02.63.05.94l-2.03 1.58a.5.5 0 0 0-.12.63l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.4 1.04.72 1.62.94l.36 2.54a.5.5 0 0 0 .5.43h3.84a.5.5 0 0 0 .5-.43l.36-2.54c.58-.22 1.12-.54 1.62-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.63l-2.03-1.58ZM12 15.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Z" />
						</svg>
					</span>
					<span>Settings</span>
				</button> */}
			</div>
		</aside>
	)
}

export default Sidebar
