import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import * as api from "../src/context/api.js";
import AdminDashboard from "../src/admin/AdminDashboard.jsx";

describe("AdminDashboard - flux complet ajout produit", () => {
  beforeEach(() => {
    vi.spyOn(api, "fetchProducts")
      .mockResolvedValueOnce([{ id: "p1", name: "Existant", category: "Mode", subcategory: "Test", price: 50, stock: 3, ref: "REF1" }])
      .mockResolvedValueOnce([
        { id: "p1", name: "Existant", category: "Mode", subcategory: "Test", price: 50, stock: 3, ref: "REF1" },
        { id: "p2", name: "Chapeau Nouveau", category: "Mode", subcategory: "Accessoires", price: 150, stock: 0, ref: "REF2" },
      ]);
    vi.spyOn(api, "createProduct").mockResolvedValue({ id: "p2", name: "Chapeau Nouveau" });
  });

  it("affiche le nouveau produit dans le tableau après création", async () => {
    render(<AdminDashboard />, { wrapper: MemoryRouter });
    const user = userEvent.setup();

    // attendre le chargement initial
    await screen.findByText("Existant");
    expect(screen.queryByText("Chapeau Nouveau")).not.toBeInTheDocument();

    // ouvrir la modale
    await user.click(screen.getByRole("button", { name: /Ajouter un produit/i }));

    // remplir le formulaire minimal
    await user.type(screen.getByLabelText(/Nom du produit/i), "Chapeau Nouveau");
    await user.type(screen.getByLabelText(/^Catégorie \*/i), "Mode");
    await user.type(screen.getByLabelText(/^Sous-catégorie \*/i), "Accessoires");
    await user.type(screen.getByLabelText(/^Prix \(€\)/i), "150");

    await user.click(screen.getByRole("button", { name: /Créer le produit/i }));
    const confirmBtn = await screen.findByRole("button", { name: /^Ajouter$/i });
    await user.click(confirmBtn);

    // le produit doit maintenant apparaître dans le tableau
    await waitFor(() => {
      expect(screen.getByText("Chapeau Nouveau")).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(api.createProduct).toHaveBeenCalled();
    expect(api.fetchProducts).toHaveBeenCalledTimes(2);
  });
});
