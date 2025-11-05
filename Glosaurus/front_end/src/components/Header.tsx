//import { useLocation } from 'preact-iso';
import './Header.css';

export function Header() {
	//const { url } = useLocation();

	return (
		<header class="header">
			<div class="header-left">
				<img src="/logo.png" class="logo" title="Glosaurus" />
				<h1 class="app-name">Glosaurus</h1>
				{/*
				<div class="separator"></div>
				<nav class="nav">
					<a href="/" class="active">Home</a>
					<a href="/settings">Settings</a>
				</nav>
				//Navigation links can be added in future versions */} 
			</div>

			{/* <button class="new-glossary">New Glossary</button> //Button to add a new glossary in future versions */} 
		</header>

	);
}
