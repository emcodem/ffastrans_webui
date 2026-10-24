# TODO: code signing of the bundled tools

## Why the binaries in this folder are signed

Windows 11 **Smart App Control** (in enforce mode) blocks unsigned exe and dll files, including ones the webinterface starts as child processes. Node then throws `spawn UNKNOWN`, and the CodeIntegrity event log (`Microsoft-Windows-CodeIntegrity/Operational`, events 3033/3077) shows the block. Users see missing thumbnails, a player that doesn't start, or tusd failing to start.

Every exe and dll in `tools/` that had no signature was signed on 2026-10-24 with a **self-signed** certificate (`CN=FFAStrans Webinterface`). Tested on Windows 11 25H2 (build 26200.9711): Smart App Control lets self-signed files run, even when the certificate isn't installed anywhere. Files that already had a trusted signature (Microsoft runtime dlls, MediaInfo) were left unchanged.

## When you add or update a binary in tools/

Sign every new or replaced exe/dll before committing, otherwise it gets blocked again. Run this from the repository root in PowerShell 7. It creates a throwaway certificate in memory and signs only files that are still unsigned:

```powershell
$rsa  = [System.Security.Cryptography.RSA]::Create(3072)
$req  = [System.Security.Cryptography.X509Certificates.CertificateRequest]::new('CN=FFAStrans Webinterface', $rsa, 'SHA256', [System.Security.Cryptography.RSASignaturePadding]::Pkcs1)
$eku  = [System.Security.Cryptography.OidCollection]::new(); $null = $eku.Add([System.Security.Cryptography.Oid]::new('1.3.6.1.5.5.7.3.3'))
$req.CertificateExtensions.Add([System.Security.Cryptography.X509Certificates.X509EnhancedKeyUsageExtension]::new($eku, $false))
$cert = $req.CreateSelfSigned((Get-Date).AddDays(-1), (Get-Date).AddYears(50))
Get-ChildItem tools -Recurse -File -Include *.exe,*.dll |
  Where-Object { (Get-AuthenticodeSignature $_.FullName).Status -eq 'NotSigned' } |
  ForEach-Object { Set-AuthenticodeSignature $_.FullName -Certificate $cert -HashAlgorithm SHA256 }
```

Check that nothing is left: `Get-ChildItem tools -Recurse -Include *.exe,*.dll | Get-AuthenticodeSignature | Where-Object Status -eq NotSigned` should return nothing. (Signed files show as `UnknownError` because the root isn't trusted. That's expected.)

## Open points

- [ ] Microsoft doesn't document that self-signed files pass Smart App Control. Re-test after big Windows updates on a machine with Smart App Control on. If self-signed stops working, switch to a trusted certificate (e.g. Azure Trusted Signing) and re-sign everything here.
- [ ] Cross-check on a second Windows 11 PC with Smart App Control on before a release.
- [ ] The built server exe (`build_tools/nexe_sea`) is created fresh by every build and is not covered by this. Smart App Control already blocked `build_tools\nexe_sea\windows-x64-24.22.1` once. Decide whether the build should sign its output.
- [ ] The MongoDB binaries extracted at startup (`node_components/mongodb_server`) were not checked.
