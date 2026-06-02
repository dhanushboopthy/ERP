# Quick Route Guard Application Script
# Use this PowerShell script to identify which pages still need RouteGuard

Write-Host "`n=== ROUTE GUARD STATUS CHECK ===" -ForegroundColor Cyan
Write-Host "Scanning all protected pages for RouteGuard implementation...`n"

$totalPages = 0
$protectedPages = 0
$unprotectedPages = @()

# Define protected route patterns
$protectedPaths = @(
    "frontend/src/app/(dashboard)/masters/**",
    "frontend/src/app/(dashboard)/sizing/**",
    "frontend/src/app/(dashboard)/reports/**",
    "frontend/src/app/(dashboard)/settings/**"
)

foreach ($pattern in $protectedPaths) {
    $files = Get-ChildItem -Path $pattern -Filter "page.tsx" -Recurse -ErrorAction SilentlyContinue
    
    foreach ($file in $files) {
        $totalPages++
        $content = Get-Content $file.FullName -Raw
        
        if ($content -match "RouteGuard") {
            $protectedPages++
            Write-Host "✅ $($file.FullName)" -ForegroundColor Green
        } else {
            $unprotectedPages += $file.FullName
            Write-Host "❌ $($file.FullName)" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Total Protected Pages: $totalPages"
Write-Host "With RouteGuard: $protectedPages" -ForegroundColor Green
Write-Host "Missing RouteGuard: $($unprotectedPages.Count)" -ForegroundColor Red
Write-Host "Coverage: $([math]::Round(($protectedPages / $totalPages) * 100, 2))%`n"

if ($unprotectedPages.Count -gt 0) {
    Write-Host "=== PAGES NEEDING PROTECTION ===" -ForegroundColor Yellow
    foreach ($page in $unprotectedPages) {
        Write-Host "  - $page"
    }
    
    Write-Host "`nNext Steps:" -ForegroundColor Cyan
    Write-Host "1. Apply RouteGuard to each page above"
    Write-Host "2. Use ROUTE_GUARD_IMPLEMENTATION_GUIDE.md for pattern"
    Write-Host "3. Re-run this script to verify`n"
} else {
    Write-Host "`n🎉 ALL PAGES PROTECTED! Ready for production.`n" -ForegroundColor Green
}
