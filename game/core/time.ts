export interface GameTime {
  day: number;
}

export const createInitialTime = (): GameTime => ({ day: 1 });

export const advanceDay = (time: GameTime, step = 1): GameTime => ({
  day: time.day + step,
});
