import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import * as api from "../src/context/api.js";
import AdminDashboard from "../src/admin/AdminDashboard.jsx";

describe("AdminDashboard - flux complet ajout produit", () => {
  beforeEach(() => {
    vi.spyOn(api, "fetchProducts")
      .mockResolvedValueOnce([
        {
          id: "p1",
          name: "Existant",
          category: "Mode",
          subcategory: "Test",
          price: 50,
          stock: 3,
          ref: "REF1",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "p1",
          name: "Existant",
          category: "Mode",
          subcategory: "Test",
          price: 50,
          stock: 3,
          ref: "REF1",
        },
        {
          id: "p2",
          name: "Chapeau Nouveau",
          category: "Mode",
          subcategory: "Accessoires",
          price: 150,
          stock: 0,
          ref: "REF2",
        },
      ]);

    vi.spyOn(api, "createProduct").mockResolvedValue({
      id: "p2",
      name: "Chapeau Nouveau",
    });

    vi.spyOn(api, "fetchAdminOrders").mockResolvedValue({
      orders: [],
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("affiche le nouveau produit dans le tableau après création", async () => {
    const user = userEvent.setup();

    render(<AdminDashboard />, {
      wrapper: MemoryRouter,
    });

    // Attendre le chargement initial des produits.
    await screen.findAllByText("Existant");

    expect(
      screen.queryByText("Chapeau Nouveau")
    ).not.toBeInTheDocument();

    // Récupérer les boutons Ajouter un produit.
    const addButtons = screen.getAllByRole("button", {
      name: /Ajouter un produit/i,
    });

    // Cliquer sur le premier bouton pour ouvrir la modale.
    await user.click(addButtons[0]);

    // Remplir les champs du formulaire.
    await user.type(
      screen.getByLabelText(/Nom du produit/i),
      "Chapeau Nouveau"
    );

    await user.type(
      screen.getByLabelText(/^Catégorie/i),
      "Mode"
    );

    await user.type(
      screen.getByLabelText(/^Sous-catégorie/i),
      "Accessoires"
    );

    const priceFields = screen.getAllByLabelText(/^Prix/i);

    await user.type(priceFields[0], "150");

    // Cliquer sur le bouton de création.
    await user.click(
      screen.getByRole("button", {
        name: /Créer le produit/i,
      })
    );

    // Confirmer l'ajout dans la boîte de dialogue.
    const dialogs = await screen.findAllByRole("dialog");

    const confirmDialog = dialogs.find(
      (dialog) =>
        dialog.getAttribute("aria-labelledby") === "confirm-dialog-title"
    );

    expect(confirmDialog).toBeTruthy();

    const confirmButton = within(confirmDialog).getByRole("button", {
      name: /^Ajouter$/i,
    });

    await user.click(confirmButton);

    // Vérifier que le nouveau produit apparaît dans le tableau.
    await waitFor(
      () => {
        expect(
          screen.getAllByText("Chapeau Nouveau").length
        ).toBeGreaterThanOrEqual(1);
      },
      { timeout: 10000 }
    );

    // Vérifier les appels API.
    expect(api.createProduct).toHaveBeenCalledTimes(1);
    expect(api.fetchProducts).toHaveBeenCalledTimes(2);
  });
});
