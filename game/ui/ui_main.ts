import type { GameRunner } from "../core/runLoop.js";
import { executeTrade } from "../systems/portfolioSystem.js";
import {
  placeLimitBuyWatch,
  placeLimitSellWatch,
  placeStopLossWatch,
  cancelWatchOrder,
} from "../systems/watchOrders.js";
import type {
  GameState,
  MiniGameEventDescriptor,
  WatchOrderType,
} from "../core/state.js";
import type { MetaProfile } from "../core/metaState.js";
import { drawSparkline, drawPieChart, type PieSegment } from "../charts/miniChart.js";
import { formatCurrency, createListItem } from "./ui_helpers.js";
import { refreshHoldingsPanel, populateTickerOptions } from "./ui_portfolio.js";
import { renderEventList } from "./ui_events.js";
import { renderEraList } from "./ui_eras.js";
import { initializeNewsUI } from "./ui_news.js";
import { initializeMetaPanel } from "./ui_meta.js";
import { bindWhaleBuyoutHandler, renderWhaleInfluenceBar } from "./whale-influence-ui.js";
import { renderWhaleDialogue } from "./whale-dialogue-ui.js";
import { renderWhalePortrait, setWhaleSpeaking } from "./whale-portrait-ui.js";
import { CONFIG } from "../core/config.js";
import { buyBondFromListing } from "../systems/bondSystem.js";
import {
  findReactiveMicrocapCompany,
  recordReactiveMicrocapTrade,
} from "../whales/reactiveMicrocap.js";
import { localIncomeDefinitions } from "../systems/localIncomeSystem.js";
import type { DCAStreamId } from "../simulation/dca.js";
import {
  DCA_STREAMS,
  setActiveDCAStream,
  setDCADailyContribution,
} from "../simulation/dca.js";
import { recordLifecycleEvent } from "../systems/lifecycleSystem.js";
import { launchDeliveryTimingMiniGame } from "../minigames/deliveryTiming.js";
import { launchPhoneUnlockMiniGame } from "../minigames/phoneUnlock.js";
import { launchGarageCleanoutMiniGame } from "../minigames/garageCleanout.js";
import {
  createMiniGameEvent,
  type MiniGameEventId,
} from "../minigames/eventLibrary.js";
import { findBondDefinition } from "../generators/bondGen.js";
import {
  campaignLibrary,
  findCampaign,
} from "../content/campaigns.js";
import {
  challengeLibrary,
  findChallengeMode,
} from "../content/challengeModes.js";
import { findWhaleProfile } from "../generators/whaleGen.js";
import type { WhaleProfile } from "../generators/whaleGen.js";
import type { MiniGameResult } from "../minigames/types.js";
import type { StorySceneEvent } from "../../story/story-runner.js";
import { STORY_ACTS } from "../../story/story-flow.js";

export interface UIController {
  refresh(): void;
  updateMeta(meta: MetaProfile): void;
  updateAutosave(state: GameState): void;
}

interface UIOptions {
  onSummaryUpdate?: (summary: string) => void;
  metaState?: MetaProfile;
}

type PendingMiniGameEvent = MiniGameEventDescriptor;

