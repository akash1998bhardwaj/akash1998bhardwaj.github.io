Add-Type -AssemblyName System.Drawing

$srcDir = "d:\akash\myportfolio\assets\images\figma"
$destDir = "d:\akash\myportfolio\assets\images\figma\thumbs"

if (!(Test-Path -Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir | Out-Null
}

$images = Get-ChildItem -Path $srcDir -Filter "*.png"

foreach ($img in $images) {
    Write-Host "Compressing $($img.Name)..."
    $srcPath = $img.FullName
    
    # Save as .jpg for max compression
    $destPath = Join-Path -Path $destDir -ChildPath ($img.BaseName + ".jpg")
    
    if (Test-Path -Path $destPath) {
        Write-Host "Skipping $($img.Name), already exists."
        continue
    }

    $image = [System.Drawing.Image]::FromFile($srcPath)
    
    # Target width 800px, calculate height keeping aspect ratio
    $targetWidth = 800
    $ratio = $targetWidth / $image.Width
    $targetHeight = [math]::Floor($image.Height * $ratio)

    $bitmap = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # High quality scaling
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($image, 0, 0, $targetWidth, $targetHeight)

    # Save as JPEG with specific quality
    $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]60)

    $bitmap.Save($destPath, $jpegCodec, $encoderParams)

    $graphics.Dispose()
    $bitmap.Dispose()
    $image.Dispose()
    Write-Host "Done $($img.Name)"
}
Write-Host "All compression finished."
