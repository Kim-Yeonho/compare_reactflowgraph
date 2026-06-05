/**
 * 데모용 기본 샘플 그래프 — "HGS_TEST_AGENT"의 배포본/캔버스 편집본.
 *
 * 두 그래프는 같은 그래프의 편집 전/후라 노드 id가 동일하게 유지된다.
 *  - deployedGraph(이전): KMS Retriever + Document Formatter 기반 RAG 파이프라인,
 *    Agent 프롬프트에 "참고 문서: {document}" 포함, document 변수 필드 존재.
 *  - canvasGraph(이후): RAG 노드 2개 제거(removed), Web Search Tool + Language Model
 *    추가(added), Agent 프롬프트에서 "참고 문서" 단락 제거(modified), document 필드 제거.
 *
 * 실제 JSON으로 바꾸려면 상단 "JSON 입력 편집"에 붙여넣거나 이 두 파일을 교체하면 된다.
 */
import deployedGraph from "./deployed.json";
import canvasGraph from "./canvas.json";

export { deployedGraph, canvasGraph };
