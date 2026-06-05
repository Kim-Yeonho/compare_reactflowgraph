/**
 * transformGraph — diffGraphs() 결과를 React Flow 노드/엣지 구조로 변환.
 *
 * 자체 포맷의 노드/엣지를 React Flow가 이해하는 형태로 매핑한다.
 *  - 노드: { id, type:'customNode', position:{x,y}, data:{...}, draggable, selectable }
 *  - 엣지: 합성 키를 id로, source/target은 노드 id 그대로. 상태별 스타일 적용.
 */
import { MarkerType } from "reactflow";
import { STATUS_STYLE } from "./diffStyles";

/** diff 노드 항목 + 원본 노드(raw) → React Flow 노드 */
function toFlowNode(entry, raw) {
  const meta = raw.metadata ?? {};
  const isRemoved = entry.diffStatus === "removed";
  return {
    id: entry.id,
    type: "customNode",
    position: { x: raw.canvas?.x ?? 0, y: raw.canvas?.y ?? 0 },
    // removed 노드는 사용자가 건드릴 수 없도록 잠근다.
    draggable: !isRemoved,
    selectable: !isRemoved,
    data: {
      label: meta.display_name || meta.name || entry.id,
      name: meta.name,
      category: meta.category,
      diffStatus: entry.diffStatus,
      changedFields: entry.changedFields ?? [],
    },
  };
}

/** diff 엣지 항목 → React Flow 엣지(상태별 스타일 포함) */
function toFlowEdge(entry) {
  const s = STATUS_STYLE[entry.diffStatus];
  const isRemoved = entry.diffStatus === "removed";
  const isUnchanged = entry.diffStatus === "unchanged";
  return {
    id: entry.id,
    source: entry.source,
    target: entry.target,
    data: { diffStatus: entry.diffStatus },
    animated: entry.diffStatus === "added",
    style: {
      stroke: s.edge,
      strokeWidth: isUnchanged ? 1.5 : 2.5,
      strokeDasharray: isRemoved ? "6 4" : undefined,
      opacity: isUnchanged ? 0.45 : 1,
    },
    markerEnd: { type: MarkerType.ArrowClosed, color: s.edge },
  };
}

/**
 * 오버레이 모드: 병합 노드 집합(added+removed+modified+unchanged)을 단일 캔버스로.
 * 노드 좌표/내용은 after(캔버스)를 우선, 없으면 before(배포)를 사용.
 */
export function toOverlayFlow(diff) {
  const nodes = diff.nodes.map((n) => toFlowNode(n, n.after || n.before));
  const edges = diff.edges.map(toFlowEdge);
  return { nodes, edges };
}

/**
 * 좌우 분할 모드의 한 쪽.
 *  - side 'before' → 배포 버전(removed/modified/unchanged 노드, before 좌표)
 *  - side 'after'  → 캔버스 버전(added/modified/unchanged 노드, after 좌표)
 * 두 쪽 모두 같은 좌표계를 쓰므로 같은 id 노드는 같은 위치에 나타난다.
 */
export function toSideFlow(diff, side) {
  const pick = side === "before" ? (x) => x.before : (x) => x.after;
  const nodes = diff.nodes
    .filter((n) => pick(n))
    .map((n) => toFlowNode(n, pick(n)));
  const edges = diff.edges.filter((e) => pick(e)).map(toFlowEdge);
  return { nodes, edges };
}
