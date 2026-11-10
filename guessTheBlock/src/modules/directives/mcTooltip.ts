import type { Directive } from "vue";

/**
 * Minecraft-style tooltip (the dark purple box you get when hovering an item).
 *
 * It only shows up when the element is "compact": its full text is not what
 * you see, because it is abbreviated ("Dim" for "Dimensions"), cut off by
 * the cell, or drawn as an icon (tool, colour, dimension blocks, 3D model).
 *
 *   v-mc-tooltip="'Dimensions'"
 *   v-mc-tooltip="{ title: 'Pickaxe', lore: 'Tool' }"
 */
export type TooltipValue =
  | string
  | { title: string; lore?: string }
  | null
  | undefined;

interface TooltipState {
  value: TooltipValue;
  onEnter: (e: PointerEvent) => void;
  onMove: (e: PointerEvent) => void;
  onLeave: () => void;
  onDown: (e: PointerEvent) => void;
}

const states = new WeakMap<HTMLElement, TooltipState>();

let box: HTMLDivElement | null = null;
let owner: HTMLElement | null = null;
let touchTimer: number | undefined;

const OFFSET = 12;
const MARGIN = 6;
const TOUCH_MS = 1800;

const normalize = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

const parts = (value: TooltipValue) =>
  typeof value === "string" ? { title: value, lore: "" } : value ?? null;

/** Text the user can actually read: skips hidden and screen-reader-only nodes. */
function visibleText(el: HTMLElement): string {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const out: string[] = [];
  const hidden = new Map<Element, boolean>();
  const isHidden = (node: Element | null): boolean => {
    if (!node || node === el) return false;
    const cached = hidden.get(node);
    if (cached !== undefined) return cached;
    const style = getComputedStyle(node);
    const result =
      node.classList.contains("sr-only") ||
      style.display === "none" ||
      style.visibility === "hidden" ||
      isHidden(node.parentElement);
    hidden.set(node, result);
    return result;
  };
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!isHidden(n.parentElement)) out.push(n.textContent ?? "");
  }
  return out.join(" ");
}

/** Text clipped by the element itself or a clamped child. */
function overflows(el: HTMLElement): boolean {
  const clipped = (e: Element) =>
    e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1;
  if (clipped(el)) return true;
  return Array.from(el.querySelectorAll(".mc-cell__value")).some(clipped);
}

function isCompact(el: HTMLElement, title: string): boolean {
  return normalize(visibleText(el)) !== normalize(title) || overflows(el);
}

function ensureBox(): HTMLDivElement {
  if (box) return box;
  box = document.createElement("div");
  box.className = "mc-tooltip";
  box.setAttribute("aria-hidden", "true");
  document.body.appendChild(box);
  return box;
}

function show(el: HTMLElement, value: TooltipValue): boolean {
  const p = parts(value);
  if (!p?.title || !isCompact(el, p.title)) return false;
  const b = ensureBox();
  b.replaceChildren();
  const title = document.createElement("div");
  title.className = "mc-tooltip__title";
  title.textContent = p.title;
  b.appendChild(title);
  if (p.lore) {
    const lore = document.createElement("div");
    lore.className = "mc-tooltip__lore";
    lore.textContent = p.lore;
    b.appendChild(lore);
  }
  b.classList.add("is-visible");
  owner = el;
  return true;
}

function hide() {
  window.clearTimeout(touchTimer);
  box?.classList.remove("is-visible");
  owner = null;
}

/** Like in Minecraft: up and to the right of the cursor, kept on screen. */
function place(x: number, y: number) {
  if (!box) return;
  const { width, height } = box.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left = x + OFFSET;
  let top = y - OFFSET - height;
  if (left + width > vw - MARGIN) left = x - OFFSET - width;
  if (top < MARGIN) top = y + OFFSET * 1.5;
  left = Math.max(MARGIN, Math.min(left, vw - width - MARGIN));
  top = Math.max(MARGIN, Math.min(top, vh - height - MARGIN));
  box.style.transform = `translate(${Math.round(left)}px, ${Math.round(
    top
  )}px)`;
}

export const mcTooltip: Directive<HTMLElement, TooltipValue> = {
  mounted(el, binding) {
    const state: TooltipState = {
      value: binding.value,
      onEnter(e) {
        if (e.pointerType === "touch") return;
        if (show(el, state.value)) place(e.clientX, e.clientY);
      },
      onMove(e) {
        if (owner === el && e.pointerType !== "touch")
          place(e.clientX, e.clientY);
      },
      onLeave() {
        if (owner === el) hide();
      },
      // No hover on phones: a tap shows it for a moment, above the finger.
      onDown(e) {
        if (e.pointerType !== "touch") return;
        hide();
        if (!show(el, state.value)) return;
        const r = el.getBoundingClientRect();
        place(r.left + r.width / 2, r.top);
        touchTimer = window.setTimeout(hide, TOUCH_MS);
      },
    };
    states.set(el, state);
    el.addEventListener("pointerenter", state.onEnter);
    el.addEventListener("pointermove", state.onMove);
    el.addEventListener("pointerleave", state.onLeave);
    el.addEventListener("pointerdown", state.onDown);
    el.addEventListener("contextmenu", preventMenu);
  },
  updated(el, binding) {
    const state = states.get(el);
    if (state) state.value = binding.value;
  },
  beforeUnmount(el) {
    const state = states.get(el);
    if (!state) return;
    el.removeEventListener("pointerenter", state.onEnter);
    el.removeEventListener("pointermove", state.onMove);
    el.removeEventListener("pointerleave", state.onLeave);
    el.removeEventListener("pointerdown", state.onDown);
    el.removeEventListener("contextmenu", preventMenu);
    states.delete(el);
    if (owner === el) hide();
  },
};

// A long press on phones opens the browser's copy/save menu over the tooltip.
function preventMenu(e: Event) {
  e.preventDefault();
}

// Scrolling moves the element away from the cursor.
if (typeof window !== "undefined") {
  window.addEventListener("scroll", hide, { passive: true, capture: true });
}
