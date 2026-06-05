import { useState } from "react";

function parseGraph(text) {
  const obj = JSON.parse(text); // 실패 시 throw → 호출부에서 메시지 처리
  if (!obj || typeof obj !== "object" || !Array.isArray(obj.nodes)) {
    throw new Error("nodes 배열이 있는 그래프 JSON이 아닙니다.");
  }
  return obj;
}

/**
 * 배포/캔버스 두 JSON 입력창 + "비교" 버튼.
 * 파싱 실패 시 해당 입력창 아래에 붉은 오류 메시지를 표시하고 비교를 막는다.
 */
export default function JsonInputs({ initialDeployed, initialCanvas, onCompare }) {
  const [deployedText, setDeployedText] = useState(initialDeployed);
  const [canvasText, setCanvasText] = useState(initialCanvas);
  const [errors, setErrors] = useState({ deployed: null, canvas: null });

  function handleCompare() {
    const next = { deployed: null, canvas: null };
    let deployedObj;
    let canvasObj;
    try {
      deployedObj = parseGraph(deployedText);
    } catch (e) {
      next.deployed = e.message;
    }
    try {
      canvasObj = parseGraph(canvasText);
    } catch (e) {
      next.canvas = e.message;
    }
    setErrors(next);
    if (!next.deployed && !next.canvas) {
      onCompare(deployedObj, canvasObj);
    }
  }

  return (
    <div className="json-inputs">
      <div className="ji-grid">
        <div className="ji-col">
          <label>배포 버전 JSON (deployedGraph)</label>
          <textarea
            spellCheck={false}
            value={deployedText}
            onChange={(e) => setDeployedText(e.target.value)}
          />
          {errors.deployed && <div className="ji-error">⚠ {errors.deployed}</div>}
        </div>
        <div className="ji-col">
          <label>캔버스 버전 JSON (canvasGraph)</label>
          <textarea
            spellCheck={false}
            value={canvasText}
            onChange={(e) => setCanvasText(e.target.value)}
          />
          {errors.canvas && <div className="ji-error">⚠ {errors.canvas}</div>}
        </div>
      </div>
      <div className="ji-actions">
        <button className="primary" onClick={handleCompare}>
          비교
        </button>
      </div>
    </div>
  );
}
