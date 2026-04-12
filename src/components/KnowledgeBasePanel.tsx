import { FormEvent, useState } from "react";

import type { Faq, ServiceEntry } from "../types";

type Props = {
  faqs: Faq[];
  services: ServiceEntry[];
  onAddFaq: (input: { question: string; answer: string }) => Promise<void>;
  onAddService: (input: { title: string; content: string }) => Promise<void>;
};

export function KnowledgeBasePanel({ faqs, services, onAddFaq, onAddService }: Props) {
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceContent, setServiceContent] = useState("");

  async function submitFaq(event: FormEvent) {
    event.preventDefault();
    await onAddFaq({ question: faqQuestion, answer: faqAnswer });
    setFaqQuestion("");
    setFaqAnswer("");
  }

  async function submitService(event: FormEvent) {
    event.preventDefault();
    await onAddService({ title: serviceTitle, content: serviceContent });
    setServiceTitle("");
    setServiceContent("");
  }

  return (
    <section className="panel-grid">
      <div className="panel card">
        <div className="panel-head">
          <h3>FAQs</h3>
          <p>These answers are used directly by the AI voice agent.</p>
        </div>
        <form className="form-stack" onSubmit={submitFaq}>
          <input placeholder="Question" value={faqQuestion} onChange={(event) => setFaqQuestion(event.target.value)} required />
          <textarea placeholder="Answer" value={faqAnswer} onChange={(event) => setFaqAnswer(event.target.value)} required />
          <button className="primary-button" type="submit">
            Add FAQ
          </button>
        </form>
        <div className="list-stack">
          {faqs.map((faq) => (
            <article key={faq.id} className="list-card">
              <strong>{faq.question}</strong>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="panel card">
        <div className="panel-head">
          <h3>Services</h3>
          <p>Describe offerings, pricing logic, availability, and business-specific context.</p>
        </div>
        <form className="form-stack" onSubmit={submitService}>
          <input placeholder="Service title" value={serviceTitle} onChange={(event) => setServiceTitle(event.target.value)} required />
          <textarea
            placeholder="Explain the service"
            value={serviceContent}
            onChange={(event) => setServiceContent(event.target.value)}
            required
          />
          <button className="primary-button" type="submit">
            Add service
          </button>
        </form>
        <div className="list-stack">
          {services.map((service) => (
            <article key={service.id} className="list-card">
              <strong>{service.title}</strong>
              <p>{service.content}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
