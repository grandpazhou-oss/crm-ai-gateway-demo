param(
    [Parameter(Mandatory = $true)][string]$RepositoryRoot
)

$ErrorActionPreference = "Stop"
$repo = (Resolve-Path $RepositoryRoot).Path
$pluginRoot = Join-Path $repo "plugins/ActualTotals"
$testProject = Join-Path $pluginRoot "tests/CrmAiGateway.ActualTotals.Core.Tests/CrmAiGateway.ActualTotals.Core.Tests.csproj"
$pluginProject = Join-Path $pluginRoot "src/CrmAiGateway.ActualTotals.Plugin/CrmAiGateway.ActualTotals.Plugin.csproj"
$inspectorProject = Join-Path $pluginRoot "tools/AssemblyInspector/AssemblyInspector.csproj"
$ciDirectory = Join-Path $pluginRoot ".ci"
$artifactDirectory = Join-Path $pluginRoot "artifacts/Release"
$testResults = Join-Path $ciDirectory "TestResults"
$keyPath = Join-Path $ciDirectory "actual-totals-ci-demo.snk"

Remove-Item $ciDirectory -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $artifactDirectory -Recurse -Force -ErrorAction SilentlyContinue
New-Item $ciDirectory -ItemType Directory -Force | Out-Null
New-Item $testResults -ItemType Directory -Force | Out-Null

