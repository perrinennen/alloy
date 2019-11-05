(function() {
  function target() {
    function generateOffer(el) {
      el.innerHTML = "<h1>HERE'S YOUR AWESOME BANNER!<h1>";
    }

    function generateOfferOnEvent(el, msg) {
      el.innerHTML =
        msg || "<h1>HERE'S AN UPDATED OFFER FROM EVENT CHANGE!<h1>";
    }

    return {
      getMbox: function(selector) {
        // Get MID, after checking for Opt In.
        var visitor = Visitor.getInstance("5D7236525AA6D9580A495C6C@AdobeOrg");
        var optIn = adobe.optIn;
        var offerEl = document.querySelector(selector);
        var shouldAutoSubscribe = true;

        optIn.fetchPermissions(function() {
          if (optIn.isApproved([optIn.Categories.TARGET])) {
            generateOfferOnEvent(offerEl);
          } else {
            generateOfferOnEvent(
              offerEl,
              "<h1>EVENT CHANGE: TARGET IS NOW DENIED!<h1>"
            );
          }
        }, shouldAutoSubscribe);
      }
    };
  }

  window.adobe = window.adobe || {};
  window.adobe.target = target();

  window.target = target();
})();
