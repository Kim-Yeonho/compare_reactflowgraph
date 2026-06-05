/**
 * 데모용 샘플 그래프 — "경영 성과 및 시장 분석 Agent".
 *
 * deployedGraph: 배포 버전(이전). 사용자가 제공한 실제 포맷을 기반으로 하되,
 *   "삭제(removed)" 상태를 보여주기 위해 도구 노드(계산기) 1개를 추가했다.
 * canvasGraph: 캔버스 편집 버전(이후). 아래가 한 번에 보이도록 변형했다.
 *   - modified : Agent 노드의 model / system_prompt_template / jailbreak_check
 *   - added    : "웹 검색" 도구 노드 + 해당 엣지
 *   - removed  : "계산기" 도구 노드 + 해당 엣지
 *   - unchanged: Chat Input / Chat Output
 *   - config 변경: number_of_messages 20 → 30
 */

const AGENT_ID = "8a7c3da6-b05d-4498-9669-53c9b93cf042";
const CHAT_INPUT_ID = "a89f71ac-1309-4c8c-965c-9a52498ef16c";
const CHAT_OUTPUT_ID = "a837f31c-5536-46e7-ad4f-53dda5be29ce";
const CALCULATOR_ID = "c1d2e3f4-aaaa-bbbb-cccc-000000000001";
const WEBSEARCH_ID = "d4c3b2a1-1111-2222-3333-000000000002";

function toolNode(id, name, displayName, description, x, fields) {
  return {
    id,
    metadata: {
      outputs: [
        {
          name: "component_as_tool",
          display_name: "Toolset",
          output_types: ["TOOL"],
          multiple_outputs: false,
        },
      ],
      fields,
      name,
      display_name: displayName,
      description,
      category: "TOOL",
      can_be_tool: true,
    },
    canvas: { x, y: 260 },
  };
}

export const deployedGraph = {
  name: "graph_a0668b59",
  role: "당사 경영 성과와 시장 동향, 통계를 통해 인사이트를 알려주는 에이전트",
  description: "",
  config: {
    options: [
      {
        name: "number_of_messages",
        type: "INT",
        description: "대화에서 기억할 메시지의 개수 (AI 메시지 포함)",
        placeholder: null,
        required: true,
        is_shown: true,
        display_name: "메시지 히스토리 길이",
        value: 20,
      },
    ],
    version: "v2",
  },
  nodes: [
    {
      id: CHAT_INPUT_ID,
      metadata: {
        outputs: [
          {
            name: "message",
            display_name: "User Message",
            output_types: ["MESSAGE"],
            multiple_outputs: true,
          },
        ],
        fields: [],
        name: "ChatInput",
        display_name: "Chat Input",
        description: "채팅 입력 컴포넌트",
        category: "INPUT",
        can_be_tool: false,
      },
      canvas: { x: 0, y: 0 },
    },
    {
      id: AGENT_ID,
      metadata: {
        outputs: [
          {
            name: "response",
            display_name: "Response",
            output_types: ["MESSAGE", "AI_MESSAGE"],
            multiple_outputs: true,
          },
        ],
        fields: [
          {
            name: "input",
            type: "TEXT",
            description: "",
            placeholder: "",
            required: true,
            is_shown: true,
            display_name: "Input",
            refresh_button: false,
            input_types: ["MESSAGE"],
            multiple_inputs: false,
            value: null,
            should_update: false,
            should_copy_value: true,
            root_group_field_names: null,
            multiline: true,
            regex: null,
            editable: true,
          },
          {
            name: "tools",
            type: "TOOL",
            description: "에이전트가 사용할 도구들",
            placeholder: null,
            required: false,
            is_shown: true,
            display_name: "Tools",
            refresh_button: false,
            input_types: ["TOOL"],
            multiple_inputs: true,
            value: null,
            should_update: false,
            should_copy_value: true,
            root_group_field_names: null,
          },
          {
            name: "system_prompt_template",
            type: "PROMPT",
            description: "에이전트의 시스템 프롬프트 템플릿",
            placeholder: null,
            required: false,
            is_shown: true,
            display_name: "System Prompt Template",
            refresh_button: false,
            input_types: [],
            multiple_inputs: false,
            value: "사용자의 질문에 한국어로 간결하고 정확하게 답변하세요.",
            should_update: false,
            should_copy_value: true,
            root_group_field_names: ["system_prompt_template"],
            multiline: true,
            use_prompt_gallery: true,
          },
          {
            name: "jailbreak_check",
            type: "BOOLEAN",
            description: "입력 내용 안전성 검사 체크할지 여부",
            placeholder: null,
            required: false,
            is_shown: true,
            display_name: "Jailbreak Check",
            refresh_button: false,
            input_types: [],
            multiple_inputs: false,
            value: false,
            should_update: false,
            should_copy_value: true,
            root_group_field_names: null,
          },
          {
            name: "model",
            type: "DROPDOWN",
            description: "언어 모델 제공자",
            placeholder: "모델을 선택하세요",
            required: true,
            is_shown: true,
            display_name: "Model",
            refresh_button: true,
            input_types: [],
            multiple_inputs: false,
            value: "azure_openai:gpt-5.4",
            should_update: true,
            should_copy_value: true,
            root_group_field_names: ["model"],
            options: ["azure_openai:gpt-5.4", "azure_openai:gpt-5.4-mini"],
            option_item_metadata: [
              {
                model_name: "gpt-5.4",
                model_id: 201,
                provider_id: 2,
                provider_name: "azure_openai",
                metadata_type: "PROVIDER",
                tags: [],
                model_type_list: ["LLM"],
                parameters: {},
              },
              {
                model_name: "gpt-5.4-mini",
                model_id: 202,
                provider_id: 2,
                provider_name: "azure_openai",
                metadata_type: "PROVIDER",
                tags: [],
                model_type_list: ["LLM"],
                parameters: {},
              },
            ],
            searchable: false,
          },
        ],
        name: "Agent",
        display_name: "Agent",
        description: "요청을 주어진 도구를 사용하여 처리하는 에이전트",
        category: "AGENT",
        can_be_tool: false,
      },
      canvas: { x: 300, y: 0 },
    },
    {
      id: CHAT_OUTPUT_ID,
      metadata: {
        outputs: [],
        fields: [
          {
            name: "input",
            type: "MESSAGE",
            description: "입력",
            placeholder: null,
            required: true,
            is_shown: true,
            display_name: "Input",
            refresh_button: false,
            input_types: ["AI_MESSAGE"],
            multiple_inputs: true,
            value: null,
            should_update: false,
            should_copy_value: true,
            root_group_field_names: null,
          },
        ],
        name: "ChatOutput",
        display_name: "Chat Output",
        description: "AI 출력 컴포넌트",
        category: "OUTPUT",
        can_be_tool: false,
      },
      canvas: { x: 600, y: 0 },
    },
    // 배포본에만 존재 → 캔버스에서 삭제(removed) 데모용
    toolNode(
      CALCULATOR_ID,
      "Calculator",
      "계산기",
      "수식을 계산하는 도구",
      150,
      [
        {
          name: "expression",
          type: "TEXT",
          description: "계산할 수식",
          placeholder: null,
          required: false,
          is_shown: true,
          display_name: "Expression",
          value: "",
        },
      ],
    ),
  ],
  edges: [
    {
      source: CHAT_INPUT_ID,
      source_output_name: "message",
      target: AGENT_ID,
      target_field_name: "input",
    },
    {
      source: AGENT_ID,
      source_output_name: "response",
      target: CHAT_OUTPUT_ID,
      target_field_name: "input",
    },
    {
      source: CALCULATOR_ID,
      source_output_name: "component_as_tool",
      target: AGENT_ID,
      target_field_name: "tools",
    },
  ],
  notes: [],
  display_name: "경영 성과 및 시장 분석 Agent",
  is_favorite: false,
  has_schedule: false,
  status: "ACTIVE",
  ownership: "MY",
  validation_status: "VALID",
  validation_errors: [],
  tags: [],
};

