import React from "react";

export default function Cart() {
  window
    .alloy("event", {
      viewStart: true,
      xdm: {
        // Demonstrates overriding automatically collected data
        device: {
          screenHeight: 1
        }
      }
    })
    .then(function(data) {
      console.log("Sandbox: View start event has completed.", data);
    });

  return (
    <div>
      <h2>Cart</h2>

      <section>
        <div className="personalization-container">
          <h2>Some awesome default content.</h2>
          <div>
            All visitors qualify for the offer{" "}
            <span role="img" aria-label="">
              👆
            </span>
          </div>
          <br />
        </div>

        <div className="personalization-container-2">
          <h2>Some more awesome default content.</h2>
          You only qualify for the offer{" "}
          <span role="img" aria-label="">
            👆
          </span>{" "}
          if you collect:
          <pre>{JSON.stringify({ data: { nonXdmKey: "nonXdmValue" } })}</pre>
        </div>
      </section>
    </div>
  );
}
