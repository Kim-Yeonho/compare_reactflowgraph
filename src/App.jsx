import { useState } from "react";
import "reactflow/dist/style.css";
import "./styles.css";

import { deployedGraph, canvasGraph } from "./sample/sampleGraph";
import { diffGraphs } from "./lib/diffGraphs";
import OverlayView from "./components/OverlayView";
import SplitView from "./components/SplitView";
import SummaryPanel from "./components/SummaryPanel";
import JsonInputs from "./components/JsonInputs";
import ErrorBoundary from "./components/ErrorBoundary";

// 초기값: 샘플 그래프를 양쪽 입력창에 넣고 즉시 비교 결과를 보여준다.
const initialDeployed = JSON.stringify(deployedGraph, null, 2);
const initialCanvas = JSON.stringify(canvasGraph, null, 2);
const initialDiff = diffGraphs(deployedGraph, canvasGraph);

export default function App() {
  const [mode, setMode] = useState("overlay");
  const [diff, setDiff] = useState(initialDiff);
  const [focus, setFocus] = useState({ id: null, nonce: 0 });
  const [showInputs, setShowInputs] = useState(false);

  function handleCompare(deployedObj, canvasObj) {
    setDiff(diffGraphs(deployedObj, canvasObj));
    setFocus({ id: null, nonce: 0 });
    setShowInputs(false);
  }

  // 패널/노드 클릭 → 포커스(같은 노드 재클릭도 동작하도록 nonce 증가)
  function selectNode(id) {
    setFocus((f) => ({ id, nonce: f.nonce + 1 }));
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">⇄</span>
          <div>
            <h1>에이전트 그래프 Diff 뷰어</h1>
            <small>배포 버전 ↔ 캔버스 편집 버전 비교</small>
          </div>
        </div>

        <div className="mode-toggle" role="tablist">
          <button
            className={mode === "overlay" ? "active" : ""}
            onClick={() => setMode("overlay")}
          >
            오버레이
          </button>
          <button
            className={mode === "split" ? "active" : ""}
            onClick={() => setMode("split")}
          >
            좌우 분할
          </button>
        </div>

        <button className="ghost input-toggle" onClick={() => setShowInputs((s) => !s)}>
          {showInputs ? "입력 닫기 ▴" : "JSON 입력 편집 ▾"}
        </button>
      </header>

      {showInputs && (
        <JsonInputs
          initialDeployed={initialDeployed}
          initialCanvas={initialCanvas}
          onCompare={handleCompare}
        />
      )}

      <div className="content">
        <main className="canvas-area">
          <ErrorBoundary key={mode}>
            {mode === "overlay" ? (
              <OverlayView diff={diff} focus={focus} onSelectNode={selectNode} />
            ) : (
              <SplitView diff={diff} focus={focus} onSelectNode={selectNode} />
            )}
          </ErrorBoundary>
        </main>
        <SummaryPanel diff={diff} focus={focus} onSelectNode={selectNode} />
      </div>
    </div>
  );
}
