import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false)
	const { user, logout } = useAuth()
	const navigate = useNavigate()

	const toggleDropdown = () => {
		setIsDropdownOpen(!isDropdownOpen)
	}

	const handleLogout = () => {
		logout()
		navigate('/signIn')
	}

	return (
		<header className="app-navbar navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm px-4">
			<div className="container-fluid p-0 align-items-center">
				<div className="app-navbar__brand">
				</div>

				<button className="navbar-toggler app-navbar__toggle" type="button" aria-label="Toggle menu">
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
					</svg>
				</button>

				<div className="dropdown ms-auto position-relative">
					<button
						type="button"
						className="app-navbar__profile d-flex align-items-center gap-2 text-dark text-decoration-none"
						onClick={toggleDropdown}
						aria-expanded={isDropdownOpen}
					>
						<span className="app-navbar__profile-icon" aria-hidden="true">
							<svg viewBox="0 0 24 24">
								<path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.51 4.51 0 0 0 12 12Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
							</svg>
						</span>
						<span className="app-navbar__profile-name">{user?.name || 'Utilisateur'}</span>
						<svg className="app-navbar__dropdown-caret" viewBox="0 0 24 24" aria-hidden="true">
							<path d="M7 10l5 5 5-5H7z" />
						</svg>
					</button>
					{isDropdownOpen && (
						<ul className="dropdown-menu dropdown-menu-end show" style={{ display: 'block' }}>
							<li>
								<button
									className="dropdown-item"
									onClick={() => { navigate('/profile'); toggleDropdown(); }}
									style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
								>
									Profil
								</button>
							</li>
							<li>
								<button
									className="dropdown-item"
									onClick={handleLogout}
									style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
								>
									Déconnexion
								</button>
							</li>
						</ul>
					)}
				</div>
			</div>
		</header>
	)
}

export default Navbar