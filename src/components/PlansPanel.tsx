import type { Plan } from "../types";

type Props = {
  plans: Plan[];
};

export function PlansPanel({ plans }: Props) {
  return (
    <section className="panel card">
      <div className="panel-head">
        <h3>Subscription plans</h3>
        <p>Pricing currently exposed by the backend plan catalog.</p>
      </div>
      <div className="stats-grid plans-grid">
        {plans.map((plan) => (
          <article key={plan.code} className="stat-card">
            <span>{plan.code}</span>
            <strong>Rs. {plan.priceInr}</strong>
            <p>{plan.includedCalls} included calls</p>
            <p>Extra call: Rs. {plan.extraCallPriceInr}</p>
            <p>
              Profit range: Rs. {plan.estimatedProfitRangeInr[0]} - Rs. {plan.estimatedProfitRangeInr[1]}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
