/**
 * wordDiff — 두 텍스트의 단어 단위 inline diff (LCS 기반, 외부 의존성 없음).
 *
 * 반환: [{ type: 'equal' | 'added' | 'removed', text }]
 *  - 공백도 토큰으로 보존하므로 세그먼트를 이어붙이면 원문이 복원된다.
 *  - 긴 프롬프트(수백 토큰) 수준에서 충분히 빠르다.
 */

function tokenize(text) {
  // 단어와 공백 덩어리를 모두 토큰으로 유지 (\s+ 캡처 분리)
  return String(text ?? "").split(/(\s+)/).filter((t) => t !== "");
}

function pushSeg(out, type, text) {
  const last = out[out.length - 1];
  if (last && last.type === type) last.text += text;
  else out.push({ type, text });
}

export function wordDiff(before, after) {
  const a = tokenize(before);
  const b = tokenize(after);
  const m = a.length;
  const n = b.length;

  // LCS 길이 DP (뒤에서부터)
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      pushSeg(out, "equal", a[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      pushSeg(out, "removed", a[i]);
      i++;
    } else {
      pushSeg(out, "added", b[j]);
      j++;
    }
  }
  while (i < m) pushSeg(out, "removed", a[i++]);
  while (j < n) pushSeg(out, "added", b[j++]);
  return out;
}

/** 문자열 필드인지(인라인 diff 적용 대상) 판별 */
export function isTextValue(v) {
  return typeof v === "string";
}
