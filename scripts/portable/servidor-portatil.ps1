# PROYECTA portátil: sirve la aplicación compilada (carpeta "app") en este equipo, sin Node.js ni instalaciones.
# Solo escucha en 127.0.0.1 (no se expone a la red). Compatible con Windows PowerShell 5.1 y PowerShell 7.
param([switch]$NoBrowser, [int]$MaxRequests = 0)
$ErrorActionPreference = 'Stop'
$root = Join-Path $PSScriptRoot 'app'
$index = Join-Path $root 'index.html'
if (-not (Test-Path -LiteralPath $index)) {
    Write-Host 'No se encontro la carpeta "app". Copia la carpeta PROYECTA completa, sin separar sus archivos.' -ForegroundColor Red
    exit 1
}
$rootFull = [System.IO.Path]::GetFullPath($root)
$types = @{
    '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.mjs' = 'text/javascript; charset=utf-8'
    '.css' = 'text/css; charset=utf-8'; '.json' = 'application/json; charset=utf-8'; '.svg' = 'image/svg+xml'
    '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.webp' = 'image/webp'; '.gif' = 'image/gif'
    '.ico' = 'image/x-icon'; '.woff' = 'font/woff'; '.woff2' = 'font/woff2'; '.ttf' = 'font/ttf'; '.map' = 'application/json'
    '.wasm' = 'application/wasm'; '.txt' = 'text/plain; charset=utf-8'; '.pdf' = 'application/pdf'
}
# Port 5173 keeps the same browser storage as the development version; if it is busy, try the next ones.
$listener = $null
$url = $null
foreach ($port in 5173..5183) {
    $candidate = New-Object System.Net.HttpListener
    $candidate.Prefixes.Add("http://127.0.0.1:$port/")
    try {
        $candidate.Start()
        $listener = $candidate
        $url = "http://127.0.0.1:$port/"
        break
    } catch {
        $candidate.Close()
    }
}
if (-not $listener) {
    Write-Host 'No hay un puerto libre entre 5173 y 5183. Cierra otras ventanas de PROYECTA e intentalo de nuevo.' -ForegroundColor Red
    exit 1
}
Write-Host "PROYECTA listo en $url" -ForegroundColor Green
Write-Host 'Deja esta ventana abierta mientras usas el simulador. Para cerrarlo, cierra esta ventana.'
if ($url -ne 'http://127.0.0.1:5173/') {
    Write-Host 'Aviso: el puerto 5173 estaba ocupado. Las partidas guardadas en este puerto son independientes.' -ForegroundColor Yellow
}
if (-not $NoBrowser) {
    $edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe", "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe") |
        Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -First 1
    if ($edge) { Start-Process -FilePath $edge -ArgumentList "--app=$url" } else { Start-Process $url }
}
$served = 0
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $response = $context.Response
        try {
            $path = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath).TrimStart('/')
            if ($path -eq '') { $path = 'index.html' }
            $file = [System.IO.Path]::GetFullPath((Join-Path $rootFull ($path -replace '/', [System.IO.Path]::DirectorySeparatorChar)))
            # Never serve files outside the app folder.
            if (-not $file.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
                $response.StatusCode = 403
            } else {
                # Single page app: unknown routes without extension fall back to index.html.
                if (-not (Test-Path -LiteralPath $file -PathType Leaf) -and -not [System.IO.Path]::HasExtension($file)) { $file = $index }
                if (Test-Path -LiteralPath $file -PathType Leaf) {
                    $ext = [System.IO.Path]::GetExtension($file).ToLowerInvariant()
                    $response.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
                    $response.Headers.Add('Cache-Control', 'no-cache')
                    $response.Headers.Add('X-Content-Type-Options', 'nosniff')
                    $bytes = [System.IO.File]::ReadAllBytes($file)
                    $response.ContentLength64 = $bytes.Length
                    if ($context.Request.HttpMethod -ne 'HEAD') { $response.OutputStream.Write($bytes, 0, $bytes.Length) }
                } else {
                    $response.StatusCode = 404
                }
            }
        } catch {
            try { $response.StatusCode = 500 } catch { }
        } finally {
            $response.Close()
        }
        $served++
        if ($MaxRequests -gt 0 -and $served -ge $MaxRequests) { break }
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
