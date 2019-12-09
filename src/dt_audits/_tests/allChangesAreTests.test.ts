import { allChangesAreTests } from "../allChangesAreTests";
import { createDefaultMockDTContext } from "../../util/tests/createMockDTContext";

const wontPassWhenDTS = [
  {
    files: {
      added: ["types/my-module/new-test.ts"],
      changed: ["types/my-module/index.d.ts"],
      deleted: []
    }
  },
  "wontPassWhenDTS",
  "n/a"
];

const passAndIgnoreTSConfig = [
  {
    files: {
      added: ["types/my-module/new-test.ts"],
      changed: ["types/my-module/tsconfig.json"],
      deleted: []
    }
  },
  "passAndIgnoreTSConfig",
  "success"
];

const pass = [
  {
    files: {
      added: ["types/my-module/new-test.ts"],
      changed: [],
      deleted: []
    }
  },
  "passing metadata",
  "success"
];

describe(allChangesAreTests, () => {
  describe.each([wontPassWhenDTS, passAndIgnoreTSConfig, pass])("allChangesAreTests", (files, title, expected) => {
    it(`with ${title} it should be ${expected}`, async () => {
      // @ts-ignore - files is typed as a union of all the possible params
      const testContext = await createDefaultMockDTContext(files);

      const audit = allChangesAreTests();
      const result = await audit.run(testContext.dt, testContext.context);

      expect(result.result).toEqual(expected);
    });
  });
});
