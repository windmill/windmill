
//Make sure that the jsid can access the variable in the namespace in the testWindow
var test_jsid_scope = [
  // Create an event, Sunday at noon
  { method: "open", params: { url: "http://windmill.osafoundation.org/windmill-unittests/unit_tester.html" } },
  { method: "waits.sleep", params: { milliseconds: 3000 } },
  // Create an event, Monday at noon
  { method: "waits.forElement", params: { id: "sleeper" } },
  { method: "click", params: { jsid: "testSpace.spaceId" } },
  { method: "asserts.assertNode", params: { jsid: "testSpace.spaceId" } }
];

