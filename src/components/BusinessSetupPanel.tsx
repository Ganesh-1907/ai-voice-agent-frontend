import { FormEvent, useState } from "react";

type Props = {
  onCreateBusiness: (input: {
    name: string;
    slug: string;
    description?: string;
    businessPhoneNumber: string;
    virtualPhoneNumber?: string;
    planCode: "starter" | "growth" | "pro";
    settings?: {
      serviceType?: "car_dealer" | "appliance_store" | "electronics_store" | "mixed_inventory" | "other";
      primaryEmail?: string;
      primaryMobile?: string;
      city?: string;
      state?: string;
      address?: string;
    };
  }) => Promise<void>;
};

export function BusinessSetupPanel({ onCreateBusiness }: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [businessPhoneNumber, setBusinessPhoneNumber] = useState("");
  const [virtualPhoneNumber, setVirtualPhoneNumber] = useState("");
  const [planCode, setPlanCode] = useState<"starter" | "growth" | "pro">("growth");
  const [serviceType, setServiceType] = useState<
    "car_dealer" | "appliance_store" | "electronics_store" | "mixed_inventory" | "other"
  >("mixed_inventory");
  const [primaryEmail, setPrimaryEmail] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("Saving business...");
    await onCreateBusiness({
      name,
      slug,
      description,
      businessPhoneNumber,
      virtualPhoneNumber,
      planCode,
      settings: {
        serviceType,
        primaryEmail,
        primaryMobile: virtualPhoneNumber,
        city,
        state,
        address,
      },
    });
    setStatus("Business created");
    setName("");
    setSlug("");
    setDescription("");
    setBusinessPhoneNumber("");
    setVirtualPhoneNumber("");
    setPrimaryEmail("");
    setCity("");
    setState("");
    setAddress("");
  }

  return (
    <form className="panel card form-grid" onSubmit={handleSubmit}>
      <div className="panel-head">
        <h3>Business onboarding</h3>
        <p>Add a business number and map it to your central AI call flow.</p>
      </div>

      <label>
        Business name
        <input value={name} onChange={(event) => setName(event.target.value)} required />
      </label>

      <label>
        Slug
        <input value={slug} onChange={(event) => setSlug(event.target.value)} required />
      </label>

      <label className="span-2">
        Description
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>

      <label>
        Business phone number
        <input value={businessPhoneNumber} onChange={(event) => setBusinessPhoneNumber(event.target.value)} required />
      </label>

      <label>
        Virtual / Exotel number
        <input value={virtualPhoneNumber} onChange={(event) => setVirtualPhoneNumber(event.target.value)} />
      </label>

      <label>
        Plan
        <select value={planCode} onChange={(event) => setPlanCode(event.target.value as "starter" | "growth" | "pro")}>
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="pro">Pro</option>
        </select>
      </label>

      <label>
        Service type
        <select
          value={serviceType}
          onChange={(event) =>
            setServiceType(
              event.target.value as "car_dealer" | "appliance_store" | "electronics_store" | "mixed_inventory" | "other",
            )
          }
        >
          <option value="mixed_inventory">Mixed inventory</option>
          <option value="car_dealer">Car dealer</option>
          <option value="appliance_store">Appliance store</option>
          <option value="electronics_store">Electronics store</option>
          <option value="other">Other</option>
        </select>
      </label>

      <label>
        Primary email
        <input value={primaryEmail} onChange={(event) => setPrimaryEmail(event.target.value)} />
      </label>

      <label>
        City
        <input value={city} onChange={(event) => setCity(event.target.value)} />
      </label>

      <label>
        State
        <input value={state} onChange={(event) => setState(event.target.value)} />
      </label>

      <label className="span-2">
        Address
        <textarea value={address} onChange={(event) => setAddress(event.target.value)} />
      </label>

      <div className="span-2 action-row">
        <button className="primary-button" type="submit">
          Create business
        </button>
        {status ? <span className="muted">{status}</span> : null}
      </div>
    </form>
  );
}