export const initializeUI = (
  runner: GameRunner,
  container: HTMLElement,
  options: UIOptions = {}
): UIController => {
  container.classList.add("app-shell");
  container.innerHTML = `
    <div class="view-shell">
        <nav class="view-menu view-menu--collapsed">
          <div class="view-menu__header">
            <span class="view-menu__title">Menu</span>
            <span class="view-menu__status">Run Dashboard</span>
            <button
              type="button"
              class="view-menu__toggle"
              data-action="toggle-view-menu"
              aria-expanded="false"
              aria-label="Toggle navigation menu"
            >
              ☰
            </button>
          </div>
          <div class="view-menu__list" data-role="view-menu-list">
            <button type="button" class="view-menu__item view-menu__item--active" data-view-target="dashboard">
              Run Dashboard
            </button>
            <button type="button" class="view-menu__item" data-view-target="progression">
              Progression
            </button>
            <button type="button" class="view-menu__item" data-view-target="market">
              Market Info
            </button>
            <button type="button" class="view-menu__item" data-view-target="whales">
              Whales
            </button>
            <button type="button" class="view-menu__item" data-view-target="dev">
              Dev Tools
            </button>
          </div>
        </nav>
      <div class="view-stack">
        <article class="view-page view-page--active" data-view="dashboard">
          <div class="ticker-tape" data-role="ticker-tape">
            <div class="ticker-tape__strip" data-role="ticker-strip"></div>
          </div>
          <section class="panel buy-panel" data-panel="buy">
            <header class="panel-header">
              <h2>Buy Window</h2>
              <div class="panel-header-actions">
                <span class="autosave-status" data-role="autosave-status">Autosaved Day 42 - 03:01 PM</span>
                <button type="button" class="panel-toggle" aria-expanded="true"><span>Hide</span></button>
              </div>
            </header>
            <div class="panel-body">
              <div class="time-row">
                <button type="button" data-action="advance-1">Advance 1 Day</button>
                <button type="button" data-action="advance-5">Advance 5 Days</button>
              </div>
              <div class="stats-card">
                <h3>Stats</h3>
                <div class="stats-grid" data-role="stats-grid"></div>
              </div>
              <div class="stock-card">
                <div class="stock-card__header">
                  <div>
                    <p class="stock-card__label" data-role="selected-info"></p>
                    <div class="ohlc-row" data-role="ohlc-chips"></div>
                  </div>
                  <div class="stock-card__price">
                    <span class="price" data-role="selected-price"></span>
                    <span class="pct" data-role="selected-change">0.00%</span>
                  </div>
                </div>
                <div class="stock-card__chart">
                  <canvas width="360" height="200" data-role="company-chart"></canvas>
                </div>
              </div>
              <div class="holdings-card">
                <div class="holdings-card__header">
                  <h3>Holdings</h3>
                </div>
                <ul data-role="holdings-list"></ul>
              </div>
              <div class="trade-card">
                <h3>Trade</h3>
                <form class="trade-form">
                  <label>
                    Company
                    <select name="trade-ticker"></select>
                  </label>
                  <div class="shares-group">
                    <span>Shares: <strong data-role="slider-value">10</strong></span>
                    <input type="range" name="trade-slider" min="1" max="100" value="10" />
                  </div>
                  <div class="trade-buttons">
                    <button type="button" data-action="trade-buy" class="btn-buy">Buy</button>
                    <button type="button" data-action="trade-sell" class="btn-sell">Sell</button>
                  </div>
                </form>
                <p class="feedback" data-role="trade-feedback"></p>
                <div class="trade-card__microcap reactive-microcap-card" data-role="reactive-microcap-card" hidden>
                  <div class="reactive-microcap-card__header">
                    <span>Reactive Micro-Cap Discovered</span>
                    <span class="reactive-microcap-card__tag">Highly Reactive</span>
                  </div>
                  <p class="reactive-microcap-card__ticker" data-role="reactive-microcap-ticker"></p>
                  <p class="reactive-microcap-card__name" data-role="reactive-microcap-name"></p>
                  <p class="reactive-microcap-card__description" data-role="reactive-microcap-description"></p>
                  <p class="reactive-microcap-card__marketcap" data-role="reactive-microcap-marketcap"></p>
                </div>
              </div>
                <div class="trigger-card">
                  <div class="trigger-card__header">
                    <h3>Triggers</h3>
                    <button type="button" data-action="open-watch" class="trigger-new">+ New Trigger</button>
                  </div>
                  <ul data-role="watch-list"></ul>
                </div>
              <div class="side-hustle-card">
                  <div class="side-hustle-card__header">
                    <h3 data-role="side-hustle-title">Side Hustle</h3>
                    <p class="side-hustle-card__subtitle" data-role="side-hustle-subtitle">
                      Side gigs drop in randomly—keep an eye on the board.
                    </p>
                  </div>
                  <p class="side-hustle-card__story" data-role="side-hustle-story">
                    No gigs are active right now. Pause and listen to the neighborhood.
                  </p>
                  <button type="button" class="side-hustle-card__button" data-action="start-mini-game" disabled>
                    Watch the board
                  </button>
                </div>
                <div class="local-income-panel" data-role="local-income-panel">
                  <div class="local-income-panel__header">
                    <div>
                      <h3>Community Income Hub</h3>
                      <p>Blend steadier neighborhood cash with nearby bonds.</p>
                    </div>
                    <span class="local-income-panel__tag">DCA + Bonds</span>
                  </div>
                  <div class="local-income-panel__active" data-role="dca-active"></div>
                  <div class="local-income-panel__offers" data-role="dca-offers"></div>
                  <div class="local-income-panel__log">
                    <div class="local-income-panel__log-title">
                      <span>Recent events</span>
                      <small>rare and thematic</small>
                    </div>
                    <div class="local-income-panel__log-columns">
                      <div class="local-income-panel__log-column">
                        <h4>Macro streams</h4>
                        <ul data-role="local-income-event-list"></ul>
                      </div>
                      <div class="local-income-panel__log-column">
                        <h4>DCA events</h4>
                        <ul data-role="dca-event-list"></ul>
                      </div>
                    </div>
                  </div>
                  <div class="bond-market-section">
                    <div class="bond-market-section__header">
                      <h3>Bond Tenders</h3>
                      <p>Short-duration issues anchor the broader income mix.</p>
                    </div>
                    <div class="bond-market-grid">
                      <div class="bond-market__list">
                        <h4>Available Bonds</h4>
                        <ul data-role="bond-market-list"></ul>
                      </div>
                      <div class="bond-market__holdings">
                        <h4>Your Holdings</h4>
                        <ul data-role="bond-holdings-list"></ul>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          </section>
        </article>

        <button type="button" class="story-toggle" data-action="toggle-story">Story: On</button>

        <article class="view-page" data-view="progression">
          <section class="panel meta-panel" data-panel="meta">
            <header class="panel-header">
              <h2>Meta Progression</h2>
              <button type="button" class="panel-toggle" aria-expanded="true"><span>Hide</span></button>
            </header>
            <div class="panel-body">
              <div class="meta-heading">
                <h3>Progression</h3>
                <p class="meta-detail" data-role="meta-difficulty"></p>
              </div>
              <div class="meta-summary">
                <div class="meta-summary__item">
                  <span class="meta-summary__label">Runs</span>
                  <strong data-role="meta-runs">0</strong>
                </div>
                <div class="meta-summary__item">
                  <span class="meta-summary__label">Best peak</span>
                  <strong data-role="meta-best-peak">$0.00</strong>
                </div>
                <div class="meta-summary__item">
                  <span class="meta-summary__label">Best final</span>
                  <strong data-role="meta-best-final">$0.00</strong>
                </div>
                <div class="meta-summary__item">
                  <span class="meta-summary__label">Best single day</span>
                  <strong data-role="meta-best-day">$0.00</strong>
                </div>
                <div class="meta-summary__item">
                  <span class="meta-summary__label">XP</span>
                  <strong data-role="meta-xp">0</strong>
                </div>
                <div class="meta-summary__item">
                  <span class="meta-summary__label">Level</span>
                  <strong data-role="meta-level">1</strong>
                </div>
              </div>
              <div class="story-gauge" data-role="story-gauge">
                <div class="story-gauge__labels">
                  <span class="story-gauge__act" data-role="story-gauge-act">Act I — Startup Gamble</span>
                  <span class="story-gauge__day" data-role="story-gauge-day">Day 1 / 30</span>
                </div>
                <div class="story-gauge__bar">
                  <div class="story-gauge__fill" data-role="story-gauge-fill"></div>
                </div>
                <p class="story-gauge__desc" data-role="story-gauge-desc">
                  You’re just getting started.
                </p>
              </div>
              <div class="difficulty-section">
                <p class="meta-note">Select difficulty for your next run:</p>
                <div class="difficulty-grid" data-role="difficulty-grid"></div>
              </div>
            </div>
          </section>

          <section class="panel campaign-panel" data-panel="campaign">
            <header class="panel-header">
              <h2>Campaigns</h2>
              <button type="button" class="panel-toggle" aria-expanded="true"><span>Hide</span></button>
            </header>
            <div class="panel-body">
              <p class="meta-note">Short thematic runs with defined goals and unique constraints.</p>
              <p class="meta-note" data-role="campaign-objective">Select a campaign to begin.</p>
              <ul class="campaign-progress" data-role="campaign-progress"></ul>
            </div>
          </section>

          <section class="panel challenge-panel" data-panel="challenge">
            <header class="panel-header">
              <h2>Challenges</h2>
              <button type="button" class="panel-toggle" aria-expanded="true"><span>Hide</span></button>
            </header>
            <div class="panel-body">
              <p class="meta-note">One-off high-difficulty modes with fixed modifiers.</p>
              <ul class="challenge-list" data-role="challenge-list"></ul>
            </div>
          </section>
        </article>

        <article class="view-page" data-view="market">
          <section class="panel summary-panel" data-panel="summary">
            <header class="panel-header">
              <h2>Run Summary</h2>
              <button type="button" class="panel-toggle" aria-expanded="true"><span>Hide</span></button>
            </header>
            <div class="panel-body">
              <div class="summary-graph-row summary-graph-row--primary">
                <div class="summary-graph summary-graph--sparkline">
                  <p class="summary-graph-label">Portfolio trajectory</p>
                  <canvas width="260" height="220" data-role="summary-chart"></canvas>
                </div>
                <div class="summary-graph summary-graph--timeline">
                  <p class="summary-graph-label">Era timeline</p>
                  <canvas width="220" height="160" data-role="summary-era-timeline"></canvas>
                </div>
              </div>
              <div class="summary-graph-row summary-graph-row--secondary">
                <div class="summary-graph summary-graph--distribution">
                  <p class="summary-graph-label">Sector exposure</p>
                  <canvas width="180" height="200" data-role="summary-distribution"></canvas>
                </div>
                <div class="summary-graph summary-graph--pie">
                  <div class="summary-graph-label-row">
                    <p class="summary-graph-label">Active triggers</p>
                    <button type="button" class="summary-trigger-button" data-action="open-watch">Triggers</button>
                  </div>
                  <canvas width="140" height="160" data-role="summary-watch-pie"></canvas>
                </div>
              </div>
            </div>
          </section>

          <section class="panel eras-panel" data-panel="eras">
            <header class="panel-header">
              <h2>Eras</h2>
              <button type="button" class="panel-toggle" aria-expanded="true"><span>Hide</span></button>
            </header>
            <div class="panel-body">
              <ul data-role="era-list"></ul>
            </div>
          </section>

          <section class="panel lifecycle-panel" data-panel="lifecycle">
            <header class="panel-header">
              <h2>Market Lifecycle</h2>
              <button type="button" class="panel-toggle" aria-expanded="true"><span>Hide</span></button>
            </header>
            <div class="panel-body">
              <ul class="lifecycle-log" data-role="lifecycle-log"></ul>
            </div>
          </section>

        </article>
        <article class="view-page" data-view="whales">
          <section class="panel whale-panel" data-panel="whale">
            <header class="panel-header">
              <h2>Whale Watch</h2>
              <span data-role="whale-panel-day">Day 1</span>
            </header>
            <div class="panel-body">
              <div id="whale-portrait" class="whale-portrait">
                <div class="whale-portrait-glow"></div>
                <div class="whale-portrait-inner">
                  <div id="whale-portrait-icon" class="whale-portrait-icon">?</div>
                  <div class="whale-portrait-meta">
                    <div id="whale-portrait-name" class="whale-portrait-name">Whale Name</div>
                    <div id="whale-portrait-title" class="whale-portrait-title">Title / Archetype</div>
                  </div>
                </div>
              </div>
              <div id="whale-influence" class="whale-influence">
                <div class="whale-influence-header">
                  <span id="whale-influence-player-label">You</span>
                  <span id="whale-influence-center-label">Influence Balance</span>
                  <span id="whale-influence-whale-label">Whale</span>
                </div>
                <div class="whale-influence-bar">
                  <div id="whale-influence-fill-player" class="whale-influence-fill whale-influence-fill--player"></div>
                  <div id="whale-influence-fill-whale" class="whale-influence-fill whale-influence-fill--whale"></div>
                  <div id="whale-influence-marker" class="whale-influence-marker"></div>
                </div>
                <div class="whale-influence-footer">
                  <span id="whale-influence-player-value"></span>
                  <span id="whale-influence-status" class="whale-influence-status"></span>
                  <span id="whale-influence-whale-value"></span>
                </div>
                <div class="whale-influence-actions">
                  <button id="whale-buyout-button" class="whale-buyout-button" disabled>
                    Challenge Whale
                  </button>
                </div>
              </div>
              <div class="whale-dialogue" data-role="whale-dialogue">
                <h3 class="whale-dialogue__heading">Whale Dialogue</h3>
                <ul class="whale-dialogue__list" data-role="whale-dialogue-list"></ul>
              </div>
              <div class="whale-panel__list" data-role="whale-panel-list"></div>
            </div>
          </section>
        </article>

        <article class="view-page" data-view="dev">
          <section class="panel dev-panel" data-panel="dev">
            <header class="panel-header">
              <h2>Developer Controls</h2>
              <button type="button" class="panel-toggle" aria-expanded="true"><span>Hide</span></button>
            </header>
            <div class="panel-body">
        <div class="dev-drawer__controls">
          <div class="dev-drawer__section">
            <p class="dev-drawer__label">XP controls</p>
            <button type="button" data-action="dev-award-xp-small">+500 XP</button>
            <button type="button" data-action="dev-award-xp-large">+2000 XP</button>
            <button type="button" data-action="dev-reset-xp">Reset XP</button>
          </div>
          <div class="dev-drawer__section">
            <p class="dev-drawer__label">Lifecycle controls</p>
            <button type="button" data-action="dev-trigger-ipo">Spawn IPO</button>
            <button type="button" data-action="dev-trigger-split">Force split</button>
            <button type="button" data-action="dev-trigger-bankruptcy">Trigger bankruptcy</button>
          </div>
          <div class="dev-drawer__section">
            <p class="dev-drawer__label">Mini-games</p>
            <button type="button" data-action="dev-open-delivery">Launch Delivery Timing</button>
            <button type="button" data-action="dev-open-phone">Launch Phone Unlock</button>
            <button type="button" data-action="dev-open-garage">Launch Garage Cleanout</button>
          </div>
        </div>
      </div>
          </section>
        </article>
      </div>
    </div>

    <div class="carry-reward" data-role="carry-panel" hidden>
      <div class="carry-reward__content">
        <h3>Carry Choices</h3>
        <p>Pick one reward to unlock for future campaigns.</p>
        <ul data-role="carry-list"></ul>
        <div class="carry-reward__actions">
          <button type="button" data-action="carry-close">Dismiss</button>
        </div>
      </div>
    </div>

    <div class="choice-modal" data-role="choice-modal" hidden>
      <div class="choice-content">
        <h3>Opportunity</h3>
        <p data-role="choice-description"></p>
        <div class="choice-actions">
          <button type="button" data-action="choice-act">Act</button>
          <button type="button" data-action="choice-ignore">Ignore</button>
        </div>
      </div>
    </div>

    <div class="watch-modal" data-role="watch-modal" hidden>
      <div class="watch-modal-sheet">
        <header class="watch-modal-header">
          <h3>Trigger Order</h3>
          <button type="button" data-action="watch-close">×</button>
        </header>
        <div class="watch-modal-body">
          <p class="watch-company" data-role="watch-company">Select a company to watch</p>
          <label class="watch-field" data-watch="type">
            Order type
            <select name="watch-type">
              <option value="limit-buy">Limit Buy</option>
              <option value="limit-sell">Limit Sell</option>
              <option value="stop-loss">Stop Loss</option>
            </select>
          </label>
          <label class="watch-field" data-watch="price">
            Trigger price
            <input type="number" name="watch-price" min="0.01" step="0.01" />
          </label>
          <label class="watch-field" data-watch="cash">
            Max cash to spend
            <input type="number" name="watch-cash" min="1" step="0.01" />
          </label>
          <label class="watch-field" data-watch="shares">
            Shares
            <input type="number" name="watch-shares" min="1" step="1" />
          </label>
          <label class="watch-field" data-watch="time">
            Time in force
            <select name="watch-tif">
              <option value="good-till-run">Good-till-run</option>
              <option value="day">Today only</option>
            </select>
          </label>
          <div class="watch-actions">
            <button type="button" data-action="watch-save">Save trigger</button>
            <button type="button" data-action="watch-cancel">Cancel</button>
          </div>
          <p class="watch-feedback" data-role="watch-feedback"></p>
        </div>
      </div>
    </div>
    <!-- Delivery Timing Mini-game Overlay -->
    <div id="minigame-delivery-overlay" class="minigame-overlay">
      <div class="minigame-panel">
        <div class="minigame-header">
          <div class="minigame-title">Tip Run - Delivery</div>
          <div class="minigame-subtitle">
            Stop the marker in the green zone to earn tips.
          </div>
        </div>

        <div class="minigame-bar-wrapper">
          <div class="minigame-bar">
            <div class="minigame-bar-zone"></div>
            <div class="minigame-bar-marker"></div>
          </div>
        </div>
        <div id="minigame-delivery-phase" class="minigame-delivery-phase">
          Phase 1 / 3 · Comfort tip
        </div>

        <div class="minigame-footer">
          <button id="minigame-delivery-start" class="minigame-btn">
            Start
          </button>
          <button id="minigame-delivery-stop" class="minigame-btn" disabled>
            Stop!
          </button>
          <button
            id="minigame-delivery-close"
            class="minigame-btn minigame-btn-secondary"
          >
            Cancel
          </button>
        </div>

        <div id="minigame-delivery-result" class="minigame-result"></div>
      </div>
    </div>
    <!-- Phone Unlock Mini-game Overlay -->
    <div id="minigame-phone-overlay" class="minigame-overlay">
      <div class="minigame-panel">
        <div class="minigame-header">
          <div class="minigame-title">Phone Unlock – Memory</div>
          <div class="minigame-subtitle">
            Watch the symbols, then repeat the pattern to earn cash.
          </div>
        </div>

        <div class="minigame-phone-display">
          <div id="minigame-phone-sequence" class="minigame-phone-sequence"></div>
          <div id="minigame-phone-status" class="minigame-phone-status">
            Press Start to see the pattern.
          </div>
        </div>

        <div class="minigame-phone-input">
          <button class="minigame-phone-symbol" data-symbol="0">◆</button>
          <button class="minigame-phone-symbol" data-symbol="1">●</button>
          <button class="minigame-phone-symbol" data-symbol="2">▲</button>
          <button class="minigame-phone-symbol" data-symbol="3">★</button>
        </div>

        <div class="minigame-footer">
          <button id="minigame-phone-start" class="minigame-btn">
            Start
          </button>
          <button id="minigame-phone-submit" class="minigame-btn" disabled>
            Submit
          </button>
          <button id="minigame-phone-close" class="minigame-btn minigame-btn-secondary">
            Cancel
          </button>
        </div>

    <div id="minigame-phone-result" class="minigame-result"></div>
  </div>
</div>
    <!-- Garage Cleanout Mini-game Overlay -->
    <div id="minigame-garage-overlay" class="minigame-overlay">
      <div class="minigame-panel">
        <div class="minigame-header">
          <div class="minigame-title">Garage Cleanout</div>
          <div class="minigame-subtitle">
            Pick a box. Some are junk; some are hidden treasure.
          </div>
        </div>

        <div class="minigame-garage-grid">
          <button class="minigame-garage-box" data-box="0">📦</button>
          <button class="minigame-garage-box" data-box="1">📦</button>
          <button class="minigame-garage-box" data-box="2">📦</button>
          <button class="minigame-garage-box" data-box="3">📦</button>
          <button class="minigame-garage-box" data-box="4">📦</button>
        </div>

        <div id="minigame-garage-label" class="minigame-garage-label">
          Choose one box.
        </div>

    <div class="minigame-footer">
      <button id="minigame-garage-lockin" class="minigame-btn">
        Lock It In
      </button>
      <button id="minigame-garage-close" class="minigame-btn minigame-btn-secondary">
        Cancel
      </button>
    </div>

        <div id="minigame-garage-result" class="minigame-result"></div>
      </div>
    </div>
  `;
  container.insertAdjacentHTML(
    "beforeend",
    `
    <div class="story-dialog" data-role="story-dialog" hidden>
      <div class="story-dialog__inner">
        <p data-role="story-line"></p>
        <button type="button" data-action="story-continue">Continue</button>
      </div>
    </div>
    `
  );
  container.insertAdjacentHTML(
    "beforeend",
    `
    <div class="news-modal" data-role="news-modal" hidden>
      <div class="news-modal__dialog">
        <header class="news-modal__header">
          <span>Market News</span>
          <button type="button" class="news-modal__close" data-action="close-news-modal" aria-label="Close news modal">Close</button>
        </header>
        <div class="news-modal__body" data-role="news-modal-body"></div>
      </div>
    </div>
    <div class="side-hustle-modal" data-role="side-hustle-modal" hidden>
      <div class="side-hustle-modal__dialog">
        <header class="side-hustle-modal__header">
          <span>Side Hustle</span>
          <button type="button" class="side-hustle-modal__close" data-action="close-side-hustle-modal" aria-label="Close side hustle modal">Close</button>
        </header>
        <div class="side-hustle-modal__body">
          <h3 data-role="side-hustle-modal-title"></h3>
          <p class="side-hustle-modal__subtitle" data-role="side-hustle-modal-subtitle"></p>
          <p class="side-hustle-modal__story" data-role="side-hustle-modal-story"></p>
          <p class="side-hustle-modal__prompt" data-role="side-hustle-modal-prompt"></p>
          <button type="button" class="side-hustle-modal__action" data-action="start-side-hustle">Start gig</button>
        </div>
      </div>
    </div>
    <div class="news-ticker" data-role="news-ticker">
      <button type="button" class="news-ticker__launch" data-action="open-news-modal">News</button>
      <div class="news-ticker__inner" data-role="news-ticker-inner"></div>
    </div>
    `
  );

  const tickerTape = container.querySelector<HTMLElement>("[data-role='ticker-tape']");
  const tickerStrip = container.querySelector<HTMLElement>("[data-role='ticker-strip']");
  const summaryStripDay = container.querySelector<HTMLElement>("[data-role='summary-strip-day']");
  const summaryStripEra = container.querySelector<HTMLElement>("[data-role='summary-strip-era']");
  const summaryStripProgress = container.querySelector<HTMLElement>("[data-role='summary-strip-progress']");
  const summaryStripCash = container.querySelector<HTMLElement>("[data-role='summary-strip-cash']");
  const summaryStripMargin = container.querySelector<HTMLElement>("[data-role='summary-strip-margin']");
  const summaryStripBest = container.querySelector<HTMLElement>("[data-role='summary-strip-best']");
  const summaryStripXp = container.querySelector<HTMLElement>("[data-role='summary-strip-xp']");
  const summaryStripLevel = container.querySelector<HTMLElement>("[data-role='summary-strip-level']");
  const summaryStripPrediction = container.querySelector<HTMLElement>("[data-role='summary-strip-prediction']");
  const summaryStripMutation = container.querySelector<HTMLElement>("[data-role='summary-strip-mutation']");
  const summaryChart = container.querySelector<HTMLCanvasElement>("[data-role='summary-chart']");
  const summaryDistribution = container.querySelector<HTMLCanvasElement>("[data-role='summary-distribution']");
  const summaryEraTimeline = container.querySelector<HTMLCanvasElement>("[data-role='summary-era-timeline']");
  const summaryWatchPie = container.querySelector<HTMLCanvasElement>("[data-role='summary-watch-pie']");
  const storyGaugeAct = container.querySelector<HTMLElement>("[data-role='story-gauge-act']");
  const storyGaugeDay = container.querySelector<HTMLElement>("[data-role='story-gauge-day']");
  const storyGaugeFill = container.querySelector<HTMLElement>("[data-role='story-gauge-fill']");
  const storyGaugeDesc = container.querySelector<HTMLElement>("[data-role='story-gauge-desc']");
  const eraList = container.querySelector<HTMLUListElement>("[data-role='era-list']");
  const eventList = container.querySelector<HTMLUListElement>("[data-role='event-list']");
  const holdingsList = container.querySelector<HTMLUListElement>("[data-role='holdings-list']");
  const chartCanvas = container.querySelector<HTMLCanvasElement>("[data-role='company-chart']");
  const selectedInfo = container.querySelector<HTMLElement>("[data-role='selected-info']");
  const selectedPriceEl = container.querySelector<HTMLElement>("[data-role='selected-price']");
  const selectedChangeEl = container.querySelector<HTMLElement>("[data-role='selected-change']");
  const ohlcChipsContainer = container.querySelector<HTMLElement>("[data-role='ohlc-chips']");
  const statsGrid = container.querySelector<HTMLElement>("[data-role='stats-grid']");
  const tradeTicker = container.querySelector<HTMLSelectElement>("[name='trade-ticker']");
  const tradeSlider = container.querySelector<HTMLInputElement>("[name='trade-slider']");
  const sliderValueDisplay = container.querySelector<HTMLElement>("[data-role='slider-value']");
  const choiceModal = container.querySelector<HTMLElement>("[data-role='choice-modal']");
  const choiceDescription = container.querySelector<HTMLElement>("[data-role='choice-description']");
  const choiceAct = container.querySelector<HTMLButtonElement>("[data-action='choice-act']");
  const choiceIgnore = container.querySelector<HTMLButtonElement>("[data-action='choice-ignore']");
  const tradeFeedback = container.querySelector<HTMLElement>("[data-role='trade-feedback']");
  const autosaveStatus = container.querySelector<HTMLElement>("[data-role='autosave-status']");
  const controlButtons = container.querySelectorAll<HTMLButtonElement>(
    "[data-action='advance-1'], [data-action='advance-5'], [data-action='trade-buy'], [data-action='trade-sell']"
  );
  const watchList = container.querySelector<HTMLUListElement>("[data-role='watch-list']");
  const openWatchButton = container.querySelector<HTMLButtonElement>("[data-action='open-watch']");
  const watchModal = container.querySelector<HTMLElement>("[data-role='watch-modal']");
  const watchCompanyLabel = container.querySelector<HTMLElement>("[data-role='watch-company']");
  const watchTypeSelect = container.querySelector<HTMLSelectElement>("[name='watch-type']");
  const watchPriceInput = container.querySelector<HTMLInputElement>("[name='watch-price']");
  const watchCashInput = container.querySelector<HTMLInputElement>("[name='watch-cash']");
  const watchSharesInput = container.querySelector<HTMLInputElement>("[name='watch-shares']");
  const watchTifSelect = container.querySelector<HTMLSelectElement>("[name='watch-tif']");
  const watchSaveButton = container.querySelector<HTMLButtonElement>("[data-action='watch-save']");
  const watchCancelButton = container.querySelector<HTMLButtonElement>("[data-action='watch-cancel']");
  const watchCloseButton = container.querySelector<HTMLButtonElement>("[data-action='watch-close']");
  const miniGameTitle = container.querySelector<HTMLElement>("[data-role='side-hustle-title']");
  const miniGameSubtitle = container.querySelector<HTMLElement>("[data-role='side-hustle-subtitle']");
  const miniGameStory = container.querySelector<HTMLElement>("[data-role='side-hustle-story']");
  const miniGameButton = container.querySelector<HTMLButtonElement>("[data-action='start-mini-game']");
  const reactiveMicrocapCard = container.querySelector<HTMLElement>("[data-role='reactive-microcap-card']");
  const reactiveMicrocapTicker = container.querySelector<HTMLElement>("[data-role='reactive-microcap-ticker']");
  const reactiveMicrocapName = container.querySelector<HTMLElement>("[data-role='reactive-microcap-name']");
  const reactiveMicrocapDescription = container.querySelector<HTMLElement>("[data-role='reactive-microcap-description']");
  const reactiveMicrocapMarketCap = container.querySelector<HTMLElement>("[data-role='reactive-microcap-marketcap']");
  const reactiveMicrocapInfluence = container.querySelector<HTMLElement>("[data-role='reactive-microcap-influence']");
  const localIncomePanel = container.querySelector<HTMLElement>("[data-role='local-income-panel']");
  const localIncomeEventList = container.querySelector<HTMLUListElement>("[data-role='local-income-event-list']");
  const dcaEventList = container.querySelector<HTMLUListElement>("[data-role='dca-event-list']");
  const sideHustleModal = container.querySelector<HTMLElement>("[data-role='side-hustle-modal']");
  const sideHustleModalTitle = container.querySelector<HTMLElement>("[data-role='side-hustle-modal-title']");
  const sideHustleModalSubtitle = container.querySelector<HTMLElement>("[data-role='side-hustle-modal-subtitle']");
  const sideHustleModalStory = container.querySelector<HTMLElement>("[data-role='side-hustle-modal-story']");
  const sideHustleModalPrompt = container.querySelector<HTMLElement>("[data-role='side-hustle-modal-prompt']");
  const sideHustleModalClose = container.querySelector<HTMLButtonElement>("[data-action='close-side-hustle-modal']");
  const sideHustleModalStart = container.querySelector<HTMLButtonElement>("[data-action='start-side-hustle']");
  const sideHustleCard = container.querySelector<HTMLElement>(".side-hustle-card");
  const watchFeedback = container.querySelector<HTMLElement>("[data-role='watch-feedback']");
  const storyDialog = container.querySelector<HTMLElement>("[data-role='story-dialog']");
  const storyLine = container.querySelector<HTMLElement>("[data-role='story-line']");
  const dcaOffersContainer = container.querySelector<HTMLElement>("[data-role='dca-offers']");
  const dcaActiveInfo = container.querySelector<HTMLElement>("[data-role='dca-active']");
  const storyContinueButton = container.querySelector<HTMLButtonElement>(
    "[data-action='story-continue']"
  );
  const watchFieldCash = container.querySelector<HTMLElement>("[data-watch='cash']");
  const watchFieldShares = container.querySelector<HTMLElement>("[data-watch='shares']");
  const metaPanelContainer = container.querySelector<HTMLElement>(".meta-panel");
  const campaignObjectiveEl = container.querySelector<HTMLElement>("[data-role='campaign-objective']");
  const campaignProgressList = container.querySelector<HTMLUListElement>("[data-role='campaign-progress']");
  const challengeList = container.querySelector<HTMLUListElement>("[data-role='challenge-list']");
  const carryPanel = container.querySelector<HTMLElement>("[data-role='carry-panel']");
  const carryList = container.querySelector<HTMLUListElement>("[data-role='carry-list']");
  const carryCloseButton = container.querySelector<HTMLButtonElement>("[data-action='carry-close']");
  const bondMarketList = container.querySelector<HTMLUListElement>("[data-role='bond-market-list']");
  const bondHoldingsList = container.querySelector<HTMLUListElement>("[data-role='bond-holdings-list']");
  const lifecycleLogList = container.querySelector<HTMLUListElement>("[data-role='lifecycle-log']");
  const devAwardXpSmallButton = container.querySelector<HTMLButtonElement>("[data-action='dev-award-xp-small']");
  const devAwardXpLargeButton = container.querySelector<HTMLButtonElement>("[data-action='dev-award-xp-large']");
  const devTriggerIpoButton = container.querySelector<HTMLButtonElement>("[data-action='dev-trigger-ipo']");
  const devTriggerSplitButton = container.querySelector<HTMLButtonElement>("[data-action='dev-trigger-split']");
  const devTriggerBankruptcyButton = container.querySelector<HTMLButtonElement>("[data-action='dev-trigger-bankruptcy']");
  const devResetXpButton = container.querySelector<HTMLButtonElement>("[data-action='dev-reset-xp']");
  const devOpenDeliveryButton = container.querySelector<HTMLButtonElement>("[data-action='dev-open-delivery']");
  const devOpenPhoneButton = container.querySelector<HTMLButtonElement>("[data-action='dev-open-phone']");
  const devOpenGarageButton = container.querySelector<HTMLButtonElement>("[data-action='dev-open-garage']");
  const storyEventQueue: StorySceneEvent[] = [];
  let activeStoryEvent: StorySceneEvent | null = null;
  let activeStoryLineIndex = 0;
  const STORY_MODAL_CLASS = "story-modal-open";
  let currentMeta: MetaProfile = options.metaState ?? runner.metaState;
  let selectedTicker: string | undefined = undefined;
  let lastReactiveMicrocapTicker: string | null = null;
  const summaryHistory: number[] = [];
  const WATCH_ORDER_COLORS: Record<WatchOrderType, string> = {
    "limit-buy": "#00C853",
    "limit-sell": "#FF5252",
    "stop-loss": "#4FC3F7",
  };
  const dcaStreamsList = Object.values(DCA_STREAMS);
  const dcaStreamsByName = new Map(dcaStreamsList.map((stream) => [stream.name, stream]));
  let lastOfferMessage = "";
  const storyToggleButton = container.querySelector<HTMLButtonElement>("[data-action='toggle-story']");
  const STORY_TOGGLE_KEY = "rogue-market-story-enabled";
  const readStoryPreference = (): boolean => {
    if (!window?.localStorage) {
      return true;
    }
    try {
      const raw = window.localStorage.getItem(STORY_TOGGLE_KEY);
      if (raw === null) {
        return true;
      }
      return raw === "1";
    } catch {
      return true;
    }
  };
  let storyEnabled = readStoryPreference();
  const updateStoryToggleLabel = (): void => {
    if (!storyToggleButton) return;
    storyToggleButton.textContent = storyEnabled ? "Story: On" : "Story: Off";
    storyToggleButton.classList.toggle("story-toggle--disabled", !storyEnabled);
  };
  const newsUI = initializeNewsUI(container);
  const SIDE_HUSTLE_MODAL_OPEN_CLASS = "side-hustle-modal--open";
  let queuedSideHustleEvent: PendingMiniGameEvent | null = null;
  let sideHustleModalShownEvent: PendingMiniGameEvent | null = null;
  let sideHustleModalQueued = false;
  let sideHustleModalVisible = false;

  const updateSideHustleModalContent = (event: PendingMiniGameEvent): void => {
    if (sideHustleModalTitle) sideHustleModalTitle.textContent = event.title;
    if (sideHustleModalSubtitle) sideHustleModalSubtitle.textContent = event.subtitle;
    if (sideHustleModalStory) sideHustleModalStory.textContent = event.story;
    if (sideHustleModalPrompt) sideHustleModalPrompt.textContent = event.prompt;
  };

  const closeSideHustleModal = (): void => {
    if (!sideHustleModalVisible || !sideHustleModal) return;
    sideHustleModal.hidden = true;
    sideHustleModal.classList.remove(SIDE_HUSTLE_MODAL_OPEN_CLASS);
    sideHustleModalVisible = false;
  };

  const displaySideHustleModal = (event: PendingMiniGameEvent): void => {
    if (!sideHustleModal) return;
    updateSideHustleModalContent(event);
    sideHustleModal.hidden = false;
    sideHustleModal.classList.add(SIDE_HUSTLE_MODAL_OPEN_CLASS);
    sideHustleModalVisible = true;
    sideHustleModalQueued = false;
    sideHustleModalShownEvent = event;
  };

  const maybeOpenSideHustleModal = (options: { force?: boolean } = {}): void => {
    const event = queuedSideHustleEvent;
    if (!event) return;
    if (!options.force && sideHustleModalShownEvent === event) {
      return;
    }
    if (!options.force && newsUI.isOpen()) {
      sideHustleModalQueued = true;
      return;
    }
    displaySideHustleModal(event);
  };

  let sideHustleHighlightTimer: ReturnType<typeof setTimeout> | null = null;
  const highlightSideHustleCard = (): void => {
    if (!sideHustleCard) return;
    sideHustleCard.classList.add("side-hustle-card--highlight");
    sideHustleCard.scrollIntoView({ behavior: "smooth", block: "center" });
    if (sideHustleHighlightTimer) {
      clearTimeout(sideHustleHighlightTimer);
    }
    sideHustleHighlightTimer = setTimeout(() => {
      sideHustleCard.classList.remove("side-hustle-card--highlight");
      sideHustleHighlightTimer = null;
    }, 2000);
  };

  const queueSideHustleModal = (event: PendingMiniGameEvent | null): void => {
    if (!event) {
      queuedSideHustleEvent = null;
      sideHustleModalQueued = false;
      sideHustleModalShownEvent = null;
      return;
    }
    if (queuedSideHustleEvent === event) {
      return;
    }
    queuedSideHustleEvent = event;
    sideHustleModalQueued = true;
    highlightSideHustleCard();
  };

  newsUI.onClose(() => {
    if (sideHustleModalQueued) {
      maybeOpenSideHustleModal();
    }
  });
  const whalePanelList = container.querySelector<HTMLElement>("[data-role='whale-panel-list']");
  const whalePanelDay = container.querySelector<HTMLElement>("[data-role='whale-panel-day']");

  const hideStoryDialog = () => {
    if (storyDialog) {
      storyDialog.hidden = true;
    }
    document.body.classList.remove(STORY_MODAL_CLASS);
  };

  const openNextStoryEvent = () => {
    if (!storyEnabled) return;
    const nextEvent = storyEventQueue.shift();
    if (!nextEvent) {
      activeStoryEvent = null;
      hideStoryDialog();
      return;
    }

    activeStoryEvent = nextEvent;
    activeStoryLineIndex = 0;
    storyLine && (storyLine.textContent = nextEvent.lines[0] ?? "");
    if (storyDialog) {
      storyDialog.hidden = false;
    }
    document.body.classList.add(STORY_MODAL_CLASS);
  };

  const advanceStoryLine = () => {
    if (!activeStoryEvent) {
      openNextStoryEvent();
      return;
    }

    activeStoryLineIndex += 1;
    if (activeStoryLineIndex < activeStoryEvent.lines.length) {
      storyLine && (storyLine.textContent = activeStoryEvent.lines[activeStoryLineIndex]);
      return;
    }

    activeStoryEvent = null;
    openNextStoryEvent();
  };

  const queueStoryScenes = () => {
    const scenes = runner.consumeStoryScenes();
    if (!scenes.length) return;
    storyEventQueue.push(...scenes);
    if (storyEnabled && !activeStoryEvent) {
      openNextStoryEvent();
    }
  };

  const metaPanel = metaPanelContainer
    ? initializeMetaPanel({
        container: metaPanelContainer,
        metaState: currentMeta,
      })
    : null;

  const renderSummaryGraph = () => {
    if (!summaryChart) return;
    drawSparkline(summaryChart, summaryHistory.slice(-40));
  };

  const renderCampaignPanel = () => {
    if (!campaignObjectiveEl || !campaignProgressList) return;
    const campaignId = runner.state.campaignId;
    const campaign = campaignId ? findCampaign(campaignId) : null;
    if (campaign) {
      campaignObjectiveEl.textContent = `${campaign.name} · ${campaign.objective} · Run ${runner.state.campaignRunIndex}`;
    } else {
      campaignObjectiveEl.textContent = "No active campaign.";
    }
    campaignProgressList.innerHTML = "";
    for (const entry of campaignLibrary) {
      const progress = runner.metaState.campaignProgress[entry.id];
      const runs = progress?.runs ?? 0;
      const best = progress?.bestFinal ?? 0;
      const unlocked = runner.metaState.unlockedCampaigns.includes(entry.id);
      const item = document.createElement("li");
      item.className = `campaign-entry${unlocked ? "" : " locked"}`;
      const label = unlocked ? entry.name : `${entry.name} (Locked)`;
      item.innerHTML = `
        <strong>${label}</strong>
        <p>${entry.description}</p>
        <small>${entry.objective}</small>
        <small>Runs: ${runs} · Best: ${best ? formatCurrency(best) : "—"}</small>
      `;
      campaignProgressList.appendChild(item);
    }
  };

  const renderChallengePanel = () => {
    if (!challengeList) return;
    challengeList.innerHTML = "";
    for (const mode of challengeLibrary) {
      const best = runner.metaState.challengeRecords[mode.id] ?? 0;
      const item = document.createElement("li");
      item.className = "challenge-entry";
      item.innerHTML = `
        <strong>${mode.name}</strong>
        <p>${mode.description}</p>
        <small>Best Final: ${best ? formatCurrency(best) : "—"}</small>
      `;
      challengeList.appendChild(item);
    }
  };

  const renderCarryPanel = () => {
    if (!carryPanel || !carryList) return;
    const options = runner.state.pendingCarryChoices;
    carryPanel.hidden = !options?.length;
    carryList.innerHTML = "";
    if (!options?.length) return;
    for (const option of options) {
      const entry = document.createElement("li");
      entry.className = "carry-entry";
      entry.innerHTML = `
        <strong>${option.label}</strong>
        <p>${option.description}</p>
        <button type="button" data-action="carry-choose" data-option-id="${option.id}">
          Take
        </button>
      `;
      carryList.appendChild(entry);
    }
  };

  const renderLifecycleLog = () => {
    if (!lifecycleLogList) return;
    lifecycleLogList.innerHTML = "";
    const entries = [...runner.state.lifecycleLog].reverse();
    if (entries.length === 0) {
      const placeholder = document.createElement("li");
      placeholder.className = "lifecycle-log__placeholder";
      placeholder.textContent = "No lifecycle events logged yet.";
      lifecycleLogList.appendChild(placeholder);
      return;
    }

    for (const entry of entries) {
      const item = createListItem(entry);
      item.className = "lifecycle-log__entry";
      lifecycleLogList.appendChild(item);
    }
  };

  const renderBondMarket = () => {
    if (!bondMarketList) return;
    bondMarketList.innerHTML = "";
    if (runner.state.bondMarket.length === 0) {
      const placeholder = document.createElement("li");
      placeholder.className = "bond-card";
      placeholder.textContent = "No bonds listed today.";
      bondMarketList.appendChild(placeholder);
      return;
    }

    for (const listing of runner.state.bondMarket) {
      const card = document.createElement("li");
      card.className = "bond-card";
      const definition = findBondDefinition(listing.bondId);
      const defaultChance = definition?.defaultChance ?? 0;
      card.innerHTML = `
        <div class="bond-card__header">
          <strong>${listing.bondId}</strong>
          <span class="bond-card__tag">
            ${listing.type.toUpperCase()} · ${listing.durationDays}d · Face ${formatCurrency(listing.faceValue)}
          </span>
        </div>
        <ul class="bond-card__details">
          <li>Coupon: ${(listing.couponRate * 100).toFixed(2)}%</li>
          <li>Default: ${defaultChance.toFixed(2)}</li>
        </ul>
        <button type="button" data-action="buy-bond" data-listing-id="${listing.id}">
          Buy 1 unit
        </button>
      `;
      bondMarketList.appendChild(card);
    }
  };

  const renderBondHoldings = () => {
    if (!bondHoldingsList) return;
    bondHoldingsList.innerHTML = "";
    if (runner.state.bondHoldings.length === 0) {
      const placeholder = document.createElement("li");
      placeholder.className = "bond-holding";
      placeholder.textContent = "None yet — purchase bonds to begin generating passive yield.";
      bondHoldingsList.appendChild(placeholder);
      return;
    }

    for (const holding of runner.state.bondHoldings) {
      const couponDaily =
        (holding.couponRate / CONFIG.BOND_COUPON_PERIOD) *
        holding.faceValue *
        holding.units;
      const entry = document.createElement("li");
      entry.className = "bond-holding";
      entry.innerHTML = `
        <strong>${holding.bondId}</strong>
        <p>${holding.type.toUpperCase()} · ${holding.units} unit(s)</p>
        <p class="bond-holding__meta">
          <span>Coupon/day ${formatCurrency(couponDaily)}</span>
          <span>${holding.daysToMaturity}d to maturity</span>
        </p>
      `;
      bondHoldingsList.appendChild(entry);
    }
  };

  const getSectorDistribution = () => {
    const buckets: Record<string, number> = {};
    let total = 0;

    for (const [ticker, shares] of Object.entries(runner.state.portfolio.holdings)) {
      const company = runner.state.companies.find((item) => item.ticker === ticker);
      if (!company || shares <= 0) {
        continue;
      }
      const value = shares * company.price;
      total += value;
      buckets[company.sector] = (buckets[company.sector] ?? 0) + value;
    }

    const entries = Object.entries(buckets).sort((a, b) => b[1] - a[1]);
    const colors = ["#4FC3F7", "#00C853", "#FF5252", "#2C323B"];
    const segments: PieSegment[] = [];

    for (let i = 0; i < entries.length; i += 1) {
      if (segments.length >= 4) break;
      segments.push({
        value: entries[i][1],
        color: colors[i % colors.length],
      });
    }

    if (entries.length > 4) {
      const rest = entries.slice(4).reduce((sum, [, value]) => sum + value, 0);
      if (rest > 0) {
        segments.push({
          value: rest,
          color: "#607D8B",
        });
      }
    }

    return { total, segments };
  };

  const renderSectorDistribution = () => {
    if (!summaryDistribution) return;
    const { segments } = getSectorDistribution();
    drawPieChart(summaryDistribution, segments);
  };

  const renderEraTimeline = () => {
    if (!summaryEraTimeline) return;
    const ctx = summaryEraTimeline.getContext("2d");
    if (!ctx) return;
    const width = summaryEraTimeline.width;
    const height = summaryEraTimeline.height;
    ctx.clearRect(0, 0, width, height);
    const eras = runner.state.eras;
    if (eras.length === 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#9fb7ff";
      ctx.font = "11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Era timeline unavailable", width / 2, height / 2 + 4);
      return;
    }

    const totalDuration = Math.max(1, eras.reduce((sum, era) => sum + era.duration, 0));
    const barHeight = Math.floor(height * 0.24);
    const barTop = height / 2 - barHeight / 2;
    const gap = 4;
    let cursor = 0;
    const currentIdx = Math.min(runner.state.currentEraIndex, eras.length - 1);

    // draw base track
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.fillRect(0, barTop, width, barHeight);

    const eraSegments: Array<{ left: number; width: number; era: typeof eras[number] }> = [];
    eras.forEach((era, index) => {
      const widthPortion = ((era.duration / totalDuration) * width) - gap;
      const segmentLeft = cursor + gap / 2;
      const segmentWidth = Math.max(1, widthPortion);
      const fillStyle =
        index < currentIdx
          ? "rgba(79, 195, 247, 0.4)"
          : index === currentIdx
            ? "rgba(0, 200, 83, 0.85)"
            : "rgba(255, 255, 255, 0.05)";
      ctx.fillStyle = fillStyle;
      ctx.fillRect(segmentLeft, barTop, segmentWidth, barHeight);
      eraSegments.push({ left: segmentLeft, width: segmentWidth, era });
      cursor += (era.duration / totalDuration) * width;
    });

    const predictedId = runner.state.predictedNextEraId;
    const predictedSegment = predictedId
      ? eraSegments.find((segment) => segment.era.id === predictedId)
      : undefined;
    if (predictedSegment) {
      ctx.save();
      ctx.strokeStyle = runner.state.predictionWasAccurate
        ? "rgba(255, 255, 255, 0.65)"
        : "rgba(255, 82, 82, 0.9)";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        predictedSegment.left,
        barTop - 3,
        predictedSegment.width,
        barHeight + 6
      );
      ctx.restore();
    }

    const currentEra = eras[currentIdx];
    if (currentEra) {
      const beforeDuration = eras
        .slice(0, currentIdx)
        .reduce((sum, era) => sum + era.duration, 0);
      const progressDays = Math.min(currentEra.duration, runner.state.currentEraDay + 1);
      const markerX =
        ((beforeDuration + progressDays) / totalDuration) * width;
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0, 200, 83, 0.9)";
      ctx.beginPath();
      ctx.moveTo(markerX, barTop);
      ctx.lineTo(markerX, barTop + barHeight);
      ctx.stroke();
      ctx.fillStyle = "#00C853";
      ctx.beginPath();
      ctx.arc(markerX, barTop + barHeight + 6, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const renderWatchPie = () => {
    if (!summaryWatchPie) return;
    const watchBuckets: Record<WatchOrderType, number> = {
      "limit-buy": 0,
      "limit-sell": 0,
      "stop-loss": 0,
    };

    for (const order of runner.state.watchOrders) {
      watchBuckets[order.type] += 1;
    }

    const segments: PieSegment[] = Object.entries(watchBuckets)
      .filter(([, value]) => value > 0)
      .map(([type, value]) => ({
        value,
        color: WATCH_ORDER_COLORS[type as WatchOrderType],
      }));

    drawPieChart(
      summaryWatchPie,
      segments,
      runner.state.watchOrders.length > 0 ? "Trigger mix" : "No triggers"
    );
  };

  const refreshSummary = () => {
    const totalDaysLabel =
      runner.state.totalDays === Number.MAX_SAFE_INTEGER ? "∞" : runner.state.totalDays;
    if (summaryStripDay) {
      summaryStripDay.textContent = `Day ${runner.state.day}/${totalDaysLabel}`;
    }
    if (summaryStripEra) {
      summaryStripEra.textContent = `Era ${runner.currentEraName()}`;
    }
    const value = runner.getPortfolioValue();
    summaryHistory.push(value);
    if (summaryHistory.length > 60) {
      summaryHistory.shift();
    }
    renderSummaryGraph();
    renderSectorDistribution();
    renderEraTimeline();
    renderWatchPie();
    if (summaryStripProgress) {
      const era = runner.state.eras[runner.state.currentEraIndex];
      const duration = era?.duration ?? 0;
      const progress = Math.min(duration, runner.state.currentEraDay + 1);
      summaryStripProgress.textContent = era
        ? `Progress ${progress}/${duration}`
        : "Progress unknown";
    }
    if (summaryStripCash) {
      summaryStripCash.textContent = `Cash ${formatCurrency(runner.state.portfolio.cash)}`;
    }
    const holdingsValue = Math.max(0, value - runner.state.portfolio.cash);
    const limit = runner.state.portfolio.marginLimit;
    const marginUsage = limit > 0 ? Math.min(100, (holdingsValue / limit) * 100) : 0;
    if (summaryStripMargin) {
      summaryStripMargin.textContent = limit > 0 ? `Margin ${marginUsage.toFixed(0)}%` : "Margin n/a";
    }
    if (summaryStripBest) {
      summaryStripBest.textContent = `Best final ${formatCurrency(runner.metaState.bestFinalPortfolio)}`;
    }
    if (summaryStripXp) {
      summaryStripXp.textContent = `XP ${runner.metaState.xp}`;
    }
    if (summaryStripLevel) {
      summaryStripLevel.textContent = `Level ${runner.metaState.level}`;
    }
    if (summaryStripPrediction) {
      const predictedEra = runner.state.eras.find(
        (era) => era.id === runner.state.predictedNextEraId
      );
      const actualEra = runner.state.eras.find(
        (era) => era.id === runner.state.actualNextEraId
      );
      const predictedLabel = predictedEra ? predictedEra.name : "Unknown";
      const actualLabel = actualEra ? actualEra.name : "";
      const confidence = Math.round((runner.state.predictionConfidence ?? 0) * 100);
      const hasPrediction = runner.state.predictedNextEraId !== null;
      if (hasPrediction && actualLabel) {
        summaryStripPrediction.textContent = `Predicted: ${predictedLabel} (${confidence}%) · Actual: ${actualLabel}`;
      } else if (hasPrediction) {
        summaryStripPrediction.textContent = `Predicted: ${predictedLabel} (${confidence}%)`;
      } else if (actualLabel) {
        summaryStripPrediction.textContent = `Actual: ${actualLabel}`;
      } else {
        summaryStripPrediction.textContent = "Predictions unavailable";
      }
      summaryStripPrediction.classList.toggle(
        "uncertain",
        !runner.state.predictionWasAccurate
      );
    }
    if (summaryStripMutation) {
      summaryStripMutation.textContent = runner.state.mutationMessage
        ? `Mutation: ${runner.state.mutationMessage}`
        : "";
    }
  };

  const updateSliderValueDisplay = () => {
    if (tradeSlider && sliderValueDisplay) {
      sliderValueDisplay.textContent = tradeSlider.value;
    }
  };

  const renderCompanyChart = () => {
    if (!chartCanvas) return;
    const company = runner.state.companies.find((item) => item.ticker === selectedTicker);
    if (!company) {
      if (selectedInfo) {
        selectedInfo.textContent = "Select a company from the dropdown to view its sparkline.";
      }
      chartCanvas.getContext("2d")?.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
      return;
    }
    drawSparkline(chartCanvas, company.history.slice(-40));
    if (selectedInfo) {
      selectedInfo.textContent = `${company.name} · ${company.ticker}`;
    }
    const previous = company.history[company.history.length - 2] ?? company.price;
    const changePct = previous === 0 ? 0 : (company.price - previous) / previous;
    const changeLabel = changePct >= 0 ? `+${(changePct * 100).toFixed(2)}%` : `${(changePct * 100).toFixed(2)}%`;
    if (selectedPriceEl) {
      selectedPriceEl.textContent = formatCurrency(company.price);
    }
    if (selectedChangeEl) {
      selectedChangeEl.textContent = changeLabel;
      selectedChangeEl.classList.toggle("green", changePct >= 0);
      selectedChangeEl.classList.toggle("red", changePct < 0);
    }
    if (ohlcChipsContainer) {
      ohlcChipsContainer.innerHTML = "";
      const range = company.todayRange;
      if (range) {
        const chips = [
          `O:${range.open.toFixed(2)}`,
          `H:${range.high.toFixed(2)}`,
          `L:${range.low.toFixed(2)}`,
          `C:${range.close.toFixed(2)}`,
        ];
        for (const chip of chips) {
          const span = document.createElement("span");
          span.className = "ohlc-chip";
          span.textContent = chip;
          ohlcChipsContainer.appendChild(span);
        }
      }
    }
  };

  const formatPercent = (value: number): string => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${(value * 100).toFixed(2)}%`;
  };

  const describeAggression = (
    profile?: { impactModel?: { sectorTrendDelta?: number; companyTrendDelta?: number } }
  ): string => {
    const base =
      Math.abs(profile?.impactModel?.sectorTrendDelta ?? 0) +
      Math.abs(profile?.impactModel?.companyTrendDelta ?? 0);
    if (base >= 0.04) return "High aggression";
    if (base >= 0.02) return "Medium aggression";
    if (base > 0) return "Low aggression";
    return "Neutral stance";
  };

  const formatDaysAgo = (lastDay: number): string => {
    const diff = Math.max(0, runner.state.day - lastDay);
    if (diff <= 0) return "Active today";
    if (diff === 1) return "1 day ago";
    return `${diff} days ago`;
  };

  const updateStoryGauge = (): void => {
    if (!storyGaugeAct || !storyGaugeDay || !storyGaugeFill || !storyGaugeDesc) return;
    const total = runner.state.totalDays === Number.MAX_SAFE_INTEGER
      ? runner.state.day + 1
      : runner.state.totalDays;
    const progress = total > 0 ? Math.min(runner.state.day / total, 1) : 0;
    const actIndex = Math.min(
      STORY_ACTS.length - 1,
      Math.floor(progress * STORY_ACTS.length)
    );
    const act = STORY_ACTS[actIndex] ?? STORY_ACTS[0];

    storyGaugeAct.textContent = act?.title ?? "Story Progress";
    storyGaugeDesc.textContent = act?.description ?? "";
    storyGaugeDay.textContent =
      runner.state.totalDays === Number.MAX_SAFE_INTEGER
        ? `Day ${runner.state.day}`
        : `Day ${runner.state.day} / ${runner.state.totalDays}`;
    storyGaugeFill.style.width = `${progress * 100}%`;
  };

  const getWhaleIconSymbol = (profile?: WhaleProfile | null): string => {
    if (profile?.icon) return profile.icon;
    const name = profile?.displayName ?? "";
    return name ? name.charAt(0) : "W";
  };

  const renderWhalePanel = (): void => {
    if (!whalePanelList) return;
    if (whalePanelDay) {
      whalePanelDay.textContent = `Day ${runner.state.day}`;
    }
    const whales = runner.state.activeWhales.filter((whale) => whale.visible);
    if (whales.length === 0) {
      whalePanelList.innerHTML =
        '<p class="whale-panel__empty">No whales active yet.</p>';
      return;
    }

    const fragment = document.createDocumentFragment();

    for (const whale of whales) {
      const profile = findWhaleProfile(whale.profileId);
      const row = document.createElement("article");
      row.className = "whale-panel__row";

      const icon = document.createElement("span");
      icon.className = `whale-panel__icon whale-hud__icon whale-hud__icon--${profile?.style ?? "default"}`;
      icon.textContent = getWhaleIconSymbol(profile);
      row.appendChild(icon);

      const details = document.createElement("div");
      details.className = "whale-panel__details";

      const title = document.createElement("p");
      title.className = "whale-panel__name";
      title.textContent = profile?.displayName ?? "Unknown Whale";
      details.appendChild(title);

      const meta = document.createElement("p");
      meta.className = "whale-panel__meta";
      meta.textContent = `${describeAggression(profile)} · ${formatDaysAgo(whale.lastActionDay)}`;
      details.appendChild(meta);

      const hint = document.createElement("p");
      hint.className = "whale-panel__hint";
      hint.textContent =
        profile?.description ??
        `Focus: ${profile?.favoriteSectors.join(", ") ?? "General market"}`;
      details.appendChild(hint);

      row.appendChild(details);

      const capitalEl = document.createElement("div");
      capitalEl.className = "whale-panel__capital";
      capitalEl.textContent = whale.capital
        ? formatCurrency(whale.capital)
        : "Capital unknown";
      row.appendChild(capitalEl);

      fragment.appendChild(row);
    }

    whalePanelList.innerHTML = "";
    whalePanelList.appendChild(fragment);
  };

  const updateTickerTape = () => {
    if (!tickerStrip) return;
    const totalDaysLabel =
      runner.state.totalDays === Number.MAX_SAFE_INTEGER ? "∞" : runner.state.totalDays;
    const era = runner.state.eras[runner.state.currentEraIndex];
    const trendValue =
      era?.effects?.globalTrendBias ?? era?.effects?.global ?? 0;
    const holdingsCount = Object.values(runner.state.portfolio.holdings).filter(
      (quantity) => quantity > 0
    ).length;

    const entries = [
      `Portfolio ${formatCurrency(runner.getPortfolioValue())}`,
      `Cash ${formatCurrency(runner.state.portfolio.cash)} · Day ${runner.state.day}/${totalDaysLabel} · Era ${runner.currentEraName()}`,
      `Lvl ${currentMeta.level} · XP ${currentMeta.xp} · Best Final ${formatCurrency(currentMeta.bestFinalPortfolio)}`,
      `Trend ${formatPercent(trendValue)} · Vol ${runner.state.volatilityMultiplier.toFixed(2)}`,
      `Holdings ${holdingsCount} tickers · Debt ${formatCurrency(runner.state.portfolio.debt)}`,
      `Triggers ${runner.state.watchOrders.length}`,
    ];
    const tapeText = entries.join(" · ");
    tickerStrip.innerHTML = `<span>${tapeText}&nbsp;</span><span>${tapeText}&nbsp;</span>`;
  };

  const calculateVolatility = (history: number[]): number => {
    if (history.length < 2) return 0;
    const returns = history.slice(1).map((price, index) => {
      const last = history[index];
      return last === 0 ? 0 : (price - last) / last;
    });
    const avg = returns.reduce((sum, value) => sum + value, 0) / returns.length;
    const variance =
      returns.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / returns.length;
    return Math.sqrt(variance);
  };

  const refreshCompanyStats = () => {
    const company = runner.state.companies.find((item) => item.ticker === selectedTicker);
    if (!company) {
      if (statsGrid) {
        statsGrid.innerHTML = "<div>No company selected.</div>";
      }
      return;
    }

    if (!statsGrid) return;
    const recentHistory = company.history.slice(-5);
    const average =
      recentHistory.reduce((sum, price) => sum + price, 0) / recentHistory.length;
    const previous = company.history[company.history.length - 2] ?? company.history[0];
    const changePct = previous === 0 ? 0 : (company.price - previous) / previous;
    const volatility = calculateVolatility(company.history.slice(-10));
    const entries = [
      { label: "5-Day Avg", value: formatCurrency(Number(average.toFixed(2))) },
      { label: "Volatility", value: formatPercent(volatility) },
      { label: "Trend Impact", value: formatPercent(company.trendBias + volatility * 0.5) },
      {
        label: "5-Day Change",
        value: formatPercent(
          recentHistory[0] ? (company.price - recentHistory[0]) / recentHistory[0] : 0
        ),
      },
      { label: "Δ Day", value: formatPercent(changePct) },
    ];
    statsGrid.innerHTML = "";
    for (const entry of entries) {
      const row = document.createElement("div");
      row.className = "stats-row";
      const valueSpan = document.createElement("span");
      valueSpan.className = "stats-value";
      if (entry.label === "Volatility" || entry.label === "Δ Day" || entry.label === "5-Day Change") {
        valueSpan.classList.add(entry.value.startsWith("-") ? "red" : "green");
      }
      valueSpan.textContent = entry.value;
      row.innerHTML = `<span class="stats-label">${entry.label}</span>`;
      row.appendChild(valueSpan);
      statsGrid.appendChild(row);
    }
  };
  const refreshSelectedCompany = () => {
    renderCompanyChart();
    refreshCompanyStats();
  };

  const getCompanyByTicker = (ticker?: string) =>
    runner.state.companies.find((company) => company.ticker === ticker);

  const getMaxBuyQuantity = (company: ReturnType<typeof getCompanyByTicker>) =>
    Math.floor(runner.state.portfolio.cash / (company?.price ?? 1));

  const getMaxSellQuantity = (company: ReturnType<typeof getCompanyByTicker>) =>
    company ? runner.state.portfolio.holdings[company.ticker] ?? 0 : 0;

  const updateTradeSliderLimits = () => {
    if (!tradeTicker || !tradeSlider) return;
    const company = getCompanyByTicker(tradeTicker.value);
    if (!company) return;
    const maxBuy = Math.max(1, getMaxBuyQuantity(company));
    const maxSell = Math.max(1, getMaxSellQuantity(company));
    const limit = Math.max(maxBuy, maxSell, 1);
    tradeSlider.max = limit.toString();
    if (Number(tradeSlider.value) > limit) {
      tradeSlider.value = limit.toString();
      updateSliderValueDisplay();
    }
  };

  const refreshEras = () => {
    renderEraList(eraList, runner.state.eras, runner.state.currentEraIndex);
  };

  const refreshEvents = () => {
    renderEventList(eventList, runner.state.eventsToday);
  };

  const handleHoldingSelect = (ticker: string) => {
    selectedTicker = ticker;
    if (tradeTicker) {
      tradeTicker.value = ticker;
    }
    refreshSelectedCompany();
    updateTradeSliderLimits();
  };

  const refreshHoldings = () => {
    refreshHoldingsPanel(
      holdingsList,
      runner.state.portfolio,
      runner.state.companies,
      selectedTicker,
      handleHoldingSelect
    );
  };

  const watchTypeLabels: Record<WatchOrderType, string> = {
    "limit-buy": "Limit Buy",
    "limit-sell": "Limit Sell",
    "stop-loss": "Stop Loss",
  };

  const formatWatchTime = (value: "day" | "good-till-run"): string =>
    value === "day" ? "Today only" : "Until filled";

  const renderWatchOrders = () => {
    if (!watchList) return;
    watchList.innerHTML = "";
    if (runner.state.watchOrders.length === 0) {
      const scratch = document.createElement("li");
      scratch.textContent = "No triggers set.";
      scratch.className = "trigger-card__empty";
      watchList.appendChild(scratch);
      return;
    }

    for (const order of runner.state.watchOrders) {
      const company = runner.state.companies.find((item) => item.id === order.companyId);
      const entry = document.createElement("li");
      entry.className = "watch-entry";
      const info = document.createElement("div");
      info.className = "watch-entry__info";
      info.innerHTML = `
        <strong>${company?.ticker ?? "Unknown"}</strong>
        ${watchTypeLabels[order.type]} @ ${formatCurrency(order.triggerPrice)}
        <span>${formatWatchTime(order.timeInForce)}</span>
      `;
      info.addEventListener("click", () => {
        if (company) {
          handleHoldingSelect(company.ticker);
        }
      });

      const meta = document.createElement("p");
      meta.className = "watch-entry__meta";
      const parts: string[] = [];
      if (order.maxCashToSpend) {
        parts.push(`Cash ${formatCurrency(order.maxCashToSpend)}`);
      }
      if (order.sharesToSell) {
        parts.push(`${order.sharesToSell} shares`);
      }
      meta.textContent = parts.join(" · ");

      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "watch-entry__cancel";
      cancel.textContent = "Cancel";
      cancel.addEventListener("click", () => {
        cancelWatchOrder(runner.state, order.id);
        refreshAll();
      });

      entry.appendChild(info);
      if (meta.textContent) {
        entry.appendChild(meta);
      }
      entry.appendChild(cancel);
      watchList.appendChild(entry);
    }
  };

  const updateWatchFieldVisibility = () => {
    const selectedType = watchTypeSelect?.value ?? "";
    if (watchFieldCash) {
      watchFieldCash.toggleAttribute("hidden", selectedType !== "limit-buy");
    }
    if (watchFieldShares) {
      watchFieldShares.toggleAttribute("hidden", selectedType === "limit-buy");
    }
  };

  const closeWatchModal = () => {
    if (!watchModal) return;
    watchModal.hidden = true;
    watchModal.classList.remove("open");
    document.body.classList.remove("dialog-open");
  };

  const openWatchModal = (presetType?: WatchOrderType) => {
    if (!watchModal || !watchTypeSelect || !watchPriceInput) return;
    const company =
      runner.state.companies.find((item) => item.ticker === selectedTicker) ??
      runner.state.companies[0];
    if (!company) return;
    selectedTicker = company.ticker;
    if (tradeTicker) {
      tradeTicker.value = company.ticker;
    }
    watchCompanyLabel && (watchCompanyLabel.textContent = `${company.name} (${company.ticker})`);
    watchPriceInput.value = company.price.toFixed(2);
    watchTypeSelect.value = presetType ?? "limit-buy";
    if (watchCashInput) {
      watchCashInput.value = Math.max(1, company.price * 2).toFixed(2);
    }
    if (watchSharesInput) {
      watchSharesInput.value = "1";
    }
    if (watchTifSelect) {
      watchTifSelect.value = "good-till-run";
    }
    watchFeedback && (watchFeedback.textContent = "");
    updateWatchFieldVisibility();
    watchModal.hidden = false;
    watchModal.classList.add("open");
    document.body.classList.add("dialog-open");
  };

  const handleWatchSave = () => {
    if (!watchTypeSelect || !watchPriceInput) return;
    const company =
      runner.state.companies.find((item) => item.ticker === selectedTicker) ??
      runner.state.companies[0];
    if (!company) {
      watchFeedback && (watchFeedback.textContent = "Choose a company first.");
      return;
    }
    const triggerPrice = Number(watchPriceInput.value);
    if (!triggerPrice || triggerPrice <= 0) {
      watchFeedback && (watchFeedback.textContent = "Enter a valid trigger price.");
      return;
    }
    const timeInForce = (watchTifSelect?.value ?? "good-till-run") as "day" | "good-till-run";
    if (watchTypeSelect.value === "limit-buy") {
      const cash = Number(watchCashInput?.value ?? "0");
      if (!cash || cash <= 0) {
        watchFeedback && (watchFeedback.textContent = "Set how much cash to spend.");
        return;
      }
      const entry = placeLimitBuyWatch(
        runner.state,
        company.id,
        triggerPrice,
        cash,
        timeInForce
      );
      if (!entry) {
        watchFeedback && (watchFeedback.textContent = "Trigger limit reached.");
        return;
      }
    } else if (watchTypeSelect.value === "limit-sell") {
      const shares = Number(watchSharesInput?.value ?? "0");
      if (!shares || shares <= 0) {
        watchFeedback && (watchFeedback.textContent = "Enter shares to sell.");
        return;
      }
      const entry = placeLimitSellWatch(
        runner.state,
        company.id,
        triggerPrice,
        shares,
        timeInForce
      );
      if (!entry) {
        watchFeedback && (watchFeedback.textContent = "Trigger limit reached.");
        return;
      }
    } else {
      const shares = Number(watchSharesInput?.value ?? "0");
      if (!shares || shares <= 0) {
        watchFeedback && (watchFeedback.textContent = "Enter shares for the stop loss.");
        return;
      }
      const entry = placeStopLossWatch(
        runner.state,
        company.id,
        triggerPrice,
        shares,
        timeInForce
      );
      if (!entry) {
        watchFeedback && (watchFeedback.textContent = "Trigger limit reached.");
        return;
      }
    }
    closeWatchModal();
    refreshAll();
  };

  const refreshTickers = () => {
    const previousSelection = selectedTicker ?? tradeTicker?.value;
    populateTickerOptions(tradeTicker, runner.state.companies);
    const activeCompanies = runner.state.companies.filter((company) => company.isActive);
    const fallback = activeCompanies[0]?.ticker ?? runner.state.companies[0]?.ticker;
    const newSelection =
      previousSelection &&
      activeCompanies.some((company) => company.ticker === previousSelection)
        ? previousSelection
        : fallback;
    selectedTicker = newSelection;
    if (tradeTicker && newSelection) {
      tradeTicker.value = newSelection;
    }
    refreshSelectedCompany();
  };

  const setControlLock = (locked: boolean) => {
    controlButtons.forEach((button) => {
      button.disabled = locked;
    });
    if (tradeSlider) {
      tradeSlider.disabled = locked;
    }
    if (tradeTicker) {
      tradeTicker.disabled = locked;
    }
  };

  const refreshChoicePanel = () => {
    const pending = runner.state.pendingChoice;
    if (choiceModal) {
      choiceModal.hidden = !pending;
      choiceModal.classList.toggle("open", Boolean(pending));
    }
    if (choiceDescription) {
      if (pending) {
        choiceDescription.textContent = `${pending.description} · impact ${(pending.impact * 100).toFixed(2)}%`;
      } else {
        choiceDescription.textContent = "";
      }
    }
    setControlLock(Boolean(pending));
  };

  const updateSelectionFromDropdown = () => {
    if (!tradeTicker) return;
    selectedTicker = tradeTicker.value;
    refreshSelectedCompany();
    refreshHoldings();
  };

  const focusReactiveMicrocapTicker = (ticker: string): void => {
    if (!tradeTicker) return;
    if (tradeTicker.value === ticker && selectedTicker === ticker) return;
    tradeTicker.value = ticker;
    updateSelectionFromDropdown();
  };

  const togglePanelBody = (button: HTMLButtonElement) => {
    const section = button.closest("section");
    if (!section) return;
    const body = section.querySelector<HTMLElement>(".panel-body");
    if (!body) return;
    const isExpanded = button.getAttribute("aria-expanded") === "true";
    body.hidden = isExpanded;
    button.setAttribute("aria-expanded", isExpanded ? "false" : "true");
    section.classList.toggle("collapsed", isExpanded);
    const label = button.querySelector("span");
    if (label) {
      label.textContent = isExpanded ? "Show" : "Hide";
    }
  };

  const panelToggles = Array.from(container.querySelectorAll<HTMLButtonElement>(".panel-toggle"));
  panelToggles.forEach((button) => {
    button.addEventListener("click", () => togglePanelBody(button));
  });

  const viewMenu = container.querySelector<HTMLElement>(".view-menu");
  const viewMenuStatus = container.querySelector<HTMLElement>(".view-menu__status");
  const viewButtons = Array.from(
    container.querySelectorAll<HTMLButtonElement>("[data-view-target]")
  );
  const viewMenuToggle = container.querySelector<HTMLButtonElement>(
    "[data-action='toggle-view-menu']"
  );
  const viewMenuList = container.querySelector<HTMLElement>("[data-role='view-menu-list']");
  let menuOpen = false;

  const setMenuVisible = (visible: boolean): void => {
    menuOpen = visible;
    viewMenu?.classList.toggle("view-menu--collapsed", !menuOpen);
    viewMenuList?.classList.toggle("view-menu__list--open", menuOpen);
    if (viewMenuToggle) {
      viewMenuToggle.setAttribute("aria-expanded", String(menuOpen));
    }
  };
  const viewPages = Array.from(container.querySelectorAll<HTMLElement>(".view-page"));
  const setActiveView = (viewId: string) => {
    const target = viewId || "dashboard";
    viewButtons.forEach((button) => {
      button.classList.toggle(
        "view-menu__item--active",
        button.dataset.viewTarget === target
      );
    });
    viewPages.forEach((page) => {
      page.classList.toggle("view-page--active", page.dataset.view === target);
    });
    const activeButton = viewButtons.find((button) => button.dataset.viewTarget === target);
    if (viewMenuStatus) {
      const label = activeButton?.textContent?.trim() ?? target;
      viewMenuStatus.textContent = label;
    }
    setMenuVisible(false);
  };
  viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveView(button.dataset.viewTarget ?? "dashboard");
    });
  });
  viewMenuToggle?.addEventListener("click", () => {
    setMenuVisible(!menuOpen);
  });
  setActiveView("dashboard");

  const refreshMeta = () => {
    currentMeta = runner.metaState;
    metaPanel?.refresh(currentMeta);
    updateTickerTape();
    updateStoryGauge();
  };

  const refreshAll = () => {
    refreshSummary();
    refreshEras();
    refreshEvents();
    refreshChoicePanel();
    refreshTickers();
    refreshHoldings();
    updateTradeSliderLimits();
    renderWatchOrders();
    refreshMeta();
    refreshSelectedCompany();
    updateSliderValueDisplay();
    options.onSummaryUpdate?.(runner.summary());
    renderCampaignPanel();
    renderChallengePanel();
    renderBondMarket();
    renderBondHoldings();
    renderLifecycleLog();
    renderCarryPanel();
    refreshMiniGameCard();
    refreshReactiveMicrocapCard();
    refreshLocalIncomePanel();
    refreshDcaPanel();
    updateTickerTape();
    const newsHeadlines = runner.consumeMarketNews();
    if (newsHeadlines.length > 0) {
      newsUI.appendHeadlines(newsHeadlines);
      newsUI.updateTicker(newsHeadlines);
    }
    maybeOpenSideHustleModal();
    renderWhalePanel();
    renderWhalePortrait(runner.state);
    renderWhaleInfluenceBar(runner.state);
    renderWhaleDialogue(runner.state);
    queueStoryScenes();
  };

  const DEFAULT_MINI_GAME_TITLE = "Side Hustle";
  const DEFAULT_MINI_GAME_SUBTITLE =
    "Side gigs drop in randomly—keep an eye on the board.";
  const DEFAULT_MINI_GAME_STORY =
    "No gigs are active right now. Pause and listen to the neighborhood.";
  const DEFAULT_MINI_GAME_BUTTON = "Watch the board";

  const refreshMiniGameCard = (): void => {
    const event = runner.state.pendingMiniGame;
    const title = event ? event.title : DEFAULT_MINI_GAME_TITLE;
    const subtitle = event ? event.subtitle : DEFAULT_MINI_GAME_SUBTITLE;
    const story = event ? event.story : DEFAULT_MINI_GAME_STORY;
    const buttonLabel = event ? event.prompt : DEFAULT_MINI_GAME_BUTTON;
    if (miniGameTitle) miniGameTitle.textContent = title;
    if (miniGameSubtitle) miniGameSubtitle.textContent = subtitle;
    if (miniGameStory) miniGameStory.textContent = story;
    if (miniGameButton) {
      miniGameButton.disabled = !event;
      miniGameButton.textContent = buttonLabel;
    }
    queueSideHustleModal(event);
  };

  const refreshReactiveMicrocapCard = (): void => {
    if (!reactiveMicrocapCard) return;
    const company = findReactiveMicrocapCompany(runner.state);
    if (!company || !company.reactiveDetails) {
      reactiveMicrocapCard.hidden = true;
      lastReactiveMicrocapTicker = null;
      return;
    }
    const details = company.reactiveDetails;
    reactiveMicrocapCard.hidden = false;
    reactiveMicrocapTicker && (reactiveMicrocapTicker.textContent = company.ticker);
    reactiveMicrocapName && (reactiveMicrocapName.textContent = company.name);
    reactiveMicrocapDescription && (reactiveMicrocapDescription.textContent = details.description);
    reactiveMicrocapMarketCap &&
      (reactiveMicrocapMarketCap.textContent = `Market Cap ${formatCurrency(details.marketCap)}`);
    reactiveMicrocapInfluence &&
      (reactiveMicrocapInfluence.textContent = `Influence +${details.lastInfluenceGain}`);
    if (company.ticker !== lastReactiveMicrocapTicker) {
      lastReactiveMicrocapTicker = company.ticker;
      focusReactiveMicrocapTicker(company.ticker);
    }
  };

  const renderDcaActiveInfo = (): void => {
    if (!dcaActiveInfo) return;
    const state = runner.state.dca;
    const stream = DCA_STREAMS[state.activeStreamId];
    const yieldRate = (stream.incomeRatePerDay * 100).toFixed(2);
    dcaActiveInfo.innerHTML = `
      <strong>${stream.name}</strong>
      <p>Daily contribution: $${state.dailyContribution} · Yield: ${yieldRate}%</p>
      <p class="local-income-panel__active-desc">${stream.description}</p>
      ${
        lastOfferMessage
          ? `<p class="local-income-panel__active-offer">${lastOfferMessage}</p>`
          : ""
      }
    `;
  };

  const renderDcaOffers = (): void => {
    if (!dcaOffersContainer) return;
    const state = runner.state.dca;
    dcaOffersContainer.innerHTML = "";
    for (const definition of localIncomeDefinitions) {
      const stream = dcaStreamsByName.get(definition.name);
      if (!stream) continue;

      const card = document.createElement("div");
      card.className = "local-income-offer";
      const isActive = state.activeStreamId === stream.id;
      if (isActive) {
        card.classList.add("local-income-offer--active");
      }

      const header = document.createElement("div");
      header.className = "local-income-offer__header";
      const riskBadge = document.createElement("span");
      riskBadge.className = `local-income-stream__risk local-income-stream__risk--${definition.riskTone}`;
      riskBadge.textContent = definition.riskLabel;
      const statusBadge = document.createElement("span");
      statusBadge.className = "local-income-offer__status-badge";
      statusBadge.textContent = "Steady";
      header.appendChild(riskBadge);
      header.appendChild(statusBadge);
      card.appendChild(header);

      const title = document.createElement("h4");
      title.textContent = stream.name;
      card.appendChild(title);

      const desc = document.createElement("p");
      desc.className = "local-income-offer__description";
      desc.textContent = definition.description;
      card.appendChild(desc);

      if (state.totalContributed > 0 && isActive) {
        const poolInfo = document.createElement("p");
        poolInfo.className = "local-income-offer__pool-info";
        poolInfo.textContent = `Daily contribution: $${state.dailyContribution} · Yield: ${(stream.incomeRatePerDay * 100).toFixed(2)}%`;
        card.appendChild(poolInfo);
      }

      const statsRow = document.createElement("div");
      statsRow.className = "local-income-offer__stats";
      const dailySpan = document.createElement("span");
      dailySpan.textContent = `Daily ${formatCurrency(definition.dailyIncome)}`;
      const tempoSpan = document.createElement("span");
      tempoSpan.textContent = "Steady";
      statsRow.appendChild(dailySpan);
      statsRow.appendChild(tempoSpan);
      card.appendChild(statsRow);

      const rateLabel = document.createElement("p");
      rateLabel.className = "local-income-offer__rate";
      const yieldPct = (stream.incomeRatePerDay * 100).toFixed(2);
      rateLabel.textContent = `Yield: ${yieldPct}% of contributions`;
      card.appendChild(rateLabel);

      const amountInput = document.createElement("input");
      amountInput.type = "number";
      amountInput.min = "0";
      amountInput.step = "5";
      amountInput.value = isActive ? String(state.dailyContribution) : "25";
      amountInput.className = "local-income-offer__input";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "local-income-offer__action";
      const updateButtonLabel = () => {
        const value = Math.max(0, Number(amountInput.value) || 0);
        button.textContent = `Invest $${value}/day`;
      };
      amountInput.addEventListener("input", updateButtonLabel);
      updateButtonLabel();

      button.addEventListener("click", () => {
        const contribution = Math.max(0, Number(amountInput.value) || 0);
        runner.state.dca = setActiveDCAStream(runner.state.dca, stream.id);
        runner.state.dca = setDCADailyContribution(runner.state.dca, contribution);
        lastOfferMessage = `You accepted ${stream.name} with $${contribution}/day.`;
        refreshAll();
      });

      const inputRow = document.createElement("div");
      inputRow.className = "local-income-offer__input-row";
      inputRow.appendChild(amountInput);
      inputRow.appendChild(button);
      card.appendChild(inputRow);

      const streamStatus = runner.state.localIncomeStreams[definition.id];
      const activeEvent = streamStatus?.activeEvent;
      if (activeEvent) {
        const eventNote = document.createElement("p");
        eventNote.className = "local-income-offer__event-note";
        eventNote.textContent = activeEvent.message;
        card.appendChild(eventNote);
      }

      dcaOffersContainer.appendChild(card);
    }
  };

  const renderDcaEventLog = (): void => {
    if (!dcaEventList) return;
    dcaEventList.innerHTML = "";
    const entries = runner.state.dcaEventLog;
    if (entries.length === 0) {
      const placeholder = document.createElement("li");
      placeholder.className = "local-income-panel__log-empty";
      placeholder.textContent = "DCA updates appear here when something shifts.";
      dcaEventList.appendChild(placeholder);
      return;
    }
    for (const entry of entries) {
      const row = document.createElement("li");
      row.className = "local-income-panel__log-entry";
      if (entry.kind === "bonus") {
        row.classList.add("local-income-panel__log-entry--bonus");
      } else if (entry.kind === "negative") {
        row.classList.add("local-income-panel__log-entry--alert");
      }
      const deltaStr =
        entry.cashDelta === 0
          ? ""
          : ` (${entry.cashDelta >= 0 ? "+" : "-"}${formatCurrency(
              Math.abs(entry.cashDelta)
            )})`;
      row.innerHTML = `<span class="local-income-panel__log-day">${entry.label}</span><span>${entry.description}</span><span class="local-income-panel__log-cash">${deltaStr}</span>`;
      dcaEventList.appendChild(row);
    }
  };

  const refreshDcaPanel = (): void => {
    renderDcaActiveInfo();
    renderDcaOffers();
    renderDcaEventLog();
  };

  const refreshLocalIncomePanel = (): void => {
    if (!localIncomePanel || !localIncomeEventList) {
      return;
    }

    localIncomeEventList.innerHTML = "";
    if (runner.state.localIncomeEventLog.length === 0) {
      const placeholder = document.createElement("li");
      placeholder.className = "local-income-panel__log-empty";
      placeholder.textContent = "Nothing to report yet - streams remain steady.";
      localIncomeEventList.appendChild(placeholder);
    } else {
      for (const entry of runner.state.localIncomeEventLog) {
        const row = document.createElement("li");
        const severity = entry.type === "bonus" ? "bonus" : "alert";
        row.className = `local-income-panel__log-entry local-income-panel__log-entry--${severity}`;
        row.innerHTML = `<span class="local-income-panel__log-day">Day ${entry.day}</span><span>${entry.message}</span>`;
        localIncomeEventList.appendChild(row);
      }
    }
  };

  const applyMiniGameReward = (
    event: PendingMiniGameEvent,
    result: MiniGameResult
  ): void => {
    const normalized = Math.max(0, Math.min(1, result.score));
    const rewardPct = 0.1 + normalized * 0.2;
    const portfolioValue = runner.getPortfolioValue();
    const rewardAmount = Math.max(
      1,
      Math.round(portfolioValue * rewardPct)
    );
    runner.state.portfolio.cash = Number(
      (runner.state.portfolio.cash + rewardAmount).toFixed(2)
    );
    const lifecycleMessage = `${event.title} – ${result.story} You earn ${formatCurrency(
      rewardAmount
    )}.`;
    recordLifecycleEvent(runner.state, lifecycleMessage);
    refreshAll();
  };

  const startMiniGameFromEvent = (event: PendingMiniGameEvent): void => {
    const context = { title: event.title, subtitle: event.subtitle };
    const handleResult = (result: MiniGameResult): void => {
      applyMiniGameReward(event, result);
    };
    switch (event.id) {
      case "delivery":
        launchDeliveryTimingMiniGame(handleResult, context);
        break;
      case "phone":
        launchPhoneUnlockMiniGame(handleResult, context);
        break;
      case "garage":
        launchGarageCleanoutMiniGame(handleResult, context);
        break;
    }
  };

  const startMiniGameFromType = (type: MiniGameEventId): void => {
    startMiniGameFromEvent(createMiniGameEvent(type));
  };

  const startPendingMiniGame = (): void => {
    const event = runner.state.pendingMiniGame;
    if (!event) return;
    runner.state.pendingMiniGame = null;
    closeSideHustleModal();
    refreshAll();
    startMiniGameFromEvent(event);
  };

  const placeTrade = (direction: "buy" | "sell") => {
    if (!tradeTicker || !tradeSlider) return;

    const ticker = tradeTicker.value;
    const company = getCompanyByTicker(ticker);
    if (!company) {
      tradeFeedback && (tradeFeedback.textContent = "Choose a valid company.");
      return;
    }

    const sliderValue = Math.max(1, Math.floor(Number(tradeSlider.value)));
    const maxAvailable =
      direction === "buy" ? getMaxBuyQuantity(company) : getMaxSellQuantity(company);

    if (maxAvailable <= 0) {
      tradeFeedback &&
        (tradeFeedback.textContent =
          direction === "buy"
            ? "Not enough cash to buy even a single share."
            : "You do not hold any shares.");
      return;
    }

    const quantity = Math.min(sliderValue, maxAvailable);
    if (quantity !== sliderValue) {
      tradeSlider.value = quantity.toString();
      updateSliderValueDisplay();
    }

    const clampNote =
      quantity !== sliderValue ? " (adjusted to max available)" : "";

    const signedQty = direction === "buy" ? quantity : -quantity;
    runner.state.portfolio = executeTrade(
      runner.state.portfolio,
      ticker,
      signedQty,
      company.price
    );
    recordReactiveMicrocapTrade(runner.state, company, quantity, direction);
    selectedTicker = ticker;
    tradeFeedback &&
      (tradeFeedback.textContent = `${direction === "buy" ? "Bought" : "Sold"} ${quantity} ${ticker} shares${clampNote}.`);
    updateTradeSliderLimits();
    refreshAll();
  };

  const formatAutosave = (state: GameState) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    autosaveStatus && (autosaveStatus.textContent = `Autosaved Day ${state.day} - ${timestamp}`);
  };

  container.querySelector("[data-action='advance-1']")?.addEventListener("click", () => {
    runner.step(1);
    refreshAll();
  });

  container.querySelector("[data-action='advance-5']")?.addEventListener("click", () => {
    runner.step(5);
    refreshAll();
  });

  container.querySelector("[data-action='trade-buy']")?.addEventListener("click", () => placeTrade("buy"));
  container.querySelector("[data-action='trade-sell']")?.addEventListener("click", () => placeTrade("sell"));
  tradeSlider?.addEventListener("input", updateSliderValueDisplay);
  tradeTicker?.addEventListener("change", updateSelectionFromDropdown);
  choiceAct?.addEventListener("click", () => {
    runner.resolveChoice(true);
    refreshAll();
  });
  choiceIgnore?.addEventListener("click", () => {
    runner.resolveChoice(false);
    refreshAll();
  });
  openWatchButton?.addEventListener("click", () => openWatchModal());
  watchTypeSelect?.addEventListener("change", updateWatchFieldVisibility);
  watchSaveButton?.addEventListener("click", handleWatchSave);
  watchCancelButton?.addEventListener("click", closeWatchModal);
  watchCloseButton?.addEventListener("click", closeWatchModal);
  watchModal?.addEventListener("click", (event) => {
    if (event.target === watchModal) {
      closeWatchModal();
    }
  });
  miniGameButton?.addEventListener("click", startPendingMiniGame);
  sideHustleModalStart?.addEventListener("click", startPendingMiniGame);
  sideHustleModalClose?.addEventListener("click", () => closeSideHustleModal());
  sideHustleModal?.addEventListener("click", (event) => {
    if (event.target === sideHustleModal) {
      closeSideHustleModal();
    }
  });

  storyContinueButton?.addEventListener("click", () => {
    advanceStoryLine();
  });

  storyToggleButton?.addEventListener("click", () => {
    storyEnabled = !storyEnabled;
    updateStoryToggleLabel();
    if (!storyEnabled) {
      hideStoryDialog();
    } else if (!activeStoryEvent) {
      openNextStoryEvent();
    }
    if (window?.localStorage) {
      try {
        window.localStorage.setItem(STORY_TOGGLE_KEY, storyEnabled ? "1" : "0");
      } catch {
        // ignore
      }
    }
  });

  updateStoryToggleLabel();

  carryList?.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "[data-action='carry-choose']"
    );
    if (!button) return;
    const optionId = button.dataset.optionId;
    if (!optionId) return;
    runner.claimCarryOption(optionId);
    refreshAll();
  });

  carryCloseButton?.addEventListener("click", () => {
    if (!carryPanel) return;
    carryPanel.hidden = true;
    runner.state.pendingCarryChoices = null;
  });

  bondMarketList?.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "[data-action='buy-bond']"
    );
    if (!button) return;
    const listingId = button.dataset.listingId;
    if (!listingId) return;
    const purchased = buyBondFromListing(runner.state, listingId);
    if (purchased) {
      refreshAll();
    }
  });

  devAwardXpSmallButton?.addEventListener("click", () => {
    runner.awardMetaXp(500);
    refreshAll();
  });

  devAwardXpLargeButton?.addEventListener("click", () => {
    runner.awardMetaXp(2000);
    refreshAll();
  });

  devOpenDeliveryButton?.addEventListener("click", () => startMiniGameFromType("delivery"));
  devOpenPhoneButton?.addEventListener("click", () => startMiniGameFromType("phone"));
  devOpenGarageButton?.addEventListener("click", () => startMiniGameFromType("garage"));

  devTriggerIpoButton?.addEventListener("click", () => {
    runner.triggerLifecycleIPO();
    refreshAll();
  });

  devTriggerSplitButton?.addEventListener("click", () => {
    runner.triggerLifecycleSplit();
    refreshAll();
  });

  devTriggerBankruptcyButton?.addEventListener("click", () => {
    runner.triggerLifecycleBankruptcy();
    refreshAll();
  });

  devResetXpButton?.addEventListener("click", () => {
    runner.resetMetaXp();
    refreshAll();
  });

  bindWhaleBuyoutHandler(() => {
    runner.attemptWhaleBuyout();
    refreshAll();
  });

  refreshAll();

  return {
    refresh: refreshAll,
    updateMeta(meta: MetaProfile) {
      currentMeta = meta;
      refreshMeta();
    },
    updateAutosave(state: GameState) {
      formatAutosave(state);
    },
  };
};
