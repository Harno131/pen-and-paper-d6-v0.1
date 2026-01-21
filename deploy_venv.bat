@echo off
setlocal enabledelayedexpansion

set "REPO_DIR=%~dp0"
set "COMMIT_MSG=%*"

if "%COMMIT_MSG%"=="" (
  set /p COMMIT_MSG="Commit-Nachricht: "
)

if "%COMMIT_MSG%"=="" (
  echo FEHLER: Keine Commit-Nachricht angegeben!
  echo Verwendung: deploy_venv.bat "Meine Aenderung"
  pause
  exit /b 1
)

pushd "%REPO_DIR%"

pwsh -NoProfile -ExecutionPolicy Bypass -Command ^
  "Set-Location '%REPO_DIR%'; ^
   if (Test-Path '.\\venv\\Scripts\\Activate.ps1') { . '.\\venv\\Scripts\\Activate.ps1' } ^
   elseif (Test-Path '.\\.venv\\Scripts\\Activate.ps1') { . '.\\.venv\\Scripts\\Activate.ps1' } ^
   else { Write-Host 'Hinweis: Keine venv gefunden (venv/.venv). Fahre fort...' -ForegroundColor Yellow } ^
   .\\deploy.ps1 '%COMMIT_MSG%'; ^
   if ($LASTEXITCODE -eq 0) { ^
     if ($env:VERCEL_TOKEN -and $env:VERCEL_PROJECT_ID) { ^
       Write-Host 'Warte auf Vercel-Deploy (READY)...' -ForegroundColor Cyan; ^
       $timeout = [DateTime]::UtcNow.AddMinutes(5); ^
       do { ^
         try { ^
           $headers = @{ Authorization = 'Bearer ' + $env:VERCEL_TOKEN }; ^
           $uri = 'https://api.vercel.com/v6/deployments?projectId=' + $env:VERCEL_PROJECT_ID + '&limit=1'; ^
           $res = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get; ^
           $state = $res.deployments[0].state; ^
           Write-Host ('Status: ' + $state); ^
           if ($state -eq 'READY') { break } ^
           if ($state -eq 'ERROR') { Write-Host 'Deploy fehlgeschlagen.' -ForegroundColor Red; break } ^
         } catch { ^
           Write-Host 'Status-Check fehlgeschlagen (API). Versuche erneut...' -ForegroundColor Yellow ^
         } ^
         Start-Sleep -Seconds 10; ^
       } while ([DateTime]::UtcNow -lt $timeout); ^
     } else { ^
       Write-Host 'Hinweis: Kein VERCEL_TOKEN/VERCEL_PROJECT_ID gesetzt. Status-Check übersprungen.' -ForegroundColor Yellow; ^
     } ^
     Start-Process 'https://pen-and-paper-d6-v01.vercel.app/'; ^
     Start-Process 'https://vercel.com/dashboard'; ^
   }"

popd
endlocal
