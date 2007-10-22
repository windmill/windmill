
//Make sure that the jsid can access the variable in the namespace in the testWindow
var test_jsid_scope = [
  { method: "open", params: { url: "http://windmill.osafoundation.org/windmill-unittests/unit_tester.html" } },
  { method: "waits.sleep", params: { milliseconds: 3000 } },
  { method: "waits.forElement", params: { id: "sleeper" } },
  { method: "click", params: { jsid: "testSpace.spaceId" } },
  { method: "asserts.assertNode", params: { jsid: "testSpace.spaceId" } }
];

