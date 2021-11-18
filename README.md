# webWorkerSessionTimeout
- Utilizing web workers to prevent timer from being affected by minimized/"sleeping" tabs "sleepy" state and processing is greatly reduced.
- Uses LocalStorage to allow for multiple tabs to maintain synchronized session timers 
  - WebWorkers cannot directly access LocalStorage, so sending messages between LS and the WebWorker is used to keep tabs in sync
- Displays countdown in the browser tab title once countdown begins
- Note: 
    - I'm not sure how a minimized/sleepy tab would handle messages from the web worker since it may not actively be able to process to the message.  
    - Not sure if the messages that were sent from the webWorker will be processed after the tab comes back into focus.  
    - Ideally, the webWorker could just delete the sessions expiration times from LocalStorage, however webWorkers cannot access LocalStorage directly
    - This should be tested    
    - UPDATE: I've tested this fairly extensively on another project and it appeared to work as expected for over 90 minutes

## Implementation details
### Initialize at application start
```js 
  var minutesUntilPopup = 27;
  var minutesUntilTimeout = 29;
  var sessionTimeoutPopupSelector = '#session-timeout-popup';
  var expirationCountdownSelector = '#expiration-countdown';
  var timeOutUrl = '/Account/Logoff';
  var logOutUrl = '/Account/Logoff';
  var continueSessionUrl = '/Account/KeepAlive';

  initializeSessionTimeout(
      minutesUntilPopup,
      minutesUntilTimeout,
      sessionTimeoutPopupSelector,
      expirationCountdownSelector,
      timeOutUrl,
      logOutUrl,
      continueSessionUrl
  );
```
### Axios and ajax response interceptors to reset the sessionTimer when Web API responses are received
```js
  // Add a 401 response interceptor
  window.axios.interceptors.response.use(
      function (response) {
          sessionTimeout.resetSessionTimer();
          return response;
      },
      function (error) {
          if (error.response.status == 401) {
              if (error.response.location) {
                  window.location = error.response.location;
              }
              else {
                  window.location = '/';
              }
          }
          else {
              return Promise.reject(error);
          }

          sessionTimeout.resetSessionTimer();
      }
  );

  $(document).ajaxSuccess(function(event, xhr, settings) {
      sessionTimeout.resetSessionTimer();
  });
```

### .NET Core Web API KeepAlive session refresh method
```C#
[HttpGet]
[Authorize]
public IActionResult KeepAlive()
{
    return Ok();
}
```
