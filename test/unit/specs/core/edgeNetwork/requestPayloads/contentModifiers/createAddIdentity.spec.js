import createAddIdentity from "../../../../../../../src/core/edgeNetwork/requestPayloads/contentModifiers/createAddIdentity";

describe("createAddIdentity", () => {
  test("should return a function to add identity", () => {
    const content = {};
    const addIdentity = createAddIdentity(content);
    expect(typeof addIdentity).toBe("function");
    addIdentity("IDNS", {
      id: "ABC123"
    });
    expect(content).toEqual({
      xdm: {
        identityMap: {
          IDNS: [
            {
              id: "ABC123"
            }
          ]
        }
      }
    });
  });
  test("should append identity map if called more than once", () => {
    const content = {};
    const addIdentity = createAddIdentity(content);
    addIdentity("IDNS", {
      id: "ABC123"
    });
    addIdentity("IDNS", {
      id: "ABC456"
    });
    expect(content).toEqual({
      xdm: {
        identityMap: {
          IDNS: [
            {
              id: "ABC123"
            },
            {
              id: "ABC456"
            }
          ]
        }
      }
    });
    addIdentity("IDNS2", {
      id: "ABC456"
    });
    expect(content).toEqual({
      xdm: {
        identityMap: {
          IDNS: [
            {
              id: "ABC123"
            },
            {
              id: "ABC456"
            }
          ],
          IDNS2: [
            {
              id: "ABC456"
            }
          ]
        }
      }
    });
  });
});
