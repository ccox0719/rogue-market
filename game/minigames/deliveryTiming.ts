import type { MiniGameCallback, MiniGameResult } from "./types.js";

interface TimingState {
  running: boolean;
  direction: 1 | -1;
  position: number;
  speed: number;
  zoneStart: number;
  zoneEnd: number;
  rafId: number | null;
  callback: MiniGameCallback | null;
}

const phaseConfigs = [
  { width: 0.32, speed: 0.85, multiplier: 1, label: "Comfort tip" },
  { width: 0.24, speed: 1.05, multiplier: 1.4, label: "Snug zone" },
  { width: 0.16, speed: 1.3, multiplier: 1.8, label: "Risk it" },
];

const PHASE_DURATION = 3200;

const timingState: TimingState = {
  running: false,
  direction: 1,
  position: 0,
  speed: phaseConfigs[0].speed,
  zoneStart: 0.34,
  zoneEnd: 0.66,
  rafId: null,
  callback: null,
};

let lastTimestamp: number | null = null;
let currentPhase = 0;
let phaseTimeout: number | null = null;
let phaseDisplayEl: HTMLElement | null = null;
let zoneEl: HTMLElement | null = null;
const DEFAULT_DELIVERY_TITLE = "Tip Run - Delivery";
const DEFAULT_DELIVERY_SUBTITLE =
  "Watch the neon strip and stop inside the glow to keep the tips rolling.";

function applyHeaderContext(context?: { title?: string; subtitle?: string }): void {
  const titleEl = document.querySelector(
    "#minigame-delivery-overlay .minigame-title"
  ) as HTMLElement | null;
  if (titleEl) {
    titleEl.textContent = context?.title ?? DEFAULT_DELIVERY_TITLE;
  }
  const subtitleEl = document.querySelector(
    "#minigame-delivery-overlay .minigame-subtitle"
  ) as HTMLElement | null;
  if (subtitleEl) {
    subtitleEl.textContent = context?.subtitle ?? DEFAULT_DELIVERY_SUBTITLE;
  }
}

function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

const setMarkerPosition = (pos: number): void => {
  const marker = document.querySelector(".minigame-bar-marker") as HTMLElement | null;
  if (!marker) {
    return;
  }
  marker.style.left = `${pos * 100}%`;
};

function updateZoneVisual(): void {
  zoneEl = zoneEl ?? (document.querySelector(".minigame-bar-zone") as HTMLElement | null);
  if (!zoneEl) {
    return;
  }
  const width = timingState.zoneEnd - timingState.zoneStart;
  zoneEl.style.left = `${timingState.zoneStart * 100}%`;
  zoneEl.style.width = `${width * 100}%`;
}

function updatePhaseDisplay(): void {
  phaseDisplayEl =
    phaseDisplayEl ?? (document.getElementById("minigame-delivery-phase") as HTMLElement | null);
  if (!phaseDisplayEl) {
    return;
  }
  const phase = phaseConfigs[currentPhase];
  phaseDisplayEl.textContent = `Phase ${currentPhase + 1} / ${phaseConfigs.length} · ${phase.label}`;
}

function applyPhase(index: number): void {
  currentPhase = index;
  const phase = phaseConfigs[index];
  const center = 0.5;
  const halfWidth = phase.width / 2;
  timingState.zoneStart = center - halfWidth;
  timingState.zoneEnd = center + halfWidth;
  timingState.speed = phase.speed;
  updateZoneVisual();
  updatePhaseDisplay();
}

function scheduleNextPhase(): void {
  if (currentPhase >= phaseConfigs.length - 1) {
    return;
  }
  if (phaseTimeout != null) {
    window.clearTimeout(phaseTimeout);
  }
  phaseTimeout = window.setTimeout(() => {
    if (currentPhase < phaseConfigs.length - 1) {
      applyPhase(currentPhase + 1);
      scheduleNextPhase();
    }
  }, PHASE_DURATION);
}

function clearPhaseTimers(): void {
  if (phaseTimeout != null) {
    window.clearTimeout(phaseTimeout);
    phaseTimeout = null;
  }
}

function cleanupHandlers(): void {
  const startBtn = $("minigame-delivery-start") as HTMLButtonElement | null;
  const stopBtn = $("minigame-delivery-stop") as HTMLButtonElement | null;
  const closeBtn = $("minigame-delivery-close") as HTMLButtonElement | null;
  if (startBtn) {
    startBtn.onclick = null;
  }
  if (stopBtn) {
    stopBtn.onclick = null;
  }
  if (closeBtn) {
    closeBtn.onclick = null;
  }
}

