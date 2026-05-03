$timestamp = (Get-Date).ToString('yyyyMMddHHmmss')
$email = "devadmin+$timestamp@example.com"
$password = 'DevP@ssw0rd!'
Write-Host "Using email: $email"

$reg = @{
    FullName = 'Dev Admin'
    Username = "devadmin$timestamp"
    Email = $email
    Password = $password
    ConfirmPassword = $password
} | ConvertTo-Json

Write-Host "\n1) Registering new user..."
try {
    $r = Invoke-RestMethod -Uri 'http://localhost:5271/api/Auth/register' -Method Post -Body $reg -ContentType 'application/json' -UseBasicParsing -TimeoutSec 15
    Write-Host "Register response:"; $r | ConvertTo-Json -Depth 5
} catch {
    if ($_.Exception.Response -ne $null) {
        $resp = $_.Exception.Response
        Write-Host "Register failed: $($resp.StatusCode)"
        $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $body = $reader.ReadToEnd()
        Write-Host $body
    } else {
        Write-Host "Register request failed:"; Write-Host $_.Exception.Message
    }
}

$prom = @{ email = $email } | ConvertTo-Json
Write-Host "\n2) Promoting to Admin (dev endpoint)..."
try {
    $r2 = Invoke-RestMethod -Uri 'http://localhost:5271/api/Dev/make-admin-by-email' -Method Post -Body $prom -ContentType 'application/json' -UseBasicParsing -TimeoutSec 15
    Write-Host "Promote response:"; $r2 | ConvertTo-Json -Depth 5
} catch {
    if ($_.Exception.Response -ne $null) {
        $resp = $_.Exception.Response
        Write-Host "Promote failed: $($resp.StatusCode)"
        $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $body = $reader.ReadToEnd()
        Write-Host $body
    } else {
        Write-Host "Promote request failed:"; Write-Host $_.Exception.Message
    }
}

$login = @{ Email = $email; Password = $password } | ConvertTo-Json
Write-Host "\n3) Logging in to get JWT..."
try {
    $r3 = Invoke-RestMethod -Uri 'http://localhost:5271/api/Auth/login' -Method Post -Body $login -ContentType 'application/json' -UseBasicParsing -TimeoutSec 15
    Write-Host "Login response:"; $r3 | ConvertTo-Json -Depth 5
    $token = $null
    if ($r3.data -ne $null -and $r3.data.token -ne $null) { $token = $r3.data.token }
    elseif ($r3.token -ne $null) { $token = $r3.token }
    elseif ($r3.accessToken -ne $null) { $token = $r3.accessToken }
    if ($token -ne $null) {
        Write-Host "\n4) Decoding JWT payload..."
        $parts = $token -split '\.'
        if ($parts.Length -ge 2) {
            $payload = $parts[1]
            $pad = '=' * ((4 - ($payload.Length % 4)) % 4)
            $decoded = [System.Text.Encoding]::Utf8.GetString([Convert]::FromBase64String($payload.Replace('-','+').Replace('_','/') + $pad))
            Write-Host $decoded
        } else {
            Write-Host "Token not in expected JWT format."
        }
    } else {
        Write-Host "Token not found in login response."
    }
} catch {
    if ($_.Exception.Response -ne $null) {
        $resp = $_.Exception.Response
        Write-Host "Login failed: $($resp.StatusCode)"
        $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $body = $reader.ReadToEnd()
        Write-Host $body
    } else {
        Write-Host "Login request failed:"; Write-Host $_.Exception.Message
    }
}

Write-Host "\nCredentials to use in frontend login:"
Write-Host "Email: $email"
Write-Host "Password: $password"
