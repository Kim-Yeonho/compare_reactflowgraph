import { useEffect } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
} from "reactflow";
import CustomNode from "./CustomNode";

// nodeTypes는 렌더마다 새로 만들면 경고가 나므로 모듈 레벨에 고정.
const nodeTypes = { customNode: CustomNode };

/**
 * 단일 React Flow 캔버스. 오버레이/분할 양쪽에서 재사용한다.
 *  - 데이터 변경 시 fitView
 *  - focus.id/focus.nonce 변경 시 해당 노드로 setCenter + 링 하이라이트
 *  - onMove / onInit 를 부모로 전달해 분할 모드 뷰포트 동기화에 사용
 */
export default function FlowCanvas({
  title,
  nodes,
  edges,
  focus,
  onSelectNode,
  onMove,
  onInit,
}) {
  const rf = useReactFlow();

  // 데이터가 바뀌면 화면 맞춤
  useEffect(() => {
    const t = setTimeout(() => rf.fitView({ padding: 0.2, duration: 300 }), 0);
    return () => clearTimeout(t);
  }, [nodes, edges, rf]);

  // 패널에서 항목 클릭 → 해당 노드로 포커스 이동
  useEffect(() => {
    if (!focus?.id) return;
    const node = rf.getNode(focus.id);
    if (!node) return;
    const cx = node.position.x + (node.width ?? 170) / 2;
    const cy = node.position.y + (node.height ?? 70) / 2;
    rf.setCenter(cx, cy, { zoom: 1.2, duration: 600 });
    // focus.nonce가 deps에 있어 같은 노드를 다시 눌러도 동작한다.
  }, [focus?.id, focus?.nonce, rf]);

  const styledNodes =
    focus?.id != null
      ? nodes.map((n) =>
          n.id === focus.id ? { ...n, className: "focus-ring" } : n,
        )
      : nodes;

  return (
    <div className="pane">
      {title && <div className="pane-title">{title}</div>}
      <ReactFlow
        nodes={styledNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onInit={onInit}
        onMove={onMove}
        onNodeClick={(_, node) => onSelectNode?.(node.id)}
        fitView
        minZoom={0.2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.4} color="#cbd5e1" />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  );
}
