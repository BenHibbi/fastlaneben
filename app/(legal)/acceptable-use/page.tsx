export const metadata = {
  title: 'Acceptable Use Policy | Fastlane',
  description: 'Acceptable Use Policy for Fastlane website services by CRUSH DIGITAL ATELIER LLC',
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

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg my-4">
      <p className="text-red-900 text-sm font-medium leading-relaxed">
        {children}
      </p>
    </div>
  )
}

function CautionBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg my-4">
      <p className="text-amber-900 text-sm font-medium leading-relaxed">
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

function ProhibitedCard({ icon, title, items }: { icon: string; title: string; items: string[] }) {
  return (
    <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xl">{icon}</span>
        <h4 className="font-semibold text-slate-900">{title}</h4>
      </div>
      <ul className="space-y-1.5 text-sm text-slate-600">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">✕</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function AcceptableUsePage() {
  return (
    <div className="max-w-none">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 rounded-full text-xs font-bold uppercase tracking-wider text-red-600 mb-4">
          Policy Guidelines
        </div>
        <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-3">Acceptable Use Policy</h1>
        <p className="text-slate-500">
          CRUSH DIGITAL ATELIER LLC — Fastlane Website Services
        </p>
      </div>

      {/* Table of Contents */}
      <div className="bg-slate-50 rounded-xl p-6 mb-10 border border-slate-200">
        <h2 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">Table of Contents</h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          {[
            { n: '1', t: 'Introduction' },
            { n: '2', t: 'Prohibited Content' },
            { n: '3', t: 'Prohibited Activities' },
            { n: '4', t: 'Resource Usage' },
            { n: '5', t: 'Enforcement' },
            { n: '6', t: 'Reporting Violations' },
            { n: '7', t: 'Modifications' },
            { n: '8', t: 'Contact Information' },
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
        <Section id="section-1" number="1" title="Introduction">
          <p>
            This Acceptable Use Policy (&ldquo;AUP&rdquo;) governs your use of the website services provided by CRUSH DIGITAL ATELIER LLC (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) through Fastlane. This AUP is incorporated by reference into our Terms of Service.
          </p>
          <WarningBox>
            By using our Services, you agree to comply with this AUP. Violation of this AUP may result in suspension or termination of your account without refund.
          </WarningBox>
        </Section>

        <Section id="section-2" number="2" title="Prohibited Content">
          <p className="mb-6">You may not use Fastlane websites to host, display, transmit, or promote the following:</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <ProhibitedCard
              icon="⚖️"
              title="Illegal Content"
              items={[
                'Content violating laws or regulations',
                'Promotion of illegal activities',
                'Fraud or financial crimes',
                'Illegal drug trafficking',
              ]}
            />
            <ProhibitedCard
              icon="🚫"
              title="Harmful Content"
              items={[
                'Violence, terrorism, or self-harm',
                'Hate speech or discrimination',
                'Harassment or bullying',
                'Content exploiting minors',
              ]}
            />
            <ProhibitedCard
              icon="🎭"
              title="Deceptive Content"
              items={[
                'Phishing or credential theft',
                'Scams or pyramid schemes',
                'False claims about products',
                'Impersonation or fake reviews',
              ]}
            />
            <ProhibitedCard
              icon="©️"
              title="IP Violations"
              items={[
                'Copyright infringement',
                'Pirated software or media',
                'Counterfeit goods',
                'Trademark violations',
              ]}
            />
            <ProhibitedCard
              icon="🔞"
              title="Adult Content"
              items={[
                'Pornography or explicit content',
                'Escort services',
                'Adult dating services',
              ]}
            />
            <div className="p-5 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">⚠️</span>
                <h4 className="font-semibold text-amber-900">High-Risk (Approval Required)</h4>
              </div>
              <ul className="space-y-1.5 text-sm text-amber-800">
                {[
                  'Gambling or betting services',
                  'Cryptocurrency or NFTs',
                  'Firearms or weapons',
                  'Cannabis or CBD products',
                  'Pharmaceuticals',
                  'Financial services',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">!</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <Section id="section-3" number="3" title="Prohibited Activities">
          <p>You may not use Fastlane Services to:</p>
          <List items={[
            'Send spam, unsolicited emails, or bulk communications',
            'Distribute malware, viruses, or malicious code',
            'Attempt to gain unauthorized access to systems or data',
            'Conduct denial-of-service attacks or disrupt services',
            'Mine cryptocurrency or conduct resource-intensive operations',
            'Scrape, crawl, or harvest data without authorization',
            'Resell or redistribute Services without authorization',
            'Reverse engineer or attempt to extract source code',
            'Circumvent security measures or usage limitations',
          ]} />
        </Section>

        <Section id="section-4" number="4" title="Resource Usage">
          <p>
            Your use of server resources must remain within reasonable limits. Excessive consumption of bandwidth, storage, or processing power may result in throttling, suspension, or additional charges.
          </p>
          <CautionBox>
            We reserve the right to define and enforce resource limits at our discretion.
          </CautionBox>
        </Section>

        <Section id="section-5" number="5" title="Enforcement">
          <SubSection number="5.1" title="Investigation">
            <p>
              We reserve the right to investigate any suspected violation of this AUP. We may access, preserve, and disclose information as necessary to investigate violations, comply with legal requirements, or protect our rights and the rights of others.
            </p>
          </SubSection>

          <SubSection number="5.2" title="Actions We May Take">
            <p>In response to violations, we may:</p>
            <div className="mt-4 space-y-2">
              {[
                { level: 'Level 1', action: 'Issue a warning requiring corrective action', color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
                { level: 'Level 2', action: 'Remove or disable violating content', color: 'bg-orange-100 border-orange-300 text-orange-800' },
                { level: 'Level 3', action: 'Suspend access to Services (temporary or permanent)', color: 'bg-red-100 border-red-300 text-red-800' },
                { level: 'Level 4', action: 'Terminate your account without refund', color: 'bg-red-200 border-red-400 text-red-900' },
                { level: 'Level 5', action: 'Report violations to law enforcement', color: 'bg-slate-800 border-slate-900 text-white' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-4 p-3 rounded-lg border ${item.color}`}>
                  <span className="text-xs font-bold uppercase tracking-wider shrink-0 w-16">{item.level}</span>
                  <span className="text-sm">{item.action}</span>
                </div>
              ))}
            </div>
          </SubSection>

          <SubSection number="5.3" title="No Liability">
            <p>
              We shall not be liable for any damages resulting from enforcement actions taken in good faith under this AUP.
            </p>
          </SubSection>
        </Section>

        <Section id="section-6" number="6" title="Reporting Violations">
          <p>
            If you become aware of any violation of this AUP, please report it to us immediately. Include as much detail as possible, including URLs, screenshots, and descriptions of the violation.
          </p>
          <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
            <p className="text-blue-900 text-sm">
              <strong>Report violations to:</strong>{' '}
              <a href="mailto:eric@crushhh.co" className="text-blue-700 hover:underline font-medium">
                eric@crushhh.co
              </a>
            </p>
          </div>
        </Section>

        <Section id="section-7" number="7" title="Modifications">
          <p>
            We reserve the right to modify this AUP at any time. Changes will be effective upon posting. Your continued use of the Services after modifications constitutes acceptance of the updated AUP.
          </p>
        </Section>

        <Section id="section-8" number="8" title="Contact Information">
          <p className="mb-4">For questions about this AUP, please contact:</p>
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
        </Section>

        {/* Acknowledgment */}
        <div className="mt-8 p-6 bg-[#C3F53C]/20 border border-[#C3F53C]/40 rounded-xl">
          <p className="text-slate-900 text-sm font-medium">
            <strong>ACKNOWLEDGMENT:</strong> By using the Fastlane Services, you acknowledge that you have read this Acceptable Use Policy, understand it, and agree to comply with its terms.
          </p>
        </div>
      </div>
    </div>
  )
}
