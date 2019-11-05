import { cookieJar } from "../../utils";
import { EXPERIENCE_CLOUD_ID, LEGACY_OPTIN } from "./constants/cookieNames";

export default (imsOrgId, migrateIds, optInEnabled, optIn) => {
  if (optInEnabled) {
    const storedOptIn = cookieJar.get(LEGACY_OPTIN);
    if (storedOptIn) {
      const optInstatus = Object.values(JSON.parse(storedOptIn)).every(
        val => val
      );
      if (optInstatus) {
        optIn.setPurposes("all");
      }
    }
  }
  return {
    getEcidFromAmcvCookie(identityCookieJar) {
      let ecid = null;
      if (migrateIds) {
        const amcvCookieValue = cookieJar.get(`AMCV_${imsOrgId}`);
        if (amcvCookieValue) {
          const reg = /MCMID\|(\d+)\|/;
          [, ecid] = amcvCookieValue.match(reg);
          identityCookieJar.set(EXPERIENCE_CLOUD_ID, ecid);
        }
      }
      return ecid;
    },
    createAmcvCookie(ecid) {
      if (migrateIds) {
        const amcvCookieValue = cookieJar.get(`AMCV_${imsOrgId}`);
        if (!amcvCookieValue) {
          cookieJar.set(`AMCV_${imsOrgId}`, `MCMID|${ecid}`);
        }
      }
    }
  };
};
