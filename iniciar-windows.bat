@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo NODE.JS NAO ENCONTRADO.
  echo Instale a versao LTS em https://nodejs.org/ e tente novamente.
  echo.
  pause
  exit /b 1
)
if not exist node_modules\socket.io (
  echo Instalando dependencias pela primeira vez...
  call npm install
  if errorlevel 1 (
    echo A instalacao falhou. Verifique a conexao e tente novamente.
    pause
    exit /b 1
  )
)
echo.
echo ===== MESTRE DO BANCO =====
echo Abra no navegador: http://localhost:3000
echo Para permitir que seus amigos joguem pela internet,
echo e necessario publicar o servidor em uma hospedagem com WebSocket.
echo Para encerrar, feche esta janela.
echo.
start "" "http://localhost:3000"
call npm start
pause
