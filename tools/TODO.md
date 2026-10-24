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
- [ ] **server.exe is unsigned but currently not blocked**, and this works only by accident. Tested on 2026-10-24 with the 1.4.0.307 build and with a modified copy whose hash Windows had never seen: both started with Smart App Control on, and no CodeIntegrity event was logged. Probable reason (not confirmed): the base binary `build_tools/windows-x64-24.22.1` still contains the certificate table entry and signature data of the official node.exe. postject added the SEA blob after it, so that entry now points into section data. `Get-AuthenticodeSignature` reports `NotSigned`, but Code Integrity seems to accept the file. The same stale entry makes `Set-AuthenticodeSignature` fail on server.exe ("%1 is not a valid Win32 application"). If a Node, postject or Windows update breaks this, fix both of these together:
  1. Clear the stale certificate table entry (data directory 4: offset and size) in `build_base.bat` after postject, and once in the committed base binary.
  2. Sign server.exe as the last step of `compile_to_dist.bat` (after verpatch and ResourceHacker). It's rebuilt each time, so it can't be signed once like the files here. `sea-boot.js` searches the last 16 KB of the exe for its payload sentinel, so an appended signature (a few KB) doesn't break startup.

  Step 1 alone would probably get server.exe blocked, so never do it without step 2.
- [ ] mongod.exe (embedded as base64 in `node_components/mongodb_server/bin/mongod_w64.js`, extracted to `%TEMP%\ffastrans_webinterface`) is **not signed**. Its runtime dlls are signed by Microsoft. It runs anyway, most likely through Smart App Control's cloud reputation for the official MongoDB build. Signing it would mean re-encoding the base64 file and losing that reputation, so it's left as is. Re-check when updating MongoDB.
