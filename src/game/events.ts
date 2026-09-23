export interface GameStatusDetail {
  readonly deaths: number;
  readonly message: string;
  readonly phase?: 'playing' | 'dying' | 'completed';
}

const STATUS_EVENT = 'game:status';

export function publishGameStatus(detail: GameStatusDetail): void {
  window.dispatchEvent(new CustomEvent<GameStatusDetail>(STATUS_EVENT, { detail }));
}

export function subscribeToGameStatus(listener: (detail: GameStatusDetail) => void): () => void {
  const handler = (event: Event): void => {
    listener((event as CustomEvent<GameStatusDetail>).detail);
  };

  window.addEventListener(STATUS_EVENT, handler);
  return () => window.removeEventListener(STATUS_EVENT, handler);
}
