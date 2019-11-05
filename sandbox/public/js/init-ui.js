function removeCookie(name) {
  document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

function removeAllCookies() {
  var cookies = document.cookie.split(";");
  cookies.forEach(function(cookie) {
    removeCookie(cookie.split("=")[0]);
  });
}

var midEl = document.querySelector(".mid");
var uuidEl = document.querySelector(".uuid");
var btnGive = document.querySelector(".btnGive");
var btnDeny = document.querySelector(".btnDeny");
var btnGetMid = document.querySelector(".btnGetMid");
var btnGetUuid = document.querySelector(".btnGetUuid");
var loading = document.querySelector(".loading");
var btnDeleteCookies = document.querySelector(".btnDeleteCookies");
var btnGlobalUI = document.querySelector(".btnGlobalUI");
var btnWizardUI = document.querySelector(".btnWizardUI");
var btnMultipleUI = document.querySelector(".btnMultipleUI");
var btnIabUI = document.querySelector(".btnIabUI");
var allConsentUIs = document.querySelectorAll(".consent-ui > div");

function hideAllConsentUIs() {
  allConsentUIs.forEach(function(ui) {
    ui.style.display = "none";
  });
}

function show(el) {
  el.style.display = "block";
}

function showConsentUI(el) {
  hideAllConsentUIs();
  show(el);
}

btnGlobalUI.addEventListener("click", function() {
  showConsentUI(document.querySelector(".global"));
});

btnWizardUI.addEventListener("click", function() {
  showConsentUI(document.querySelector(".wizard"));
});

btnMultipleUI.addEventListener("click", function() {
  showConsentUI(document.querySelector(".multiple"));
});

!!btnIabUI &&
  btnIabUI.addEventListener("click", function() {
    showConsentUI(document.querySelector(".iab-standard"));
  });

btnDeleteCookies.addEventListener("click", function() {
  removeAllCookies();
  document.location.reload();
});

function makeConsentAction(action) {
  return function() {
    adobe.optIn[action === "approve" ? "approveAll" : "denyAll"]();
    //consent[action](JSON.stringify(adobe.optIn.permissions));
  };
}

// var dil = DIL.create({
//    partner: "gdprsummit",
//    visitorService: {
//        namespace: "65453EA95A70434F0A495D34@AdobeOrg"
//    }
// });

btnGive.addEventListener("click", makeConsentAction("approve"));
btnDeny.addEventListener("click", makeConsentAction("deny"));

!!btnGetMid &&
  btnGetMid.addEventListener("click", function() {
    if (!adobe.optIn.isApproved("ecid")) {
      midEl.innerHTML =
        "MID cannot be retrieved. Visitor is waiting for Opt In";
      return;
    }

    visitor.getMarketingCloudVisitorID(function(mid) {
      midEl.innerHTML = mid;
    }, true);
  });

!!btnGetUuid &&
  btnGetUuid.addEventListener("click", function() {
    if (!adobe.optIn.isApproved("aam")) {
      uuidEl.innerHTML = "UUID cannot be retrieved. DIL is waiting for Opt In";
      return;
    }

    dil.api
      .afterResult(function(json) {
        uuidEl.innerHTML = json.uuid;
      })
      .submit();
  });

// Wizard
var btnAgreeOne = document.querySelector(".btnAgreeOne");
var btnAgreeTwo = document.querySelector(".btnAgreeTwo");
var btnAgreeThree = document.querySelector(".btnAgreeThree");
var btnAgreeFour = document.querySelector(".btnAgreeFour");

var btnDenyOne = document.querySelector(".btnDenyOne");
var btnDenyTwo = document.querySelector(".btnDenyTwo");
var btnDenyThree = document.querySelector(".btnDenyThree");
var btnDenyFour = document.querySelector(".btnDenyFour");

var btnWizard = document.querySelector(".btnWizard");
var screen1 = document.querySelector(".screen1");
var screen2 = document.querySelector(".screen2");
var screen3 = document.querySelector(".screen3");
var screen4 = document.querySelector(".screen4");
var screen99 = document.querySelector(".screen99");
var shouldWaitForComplete = true;

function makeWizard(action) {
  return function wizard(category, screenToHide, screenToShow) {
    //consent.deny();
    screenToHide.style.display = "none";
    screenToShow.style.display = "block";
    adobe.optIn[action](category, shouldWaitForComplete);
  };
}

var approvalWizard = makeWizard("approve");
var denialWizard = makeWizard("deny");

btnAgreeOne.addEventListener("click", function() {
  approvalWizard(adobe.optIn.Categories.ANALYTICS, screen1, screen2);
});
btnDenyOne.addEventListener("click", function() {
  denialWizard(adobe.optIn.Categories.ANALYTICS, screen1, screen2);
});

btnAgreeTwo.addEventListener("click", function() {
  approvalWizard(adobe.optIn.Categories.TARGET, screen2, screen3);
});
btnDenyTwo.addEventListener("click", function() {
  denialWizard(adobe.optIn.Categories.TARGET, screen2, screen3);
});

btnAgreeThree.addEventListener("click", function() {
  approvalWizard(adobe.optIn.Categories.ECID, screen3, screen4);
});
btnDenyThree.addEventListener("click", function() {
  denialWizard(adobe.optIn.Categories.ECID, screen3, screen4);
});

btnAgreeFour.addEventListener("click", function() {
  approvalWizard(adobe.optIn.Categories.AAM, screen4, screen99);
});
btnDenyFour.addEventListener("click", function() {
  denialWizard(adobe.optIn.Categories.AAM, screen4, screen99);
});
btnWizard.addEventListener("click", function() {
  adobe.optIn.complete();
  //consent.approve(JSON.stringify(adobe.optIn.permissions));
});

// Multiple
var btnSubmitPermissions = document.querySelector(".btnSubmitPermissions");

btnSubmitPermissions.addEventListener("click", function(ev) {
  //consent.deny();
  ev.preventDefault();
  loading.style.visibility = "visible";

  setTimeout(function() {
    multipleDiv = document.getElementsByClassName("multiple")[0];
    var allCheckboxes = Array.from(
      multipleDiv.querySelectorAll("input[type=checkbox]")
    );

    allCheckboxes.forEach(function(el) {
      if (el.checked) {
        adobe.optIn.approve(el.name, shouldWaitForComplete);
      } else {
        adobe.optIn.deny(el.name, shouldWaitForComplete);
      }
    });

    adobe.optIn.complete();
    //consent.approve(JSON.stringify(adobe.optIn.permissions));
    loading.style.visibility = "hidden";
  }, 1000);
});
