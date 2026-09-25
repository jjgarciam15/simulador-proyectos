param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$appUrl = 'http://127.0.0.1:5173/'
try {
    $vitePath = Join-Path $projectRoot 'node_modules\vite\bin\vite.js'
    if (-not (Test-Path -LiteralPath $vitePath)) {
        throw 'Faltan las dependencias del proyecto. Consulta ACCESO_RAPIDO.md.'
    }
    function Test-Proyecta {
        try {
            $page = Invoke-WebRequest -Uri $appUrl -UseBasicParsing -TimeoutSec 2
            return $page.Content -match '<title>PROYECTA'
        } catch { return $false }
    }
    if (-not (Test-Proyecta)) {
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
            if (Test-Proyecta) { $ready = $true; break }
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
    Write-Output "PROYECTA listo en $appUrl"
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
