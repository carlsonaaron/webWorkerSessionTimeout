function initializeSessionTimeout(minutesUntilPopup, minutesUntilTimeout, sessionTimeoutPopupSelector, expirationCountdownSelector, timeOutUrl, logOutUrl, continueSessionUrl) {
    function createSessionTimeout() {
        var worker = new Worker("/js/sessionTimeoutWebWorker.js");        
        
        setExpirationAndPopupTimes();   
        startSessionTimer();

        let documentTitle = document.title;        

        worker.addEventListener("message", function (e) {
            switch (e.data.message) {
                case 'debug':
                    //console.log({ type: 'debug', message: e.data.debugMsg, val: e.data.debugVal });
                    break;
                case 'getUpdatedTimes':                    
                    worker.postMessage({ 
                        message: 'updatedTimes', 
                        popupTime: localStorage.getItem('popupTime'),
                        expirationTime: localStorage.getItem('expirationTime'),
                    });
                    break;                
                case 'popupIsVisible':
                    showPopup();                    
                    break;
                case 'popupIsHidden':
                    document.title = documentTitle;
                    hidePopup();
                    break;
                case 'timeUntilExpired':
                    document.title = `${documentTitle} (${e.data.val})`;
                    document.querySelector(expirationCountdownSelector).textContent = e.data.val;
                    break;
                case 'sessionExpired':
                    window.location.href = timeOutUrl;
                    break;                
                default:
                    break;
            }
        });

        function setExpirationAndPopupTimes() {
            var currentTime = new Date().getTime();

            let msUntilPopup = minutesUntilPopup * 60 * 1000;
            let msUntilTimeout = minutesUntilTimeout * 60 * 1000;

            localStorage.setItem('popupTime', new Date(currentTime + msUntilPopup).getTime());
            localStorage.setItem('expirationTime', new Date(currentTime + msUntilTimeout).getTime());
        }

        function startSessionTimer() {
            worker.postMessage({ 
                message: 'startTimer', 
                popupTime: localStorage.getItem('popupTime'),
                expirationTime: localStorage.getItem('expirationTime'),
            });
        }

        function continueSession() {
            axios.get(continueSessionUrl)
                .then(function () {
                    resetSessionTimer();
                })
                .catch(function () {
                    logout();
                });
        }

        function resetSessionTimer() {            
            hidePopup();
            setExpirationAndPopupTimes();
            startSessionTimer();
        }

        function logout() {
            localStorage.setItem('popupTime', null);
            localStorage.setItem('expirationTime', null);

            if ($("#session-timeout-popup.show").length == 0 && ($('input.changed-input').length || $('select.changed-input').length || $('textarea.changed-input').length)) {
                if (confirm('You have unsaved changes, do you want to continue?') == false) {
                    // do not load the panel
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    return false;
                }
            }
            window.location.href = logOutUrl;
        }

        function showPopup() {
            if (!$(sessionTimeoutPopupSelector).hasClass('show')) {
                $(sessionTimeoutPopupSelector).modal('show');
            }            
        }

        function hidePopup() {
            if ($(sessionTimeoutPopupSelector).hasClass('show')) {
                $(sessionTimeoutPopupSelector).modal('hide');                
            }
        }        

        return {
            continueSession: continueSession,
            resetSessionTimer: resetSessionTimer,
            logout: logout,
        };
    }

    if (!window.sessionTimeout) {
        window.sessionTimeout = createSessionTimeout();
    }
}
