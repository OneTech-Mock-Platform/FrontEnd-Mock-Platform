import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'

function LandingPage() {
	return (
		<div className="app-shell">
			<Sidebar />

			<div className="app-main">
				<Navbar />
				{/* <main className="app-stage">
					<section className="hero-panel">
						<div>
							<p className="section-kicker text-orange mb-2">Dashboard</p>
							<h1 className="page-title mb-2">Welcome to OneTech</h1>
							<p className="page-subtitle mb-0">
								Use the sidebar to open Specifications and import files with a modern workflow.
							</p>
						</div>
					</section>
				</main> */}
			</div>
		</div>
	)
}

export default LandingPage