// ── 캔버스(편집) 버전: 배포본을 복제 후 변형 ──────────────────────────────
function buildCanvasGraph() {
  const g = structuredClone(deployedGraph);

  // config 변경: number_of_messages 20 → 30
  g.config.options[0].value = 30;

  // Agent 노드 필드 수정: model / system_prompt_template / jailbreak_check
  const agent = g.nodes.find((n) => n.id === AGENT_ID);
  for (const f of agent.metadata.fields) {
    if (f.name === "model") f.value = "azure_openai:gpt-5.4-mini";
    if (f.name === "jailbreak_check") f.value = true;
    if (f.name === "system_prompt_template") {
      f.value =
        "당신은 당사의 경영 성과 및 시장 분석 전문가입니다.\n" +
        "분기 실적과 시장 통계를 근거로, 핵심 인사이트 3가지와 전분기 대비 증감률을 표로 제시하세요.\n" +
        "모든 수치에는 출처를 함께 표기하고, 한국어로 간결하게 답변합니다.";
    }
  }

  // 계산기 노드/엣지 제거(removed)
  g.nodes = g.nodes.filter((n) => n.id !== CALCULATOR_ID);
  g.edges = g.edges.filter((e) => e.source !== CALCULATOR_ID);

  // 웹 검색 도구 노드/엣지 추가(added)
  g.nodes.push(
    toolNode(WEBSEARCH_ID, "WebSearch", "웹 검색", "웹에서 최신 정보를 검색하는 도구", 450, [
      {
        name: "max_results",
        type: "INT",
        description: "검색 결과 개수",
        placeholder: null,
        required: false,
        is_shown: true,
        display_name: "Max Results",
        value: 5,
      },
    ]),
  );
  g.edges.push({
    source: WEBSEARCH_ID,
    source_output_name: "component_as_tool",
    target: AGENT_ID,
    target_field_name: "tools",
  });

  return g;
}

export const canvasGraph = buildCanvasGraph();
