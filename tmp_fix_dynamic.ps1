$files = Get-ChildItem -Path "src\app\(admin)", "src\app\(cluber)", "src\app\(rider)" -Filter "page.tsx" -Recurse
foreach ($file in $files) {
    Write-Output "Processing $($file.FullName)..."
    $content = Get-Content $file.FullName
    $hasDynamic = $false
    foreach ($line in $content) {
        if ($line -match "export const dynamic = .force-dynamic.") {
            $hasDynamic = $true
            break
        }
    }
    
    if (-not $hasDynamic) {
        if ($content.Length -gt 0 -and $content[0] -match "use client") {
            $newContent = @($content[0], "", "export const dynamic = 'force-dynamic';", "") + $content[1..($content.Length-1)]
        } else {
            $newContent = @("export const dynamic = 'force-dynamic';", "") + $content
        }
        $newContent | Set-Content $file.FullName -Force
        Write-Output "Updated $($file.FullName)"
    } else {
        Write-Output "Already has force-dynamic: $($file.FullName)"
    }
}
