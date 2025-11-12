//import { useLocation } from 'preact-iso';
import './Header.css';

export function Header() {
    return (
        <header class="header">
            <div class="header-left">
                <img src="/logo.png" class="logo" title="Glosaurus" />
                <h1 class="app-name">Glosaurus</h1>
                
                <div class="separator"></div>
                <nav class="nav">
                    <a href="/" class="active">Home</a>
                </nav>
            </div>

            
        </header>
    );
}
