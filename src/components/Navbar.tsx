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

	const initials = (user?.name || 'U')
		.split(' ')
		.map((part) => part.charAt(0))
		.slice(0, 2)
		.join('')
		.toUpperCase()

	return (
		<header className="app-navbar">
			<div className="container-fluid">
				<div className="app-navbar__brand" />

				<div className="dropdown ms-auto position-relative">
					<button
						type="button"
						className="app-navbar__profile"
						onClick={toggleDropdown}
						aria-expanded={isDropdownOpen}
					>
						<span className="app-navbar__profile-icon">{initials}</span>
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
								>
									<svg viewBox="0 0 24 24" aria-hidden="true">
										<path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.51 4.51 0 0 0 12 12Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
									</svg>
									Profil
								</button>
							</li>
							<li>
								<button
									className="dropdown-item dropdown-item--danger"
									onClick={handleLogout}
								>
									<svg viewBox="0 0 24 24" aria-hidden="true">
										<path d="M16 17v-3H9v-4h7V7l5 5-5 5ZM14 2a2 2 0 0 1 2 2v2h-2V4H5v16h9v-2h2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
									</svg>
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