Add-Type -AssemblyName System.Drawing
$colors = [System.Drawing.ColorTranslator]::FromHtml('#E2401C')
$sizes = @(192, 512)
foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    $graphics.Clear($colors)
    $font = New-Object System.Drawing.Font("Arial", ($size/2), [System.Drawing.FontStyle]::Bold)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
    $graphics.DrawString("S", $font, $brush, $rect, $format)
    
    $path = "c:\Users\Nikhil Raj\Desktop\SwaDDo\swaddo-customer-app\public\icons\icon-$sizex$size.png"
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    
    if ($size -eq 512) {
        $maskablePath = "c:\Users\Nikhil Raj\Desktop\SwaDDo\swaddo-customer-app\public\icons\icon-maskable-512x512.png"
        $bmp.Save($maskablePath, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    
    $graphics.Dispose()
    $bmp.Dispose()
}
