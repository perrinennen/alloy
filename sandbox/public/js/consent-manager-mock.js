(function() {
  function Consent() {
    var consent = this;
    var cookieName = "optin";
    // var consentUI = document.querySelector(uiSelector);
    // On load, detect if consent has been granted previously:
    // - If not, show the Give / Deny Consent buttons.
    // - If yes, don't do anything.

    function showUI() {
      //consentUI.style.visibility = "visible";
    }

    function hideUI() {
      //consentUI.style.visibility = "hidden";
    }

    consent.approve = function(approvals) {
      var date = new Date();
      date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000);
      var expires = "; expires=" + date.toGMTString();

      document.cookie =
        cookieName + "=" + approvals + expires + ";path=/;domain=" + "";

      hideUI();
    };

    consent.deny = consent.approve;

    consent.isConsentApproved = function() {
      return document.cookie.indexOf(cookieName) > -1;
    };

    function init() {
      if (consent.isConsentApproved()) {
        hideUI();
        return;
      }

      showUI();
    }

    init();
  }

  window.Consent = Consent;
})();
