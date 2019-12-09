import { allChangesToDTSFilesAreAdditions } from "../allChangesToDTSFilesAreAdditions";
import { createDefaultMockDTContext } from "../../util/tests/createMockDTContext";

describe(allChangesToDTSFilesAreAdditions, () => {

  it("passes when a d.ts diff only has additions", async () => {
    const testContext = await createDefaultMockDTContext({}, { diff: diffWithOnlyAdditions });

    const audit = allChangesToDTSFilesAreAdditions();
    const result = await audit.run(testContext.dt, testContext.context);

    expect(result.result).toEqual("success");
  });

  it("fails when a d.ts diff has deletions also", async () => {
    const testContext = await createDefaultMockDTContext({}, { diff: hasDeletionsButTheyAreWhiteSpaceSoCouldBeAllowedInTheFuture });

    const audit = allChangesToDTSFilesAreAdditions();
    const result = await audit.run(testContext.dt, testContext.context);

    expect(result.result).toEqual("n/a");
  });


  it("handles when a d.ts diff is specifically changing the version", async () => {
    const testContext = await createDefaultMockDTContext({}, { diff: hasAdditionsButOnlyChangingTheVersion });

    const audit = allChangesToDTSFilesAreAdditions();
    const result = await audit.run(testContext.dt, testContext.context);

    expect(result.result).toEqual("success");
  });
});


// https://patch-diff.githubusercontent.com/raw/DefinitelyTyped/DefinitelyTyped/pull/40912.diff
const diffWithOnlyAdditions = `
diff --git a/types/node/fs.d.ts b/types/node/fs.d.ts
index 8c57f0c7bc8d..6992b5f9f285 100644
--- a/types/node/fs.d.ts
+++ b/types/node/fs.d.ts
@@ -107,22 +107,27 @@ declare module "fs" {
         addListener(event: string, listener: (...args: any[]) => void): this;
         addListener(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
         addListener(event: "error", listener: (error: Error) => void): this;
+        addListener(event: "close", listener: () => void): this;
 
         on(event: string, listener: (...args: any[]) => void): this;
         on(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
         on(event: "error", listener: (error: Error) => void): this;
+        on(event: "close", listener: () => void): this;
 
         once(event: string, listener: (...args: any[]) => void): this;
         once(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
         once(event: "error", listener: (error: Error) => void): this;
+        once(event: "close", listener: () => void): this;
 
         prependListener(event: string, listener: (...args: any[]) => void): this;
         prependListener(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
         prependListener(event: "error", listener: (error: Error) => void): this;
+        prependListener(event: "close", listener: () => void): this;
 
         prependOnceListener(event: string, listener: (...args: any[]) => void): this;
         prependOnceListener(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
         prependOnceListener(event: "error", listener: (error: Error) => void): this;
+        prependOnceListener(event: "close", listener: () => void): this;
     }
 
     class ReadStream extends stream.Readable {
diff --git a/types/node/v10/fs.d.ts b/types/node/v10/fs.d.ts
index c55b5d2729e6..ba6c999add03 100644
--- a/types/node/v10/fs.d.ts
+++ b/types/node/v10/fs.d.ts
@@ -59,22 +59,27 @@ declare module "fs" {
         addListener(event: string, listener: (...args: any[]) => void): this;
         addListener(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
         addListener(event: "error", listener: (error: Error) => void): this;
+        addListener(event: "close", listener: () => void): this;
 
         on(event: string, listener: (...args: any[]) => void): this;
         on(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
         on(event: "error", listener: (error: Error) => void): this;
+        on(event: "close", listener: () => void): this;
 
         once(event: string, listener: (...args: any[]) => void): this;
         once(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
         once(event: "error", listener: (error: Error) => void): this;
+        once(event: "close", listener: () => void): this;
 
         prependListener(event: string, listener: (...args: any[]) => void): this;
         prependListener(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
         prependListener(event: "error", listener: (error: Error) => void): this;
+        prependListener(event: "close", listener: () => void): this;
 
         prependOnceListener(event: string, listener: (...args: any[]) => void): this;
         prependOnceListener(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
         prependOnceListener(event: "error", listener: (error: Error) => void): this;
+        prependOnceListener(event: "close", listener: () => void): this;
     }
 
     class ReadStream extends stream.Readable {`

