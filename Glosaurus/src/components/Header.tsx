import { useLocation } from 'preact-iso';
import './Header.css';

export function Header() {
	const { url } = useLocation();

	return (
		<header class="header">
			<div class="header-left">
				<img src="/logo.png" class="logo" />
				<h1 class="app-name">Glosaurus</h1>
				<div class="separator"></div>
				<nav class="nav">
					<a href="/" class="active">Home</a>
					<a href="/settings">Settings</a>
				</nav>
			</div>

			<button class="new-glossary">New Glossary</button>
		</header>

	);
}
