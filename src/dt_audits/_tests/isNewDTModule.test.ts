import { isNewDTModule } from "../isNewDTModule";
import { createDefaultMockDTContext } from "../../util/tests/createMockDTContext";

describe(isNewDTModule, () => {

  it("passes with n/a if there are existing files in the module", async () => {
    const testContext = await createDefaultMockDTContext({
      files: {
        added: ["types/my-module/new-file.ts"],
        changed: ["types/my-module/index.ts"],
        deleted: []
      },
      touchedModules: [{ name: "my-module", files: [], codeOwners: [] }]
    });

    const audit = isNewDTModule();
    const result = await audit.run(testContext.dt, testContext.context);

    expect(result.result).toEqual("n/a");
  });


  it("fails with a blocker when the module creates a new module", async () => {
    const testContext = await createDefaultMockDTContext({
      files: {
        added: ["types/my-module/index.ts"],
        changed: [],
        deleted: []
      },
      touchedModules: [{ name: "my-module", files: [], codeOwners: [] }]
    });

    const audit = isNewDTModule();
    const result = await audit.run(testContext.dt, testContext.context);

    expect(result.result).toEqual("blocker");
  });

});
