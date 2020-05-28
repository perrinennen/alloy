import createLibraryInfo from "../../../../../src/components/LibraryInfo";

describe("LibraryInfo", () => {
  test("returns library information", () => {
    expect(createLibraryInfo().commands.getLibraryInfo.run()).toEqual({
      libraryInfo: {
        version: "{{version}}"
      }
    });
  });
});
