// Initialize AppMeasurement
var s_account = "gdprsummit";
var s = s_gi(s_account);

s.visitor = Visitor.getInstance("65453EA95A70434F0A495D34@AdobeOrg");
// s.visitorNamespace = "gdprsummit";
s.loadModule("AudienceManagement");
s.AudienceManagement.setup({
  partner: "adobesummit2018",
  secureDataCollection: false,
  visitorService: {
    namespace: "65453EA95A70434F0A495D34@AdobeOrg"
  },
  mockOptOut: false
});

/* Link Tracking Config */
s.trackDownloadLinks = true;
s.trackExternalLinks = true;
s.trackInlineStats = true;
s.linkDownloadFileTypes =
  "exe,zip,wav,mp3,mov,mpg,avi,wmv,pdf,doc,docx,xls,xlsx,ppt,pptx";
s.linkInternalFilters = "javascript:";
s.linkLeaveQueryString = false;
s.linkTrackVars = "None";
s.linkTrackEvents = "None";

s.trackingServer = "b.sc.omtrdc.net";

s.eVar1 = "GDPR Plugin";
s.pageName = "GDPR Functional Test page";
s.t();
