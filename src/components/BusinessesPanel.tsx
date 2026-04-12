import { Link } from "react-router-dom";

import type { Business } from "../types";

type Props = {
  businesses: Business[];
};

export function BusinessesPanel({ businesses }: Props) {
  return (
    <section className="panel card">
      <div className="panel-head">
        <h3>All businesses</h3>
        <p>Every onboarded business and its routing number.</p>
      </div>
      <div className="list-stack">
        {businesses.map((business) => (
          <Link key={business.id} to={`/businesses/${business.id}`} className="call-row link-row">
            <div>
              <strong>{business.name}</strong>
              <p>{business.description || "No description yet."}</p>
              <p className="muted">
                {business.city || business.state
                  ? `${business.city ?? ""}${business.city && business.state ? ", " : ""}${business.state ?? ""}`
                  : typeof business.settings.address === "string"
                    ? business.settings.address
                    : "Location not configured"}
              </p>
            </div>
            <span>{business.businessPhoneNumber} • {business.serviceType || "mixed_inventory"}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
