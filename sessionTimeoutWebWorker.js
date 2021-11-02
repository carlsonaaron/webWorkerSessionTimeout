// Triggered by postMessage in the page
var expirationTime, popupTime;

onmessage = function (evt) {
    let intervalId;    
    
    switch(evt.data.message) {
        case 'resetSessionTimer':
            clearInterval(intervalId);
            break;
        case 'updatedTimes':
            popupTime = evt.data.popupTime;
            expirationTime = evt.data.expirationTime;
            break;
        case 'startTimer':
            popupTime = evt.data.popupTime;
            expirationTime = evt.data.expirationTime;
            startSessionTimer();
            break;
    }

    
    function startSessionTimer() {        
        intervalId = setInterval(function () {
            postMessage({ message: 'getUpdatedTimes' });
            
            let currentTime = new Date().getTime();
            let msUntilPopup = popupTime ? (popupTime - currentTime) : null;
            let msUntilExpired = expirationTime ? (expirationTime - currentTime) : null;

            if (!msUntilExpired || msUntilExpired <= 0) {
                postMessage({ message: `sessionExpired` });
                return;
            }

            let secondsRemainingUntilPopup = (msUntilPopup / 1000);                                                        

            if (secondsRemainingUntilPopup > 0) {                
                postMessage({ message: 'popupIsHidden', secondsRemaining: secondsRemainingUntilPopup });
            } else {                
                postMessage({ message: 'popupIsVisible' });
                
                let minutesRemainingUntilExpiration = parseInt((msUntilExpired / 1000) / 60);
                let secondsRemainingUntilExpiration = parseInt((msUntilExpired / 1000) % 60);
                let displayTimeLeft = `${minutesRemainingUntilExpiration}:${secondsRemainingUntilExpiration.toString().padStart(2,'0')}`;
                postMessage({ message: `timeUntilExpired`, val: displayTimeLeft });               
            }            
        }, 500);
    }
}