// https://patch-diff.githubusercontent.com/raw/DefinitelyTyped/DefinitelyTyped/pull/40904.diff
const hasDeletionsButTheyAreWhiteSpaceSoCouldBeAllowedInTheFuture = `
diff --git a/types/chai/chai-tests.ts b/types/chai/chai-tests.ts
index 706957b62162..75c3e09d15bb 100644
--- a/types/chai/chai-tests.ts
+++ b/types/chai/chai-tests.ts
@@ -476,6 +476,12 @@ function deepEqual3() {
 function deepInclude() {
     expect(['foo', 'bar']).to.deep.include(['bar', 'foo']);
     ['foo', 'bar'].should.deep.include(['bar', 'foo']);
+    expect(['foo', 'bar']).to.deep.includes(['bar', 'foo']);
+    ['foo', 'bar'].should.deep.includes(['bar', 'foo']);
+    expect(['foo', 'bar']).to.deep.contain(['bar', 'foo']);
+    ['foo', 'bar'].should.deep.contain(['bar', 'foo']);
+    expect(['foo', 'bar']).to.deep.contains(['bar', 'foo']);
+    ['foo', 'bar'].should.deep.contains(['bar', 'foo']);
     expect(['foo', 'bar']).not.to.deep.equal(['foo', 'baz']);
     ['foo', 'bar'].should.not.deep.equal(['foo', 'baz']);
 }
diff --git a/types/chai/index.d.ts b/types/chai/index.d.ts
index 82c5fb30f763..dcdf88cec4c7 100644
--- a/types/chai/index.d.ts
+++ b/types/chai/index.d.ts
@@ -291,13 +291,19 @@ declare namespace Chai {
     }
 
     interface Nested {
-      include: Include;
-      property: Property;
-      members: Members;
+        include: Include;
+        includes: Include;
+        contain: Include;
+        contains: Include;
+        property: Property;
+        members: Members;
     }
 
     interface Own {
         include: Include;
+        includes: Include;
+        contain: Include;
+        contains: Include;
         property: Property;
     }
 
@@ -306,6 +312,9 @@ declare namespace Chai {
         equals: Equal;
         eq: Equal;
         include: Include;
+        includes: Include;
+        contain: Include;
+        contains: Include;
         property: Property;
         members: Members;
         ordered: Ordered;
`

// https://patch-diff.githubusercontent.com/raw/DefinitelyTyped/DefinitelyTyped/pull/40763.diff
const hasAdditionsButOnlyChangingTheVersion = `diff --git a/types/mongoose-paginate-v2/index.d.ts b/types/mongoose-paginate-v2/index.d.ts
index 3ebea7b2358c..02a1f18b6d61 100644
--- a/types/mongoose-paginate-v2/index.d.ts
+++ b/types/mongoose-paginate-v2/index.d.ts
@@ -1,9 +1,10 @@
-// Type definitions for mongoose-paginate-v2 1.0
+// Type definitions for mongoose-paginate-v2 1.3
 // Project: https://github.com/webgangster/mongoose-paginate-v2
 // Definitions by: Linus Brolin <https://github.com/linusbrolin>
 //                 simonxca <https://github.com/simonxca>
 //                 woutgg <https://github.com/woutgg>
 //                 oktapodia <https://github.com/oktapodia>
+//                 Dongjun Lee <https://github.com/ChazEpps>
 // Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
 // TypeScript Version: 3.0
 //
@@ -20,6 +21,11 @@ declare module 'mongoose' {
     prevPage?: string;
   }
 
+  interface ReadOptions {
+    pref: string;
+    tags?: any[];
+  }
+
   interface PaginateOptions {
     /* tslint:disable-next-line: ban-types */
     select?: Object | string;
@@ -34,6 +40,7 @@ declare module 'mongoose' {
     offset?: number;
     page?: number;
     limit?: number;
+    read?: ReadOptions;
   }
 
   interface QueryPopulateOptions {
diff --git a/types/mongoose/index.d.ts b/types/mongoose/index.d.ts
index 751f50b2d5b4..7498a19cd77a 100644
--- a/types/mongoose/index.d.ts
+++ b/types/mongoose/index.d.ts
@@ -33,6 +33,7 @@
 //                 Chathu Vishwajith <https://github.com/iamchathu>
 //                 Tom Yam <https://github.com/tomyam1>
 //                 Thomas Pischulski <https://github.com/nephix>
+//                 Dongjun Lee <https://github.com/ChazEpps>
 // Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
 // TypeScript Version: 3.0
 
@@ -2130,7 +2131,7 @@ declare module "mongoose" {
     /**
      * Determines the MongoDB nodes from which to read.
      * @param pref one of the listed preference options or aliases
+     * @param tags optional tags for this query
      */
     read(pref: string, tags?: any[]): this;
 `
