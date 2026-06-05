import { memo } from "react";
import { Handle, Position } from "reactflow";
import { STATUS_STYLE } from "../lib/diffStyles";

/**
 * data.diffStatus 에 따라 스타일이 분기되는 커스텀 노드.
 * 좌측 target / 우측 source 기본 핸들을 둔다(1차에서는 포트별 핸들 생략).
 */
function CustomNode({ data }) {
  const status = data.diffStatus ?? "unchanged";
  const s = STATUS_STYLE[status];
  const isRemoved = status === "removed";
  const isUnchanged = status === "unchanged";
  const changedCount = data.changedFields?.length ?? 0;

  return (
    <div
      className="custom-node"
      style={{
        border: `2px ${isRemoved ? "dashed" : "solid"} ${s.border}`,
        background: s.bg,
        color: s.text,
        opacity: isUnchanged ? 0.6 : isRemoved ? 0.75 : 1,
      }}
    >
      <Handle type="target" position={Position.Left} />
      <div className="cn-head">
        <span className="cn-badge" style={{ background: s.border }}>
          {s.label}
        </span>
        {data.category && <span className="cn-category">{data.category}</span>}
      </div>
      <div className="cn-title">{data.label}</div>
      {status === "modified" && changedCount > 0 && (
        <div className="cn-changes">필드 {changedCount}개 변경</div>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default memo(CustomNode);
