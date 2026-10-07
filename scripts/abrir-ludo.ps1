param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$appUrl = 'http://127.0.0.1:5173/'
try {
    $vitePath = Join-Path $projectRoot 'node_modules\vite\bin\vite.js'
    # Every dependency declared in package.json must exist in node_modules. After updating the code
    # (git pull) new dependencies can be missing: install them before starting the server.
    $package = Get-Content -LiteralPath (Join-Path $projectRoot 'package.json') -Raw | ConvertFrom-Json
    $declared = @()
    foreach ($group in @($package.dependencies, $package.devDependencies)) {
        if ($group) { $declared += $group.PSObject.Properties.Name }
    }
    $missing = @($declared | Where-Object { -not (Test-Path -LiteralPath (Join-Path $projectRoot ('node_modules\' + ($_ -replace '/', '\')))) })
    if ($missing.Count -gt 0 -or -not (Test-Path -LiteralPath $vitePath)) {
        Write-Host ('Instalando dependencias nuevas: ' + ($missing -join ', ')) -ForegroundColor Yellow
        $pnpm = Get-Command pnpm.cmd, pnpm -ErrorAction SilentlyContinue | Select-Object -First 1
        if (-not $pnpm) {
            throw 'Faltan dependencias y no se encontro pnpm. Ejecuta: npm install -g pnpm@11.19.0  y luego  pnpm install'
        }
        # A server started with the old dependencies must be restarted.
        Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue |
            ForEach-Object { Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue } |
            Where-Object { $_.ProcessName -eq 'node' } |
            Stop-Process -Force -ErrorAction SilentlyContinue
        Push-Location $projectRoot
        try { & $pnpm.Source install --frozen-lockfile } finally { Pop-Location }
        if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $vitePath)) {
            throw 'No se pudieron instalar las dependencias. Ejecuta  pnpm install  en esta carpeta y revisa el mensaje.'
        }
    }
    function Test-Ludo {
        try {
            $page = Invoke-WebRequest -Uri $appUrl -UseBasicParsing -TimeoutSec 2
            return $page.Content -match '<title>LUDO'
        } catch { return $false }
    }
    if (-not (Test-Ludo)) {
        $nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
        $nodePath = if ($nodeCommand) { $nodeCommand.Source } else {
            Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
        }
        if (-not (Test-Path -LiteralPath $nodePath)) {
            throw 'No se encontro Node.js. Instala Node.js 24 LTS y vuelve a abrir este archivo.'
        }
        $logDirectory = Join-Path $projectRoot '.local'
        New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
        $server = Start-Process -FilePath $nodePath -ArgumentList @('"' + $vitePath + '"', '--host', '127.0.0.1', '--port', '5173', '--strictPort') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDirectory 'servidor.log') -RedirectStandardError (Join-Path $logDirectory 'servidor-error.log') -PassThru
        $ready = $false
        for ($attempt = 0; $attempt -lt 40; $attempt++) {
            if (Test-Ludo) { $ready = $true; break }
            if ($server.HasExited) { break }
            Start-Sleep -Milliseconds 250
        }
        if (-not $ready) {
            throw 'El servidor no pudo iniciar. El puerto 5173 puede estar ocupado. Consulta .local\servidor-error.log.'
        }
    }
    if (-not $NoBrowser) {
        $edgeCandidates = @(
            "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
            "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
            "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe"
        )
        $edgePath = $edgeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
        if ($edgePath) {
            Start-Process -FilePath $edgePath -ArgumentList "--app=$appUrl"
        } else {
            Start-Process $appUrl
        }
    }
    Write-Output "Ludo listo en $appUrl"
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
