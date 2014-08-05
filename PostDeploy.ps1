
Function ServiceExists([string] $ServiceName) {
    [bool] $Return = $False
    if ( Get-WmiObject -Class Win32_Service -Filter "Name='$ServiceName'" ) {
        $Return = $True
    }
    Return $Return
}


$svcName = "StatusBoard"

If (ServiceExists($svcName))
{
  'Service ' + $svcName + ' exists.'
   bin\nssm set $svcName Application $env:ProgramFiles"\Nodejs\node.exe"

  Start-Service $svcName
  }
Else
{
  'Service ' + $svcName + ' does not exists'

  bin\nssm install $svcName $env:ProgramFiles"\Nodejs\node.exe" $PSScriptRoot\node_modules\atlasboard\lib\cli\cli.js
  bin\nssm set $svcName AppDirectory $PSScriptRoot

  Start-Service $svcName
}