# Battle Bros: Free CC0 Character Sprite Downloader
# Run from project root: .\setup-assets.ps1
# License: All Kenney.nl assets are CC0 (Public Domain) - no attribution required

$ErrorActionPreference = "SilentlyContinue"
$assetsDir = "client\public\assets\characters"
$tmpDir    = "$env:TEMP\bb_assets_dl"

Write-Host "=== Battle Bros Asset Setup ===" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $assetsDir | Out-Null
New-Item -ItemType Directory -Force -Path $tmpDir    | Out-Null

function Download-And-Extract($name, $url) {
    $zip = "$tmpDir\$name.zip"
    $out = "$tmpDir\$name"
    Write-Host "Downloading $name ..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing -TimeoutSec 60
    if (Test-Path $zip) {
        Expand-Archive -Path $zip -DestinationPath $out -Force
        Write-Host "  OK" -ForegroundColor Green
        return $out
    }
    Write-Host "  FAILED" -ForegroundColor Red
    return $null
}

function CopyTile($srcDir, $tileNum, $destId) {
    if (-not $srcDir) { return }
    $padded = $tileNum.ToString("0000")
    $f = Get-ChildItem -Path $srcDir -Filter "tile_$padded.png" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($f) {
        Copy-Item $f.FullName "$assetsDir\$destId.png" -Force
        Write-Host "  tile_$padded -> $destId.png" -ForegroundColor DarkGray
    }
}

# Kenney Tiny Dungeon (CC0) — 16x16 tile sprites, tiles 80-131 are characters + monsters
$td = Download-And-Extract "tiny-dungeon" "https://kenney.nl/media/pages/assets/tiny-dungeon/f8422efb44-1674742415/kenney_tiny-dungeon.zip"

# Map tile numbers to character IDs
# Tiles 80-93: Humanoid characters (warriors, mages, rogues)
# Tiles 94-109: Creatures and monsters
# Tiles 110-131: More characters + special units
CopyTile $td  80 "titan_grunt"
CopyTile $td  81 "lady_vex"
CopyTile $td  82 "jade_monk"
CopyTile $td  83 "shadow_rogue"
CopyTile $td  84 "iron_bro"
CopyTile $td  85 "thunder_chief"
CopyTile $td  86 "arrow_jack"
CopyTile $td  87 "volt_ranger"
CopyTile $td  88 "blaze_witch"
CopyTile $td  89 "frostborn"
CopyTile $td  90 "crystal_sage"
CopyTile $td  91 "wing_knight"
CopyTile $td  92 "forge_dwarf"
CopyTile $td  93 "bone_shard"
CopyTile $td  94 "toxin_toad"
CopyTile $td  95 "neon_wraith"
CopyTile $td  96 "stone_golem"
CopyTile $td  97 "sea_crusher"
CopyTile $td  98 "skywing"
CopyTile $td  99 "pyro_drake"

# Summary
$n = (Get-ChildItem -Path $assetsDir -Filter "*.png" -ErrorAction SilentlyContinue | Measure-Object).Count
Write-Host ""
Write-Host "Done: $n / 20 sprites in $assetsDir" -ForegroundColor Cyan
Remove-Item $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Run: cd client && npm run dev" -ForegroundColor Gray