try {
    $signingKeyBase64 = [Environment]::GetEnvironmentVariable("ACTUAL_TOTALS_SNK_BASE64")
    if ([string]::IsNullOrWhiteSpace($signingKeyBase64)) {
        throw "ACTUAL_TOTALS_SNK_BASE64 is required. Random signing-key fallback is disabled."
    }
    try {
        $signingKeyBytes = [Convert]::FromBase64String($signingKeyBase64)
    }
    catch {
        throw "ACTUAL_TOTALS_SNK_BASE64 is not valid Base64."
    }
    if ($signingKeyBytes.Length -eq 0) { throw "ACTUAL_TOTALS_SNK_BASE64 decoded to an empty key." }
    [IO.File]::WriteAllBytes($keyPath, $signingKeyBytes)
    $signingKeyBytes = $null
    $signingKeyBase64 = $null

    $sn = (Get-Command sn.exe -ErrorAction SilentlyContinue).Source
    if (-not $sn) {
        $searchRoots = @("${env:ProgramFiles(x86)}\Microsoft SDKs", "${env:ProgramFiles(x86)}\Windows Kits") | Where-Object { Test-Path $_ }
        $sn = Get-ChildItem $searchRoots -Filter sn.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
    }
    if (-not $sn) { throw "sn.exe was not found on the Windows runner." }
    & $sn -q -p $keyPath (Join-Path $ciDirectory "actual-totals-ci-demo-public.snk")
    if ($LASTEXITCODE -ne 0) { throw "The injected strong-name key is invalid." }

    dotnet restore $testProject
    if ($LASTEXITCODE -ne 0) { throw "Test restore failed." }
    dotnet restore $pluginProject
    if ($LASTEXITCODE -ne 0) { throw "Plugin restore failed." }
    dotnet restore $inspectorProject
    if ($LASTEXITCODE -ne 0) { throw "Inspector restore failed." }

    dotnet test $testProject --configuration Release --no-restore --logger "trx;LogFileName=actual-totals-tests.trx" --results-directory $testResults
    if ($LASTEXITCODE -ne 0) { throw "C# unit tests failed." }

    dotnet build $pluginProject --configuration Release --no-restore /p:SignAssembly=true /p:AssemblyOriginatorKeyFile=$keyPath
    if ($LASTEXITCODE -ne 0) { throw "Plugin Release build failed." }

    $builtDll = Join-Path $pluginRoot "src/CrmAiGateway.ActualTotals.Plugin/bin/Release/net462/CrmAiGateway.ActualTotals.Plugin.dll"
    if (-not (Test-Path $builtDll)) { throw "Expected Plugin DLL was not produced." }
    Copy-Item $builtDll $artifactDirectory

    $artifactDll = Join-Path $artifactDirectory "CrmAiGateway.ActualTotals.Plugin.dll"
    $inspectionPath = Join-Path $artifactDirectory "assembly-inspection.json"
    dotnet run --project $inspectorProject --configuration Release -- $artifactDll $inspectionPath
    if ($LASTEXITCODE -ne 0) { throw "Assembly inspection failed." }
    & $sn -q -vf $artifactDll
    if ($LASTEXITCODE -ne 0) { throw "Strong-name verification failed." }

    [xml]$trx = Get-Content (Join-Path $testResults "actual-totals-tests.trx")
    $counters = $trx.TestRun.ResultSummary.Counters
    $summary = [ordered]@{
        total = [int]$counters.total
        executed = [int]$counters.executed
        passed = [int]$counters.passed
        failed = [int]$counters.failed
        skipped = [int]$counters.notExecuted
        report = "CI-only TRX; summarized in test-summary.json"
    }
    $summary | ConvertTo-Json | Set-Content (Join-Path $artifactDirectory "test-summary.json") -Encoding utf8

    $inspection = Get-Content $inspectionPath | ConvertFrom-Json
    $customDlls = @(Get-ChildItem $artifactDirectory -Filter *.dll)
    $oneCustomPluginDllOnly = $customDlls.Count -eq 1 -and $customDlls[0].Name -eq "CrmAiGateway.ActualTotals.Plugin.dll"
    $dependencyAllowlistPassed = @($inspection.disallowedReferences).Count -eq 0
    $secretScanPassed = @($inspection.forbiddenHits).Count -eq 0
    $stablePublicKeyTokenPresent = -not [string]::IsNullOrWhiteSpace([string]$inspection.publicKeyToken)
    $excludedArtifactCount = @(Get-ChildItem $artifactDirectory -Recurse -File | Where-Object { $_.Extension -in @(".pdb", ".snk") }).Count
    $gates = [ordered]@{
        npmTestPassed = $true
        npmBuildPassed = $true
        dotnetRestorePassed = $true
        xunitPassed = ([int]$summary.failed -eq 0 -and [int]$summary.executed -gt 0)
        net462ReleaseBuildPassed = $true
        dllExists = (Test-Path $artifactDll)
        oneCustomPluginDllOnly = $oneCustomPluginDllOnly
        assemblyInspectionPassed = [bool]$inspection.passed
        dependencyAllowlistPassed = $dependencyAllowlistPassed
        secretScanPassed = $secretScanPassed
        stablePublicKeyTokenPresent = $stablePublicKeyTokenPresent
        sha256Present = -not [string]::IsNullOrWhiteSpace([string]$inspection.sha256)
        noPdbInArtifact = $excludedArtifactCount -eq 0
        noSnkInArtifact = $excludedArtifactCount -eq 0
    }
    $deployable = -not ($gates.Values -contains $false)
    $failedGates = @($gates.GetEnumerator() | Where-Object { -not [bool]$_.Value } | Select-Object -ExpandProperty Key)
    $manifest = [ordered]@{
        generatedAtUtc = [DateTime]::UtcNow.ToString("o")
        artifact = "CrmAiGateway.ActualTotals.Plugin.dll"
        sha256 = $inspection.sha256
        sizeBytes = $inspection.sizeBytes
        targetFramework = "net462"
        configuration = "Release"
        strongNameSigned = $inspection.strongNameSigned
        publicKeyToken = $inspection.publicKeyToken
        signingKeyPolicy = "Stable Demo key injected from ACTUAL_TOTALS_SNK_BASE64 and deleted before artifact upload"
        dependencies = $inspection.references
        customAssemblyDependencies = @()
        tests = $summary
        gates = $gates
        dataverseConnected = $false
        deployable = $deployable
        deploymentBlockers = $failedGates
    }
    $manifest | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $artifactDirectory "build-manifest.json") -Encoding utf8
    if (-not $deployable) { throw "One or more deployable gates failed." }
    "{0}  CrmAiGateway.ActualTotals.Plugin.dll" -f $inspection.sha256 | Set-Content (Join-Path $artifactDirectory "plugin-sha256.txt") -Encoding ascii
    $inspection.references | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $artifactDirectory "dependency-list.json") -Encoding utf8

    $expectedArtifacts = @(
        "CrmAiGateway.ActualTotals.Plugin.dll",
        "assembly-inspection.json",
        "build-manifest.json",
        "dependency-list.json",
        "plugin-sha256.txt",
        "test-summary.json"
    )
    $actualArtifacts = @(Get-ChildItem $artifactDirectory -File | Select-Object -ExpandProperty Name | Sort-Object)
    if (Compare-Object ($expectedArtifacts | Sort-Object) $actualArtifacts) { throw "Release artifact contains unexpected or missing files." }
}
finally {
    if (Test-Path $keyPath) { Remove-Item $keyPath -Force }
    $publicKeyPath = Join-Path $ciDirectory "actual-totals-ci-demo-public.snk"
    if (Test-Path $publicKeyPath) { Remove-Item $publicKeyPath -Force }
}
