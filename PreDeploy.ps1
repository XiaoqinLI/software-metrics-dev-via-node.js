
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

  Stop-Service $svcName
  $svc = Get-Service $svcName

  $svc.WaitForStatus('Stopped','00:00:30')

  }
Else
{
  'Service ' + $svcName + ' does not exists'
}