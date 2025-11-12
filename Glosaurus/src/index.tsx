import { render } from 'preact';
import { LocationProvider, Router, Route } from 'preact-iso';

import { Header } from './components/Header.jsx';
import { Glossaire } from './pages/Home/index.jsx';
import { NotFound } from './pages/_404.jsx';
import { Menu } from './components/Menu.tsx';

export function App() {
	return (
		<LocationProvider>
			<Header />
			<main>
				<Router>
					<Route path="/" component={Menu} />
					<Route path="/glossaire/:name" component={Glossaire} />
					<Route default component={NotFound} />
				</Router>
			</main>
		</LocationProvider>
	);
}

const root = document.getElementById('app');
if (root) render(<App />, root);
