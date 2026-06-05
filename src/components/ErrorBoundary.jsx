import { Component } from "react";

/**
 * 렌더 중 예외가 나도 앱 전체가 빈 화면으로 죽지 않도록 방어한다.
 * 에러 메시지를 보여주고, 다시 시도(상태 초기화) 버튼을 제공한다.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // 콘솔에 상세 스택을 남겨 디버깅을 돕는다.
    console.error("렌더 오류:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-screen">
          <h2>화면을 그리는 중 오류가 발생했습니다</h2>
          <pre>{String(this.state.error?.message || this.state.error)}</pre>
          <button onClick={() => this.setState({ error: null })}>다시 시도</button>
        </div>
      );
    }
    return this.props.children;
  }
}
