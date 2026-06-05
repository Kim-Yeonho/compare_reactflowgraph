import { useMemo, useRef } from "react";
import { ReactFlowProvider } from "reactflow";
import FlowCanvas from "./FlowCanvas";
import { toSideFlow } from "../lib/transformGraph";

/**
 * 좌우 분할 모드. 좌측=배포(removed 강조), 우측=캔버스(added 강조).
 * 두 패널의 뷰포트(zoom/pan)를 동기화한다 — 한쪽 onMove를 받아 다른 쪽
 * setViewport로 반영하며, 동일 뷰포트는 dedupe하여 무한 루프를 막는다.
 */
export default function SplitView({ diff, focus, onSelectNode }) {
  const before = useMemo(() => toSideFlow(diff, "before"), [diff]);
  const after = useMemo(() => toSideFlow(diff, "after"), [diff]);

  const leftApi = useRef(null);
  const rightApi = useRef(null);
  const lastSync = useRef("");

  const handleMove = (sourceSide) => (_evt, viewport) => {
    if (!viewport) return;
    const key = `${viewport.x.toFixed(2)}|${viewport.y.toFixed(2)}|${viewport.zoom.toFixed(3)}`;
    if (lastSync.current === key) return; // 같은 뷰포트 재반영 차단
    lastSync.current = key;
    const target = sourceSide === "left" ? rightApi.current : leftApi.current;
    if (target) target.setViewport(viewport);
  };

  return (
    <div className="split">
      <ReactFlowProvider>
        <FlowCanvas
          title="배포 버전 (이전)"
          nodes={before.nodes}
          edges={before.edges}
          focus={focus}
          onSelectNode={onSelectNode}
          onInit={(inst) => (leftApi.current = inst)}
          onMove={handleMove("left")}
        />
      </ReactFlowProvider>
      <ReactFlowProvider>
        <FlowCanvas
          title="캔버스 버전 (이후)"
          nodes={after.nodes}
          edges={after.edges}
          focus={focus}
          onSelectNode={onSelectNode}
          onInit={(inst) => (rightApi.current = inst)}
          onMove={handleMove("right")}
        />
      </ReactFlowProvider>
    </div>
  );
}
