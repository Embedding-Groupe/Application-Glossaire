// import { render } from "preact";
// import { LocationProvider, Router, Route } from "preact-iso";
// import { useState, useEffect } from "preact/hooks";
// import { invoke } from "@tauri-apps/api/core";
// import { ask } from "@tauri-apps/plugin-dialog";

// import { Header } from "./components/Header/Header.js";
// import { Glossaire } from "./pages/Home/index.jsx";
// import { NotFound } from "./pages/_404.jsx";
// import { Menu } from "./components/Menu/Menu.tsx";
// import { Parser } from "./pages/Parser/Parser.tsx";


// function MainApp() {
//   return (
//     <LocationProvider>
//       <Header />
//       <main>
//         <Router>
//           <Route path="/" component={Menu} />
//           <Route path="/glossaire/:name" component={Glossaire} />
//           <Route path="/parser" component={Parser} />

//           <Route default component={NotFound} />
//         </Router>
//       </main>
//     </LocationProvider>
//   );
// }
// //*
// function Bootstrapper() {
//   const [status, setStatus] = useState<"checking" | "installing" | "starting" | "ready" | "error">("checking");
//   const [message, setMessage] = useState("Checking Ollama installation...");

//   useEffect(() => {
//     async function init() {
//       try {
//         // 1. Check Ollama
//         const hasOllama = await invoke<boolean>("check_ollama");

//         if (!hasOllama) {
//           const shouldInstall = await ask(
//             "Ollama is required for this application. Do you want to install it now?",
//             { title: "Ollama Missing", kind: "warning" }
//           );

//           if (shouldInstall) {
//             setStatus("installing");
//             setMessage("Installing Ollama... This may take a few minutes. Please check for any system prompts.");

//             // 2. Install
//             await invoke("install_ollama");
//           } else {
//             setStatus("error");
//             setMessage("Ollama is required. Please restart and install Ollama.");
//             return;
//           }
//         }

//         // 3. Start Backend
//         setStatus("starting");
//         setMessage("Starting background services...");
//         await invoke("start_backend");

//         // 4. Ready
//         setStatus("ready");
//       } catch (err: any) {
//         console.error("Bootstrap error:", err);
//         setStatus("error");
//         setMessage(`Initialization failed: ${err.toString()}`);
//       }
//     }

//     init();
//   }, []);

//   if (status === "ready") {
//     return <MainApp />;
//   }

//   return (
//     <div style={{
//       display: "flex",
//       flexDirection: "column",
//       alignItems: "center",
//       justifyContent: "center",
//       height: "100vh",
//       fontFamily: "system-ui, sans-serif",
//       backgroundColor: "#f9f9f9",
//       color: "#333"
//     }}>
//       <div style={{
//         padding: "2rem",
//         borderRadius: "8px",
//         background: "white",
//         boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
//         textAlign: "center",
//         maxWidth: "400px"
//       }}>
//         <h2 style={{ marginBottom: "1rem" }}>
//           {status === "checking" && "Initializing"}
//           {status === "installing" && "Installing Dependencies"}
//           {status === "starting" && "Starting App"}
//           {status === "error" && "Error"}
//         </h2>

//         {status === "installing" && (
//           <div style={{ margin: "1rem 0" }}>
//             <div className="spinner" style={{
//               border: "4px solid #f3f3f3",
//               borderTop: "4px solid #3498db",
//               borderRadius: "50%",
//               width: "30px",
//               height: "30px",
//               animation: "spin 1s linear infinite",
//               margin: "0 auto"
//             }} />
//             <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
//           </div>
//         )}

//         <p style={{ lineHeight: "1.5" }}>{message}</p>

//         {status === "error" && (
//           <button
//             onClick={() => window.location.reload()}
//             style={{
//               marginTop: "1rem",
//               padding: "0.5rem 1rem",
//               background: "#333",
//               color: "white",
//               border: "none",
//               borderRadius: "4px",
//               cursor: "pointer"
//             }}
//           >
//             Retry
//           </button>
//         )}
//       </div>
//     </div>
//   );
// }

// const root = document.getElementById("app");
// if (root) render(<Bootstrapper />, root);










import { render } from "preact";
import { LocationProvider, Router, Route } from "preact-iso";

import { Header } from "./components/Header/Header.js";
import { Glossaire } from "./pages/Home/index.jsx";
import { NotFound } from "./pages/_404.jsx";
import { Menu } from "./components/Menu/Menu.tsx";
import { Parser } from "./pages/Parser/Parser.tsx";

export function App() {
  return (
    <LocationProvider>
      <Header />
      <main>
        <Router>
          <Route path="/" component={Menu} />
          <Route path="/glossaire/:name" component={Glossaire} />
          <Route path="/parser" component={Parser} />

          <Route default component={NotFound} />
        </Router>
      </main>
    </LocationProvider>
  );
}

const root = document.getElementById("app");
if (root) render(<App />, root);