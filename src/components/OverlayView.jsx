import { useMemo } from "react";
import { ReactFlowProvider } from "reactflow";
import FlowCanvas from "./FlowCanvas";
import { toOverlayFlow } from "../lib/transformGraph";

/** 오버레이 모드: 병합된 단일 캔버스. */
export default function OverlayView({ diff, focus, onSelectNode }) {
  const { nodes, edges } = useMemo(() => toOverlayFlow(diff), [diff]);
  return (
    <ReactFlowProvider>
      <FlowCanvas
        nodes={nodes}
        edges={edges}
        focus={focus}
        onSelectNode={onSelectNode}
      />
    </ReactFlowProvider>
  );
}
