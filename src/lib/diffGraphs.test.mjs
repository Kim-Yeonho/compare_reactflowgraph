// 단독 실행: `npm test` (node --test). React Flow 의존성 없이 순수 로직만 검증.
import { test } from "node:test";
import assert from "node:assert/strict";
import { diffGraphs, edgeKey } from "./diffGraphs.js";

function node(id, fields = [], extra = {}) {
  return {
    id,
    canvas: { x: 0, y: 0 },
    metadata: { name: id, display_name: id, category: "X", outputs: [], fields },
    ...extra,
  };
}
function field(name, value) {
  return { name, display_name: name, value };
}
function edge(source, so, target, tf) {
  return { source, source_output_name: so, target, target_field_name: tf };
}

test("노드 added/removed/modified/unchanged 분류", () => {
  const a = {
    nodes: [
      node("keep", [field("model", "gpt-5.4")]),
      node("mod", [field("model", "gpt-5.4")]),
      node("gone", []),
    ],
    edges: [],
  };
  const b = {
    nodes: [
      node("keep", [field("model", "gpt-5.4")]),
      node("mod", [field("model", "gpt-5.4-mini")]),
      node("new", []),
    ],
    edges: [],
  };
  const d = diffGraphs(a, b);
  const byId = Object.fromEntries(d.nodes.map((n) => [n.id, n]));
  assert.equal(byId.keep.diffStatus, "unchanged");
  assert.equal(byId.mod.diffStatus, "modified");
  assert.equal(byId.gone.diffStatus, "removed");
  assert.equal(byId.new.diffStatus, "added");
  assert.equal(byId.mod.changedFields[0].name, "model");
  assert.equal(byId.mod.changedFields[0].before, "gpt-5.4");
  assert.equal(byId.mod.changedFields[0].after, "gpt-5.4-mini");
  assert.deepEqual(d.summary, { added: 1, removed: 1, modified: 1, unchanged: 1 });
});

test("canvas 좌표/정의성 메타 변경은 modified로 보지 않음", () => {
  const a = { nodes: [node("n", [field("model", "x")], { canvas: { x: 0, y: 0 } })], edges: [] };
  const b = { nodes: [node("n", [field("model", "x")], { canvas: { x: 999, y: 50 } })], edges: [] };
  b.nodes[0].metadata.description = "다른 설명";
  const d = diffGraphs(a, b);
  assert.equal(d.nodes[0].diffStatus, "unchanged");
});

test("엣지는 합성 키로 added/removed/unchanged 판정", () => {
  const a = { nodes: [], edges: [edge("1", "out", "2", "in"), edge("9", "o", "2", "in")] };
  const b = { nodes: [], edges: [edge("1", "out", "2", "in"), edge("3", "o", "2", "in")] };
  const d = diffGraphs(a, b);
  const byKey = Object.fromEntries(d.edges.map((e) => [e.id, e.diffStatus]));
  assert.equal(byKey[edgeKey(edge("1", "out", "2", "in"))], "unchanged");
  assert.equal(byKey[edgeKey(edge("9", "o", "2", "in"))], "removed");
  assert.equal(byKey[edgeKey(edge("3", "o", "2", "in"))], "added");
});

function compNode(id, name, category, fields = []) {
  return { id, canvas: { x: 0, y: 0 }, metadata: { name, display_name: name, category, outputs: [], fields } };
}

test("id가 달라도 동일 컴포넌트는 시그니처로 매칭되어 unchanged", () => {
  const a = { nodes: [compNode("A1", "ChatInput", "INPUT")], edges: [] };
  const b = { nodes: [compNode("B9", "ChatInput", "INPUT")], edges: [] };
  const d = diffGraphs(a, b);
  assert.equal(d.nodes.length, 1);
  assert.equal(d.nodes[0].diffStatus, "unchanged");
});

test("시그니처 매칭 시 엣지 양끝이 통합되어 unchanged", () => {
  const a = {
    nodes: [compNode("A1", "ChatInput", "INPUT"), compNode("A2", "ChatOutput", "OUTPUT")],
    edges: [edge("A1", "message", "A2", "input")],
  };
  const b = {
    nodes: [compNode("B1", "ChatInput", "INPUT"), compNode("B2", "ChatOutput", "OUTPUT")],
    edges: [edge("B1", "message", "B2", "input")],
  };
  const d = diffGraphs(a, b);
  assert.equal(d.nodes.filter((n) => n.diffStatus !== "unchanged").length, 0);
  assert.equal(d.edges.length, 1);
  assert.equal(d.edges[0].diffStatus, "unchanged");
});

test("같은 양끝 노드인데 포트만 바뀌면 엣지 modified", () => {
  const a = { nodes: [], edges: [edge("1", "outA", "2", "inX")] };
  const b = { nodes: [], edges: [edge("1", "outB", "2", "inX")] };
  const d = diffGraphs(a, b);
  assert.equal(d.edges.length, 1);
  assert.equal(d.edges[0].diffStatus, "modified");
  assert.equal(d.edges[0].changes[0].name, "출력 포트");
  assert.equal(d.edges[0].changes[0].before, "outA");
  assert.equal(d.edges[0].changes[0].after, "outB");
});

test("config.options value 변경 산출", () => {
  const a = { nodes: [], edges: [], config: { options: [{ name: "n", display_name: "N", value: 20 }] } };
  const b = { nodes: [], edges: [], config: { options: [{ name: "n", display_name: "N", value: 30 }] } };
  const d = diffGraphs(a, b);
  assert.equal(d.configChanges.length, 1);
  assert.equal(d.configChanges[0].before, 20);
  assert.equal(d.configChanges[0].after, 30);
});
