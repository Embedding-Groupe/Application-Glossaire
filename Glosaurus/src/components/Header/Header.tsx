import { useLocation } from 'preact-iso'
import './Header.css'

export function Header() {
  const location = useLocation()

  const handleHomeClick = () => {
    location.route('/')
  }

  const handleGlossaryClick = (name: string) => {
    location.route(`/glossaire/${encodeURIComponent(name)}`)
  }

  let currentGlossaryName: string | null = null

  if (location.path.startsWith('/glossaire/')) {
    const slug = location.path.slice('/glossaire/'.length)
    if (slug) currentGlossaryName = decodeURIComponent(slug)
  } else if (location.path.startsWith('/parser')) {
    const parserName = location.query?.glossary
    if (parserName) currentGlossaryName = decodeURIComponent(parserName)
  }

  return (
    <header className="header">
      <div className="header-left">
        <button
          type="button"
          className="brand"
          onClick={handleHomeClick}
          aria-label="Back to Home"
        >
          <img src="/logo.png" className="logo" title="Glosaurus" />
          <h1 className="app-name">Glosaurus</h1>
        </button>

        <div className="separator"></div>

        {currentGlossaryName && (
          <nav className="nav">
            <button
              type="button"
              className="current-glossary-btn"
              onClick={() => handleGlossaryClick(currentGlossaryName!)}
              aria-label={`Revenir au glossaire ${currentGlossaryName}`}
            >
              {currentGlossaryName}
            </button>
          </nav>
        )}
      </div>
    </header>
  )
}