function evaluateResult(): MiniGameResult {
  const { position, zoneStart, zoneEnd } = timingState;
  const zoneCenter = (zoneStart + zoneEnd) / 2;
  const zoneWidth = zoneEnd - zoneStart;
  const distFromCenter = Math.abs(position - zoneCenter) / (zoneWidth / 2);
  const normalizedDist = Math.min(1, Math.max(0, distFromCenter));
  const tierScore = 1 - normalizedDist;
  const phaseBias = (currentPhase + 1) / phaseConfigs.length;
  const score = Math.min(1, tierScore * 0.7 + phaseBias * 0.3);

  const phase = phaseConfigs[currentPhase];
  let tier: "perfect" | "good" | "ok" | "miss";

  if (normalizedDist <= 0.25) {
    tier = "perfect";
  } else if (normalizedDist <= 0.6) {
    tier = "good";
  } else if (normalizedDist <= 1.0) {
    tier = "ok";
  } else {
    tier = "miss";
  }

  const stories: Record<typeof tier, string> = {
    perfect: "The neon halo lights up as you stop on the dot.",
    good: "You land in the glow and keep the courier happy.",
    ok: "The meter wavers, but you still squeak through with a blip.",
    miss: "You overshoot the beam; the delivery van groans.",
  };

  const story = `${phase.label}: ${stories[tier]}`;

  return {
    score,
    story,
    tag: "delivery_timing",
  };
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function step(timestamp: number): void {
  if (!timingState.running) {
    return;
  }
  if (lastTimestamp == null) {
    lastTimestamp = timestamp;
  }
  const dt = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;
  timingState.position += timingState.direction * timingState.speed * dt;
  if (timingState.position <= 0) {
    timingState.position = 0;
    timingState.direction = 1;
  } else if (timingState.position >= 1) {
    timingState.position = 1;
    timingState.direction = -1;
  }
  setMarkerPosition(timingState.position);
  timingState.rafId = requestAnimationFrame(step);
}

export function launchDeliveryTimingMiniGame(
  callback: MiniGameCallback,
  context?: { title?: string; subtitle?: string }
): void {
  const overlay = $("minigame-delivery-overlay");
  const startBtn = $("minigame-delivery-start") as HTMLButtonElement | null;
  const stopBtn = $("minigame-delivery-stop") as HTMLButtonElement | null;
  const closeBtn = $("minigame-delivery-close") as HTMLButtonElement | null;
  const resultEl = $("minigame-delivery-result");
  if (!overlay || !startBtn || !stopBtn || !closeBtn || !resultEl) {
    return;
  }

  timingState.callback = callback;
  timingState.running = false;
  timingState.position = 0;
  timingState.direction = 1;
  lastTimestamp = null;
  clearPhaseTimers();
  applyPhase(0);
  applyHeaderContext(context);
  overlay.classList.add("is-visible");
  resultEl.textContent = "";
  startBtn.disabled = false;
  stopBtn.disabled = true;
  setMarkerPosition(timingState.position);

  startBtn.onclick = () => {
    if (timingState.running) {
      return;
    }
    resultEl.textContent = "";
    timingState.running = true;
    timingState.position = 0;
    timingState.direction = 1;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    lastTimestamp = null;
    applyPhase(0);
    scheduleNextPhase();
    if (timingState.rafId != null) {
      cancelAnimationFrame(timingState.rafId);
    }
    timingState.rafId = requestAnimationFrame(step);
  };

  stopBtn.onclick = () => {
    if (!timingState.running) {
      return;
    }
    timingState.running = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    if (timingState.rafId != null) {
      cancelAnimationFrame(timingState.rafId);
      timingState.rafId = null;
    }
    clearPhaseTimers();
    const result = evaluateResult();
    resultEl.textContent = result.story;
    window.setTimeout(() => {
      overlay.classList.remove("is-visible");
      if (timingState.callback) {
        timingState.callback(result);
      }
      cleanupHandlers();
    }, 600);
  };

  closeBtn.onclick = () => {
    if (timingState.rafId != null) {
      cancelAnimationFrame(timingState.rafId);
      timingState.rafId = null;
    }
    timingState.running = false;
    clearPhaseTimers();
    overlay.classList.remove("is-visible");
    const result: MiniGameResult = {
      score: 0,
      story: "You skipped the delivery. No tips earned.",
      tag: "delivery_timing",
    };
    if (timingState.callback) {
      timingState.callback(result);
    }
    cleanupHandlers();
  };
}
