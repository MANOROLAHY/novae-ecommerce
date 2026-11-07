import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as api from "../src/context/api.js";
import ProductFormModal from "../src/admin/ProductFormModal.jsx";

describe("ProductFormModal - creation", () => {
  it("appelle createProduct puis onSaved quand tous les champs sont remplis", async () => {
    const createSpy = vi.spyOn(api, "createProduct").mockResolvedValue({ id: "new-id", name: "Chapeau" });
    const onSaved = vi.fn();
    const onClose = vi.fn();

    render(<ProductFormModal product={null} onClose={onClose} onSaved={onSaved} />);

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Nom du produit/i), "Chapeau");
    await user.type(screen.getByLabelText(/^Catégorie \*/i), "Mode");
    await user.type(screen.getByLabelText(/^Sous-catégorie \*/i), "Accessoires");
    await user.type(screen.getByLabelText(/^Prix \*/i), "150");
    const submitBtn = screen.getByRole("button", { name: /Créer le produit/i });
    await user.click(submitBtn);

    console.log("--- Après clic, contenu visible ---");
    screen.debug(undefined, 20000);

    // On cherche le bouton de confirmation
    const confirmBtn = await screen.findByRole("button", { name: /^Ajouter$/i });
    console.log("--- Bouton de confirmation trouvé, clic ---");
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalled();
    }, { timeout: 3000 });

    console.log("--- createProduct appelé avec:", JSON.stringify(createSpy.mock.calls[0][0]));
    expect(onSaved).toHaveBeenCalled();
  });
});
