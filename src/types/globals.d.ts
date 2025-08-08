interface DelegatedInkTrailPresenter {
  // 必要に応じて実体に合わせて足してください
  updateInkTrailStartPoint?(x: number, y: number): void;
}

interface Navigator {
  ink?: {
    requestPresenter(options: { presentationArea: HTMLCanvasElement }):
      Promise<DelegatedInkTrailPresenter>;
  };
}