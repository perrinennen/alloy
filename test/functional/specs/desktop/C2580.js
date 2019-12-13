import { Selector } from "testcafe";
import createConsoleLogger from "../../src/consoleLogger";
import fixtureFactory from "../../src/fixtureFactory";

const urlCollector = `http://127.0.0.1:8080/test/functional/sandbox/html/commandQueue.html`;

fixtureFactory({
  title: "C2580: Queue commands before library loads.",
  url: urlCollector
});

test.meta({
  ID: "C2580",
  SEVERITY: "P0",
  TEST_RUN: "Regression"
});

test("Test C2580: Run placeholder snippet. Run commands before alloy.js is loaded.", async t => {
  const logger = createConsoleLogger(t, "log");

  let newMessages = await logger.getAllMessages();
  await t.expect(newMessages).match(/Executing getLibraryInfo command/);
  await t.expect(newMessages).match(/Executing event command/);
  await t.expect(newMessages).match(/Executing debug command/);
  await t.expect(newMessages).match(/Executing setCustomerIds command/);
});
