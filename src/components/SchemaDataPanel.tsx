import { FormEvent, useState } from "react";

import type { Business, Product, ProductImage, UserRecord } from "../types";

type Props = {
  business: Business;
  users: UserRecord[];
  products: Product[];
  selectedProductId: string | null;
  images: ProductImage[];
  onSelectProduct: (productId: string | null) => void;
  onCreateProduct: (input: {
    name: string;
    slug: string;
    description?: string;
    category: "car" | "bike" | "scooter" | "fridge" | "ac" | "washing_machine" | "tv" | "mobile" | "furniture" | "other";
    price: number;
  }) => Promise<void>;
  onAddImage: (input: { imageUrl: string; altText?: string; isPrimary?: boolean; sortOrder?: number }) => Promise<void>;
};

export function SchemaDataPanel({
  business,
  users,
  products,
  selectedProductId,
  images,
  onSelectProduct,
  onCreateProduct,
  onAddImage,
}: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<
    "car" | "bike" | "scooter" | "fridge" | "ac" | "washing_machine" | "tv" | "mobile" | "furniture" | "other"
  >("other");
  const [price, setPrice] = useState("0");

  const [imageUrl, setImageUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [sortOrder, setSortOrder] = useState("0");

  async function submitProduct(event: FormEvent) {
    event.preventDefault();
    await onCreateProduct({
      name,
      slug,
      description,
      category,
      price: Number(price || 0),
    });
    setName("");
    setSlug("");
    setDescription("");
    setPrice("0");
  }

  async function submitImage(event: FormEvent) {
    event.preventDefault();
    await onAddImage({
      imageUrl,
      altText,
      isPrimary,
      sortOrder: Number(sortOrder || 0),
    });
    setImageUrl("");
    setAltText("");
    setIsPrimary(false);
    setSortOrder("0");
  }

  return (
    <section className="panel-grid">
      <div className="panel card">
        <div className="panel-head">
          <h3>Business (businesses table)</h3>
          <p>Primary AI knowledge source: organization details, contact, and location come from these fields.</p>
        </div>
        <div className="list-card">
          <strong>{business.name}</strong>
          <p>Slug: {business.slug}</p>
          <p>Contact: {business.businessPhoneNumber}</p>
          <p>Email: {business.primaryEmail || "not set"}</p>
          <p>Service type: {business.serviceType || "mixed_inventory"}</p>
          <p>City/State: {(business.city || "-") + " / " + (business.state || "-")}</p>
          <p>Address: {business.address || "not set"}</p>
        </div>
      </div>

      <div className="panel card">
        <div className="panel-head">
          <h3>Users (users table)</h3>
          <p>Users linked by business_id.</p>
        </div>
        <div className="list-stack">
          {users.map((user) => (
            <article key={user.id} className="list-card">
              <strong>{user.name}</strong>
              <p>{user.email}</p>
              <p>{user.mobile} • {user.role}</p>
            </article>
          ))}
          {users.length === 0 ? <p className="muted">No users found for this business.</p> : null}
        </div>
      </div>

      <div className="panel card">
        <div className="panel-head">
          <h3>Products (products table)</h3>
          <p>Primary inventory knowledge base used by AI for list/count/price/status questions.</p>
        </div>

        <form className="form-stack" onSubmit={submitProduct}>
          <input placeholder="Product name" value={name} onChange={(event) => setName(event.target.value)} required />
          <input placeholder="Slug" value={slug} onChange={(event) => setSlug(event.target.value)} required />
          <textarea placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
          <select value={category} onChange={(event) => setCategory(event.target.value as typeof category)}>
            <option value="car">car</option>
            <option value="bike">bike</option>
            <option value="scooter">scooter</option>
            <option value="fridge">fridge</option>
            <option value="ac">ac</option>
            <option value="washing_machine">washing_machine</option>
            <option value="tv">tv</option>
            <option value="mobile">mobile</option>
            <option value="furniture">furniture</option>
            <option value="other">other</option>
          </select>
          <input
            type="number"
            step="0.01"
            placeholder="Price"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            required
          />
          <button className="primary-button" type="submit">Create product</button>
        </form>

        <div className="list-stack">
          {products.map((product) => (
            <button key={product.id} className="call-row" type="button" onClick={() => onSelectProduct(product.id)}>
              <div>
                <strong>{product.name}</strong>
                <p>{product.category} • {product.status}</p>
              </div>
              <span>{product.price} {product.currency}</span>
            </button>
          ))}
          {products.length === 0 ? <p className="muted">No products found.</p> : null}
        </div>
      </div>

      <div className="panel card">
        <div className="panel-head">
          <h3>Product Images (product_images table)</h3>
          <p>Images linked by product_id.</p>
        </div>

        {selectedProductId ? (
          <form className="form-stack" onSubmit={submitImage}>
            <input placeholder="Image URL" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} required />
            <input placeholder="Alt text" value={altText} onChange={(event) => setAltText(event.target.value)} />
            <label className="checkline">
              <input type="checkbox" checked={isPrimary} onChange={(event) => setIsPrimary(event.target.checked)} />
              Is primary
            </label>
            <input
              type="number"
              placeholder="Sort order"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            />
            <button className="primary-button" type="submit">Add image</button>
          </form>
        ) : (
          <p className="muted">Select a product to manage images.</p>
        )}

        <div className="list-stack">
          {images.map((img) => (
            <article key={img.id} className="list-card">
              <strong>{img.isPrimary ? "Primary" : "Image"}</strong>
              <p>{img.imageUrl}</p>
              <p>{img.altText || "No alt text"}</p>
            </article>
          ))}
          {images.length === 0 ? <p className="muted">No images found.</p> : null}
        </div>
      </div>
    </section>
  );
}
