/**
 * diffGraphs — 자체 포맷(에이전트 그래프) 두 개를 비교하는 순수 모듈.
 *
 * UI/React Flow에 대한 의존성이 전혀 없으므로 단독으로 테스트할 수 있다.
 * (transformGraph.js가 이 결과를 React Flow 구조로 변환한다.)
 *
 * 비교 규칙
 *  - 노드: metadata.id 기준 매칭. metadata.fields[]의 value(name 기준)만 비교.
 *          canvas 좌표 / display_name / description / category / outputs /
 *          필드의 placeholder·options 등 "정의성" 속성은 비교에서 제외한다.
 *  - 엣지: id가 없으므로 합성 키로 매칭. 존재 여부만 비교(added/removed/unchanged).
 *  - 그래프 설정: config.options[]의 value를 name 기준으로 비교.
 */

/** 엣지 합성 식별자. transformGraph도 동일 규칙을 재사용한다. */
export function edgeKey(edge) {
  return `${edge.source}::${edge.source_output_name}->${edge.target}::${edge.target_field_name}`;
}

/** 순서에 무관한 안정적 직렬화 → 깊은 동등 비교용. undefined도 구분한다. */
function canonical(value) {
  if (value === undefined) return "__undefined__";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}`;
}

function valuesEqual(a, b) {
  return canonical(a) === canonical(b);
}

function fieldMap(node) {
  const fields = node?.metadata?.fields ?? [];
  return new Map(fields.map((f) => [f.name, f]));
}

/**
 * 두 노드의 fields value를 name 기준으로 대조하여 변경된 필드 목록을 만든다.
 * 반환: [{ name, label, before, after }]
 */
function compareNodeFields(beforeNode, afterNode) {
  const bf = fieldMap(beforeNode);
  const af = fieldMap(afterNode);
  const names = new Set([...bf.keys(), ...af.keys()]);
  const changed = [];
  for (const name of names) {
    const bField = bf.get(name);
    const aField = af.get(name);
    const before = bField ? bField.value : undefined;
    const after = aField ? aField.value : undefined;
    if (!valuesEqual(before, after)) {
      changed.push({
        name,
        label: (aField || bField).display_name || name,
        before,
        after,
      });
    }
  }
  return changed;
}

/** 노드의 컴포넌트 시그니처(타입). id가 달라도 같은 종류를 식별한다. */
function nodeSignature(node) {
  const meta = node?.metadata ?? {};
  return `${meta.name || meta.display_name || ""}|${meta.category || ""}`;
}

/**
 * 노드 매칭.
 *  1) id 완전 일치 (배포본↔캔버스 편집본처럼 id가 안정적인 경우)
 *  2) 남은 노드는 시그니처(name+category)로 폴백 매칭 — id 공간이 달라도
 *     동일 컴포넌트를 연결. 같은 시그니처가 여럿이면 필드 변경이 가장 적은 쌍을
 *     우선 연결한다.
 * 반환: { pairs:[{before,after}], removed:[node], added:[node] }
 */
function matchNodes(deployedNodes, canvasNodes) {
  const before = deployedNodes.map((n) => ({ n, matched: false }));
  const after = canvasNodes.map((n) => ({ n, matched: false }));
  const pairs = [];

  // 1차: id 일치
  const afterById = new Map();
  for (const ao of after) afterById.set(ao.n.id, ao);
  for (const bo of before) {
    const ao = afterById.get(bo.n.id);
    if (ao && !ao.matched) {
      bo.matched = true;
      ao.matched = true;
      pairs.push({ before: bo.n, after: ao.n });
    }
  }

  // 2차: 시그니처 폴백 (필드 변경 최소 쌍 우선)
  for (const ao of after) {
    if (ao.matched) continue;
    let best = null;
    let bestScore = Infinity;
    for (const bo of before) {
      if (bo.matched) continue;
      if (nodeSignature(bo.n) !== nodeSignature(ao.n)) continue;
      const score = compareNodeFields(bo.n, ao.n).length;
      if (score < bestScore) {
        bestScore = score;
        best = bo;
      }
    }
    if (best) {
      best.matched = true;
      ao.matched = true;
      pairs.push({ before: best.n, after: ao.n });
    }
  }

  const removed = before.filter((o) => !o.matched).map((o) => o.n);
  const added = after.filter((o) => !o.matched).map((o) => o.n);
  return { pairs, removed, added };
}

function makeEdgeEntry(diffStatus, before, after) {
  const src = after || before;
  const changes = [];
  if (diffStatus === "modified") {
    if (before.source_output_name !== after.source_output_name) {
      changes.push({
        name: "출력 포트",
        before: before.source_output_name,
        after: after.source_output_name,
      });
    }
    if (before.target_field_name !== after.target_field_name) {
      changes.push({
        name: "입력 포트",
        before: before.target_field_name,
        after: after.target_field_name,
      });
    }
  }
  return {
    id: edgeKey(src),
    diffStatus,
    source: src.source,
    target: src.target,
    sourceOutput: src.source_output_name,
    targetField: src.target_field_name,
    before,
    after,
    changes,
  };
}

/** 엣지 비교: 완전일치(unchanged) → 양끝 동일(modified) → 나머지(removed/added). */
function diffEdges(beforeList, afterList) {
  const before = beforeList.map((raw) => ({ raw, key: edgeKey(raw), matched: false }));
  const after = afterList.map((raw) => ({ raw, key: edgeKey(raw), matched: false }));
  const edges = [];

  // 1차: 4-튜플 완전 일치
  for (const be of before) {
    const ae = after.find((a) => !a.matched && a.key === be.key);
    if (ae) {
      be.matched = true;
      ae.matched = true;
      edges.push(makeEdgeEntry("unchanged", be.raw, ae.raw));
    }
  }
  // 2차: 같은 source-target 쌍 → 포트만 바뀐 modified
  for (const be of before) {
    if (be.matched) continue;
    const ae = after.find(
      (a) => !a.matched && a.raw.source === be.raw.source && a.raw.target === be.raw.target,
    );
    if (ae) {
      be.matched = true;
      ae.matched = true;
      edges.push(makeEdgeEntry("modified", be.raw, ae.raw));
    }
  }
  // 나머지
  for (const be of before) if (!be.matched) edges.push(makeEdgeEntry("removed", be.raw, null));
  for (const ae of after) if (!ae.matched) edges.push(makeEdgeEntry("added", null, ae.raw));

  return edges;
}

function indexConfig(graph) {
  const options = graph?.config?.options ?? [];
  return new Map(options.map((o) => [o.name, o]));
}

/**
 * @param {object} deployed 배포 버전 그래프(이전)
 * @param {object} canvas   캔버스 편집 버전 그래프(이후)
 * @returns {{
 *   nodes: Array, edges: Array, configChanges: Array,
 *   summary: { added:number, removed:number, modified:number, unchanged:number }
 * }}
 */
export function diffGraphs(deployed, canvas) {
  const summary = { added: 0, removed: 0, modified: 0, unchanged: 0 };

  // ── 노드 ──────────────────────────────────────────────
  // id 우선 매칭 후 시그니처 폴백. 매칭된 노드는 하나의 "통합 id"로 합쳐
  // 엣지 비교 시 양쪽 id 공간을 일치시킨다.
  const { pairs, removed, added } = matchNodes(deployed.nodes ?? [], canvas.nodes ?? []);

  const nodes = [];
  // 통합 id 매핑: 원본 노드 id → 비교에 쓰는 canonical id(배포본 id 우선)
  const beforeToCanon = new Map();
  const afterToCanon = new Map();

  for (const { before, after } of pairs) {
    const canon = before.id;
    const changedFields = compareNodeFields(before, after);
    const diffStatus = changedFields.length > 0 ? "modified" : "unchanged";
    beforeToCanon.set(before.id, canon);
    afterToCanon.set(after.id, canon);
    summary[diffStatus] += 1;
    nodes.push({ id: canon, diffStatus, changedFields, before, after });
  }
  for (const n of removed) {
    beforeToCanon.set(n.id, n.id);
    summary.removed += 1;
    nodes.push({ id: n.id, diffStatus: "removed", changedFields: [], before: n, after: undefined });
  }
  for (const n of added) {
    afterToCanon.set(n.id, n.id);
    summary.added += 1;
    nodes.push({ id: n.id, diffStatus: "added", changedFields: [], before: undefined, after: n });
  }

  // ── 엣지 ──────────────────────────────────────────────
  // 엣지 양끝 id를 통합 id로 치환 → 노드 id가 달라도 같은 연결로 비교된다.
  // 1차: 4-튜플 완전 일치(unchanged), 2차: 양끝 동일·포트만 변경(modified),
  // 나머지: removed/added.
  const remap = (idMap) => (e) => ({
    ...e,
    source: idMap.get(e.source) ?? e.source,
    target: idMap.get(e.target) ?? e.target,
  });
  const edges = diffEdges(
    (deployed.edges ?? []).map(remap(beforeToCanon)),
    (canvas.edges ?? []).map(remap(afterToCanon)),
  );

  // ── 그래프 설정(config.options) ───────────────────────
  const dConfig = indexConfig(deployed);
  const cConfig = indexConfig(canvas);
  const configNames = new Set([...dConfig.keys(), ...cConfig.keys()]);
  const configChanges = [];
  for (const name of configNames) {
    const b = dConfig.get(name);
    const a = cConfig.get(name);
    const before = b ? b.value : undefined;
    const after = a ? a.value : undefined;
    if (!valuesEqual(before, after)) {
      configChanges.push({
        name,
        display_name: (a || b).display_name || name,
        before,
        after,
      });
    }
  }

  return { nodes, edges, configChanges, summary };
}
