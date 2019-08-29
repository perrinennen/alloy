import React from "react";
import { withRouter } from "react-router-dom";

let previousPath;
function HomeWithHistory({ history }) {

  history.listen((loc) => {
    if (loc.pathname !== previousPath) {
      const instanceName = loc.pathname.includes("orgTwo") ? "organizationTwo" : "alloy";
      window[instanceName]("event", {
        viewStart: true,
        data: {
          "eventType": "page-view",
          "url": window.location.href,
          "name": loc.pathname.substring(1)
        }
      });
    }
    previousPath = loc.pathname;
  });

  const visitDoc = ev => {
    window.alloy("event", {
      data: {
        "eventType": "visit-doc",
        "activitystreams:href": ev.target.href,
        "activitystreams:name": ev.target.name,
        "activitystreams:mediaType": "text/html",
      }
    });
  };

  const copyBaseCode = ev => {
    window.alloy("event", {
      data: {
        "eventType": "copy-base-code",
        "activitystreams:href": "https://launch.gitbook.io/adobe-experience-platform-web-sdk/",
        "activitystreams:name": "copyBaseCode",
        "activitystreams:mediaType": "text/html",
      }
    });
  };

  const makeOptInCommand = purposes => () => {
    window.alloy("optIn", {
      purposes
    }).catch(console.error);
  };

  return (
      <div>
        <section>  
          <div className="container">
            <h2>Some Awesome Default Content - Might get replaced by a Personalization Offer.</h2>
            <br/>
          </div>
        </section>

        <section> 
          <div>
            <h2>Getting Started</h2>

            <section className="demo">
              <p>Alloy is designed with some of the following goals in mind:</p>

              <ul>
                <li>Ease of implementation.</li>
                <li>Performance.</li>
                <li>Privacy.</li>
                <li>Solution Agnostic.</li>
              </ul>

              <p>Comparing Alloy to AAM + AA + T + ECID:</p>
              
              <ul>
                <li>Single library & Launch extension vs 4.</li>
                <li>Alloy is ~80% smaller in kb size.</li>
                <li>Alloy's Script Evaluation by the browser is 64% faster.</li>
                <li>Alloy + Konductor allow you to collect data to Platform and Experience Cloud Solutions, retrieve a visitor ID, Destinations and Personalization offers in one server call.</li>
              </ul>

              <h3>Today's demo:</h3>
              <ul>
                <li>Send data to Adobe Experience Platform.</li>
                <li>Receive and Render a Personalization Offer.</li>
                <li>Receive and Trigger Audience Destinations.</li>
              </ul>
            </section>
            
            <h3>Installation</h3>
            <p>
            The first step in implemented the Adobe Experience Platform SDK is to copy and paste the following
            "base code" as high as possible in the head tag of your HTML:
            </p>
            <pre>
              <code>
              {`
                <script>
                  !function(n,o){o.forEach(function(o){n[o]||((n.__alloyNS=n.__alloyNS||
                  []).push(o),n[o]=function(){var u=arguments;return new Promise(
                  function(i,l){n[o].q.push([i,l,u])})},n[o].q=[])})}
                  (window,["alloy"]);
                </script>
                <script src="alloy.js" async></script>
              `}
              </code>
            </pre>
            <button onClick={copyBaseCode}>Copy Base Code</button>

            <p>
            The base code, by default, creates a global function named alloy. You will use this function to interact with the SDK.
            If you would like to name the global function something else, you may change the alloy name as follows:
            </p>
            <pre>
              <code>
              {`
                <script>
                  !function(n,o){o.forEach(function(o){n[o]||((n.__alloyNS=n.__alloyNS||
                  []).push(o),n[o]=function(){var u=arguments;return new Promise(
                  function(i,l){n[o].q.push([i,l,u])})},n[o].q=[])})}
                  (window,["mycustomname"]);
                </script>
                <script src="alloy.js" async></script>
              `}
              </code>
            </pre>
            <p>
            With this change made, the global function would be named mycustomname instead of alloy.
            This base code, in addition to creating a global function, also loads additional code contained <br/>
            within an external file (alloy.js) hosted on a server. By default, this code is loaded asynchronously<br/>
            to allow your webpage to be as performant as possible. This is the recommended implementation.
            </p>
            <a
              href="https://launch.gitbook.io/adobe-experience-platform-web-sdk/"
              onClick={visitDoc} name="Alloy Public Documentation">Read full documentation</a>

            <div>
              <h2>Opt-In</h2>
              <p>To test Opt-In on load, set the `optInEnabled` config to true.</p>
              <div>
                <button onClick={makeOptInCommand("all")}>OptIn to all purposes</button>
                <span>should trigger queued up commands.</span></div>
              <div>
                <button onClick={makeOptInCommand("none")}>OptIn to no purposes</button>
                <span>should stop most commands and throw an error.</span></div>
            </div>
          </div>
        </section>
      </div>
    );
}

const Home = withRouter(HomeWithHistory);
export default Home;
