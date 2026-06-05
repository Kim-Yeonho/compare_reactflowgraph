// 상태별 색상/표시 규칙 — 노드(CustomNode), 엣지, 요약 패널이 공통으로 사용.
export const STATUS_STYLE = {
  added: {
    label: "추가",
    border: "#16a34a",
    bg: "#dcfce7",
    text: "#14532d",
    edge: "#16a34a",
  },
  removed: {
    label: "삭제",
    border: "#dc2626",
    bg: "#fee2e2",
    text: "#7f1d1d",
    edge: "#dc2626",
  },
  modified: {
    label: "수정",
    border: "#d97706",
    bg: "#fef3c7",
    text: "#78350f",
    edge: "#d97706",
  },
  unchanged: {
    label: "동일",
    border: "#cbd5e1",
    bg: "#ffffff",
    text: "#64748b",
    edge: "#cbd5e1",
  },
};

export const STATUS_ORDER = ["added", "removed", "modified"];
