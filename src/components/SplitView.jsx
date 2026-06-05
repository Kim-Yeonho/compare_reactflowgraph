import { useMemo, useRef } from "react";
import { ReactFlowProvider } from "reactflow";
import FlowCanvas from "./FlowCanvas";
import { toSideFlow } from "../lib/transformGraph";

/**
 * 좌우 분할 모드. 좌측=배포(removed 강조), 우측=캔버스(added 강조).
 * 두 패널의 뷰포트(zoom/pan)를 동기화한다.
 *
 * 무한 루프 방지: React Flow의 onMove는 사용자 제스처일 때만 event가 채워지고
 * 프로그램적 이동(fitView·상대 패널 setViewport)일 때는 event가 null이다.
 * 따라서 "사용자가 직접 움직인 경우(event 존재)"에만 반대편에 반영하면,
 * 동기화로 발생한 이동이 다시 동기화를 부르는 핑퐁이 원천 차단된다.
 */
export default function SplitView({ diff, focus, onSelectNode }) {
  const before = useMemo(() => toSideFlow(diff, "before"), [diff]);
  const after = useMemo(() => toSideFlow(diff, "after"), [diff]);

  const leftApi = useRef(null);
  const rightApi = useRef(null);

  const handleMove = (sourceSide) => (event, viewport) => {
    if (!event || !viewport) return; // 프로그램적 이동은 무시 → 루프 차단
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
