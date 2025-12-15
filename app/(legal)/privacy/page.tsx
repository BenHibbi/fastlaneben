export const metadata = {
  title: 'Privacy Policy | Fastlane',
  description: 'Privacy Policy for Fastlane website services by CRUSH DIGITAL ATELIER LLC',
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

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg my-4">
      <p className="text-blue-900 text-sm leading-relaxed">
        {children}
      </p>
    </div>
  )
}

function List({ items }: { items: (string | React.ReactNode)[] }) {
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

function CookieCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
      <h4 className="font-semibold text-slate-900 mb-1">{title}</h4>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <div className="max-w-none">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
          Privacy &amp; Data
        </div>
        <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-3">Privacy Policy</h1>
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
            { n: '2', t: 'Information We Collect' },
            { n: '3', t: 'How We Use Information' },
            { n: '4', t: 'How We Share Information' },
            { n: '5', t: 'Cookies & Tracking' },
            { n: '6', t: 'Data Retention' },
            { n: '7', t: 'Data Security' },
            { n: '8', t: 'Your Rights & Choices' },
            { n: '9', t: 'California Privacy (CCPA)' },
            { n: '10', t: 'International Transfers' },
            { n: '11', t: 'Children\'s Privacy' },
            { n: '12-14', t: 'Additional Provisions' },
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
            CRUSH DIGITAL ATELIER LLC (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Fastlane website production and hosting services (&ldquo;Services&rdquo;).
          </p>
          <InfoBox>
            By accessing or using our Services, you consent to the data practices described in this Privacy Policy. If you do not agree with the practices described herein, please do not use our Services.
          </InfoBox>
        </Section>

        <Section id="section-2" number="2" title="Information We Collect">
          <SubSection number="2.1" title="Information You Provide">
            <p>We collect information that you voluntarily provide to us, including:</p>
            <List items={[
              'Contact information (name, email address, phone number)',
              'Business information (company name, industry, address)',
              'Account credentials (username, password)',
              'Payment information (credit card details, billing address)',
              'Content you provide for your website (text, images, logos)',
              'Communications with us (support requests, feedback)',
            ]} />
          </SubSection>

          <SubSection number="2.2" title="Information Collected Automatically">
            <p>When you access our Services, we may automatically collect:</p>
            <List items={[
              'Device information (browser type, operating system, device identifiers)',
              'Usage data (pages visited, features used, time spent)',
              'IP address and general location information',
              'Log data (access times, referring URLs)',
              'Cookies and similar tracking technologies',
            ]} />
          </SubSection>

          <SubSection number="2.3" title="Information from Third Parties">
            <p>
              We may receive information about you from third-party sources, including payment processors, analytics providers, and business partners. This information may be combined with other information we collect about you.
            </p>
          </SubSection>
        </Section>

        <Section id="section-3" number="3" title="How We Use Your Information">
          <p>We use the information we collect to:</p>
          <List items={[
            'Provide, operate, and maintain our Services',
            'Process transactions and send related information',
            'Send administrative communications (service updates, security alerts)',
            'Respond to your inquiries and provide customer support',
            'Improve, personalize, and develop our Services',
            'Analyze usage patterns and trends',
            'Detect, prevent, and address technical issues and fraud',
            'Comply with legal obligations',
            'Protect our rights, privacy, safety, or property',
          ]} />
        </Section>

        <Section id="section-4" number="4" title="How We Share Your Information">
          <SubSection number="4.1" title="Service Providers">
            <p>
              Third-party vendors who perform services on our behalf, including payment processing, hosting, analytics, customer support, and marketing. These providers are contractually obligated to protect your information.
            </p>
          </SubSection>

          <SubSection number="4.2" title="Legal Requirements">
            <p>
              When required by law, regulation, legal process, or governmental request, or when we believe disclosure is necessary to protect our rights, your safety, or the safety of others.
            </p>
          </SubSection>

          <SubSection number="4.3" title="Business Transfers">
            <p>
              In connection with a merger, acquisition, reorganization, sale of assets, or bankruptcy, your information may be transferred to the acquiring entity.
            </p>
          </SubSection>

          <SubSection number="4.4" title="With Your Consent">
            <p>
              We may share your information for other purposes with your explicit consent.
            </p>
          </SubSection>
        </Section>

        <Section id="section-5" number="5" title="Cookies and Tracking Technologies">
          <p>
            We use cookies, web beacons, pixels, and similar tracking technologies to collect information and improve our Services. Cookies are small data files stored on your device.
          </p>

          <SubSection number="5.1" title="Types of Cookies We Use">
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <CookieCard
                title="Essential Cookies"
                description="Required for basic site functionality"
              />
              <CookieCard
                title="Performance Cookies"
                description="Help us understand how visitors use our Services"
              />
              <CookieCard
                title="Functional Cookies"
                description="Remember your preferences and settings"
              />
              <CookieCard
                title="Advertising Cookies"
                description="Deliver relevant advertisements"
              />
            </div>
          </SubSection>

          <SubSection number="5.2" title="Your Cookie Choices">
            <p>
              Most web browsers allow you to manage cookie preferences. You can set your browser to refuse cookies or alert you when cookies are being sent. Note that disabling cookies may affect the functionality of our Services.
            </p>
          </SubSection>
        </Section>

        <Section id="section-6" number="6" title="Data Retention">
          <p>
            We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When determining retention periods, we consider the nature of the information, the purposes for which it was collected, and legal requirements.
          </p>
        </Section>

        <Section id="section-7" number="7" title="Data Security">
          <p>
            We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
          </p>
          <InfoBox>
            However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </InfoBox>
        </Section>

        <Section id="section-8" number="8" title="Your Rights and Choices">
          <p>Depending on your location, you may have certain rights regarding your personal information:</p>
          <List items={[
            <><strong className="text-slate-900">Access:</strong> Request access to your personal information</>,
            <><strong className="text-slate-900">Correction:</strong> Request correction of inaccurate information</>,
            <><strong className="text-slate-900">Deletion:</strong> Request deletion of your personal information</>,
            <><strong className="text-slate-900">Portability:</strong> Request a copy of your data in a portable format</>,
            <><strong className="text-slate-900">Objection:</strong> Object to certain processing of your information</>,
            <><strong className="text-slate-900">Withdraw consent:</strong> Withdraw previously given consent</>,
          ]} />
          <p className="mt-4">
            To exercise these rights, please contact us at{' '}
            <a href="mailto:eric@crushhh.co" className="text-[#84a329] hover:underline font-medium">
              eric@crushhh.co
            </a>
            . We will respond to your request within the timeframe required by applicable law.
          </p>
        </Section>

        <Section id="section-9" number="9" title="California Privacy Rights (CCPA)">
          <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):</p>
          <List items={[
            'Right to know what personal information we collect, use, and share',
            'Right to delete personal information (with certain exceptions)',
            'Right to opt-out of the sale of personal information',
            'Right to non-discrimination for exercising your rights',
          ]} />
          <div className="mt-4 p-4 bg-emerald-50 border-l-4 border-emerald-400 rounded-r-lg">
            <p className="text-emerald-900 text-sm font-medium">
              We do not sell your personal information.
            </p>
          </div>
          <p className="mt-4">
            To exercise your California privacy rights, contact us at{' '}
            <a href="mailto:eric@crushhh.co" className="text-[#84a329] hover:underline font-medium">
              eric@crushhh.co
            </a>.
          </p>
        </Section>

        <Section id="section-10" number="10" title="International Data Transfers">
          <p>
            Your information may be transferred to and processed in the United States or other countries where our service providers operate. These countries may have different data protection laws than your country of residence.
          </p>
          <InfoBox>
            By using our Services, you consent to the transfer of your information to the United States and other jurisdictions.
          </InfoBox>
        </Section>

        <Section id="section-11" number="11" title="Children&apos;s Privacy">
          <p>
            Our Services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected personal information from a child, we will take steps to delete that information.
          </p>
        </Section>

        <Section id="section-12-14" number="12-14" title="Additional Provisions">
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-1">12. Third-Party Links</h4>
              <p className="text-sm">Our Services may contain links to third-party websites. We are not responsible for their privacy practices.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-1">13. Policy Changes</h4>
              <p className="text-sm">We may update this Privacy Policy from time to time. Continued use after changes constitutes acceptance.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-1">14. Contact Us</h4>
              <p className="text-sm">Questions about this policy? Contact us at the address below.</p>
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
            <strong>ACKNOWLEDGMENT:</strong> By using the Fastlane Services, you acknowledge that you have read this Privacy Policy, understand it, and agree to its terms.
          </p>
        </div>
      </div>
    </div>
  )
}
