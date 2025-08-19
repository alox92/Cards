@echo off
REM Script pour démarrer Tauri avec le bon environnement

REM Ajout des chemins Rust au PATH
set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"

REM Vérification
echo "Test Rust:"
rustc --version
echo "Test Cargo:"
cargo --version

REM Lancement Tauri
echo "Lancement Tauri..."
npx tauri dev
