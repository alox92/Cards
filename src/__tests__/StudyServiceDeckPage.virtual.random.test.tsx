import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

vi.mock("@/utils/reactConcurrentFeatures", () => ({
  useConcurrentTransition: () => ({
    isPending: false,
    executeTransition: (cb: () => void) => cb(),
  }),
  useDeferredSearch: (items: any[], filter: string) => ({ searchTerm: filter }),
}));

const FAST = process.env.FAST_TESTS === "1";
// Dataset important pour virtualisation (réduit si FAST)
const SIZE = 1500;
const CARDS = Array.from({ length: SIZE }, (_, i) => ({
  id: "r" + i,
  frontText: "Front " + i,
  backText: "Back " + i,
  tags: [],
  difficulty: 1,
  deckId: "dd1",
}));

// État mutable pour simuler suppression
let mutableCards: typeof CARDS = [];

import { container } from "@/application/Container";
import { DECK_SERVICE_TOKEN } from "@/application/services/DeckService";
import { CARD_SERVICE_TOKEN } from "@/application/services/CardService";

import StudyServiceDeckPage from "@/ui/pages/StudyServiceDeckPage";

// Seeded pseudo random pour reproductibilité
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

beforeEach(() => {
  mutableCards = [...CARDS];

  // Ensure container is initialized so registerAll doesn't overwrite us later
  container.ensureInit();

  // Clear cache to force new resolution
  (container as any).instances.clear();

  // Register mocks
  container.register(DECK_SERVICE_TOKEN, () => ({
    getDeck: async () => ({ id: "dd1", name: "Deck Random" }),
  }));

  container.register(CARD_SERVICE_TOKEN, () => ({
    listByDeck: async () => mutableCards,
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(async (id: string) => {
      mutableCards = mutableCards.filter((c) => c.id !== id);
    }),
  }));
});

function scrollTo(list: HTMLElement, top: number) {
  list.scrollTop = top;
  fireEvent.scroll(list);
}

describe("Virtualisation random stress + sélection après suppression", () => {
  it("multi-scroll aléatoire + toggle rapide conserve borne max nodes", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/study-service/dd1"]}>
          <Routes>
            <Route
              path="/study-service/:deckId"
              element={<StudyServiceDeckPage />}
            />
          </Routes>
        </MemoryRouter>
      );
    });
    const list = (await screen.findByTestId(
      "deck-card-list",
      {},
      { timeout: 10000 }
    )) as HTMLElement;

    // Forcer virtual
    const select = (await screen.findByRole(
      "combobox",
      {},
      { timeout: 10000 }
    )) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "virtual" } });

    const rng = mulberry32(123456);
    const LOOPS = FAST ? 12 : 25;
    for (let i = 0; i < LOOPS; i++) {
      const ratio = rng();
      const target = Math.floor(
        ratio * (list.scrollHeight - list.clientHeight)
      );
      scrollTo(list, target);
      // toggles rapides mode (virtual -> pagination -> virtual) pour détecter fuites
      if (i % 5 === 0) {
        fireEvent.change(select, { target: { value: "pagination" } });
        fireEvent.change(select, { target: { value: "virtual" } });
      }
      await act(async () => {});
      const rendered = list.querySelectorAll("[data-idx]").length;
      // borne empirique: visible window ~ (containerHeight/itemHeight)+overscan (~ (600/72)+10 ≈ 18) + marge sécurité
      expect(rendered).toBeLessThan(80);
      // attribut métrique cohérent
      const metric = parseInt(
        list.getAttribute("data-rendered-count") || "0",
        10
      );
      expect(metric).toBe(rendered);
    }
  }, 30000);

  it("conserve la sélection restante après suppression d’une carte sélectionnée", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/study-service/dd1"]}>
          <Routes>
            <Route
              path="/study-service/:deckId"
              element={<StudyServiceDeckPage />}
            />
          </Routes>
        </MemoryRouter>
      );
    });

    const list = (await screen.findByTestId(
      "deck-card-list",
      {},
      { timeout: 10000 }
    )) as HTMLElement;
    const select = (await screen.findByRole(
      "combobox",
      {},
      { timeout: 10000 }
    )) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "virtual" } });

    // Attendre rendu initial
    await waitFor(() => {
      if (list.querySelectorAll("[data-idx]").length === 0)
        throw new Error("no items yet");
    });

    // Sélectionner deux premières lignes rendues
    const rows = Array.from(list.querySelectorAll("[data-idx]")).slice(
      0,
      2
    ) as HTMLElement[];
    const cb1 = rows[0].querySelector(
      'input[type="checkbox"]'
    ) as HTMLInputElement;
    const cb2 = rows[1].querySelector(
      'input[type="checkbox"]'
    ) as HTMLInputElement;
    fireEvent.click(cb1);
    fireEvent.click(cb2);
    expect(cb1.checked).toBe(true);
    expect(cb2.checked).toBe(true);

    // Supprimer la première carte sélectionnée
    // Trouver le bouton de suppression contenant '✖'
    const btn = Array.from(rows[0].querySelectorAll("button")).find(
      (b) => b.textContent === "✖"
    ) as HTMLButtonElement | undefined;
    if (!btn) throw new Error("delete button not found");
    // Simuler confirm()
    const origConfirm = window.confirm;
    (window as any).confirm = () => true;
    fireEvent.click(btn); // déclenche delete
    (window as any).confirm = origConfirm;

    // Attendre rafraîchissement
    await waitFor(
      () => {
        // la carte r0 ne doit plus exister
        const still = Array.from(list.querySelectorAll("[data-idx]")).find(
          (el) => (el as HTMLElement).innerHTML.includes("Front 0")
        );
        if (still) throw new Error("card not deleted yet");
      },
      { timeout: 4000 }
    );

    // S'assurer que la deuxième carte (Front 1) est toujours sélectionnée
    // Scroll en haut pour garantir sa présence
    list.scrollTop = 0;
    fireEvent.scroll(list);
    await waitFor(() => {
      if (
        !Array.from(list.querySelectorAll("[data-idx]")).some((el) =>
          el.innerHTML.includes("Front 1")
        )
      )
        throw new Error("front1 not visible yet");
    });
    const row1 = Array.from(list.querySelectorAll("[data-idx]")).find((el) =>
      el.innerHTML.includes("Front 1")
    ) as HTMLElement | undefined;
    expect(row1).toBeTruthy();
    const cbPersist = row1!.querySelector(
      'input[type="checkbox"]'
    ) as HTMLInputElement | null;
    expect(cbPersist?.checked).toBe(true);
  }, 30000);
});
