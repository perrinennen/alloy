function readCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(";");
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1, c.length);
    }

    if (c.indexOf(nameEQ) == 0) {
      return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
}

//In this app's current form consent manager doesn't do anything...
//var consent = new Consent();

// Retrieve existing consent.
//var previousPermissions = readCookie("optin");
//var preOptInApprovals = {"aa":true}

var visitor = Visitor.getInstance("97D1F3F459CE0AD80A495CBE@AdobeOrg", {
  doesOptInApply: function() {
    return true;
  },
  //previousPermissions: previousPermissions,
  //preOptInApprovals: preOptInApprovals,
  //optInCookieDomain: "foo.bar"
  isOptInStorageEnabled: true,
  optInStorageExpiry: 60 * 60 * 24 * 30 // One month in seconds
});
