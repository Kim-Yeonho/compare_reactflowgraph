# 에이전트 그래프 버전 Diff 뷰어 (1차)

배포된 에이전트 그래프와 캔버스에서 편집 중인 버전을 **그래프 위에서 시각적으로** 비교한다.
JSON 텍스트 diff가 아니라, 노드/엣지에 추가·삭제·수정·동일 상태를 색으로 표현한다.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ — Vercel 정적 배포
npm test         # diff 로직 단독 테스트 (node --test)
```

## 구조

```
src/
├─ lib/
│  ├─ diffGraphs.js        # 두 그래프 비교 (순수 함수, UI 무의존 → 단독 테스트)
│  ├─ diffGraphs.test.mjs  # diffGraphs 단위 테스트
│  ├─ transformGraph.js    # 자체 포맷 → React Flow 노드/엣지 변환 + 오버레이/분할 빌더
│  └─ diffStyles.js        # 상태별 색상 규칙(공통)
├─ sample/
│  └─ sampleGraph.js       # 데모 샘플(배포본/캔버스본) — 4가지 상태가 모두 보이도록 구성
├─ components/
│  ├─ CustomNode.jsx       # diffStatus 기반 노드 렌더
│  ├─ FlowCanvas.jsx       # 단일 React Flow 캔버스(포커스/fit 공통)
│  ├─ OverlayView.jsx      # 오버레이 모드(단일 캔버스)
│  ├─ SplitView.jsx        # 좌우 분할 + 뷰포트 동기화
│  ├─ SummaryPanel.jsx     # 변경 요약/항목/필드 전후 대조
│  └─ JsonInputs.jsx       # JSON 입력 textarea 2개 + 비교 버튼
└─ App.jsx
```

## diff 규칙 요약

- **노드**: `id` 기준 매칭. `metadata.fields[]`의 `value`(name 기준)만 비교.
  - 제외(노이즈): `canvas` 좌표, `display_name`/`description`/`category`/`outputs`,
    필드의 `placeholder`/`options`/`option_item_metadata` 등 정의성 속성.
  - 상태: `added` / `removed` / `modified` / `unchanged`. modified는 변경 필드의 전/후 value 보관.
- **엣지**: id가 없어 `source::source_output_name->target::target_field_name` 합성 키로 매칭.
  존재 여부만 비교(`added`/`removed`/`unchanged`).
- **그래프 설정**: `config.options[]`의 value를 name 기준 비교 → 요약 패널 상단에 표시.

## 뷰 모드

- **오버레이**: 병합 노드 집합을 단일 캔버스에. 변경 규모가 작을 때 적합.
- **좌우 분할**: 좌=배포(removed 강조) / 우=캔버스(added 강조), modified는 양쪽 주황.
  두 패널 zoom/pan 동기화(같은 좌표계 → 같은 id 노드는 같은 위치).

## 색상

- 추가: 녹색 · 삭제: 적색(점선/반투명, 드래그·선택 비활성) · 수정: 주황 · 동일: 흐린 기본.

## 2차 추가 (완료)

- **긴 텍스트 word-level inline diff**: 프롬프트 등 공백 포함 텍스트는 단어 단위로 비교해
  추가(녹색)·삭제(빨강 취소선)만 하이라이트. ([wordDiff.js](src/lib/wordDiff.js))
- **노드 → 패널 양방향 연동**: 캔버스 노드 클릭 시 요약 패널의 해당 항목이 자동 스크롤·강조되고,
  수정 항목이면 변경 필드가 자동으로 펼쳐짐.
- **엣지 modified 상세 비교**: 같은 두 노드를 잇되 포트(출력/입력)만 바뀐 경우 "삭제+추가"가 아니라
  "수정"으로 묶어 전/후 포트를 표시. 엣지 변경 섹션 신설.
- 캔버스 배경 도트를 빌더 UI 스타일(흰 배경 + 옅은 회색 도트)에 맞춤.

## 다음 단계 (미구현)

- 파일 업로드 / API·DB 연동(Supabase 등)
- diff 기반 배포 액션(승인/롤백)
