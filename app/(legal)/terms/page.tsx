export const metadata = {
  title: 'Terms of Service | Fastlane',
  description: 'Terms of Service for Fastlane website services by CRUSH DIGITAL ATELIER LLC',
}

function Section({ id, number, title, children }: { id: string; number: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="flex items-baseline gap-3 font-serif-display text-xl sm:text-2xl text-slate-900 mb-4 pb-3 border-b border-slate-200">
        <span className="text-[#C3F53C] bg-slate-900 px-2 py-0.5 rounded text-sm font-bold">{number}</span>
        {title}
      </h2>
      <div className="space-y-4 text-slate-600 leading-relaxed">
        {children}
      </div>
    </section>
  )
}

function SubSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
        <span className="text-slate-400 text-sm">{number}</span>
        {title}
      </h3>
      <div className="pl-0 sm:pl-4 space-y-3">
        {children}
      </div>
    </div>
  )
}

function ImportantBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg my-4">
      <p className="text-amber-900 text-sm font-medium uppercase tracking-wide leading-relaxed">
        {children}
      </p>
    </div>
  )
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 my-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C3F53C] mt-2 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function TermsPage() {
  return (
    <div className="max-w-none">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
          Legal Agreement
        </div>
        <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-3">Terms of Service</h1>
        <p className="text-slate-500">
          CRUSH DIGITAL ATELIER LLC — Fastlane Website Services
        </p>
      </div>

      {/* Table of Contents */}
      <div className="bg-slate-50 rounded-xl p-6 mb-10 border border-slate-200">
        <h2 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">Table of Contents</h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          {[
            { n: '1', t: 'Introduction and Acceptance' },
            { n: '2', t: 'Service Description' },
            { n: '3', t: 'Subscription and Payment' },
            { n: '4', t: 'Production and Delivery' },
            { n: '5', t: 'Intellectual Property' },
            { n: '6', t: 'Content Disclaimer' },
            { n: '7', t: 'No Guarantees' },
            { n: '8', t: 'Limitation of Liability' },
            { n: '9', t: 'Indemnification' },
            { n: '10', t: 'Disclaimer of Warranties' },
            { n: '11', t: 'Refund and Cancellation' },
            { n: '12-21', t: 'Additional Terms' },
          ].map((item) => (
            <a key={item.n} href={`#section-${item.n}`} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors py-1">
              <span className="text-[#84a329] font-mono text-xs">{item.n}.</span>
              {item.t}
            </a>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-10">
        <Section id="section-1" number="1" title="Introduction and Acceptance">
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;, &ldquo;Agreement&rdquo;) constitute a legally binding contract between you (&ldquo;Client&rdquo;, &ldquo;you&rdquo;, &ldquo;your&rdquo;) and CRUSH DIGITAL ATELIER LLC, a Wyoming limited liability company (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;), governing your access to and use of the Fastlane website production and hosting services (&ldquo;Services&rdquo;).
          </p>
          <ImportantBox>
            BY ACCESSING, USING, OR SUBSCRIBING TO OUR SERVICES, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS. IF YOU DO NOT AGREE TO THESE TERMS, YOU MAY NOT USE OUR SERVICES.
          </ImportantBox>
          <p>
            We reserve the right to modify these Terms at any time. Continued use of the Services after any modifications constitutes acceptance of the revised Terms.
          </p>
        </Section>

        <Section id="section-2" number="2" title="Service Description">
          <SubSection number="2.1" title="Nature of Services">
            <p>
              Fastlane is a subscription-based, productized website production and hosting service. We design, build, host, and maintain websites on behalf of Clients. Fastlane is NOT a traditional agency, consultancy, or custom development shop.
            </p>
          </SubSection>

          <SubSection number="2.2" title="What Is Included">
            <p>The base Fastlane plan includes:</p>
            <List items={[
              'One (1) website',
              'One (1) validated design direction',
              'Mobile-optimized responsive layout',
              'Hosting and SSL certificate',
              'Two (2) revision rounds',
              'Up to ten (10) minor changes per revision round',
            ]} />
          </SubSection>

          <SubSection number="2.3" title="What Is NOT Included">
            <p>The following are expressly excluded from the base plan:</p>
            <List items={[
              'Additional pages beyond the agreed scope',
              'New features, systems, or functionality',
              'Complete redesigns or major direction changes',
              'Custom integrations or third-party development',
              'Content creation, copywriting, or photography',
              'Legal document drafting (privacy policies, terms, disclaimers)',
            ]} />
          </SubSection>
        </Section>

        <Section id="section-3" number="3" title="Subscription and Payment Terms">
          <SubSection number="3.1" title="Preview Policy">
            <p>
              Clients receive a custom preview of their website before payment is required. No payment is due until the Client elects to activate and go live with the website.
            </p>
          </SubSection>

          <SubSection number="3.2" title="Payment Terms">
            <p>
              Subscription fees are billed in advance on a recurring basis. Payment is due upon activation. All fees are non-refundable except as expressly stated in these Terms.
            </p>
          </SubSection>

          <SubSection number="3.3" title="Failed Payments">
            <p>
              If payment fails or is not received, we reserve the right to suspend or terminate access to the Services, including taking the website offline, without prior notice.
            </p>
          </SubSection>

          <SubSection number="3.4" title="Post-Delivery Changes">
            <p>
              After website delivery, simple changes (text edits, image replacements, minor updates) are available at <strong className="text-slate-900">$10 per request</strong>. Complex changes may require a separate quote. Payment is required before execution of any post-delivery change.
            </p>
          </SubSection>
        </Section>

        <Section id="section-4" number="4" title="Production and Delivery">
          <SubSection number="4.1" title="Timeline">
            <p>
              Once production begins, the website will be delivered within <strong className="text-slate-900">seven (7) business days</strong>. The production timeline commences only after: (a) payment is completed; and (b) all required content has been provided by the Client.
            </p>
          </SubSection>

          <SubSection number="4.2" title="Client Responsiveness">
            <p>
              If we do not receive feedback or required materials within five (5) business days of a request, the design shall be deemed approved by default, and we will proceed to delivery.
            </p>
          </SubSection>

          <SubSection number="4.3" title="Revisions">
            <p>
              Minor changes include: editing text, replacing images, adjusting colors, reordering sections, and small visual tweaks. Major changes or complete redesigns are not covered and may incur additional fees.
            </p>
          </SubSection>
        </Section>

        <Section id="section-5" number="5" title="Intellectual Property and License">
          <SubSection number="5.1" title="Ownership">
            <ImportantBox>
              THE CLIENT DOES NOT OWN THE UNDERLYING CODE, DESIGN TEMPLATES, FRAMEWORKS, OR PROPRIETARY SYSTEMS USED TO CREATE THE WEBSITE. All intellectual property rights remain the exclusive property of CRUSH DIGITAL ATELIER LLC.
            </ImportantBox>
          </SubSection>

          <SubSection number="5.2" title="License Grant">
            <p>
              Subject to these Terms and payment of all applicable fees, we grant the Client a limited, non-exclusive, non-transferable, revocable license to use the website for the Client&apos;s business purposes for the duration of the active subscription.
            </p>
          </SubSection>

          <SubSection number="5.3" title="License Termination">
            <p>
              The license automatically terminates upon: (a) cancellation of the subscription; (b) non-payment; or (c) breach of these Terms. Upon termination, the Client&apos;s right to use the website ceases immediately.
            </p>
          </SubSection>
        </Section>

        <Section id="section-6" number="6" title="Content and Compliance Disclaimer">
          <ImportantBox>
            THE CLIENT IS SOLELY RESPONSIBLE FOR ALL CONTENT PROVIDED OR APPROVED FOR PUBLICATION ON THE WEBSITE.
          </ImportantBox>
          <p>This includes but is not limited to:</p>
          <List items={[
            'All text, copy, and written materials',
            'Images, photographs, graphics, and logos',
            'Trademarks, trade names, and branding elements',
            'Legal notices, disclaimers, and disclosures',
            'Privacy policies and terms of service',
            'Product or service claims and representations',
          ]} />
          <p className="mt-4">
            CRUSH DIGITAL ATELIER LLC does not verify, audit, review, or guarantee the legal accuracy, truthfulness, completeness, or compliance of any client-provided content.
          </p>
        </Section>

        <Section id="section-7" number="7" title="No Guarantees — Results and Performance">
          <ImportantBox>
            CRUSH DIGITAL ATELIER LLC MAKES NO GUARANTEES, WARRANTIES, OR REPRESENTATIONS REGARDING BUSINESS RESULTS.
          </ImportantBox>
          <p>This includes:</p>
          <List items={[
            'Search engine rankings or SEO performance',
            'Website traffic volume or visitor numbers',
            'Lead generation or customer acquisition',
            'Conversion rates or sales performance',
            'Business outcomes, revenue, or profitability',
          ]} />
          <p className="mt-4">
            We guarantee delivery, professional structure, and technical functionality—not business results.
          </p>
        </Section>

        <Section id="section-8" number="8" title="Limitation of Liability">
          <ImportantBox>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, CRUSH DIGITAL ATELIER LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, PUNITIVE, OR CONSEQUENTIAL DAMAGES.
          </ImportantBox>
          <p>
            <strong className="text-slate-900">Liability Cap:</strong> In no event shall our total liability exceed the amount paid by the Client during the twelve (12) months immediately preceding the claim.
          </p>
        </Section>

        <Section id="section-9" number="9" title="Indemnification">
          <p>
            The Client agrees to indemnify, defend, and hold harmless CRUSH DIGITAL ATELIER LLC from and against any and all claims, damages, losses, liabilities, costs, and expenses arising out of or related to content provided by the Client, misuse of Services, or violation of these Terms.
          </p>
        </Section>

        <Section id="section-10" number="10" title="Disclaimer of Warranties">
          <ImportantBox>
            THE SERVICES ARE PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
          </ImportantBox>
        </Section>

        <Section id="section-11" number="11" title="Refund and Cancellation Policy">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <p className="text-red-900 text-sm font-medium">
              ONCE PRODUCTION HAS COMMENCED, ALL FEES ARE NON-REFUNDABLE.
            </p>
          </div>
          <p className="mt-4">
            The Client may cancel their subscription at any time. Upon cancellation, the website may be taken offline and the license terminates.
          </p>
        </Section>

        <Section id="section-12-21" number="12-21" title="Additional Terms">
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-1">12. Third-Party Services</h4>
              <p className="text-sm">We are not responsible for third-party services, tools, or platforms integrated with the Services.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-1">13. Feature Modules</h4>
              <p className="text-sm">Additional modules are billed separately and can be activated/deactivated anytime.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-1">14. Customer Support</h4>
              <p className="text-sm">Support is provided through an automated chatbot system.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-1">15. Dispute Resolution</h4>
              <p className="text-sm">Disputes are resolved through binding arbitration administered by the AAA.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-1">16. Governing Law</h4>
              <p className="text-sm">These Terms are governed by the laws of the State of Wyoming, United States.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-1">17-21. Miscellaneous</h4>
              <p className="text-sm">DMCA compliance, modifications to terms, severability, entire agreement, and contact information.</p>
            </div>
          </div>
        </Section>

        {/* Contact */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <h2 className="font-serif-display text-xl text-slate-900 mb-4">Contact Information</h2>
          <div className="bg-slate-900 text-white rounded-xl p-6">
            <div className="font-semibold text-lg mb-2">CRUSH DIGITAL ATELIER LLC</div>
            <div className="text-slate-400 text-sm space-y-1">
              <p>30 N GOULD ST STE N</p>
              <p>Sheridan, WY 82801, United States</p>
              <p className="mt-3">
                <a href="mailto:eric@crushhh.co" className="text-[#C3F53C] hover:underline">
                  eric@crushhh.co
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Acknowledgment */}
        <div className="mt-8 p-6 bg-[#C3F53C]/20 border border-[#C3F53C]/40 rounded-xl">
          <p className="text-slate-900 text-sm font-medium">
            <strong>ACKNOWLEDGMENT:</strong> By using the Fastlane Services, the Client acknowledges that they have read these Terms of Service, understand them, and agree to be bound by them.
          </p>
        </div>
      </div>
    </div>
  )
}
