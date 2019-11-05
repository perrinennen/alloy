// Initialize AppMeasurement
var s_account = "ujslatest";
var s = s_gi(s_account);

s.visitor = Visitor.getInstance("97D1F3F459CE0AD80A495CBE@AdobeOrg");
// s.visitorNamespace = "gdprsummit";

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
