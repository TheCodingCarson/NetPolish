# Initialize variables to store the count of changes and a list of changed files
$changeCount = 0
$changedFiles = @()

# Get the parent directory of the current directory
$parentDir = Split-Path -Path $currentDir -Parent

# Set the directory to "Firefox" inside the parent directory
$firefoxDirectory = Join-Path -Path $parentDir -ChildPath "Firefox" Set-Location -Path $firefoxDirectory

# Recursively iterate through each file
Get-ChildItem -Path $firefoxDirectory -Recurse | ForEach-Object {
    # Check if the item is a file and the extension is not ".ps1" or ".md"
    if (($_ -is [System.IO.FileInfo]) -and
        (-not ($_.Extension -eq ".ps1" -or $_.Extension -eq ".md"))) {
        # Read the file's content
        $content = Get-Content $_.FullName -Raw

        # Check if the content contains "chrome."
        if ($content -match 'chrome\.') {
            # Replace "chrome." with "browser."
            $newContent = $content -replace 'chrome\.', 'browser.'

            # Write the modified content back to the file
            Set-Content -Path $_.FullName -Value $newContent

            # Update the count of changes and the list of changed files
            $changeCount += ($newContent.Length - $content.Length)
            $changedFiles += $_.FullName
        }
    }
}

# Output the summary
Write-Host "Total changes made: $changeCount"
Write-Host "Changed files:"
$changedFiles | ForEach-Object { Write-Host $_ }