import { useEffect, useMemo, useRef, useState } from "react";
import { STATUS_STYLE, STATUS_ORDER } from "../lib/diffStyles";
import { wordDiff, isTextValue } from "../lib/wordDiff";

function nodeLabelOf(entry) {
  const raw = entry.after || entry.before;
  return raw?.metadata?.display_name || raw?.metadata?.name || entry.id;
}

function renderValue(v) {
  if (v === undefined || v === null || v === "") return <em className="muted">(없음)</em>;
  if (typeof v === "object") return <code>{JSON.stringify(v)}</code>;
  return String(v);
}

/** 긴 텍스트는 단어 단위 inline diff, 그 외는 이전/이후 2단 표시. */
function FieldChange({ field }) {
  const { before, after } = field;
  const useInline =
    isTextValue(before) && isTextValue(after) && /\s/.test(`${before}${after}`);

  if (useInline) {
    const segs = wordDiff(before, after);
    return (
      <div className="field-change">
        <div className="fc-name">{field.label}</div>
        <div className="fc-inline">
          {segs.map((s, i) =>
            s.type === "equal" ? (
              <span key={i}>{s.text}</span>
            ) : (
              <span key={i} className={s.type === "added" ? "w-add" : "w-del"}>
                {s.text}
              </span>
            ),
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="field-change">
      <div className="fc-name">{field.label}</div>
      <div className="fc-side fc-before">
        <span className="fc-tag">이전</span>
        <div className="fc-val">{renderValue(before)}</div>
      </div>
      <div className="fc-side fc-after">
        <span className="fc-tag">이후</span>
        <div className="fc-val">{renderValue(after)}</div>
      </div>
    </div>
  );
}

function ChangeItem({ entry, focused, focusNonce, onSelect }) {
  const [open, setOpen] = useState(false);
  const rowRef = useRef(null);
  const s = STATUS_STYLE[entry.diffStatus];
  const canExpand = entry.diffStatus === "modified" && entry.changedFields.length > 0;

  // 노드 클릭 등으로 이 항목이 포커스되면 스크롤 + (수정 항목이면) 펼침
  useEffect(() => {
    if (!focused) return;
    rowRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    if (canExpand) setOpen(true);
  }, [focused, focusNonce, canExpand]);

  return (
    <div ref={rowRef} className={`change-item ${focused ? "focused" : ""}`}>
      <div className="ci-row">
        <button className="ci-main" onClick={() => onSelect(entry.id)} title="캔버스에서 보기">
          <span className="ci-badge" style={{ background: s.border }}>
            {s.label}
          </span>
          <span className="ci-label">{nodeLabelOf(entry)}</span>
        </button>
        {canExpand && (
          <button className="ci-toggle" onClick={() => setOpen((o) => !o)}>
            {open ? "접기" : `필드 ${entry.changedFields.length}`}
          </button>
        )}
      </div>
      {canExpand && open && (
        <div className="ci-fields">
          {entry.changedFields.map((f) => (
            <FieldChange key={f.name} field={f} />
          ))}
        </div>
      )}
    </div>
  );
}

function EdgeItem({ entry, nameOf, onSelect }) {
  const s = STATUS_STYLE[entry.diffStatus];
  return (
    <button className="edge-item" onClick={() => onSelect(entry.source)} title="출발 노드로 이동">
      <span className="ci-badge" style={{ background: s.border }}>
        {s.label}
      </span>
      <span className="edge-body">
        <span className="edge-route">
          {nameOf(entry.source)} → {nameOf(entry.target)}
        </span>
        {entry.diffStatus === "modified" &&
          entry.changes.map((c) => (
            <span key={c.name} className="edge-change">
              {c.name}: <s>{c.before}</s> → <b>{c.after}</b>
            </span>
          ))}
      </span>
    </button>
  );
}

/** 변경 요약 패널: 규모 요약 + config 변경 + 변경 노드/엣지 리스트. */
export default function SummaryPanel({ diff, focus, onSelectNode }) {
  const changedNodes = diff.nodes.filter((n) => n.diffStatus !== "unchanged");
  const changedEdges = diff.edges.filter((e) => e.diffStatus !== "unchanged");

  const nameOf = useMemo(() => {
    const map = new Map();
    for (const n of diff.nodes) {
      const raw = n.after || n.before;
      map.set(n.id, raw?.metadata?.display_name || raw?.metadata?.name || n.id);
    }
    return (id) => map.get(id) || id;
  }, [diff]);

  return (
    <aside className="summary">
      <h2>변경 요약</h2>

      <div className="summary-counts">
        {STATUS_ORDER.map((status) => {
          const s = STATUS_STYLE[status];
          return (
            <div key={status} className="count" style={{ borderColor: s.border }}>
              <span className="count-num" style={{ color: s.border }}>
                {diff.summary[status]}
              </span>
              <span className="count-label">{s.label}</span>
            </div>
          );
        })}
      </div>

      {diff.configChanges.length > 0 && (
        <section className="config-changes">
          <h3>그래프 설정 변경</h3>
          {diff.configChanges.map((c) => (
            <div className="cfg-row" key={c.name}>
              <div className="cfg-name">{c.display_name}</div>
              <div className="cfg-vals">
                <span className="cfg-before">{renderValue(c.before)}</span>
                <span className="cfg-arrow">→</span>
                <span className="cfg-after">{renderValue(c.after)}</span>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="change-list">
        <h3>노드 변경 ({changedNodes.length})</h3>
        {changedNodes.length === 0 && <p className="muted">변경된 노드가 없습니다.</p>}
        {changedNodes.map((entry) => (
          <ChangeItem
            key={entry.id}
            entry={entry}
            focused={entry.id === focus.id}
            focusNonce={focus.nonce}
            onSelect={onSelectNode}
          />
        ))}
      </section>

      <section className="edge-list">
        <h3>엣지 변경 ({changedEdges.length})</h3>
        {changedEdges.length === 0 && <p className="muted">변경된 엣지가 없습니다.</p>}
        {changedEdges.map((entry) => (
          <EdgeItem key={entry.id} entry={entry} nameOf={nameOf} onSelect={onSelectNode} />
        ))}
      </section>
    </aside>
  );
}
