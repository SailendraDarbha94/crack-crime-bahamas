import type { ReactNode } from "react";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How Crime Stoppers Bahamas handles information in the Crack Crime Bahamas app and website: anonymous tips, notifications, who can see what, and how long it is kept.",
};

// Every statement here must match what the app and website actually do. When
// the data they collect changes, change this page and its date in the same
// commit. It is linked from the app's About Us screen and the site footer, and
// is the privacy policy URL given to the App Store and Google Play.
const LAST_UPDATED = "29 September 2026";

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="my-10">
    <h2 className="text-2xl md:text-3xl font-semibold text-amber-900 mb-3">{title}</h2>
    <div className="space-y-3 text-lg leading-relaxed text-amber-950/90">{children}</div>
  </section>
);

const List = ({ children }: { children: ReactNode }) => (
  <ul className="list-disc pl-6 space-y-2">{children}</ul>
);

const SubList = ({ children }: { children: ReactNode }) => (
  <ul className="list-[circle] pl-6 mt-2 space-y-1">{children}</ul>
);

const Term = ({ children }: { children: ReactNode }) => (
  <span className="font-semibold text-amber-950">{children}</span>
);

const link = "text-amber-800 hover:text-amber-950 underline";

const Page = () => {
  return (
    <main className="w-full min-h-screen p-4 md:p-14 lg:p-24 font-nunito">
      <div className="max-w-3xl">
        <div className="mt-10">
          <p className="text-sm text-amber-900/70">Last updated {LAST_UPDATED}</p>
          <h1 className="text-4xl md:text-5xl font-bold text-amber-950 drop-shadow-[0_2px_10px_rgba(255,255,255,0.5)]">
            Privacy Policy
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-amber-950/90">
            This policy explains what information Crime Stoppers Bahamas (&ldquo;we&rdquo;) collects
            through the Crack Crime Bahamas mobile app (listed on Google Play as
            &ldquo;CrackCrimeBahamas&rdquo; by eBiz Ltd) and this website, how we use it, who can see
            it, and how long we keep it. Crime Stoppers Bahamas is a non-governmental organisation
            whose purpose is to let people give information about crime without revealing who they
            are.
          </p>
        </div>

        <Section title="Tips are anonymous">
          <List>
            <li>
              We never ask for your name, phone number, email address or anything else that
              identifies you, and we do not store your IP address or details of your device with a
              tip.
            </li>
            <li>
              A tip is stored as the text you write, the time it was sent, and a 6-character PIN. If
              you later send a message that contains that PIN, it is added to the same tip instead of
              starting a new one. Keep your PIN private: anyone who has it can add messages to your
              tip, although they cannot read it.
            </li>
            <li>
              Tips travel over an encrypted connection. They are kept in a database that our provider
              encrypts, and our database rules let only approved administrators read them, and police
              officers read only the ones forwarded to the police.
            </li>
            <li>
              Our hosting provider&apos;s servers briefly log technical details of every request,
              including tips sent from the app, such as the IP address. We do not use these logs to
              identify people who send tips.
            </li>
            <li>
              Please don&apos;t put your own name or anything that could identify you in the tip
              itself. If you email us instead, we will see your email address, so use the app or the
              328-TIPS hotline to stay anonymous.
            </li>
          </List>
        </Section>

        <Section title="What we collect">
          <List>
            <li>
              <Term>Tips</Term>: as described above.
            </li>
            <li>
              <Term>Notification registration (mobile app)</Term>: if you allow notifications, the
              app sends us a push token and technical details of your device: its make and model, device
              type and estimated year class, operating system, version and build, memory and processor
              type, and the device&apos;s name. On Android the device name is the one set on the phone, which often includes the
              owner&apos;s first name. We use these only to send alerts from Crime Stoppers Bahamas.
              They are not stored with any tip you send.
            </li>
            <li>
              <Term>Location (older app versions)</Term>: the Android app now on Google Play (version
              5.0.1) and earlier versions of the app send the phone&apos;s precise location (GPS
              coordinates, with altitude, speed, direction of travel and the time of the reading) when
              registering for notifications, so that alerts can be sent to a particular area. The next
              version of the app, and later ones, do not send your location to us. To stop an older
              version sending it, turn off location access for the app in your phone&apos;s settings,
              or update the app once the new version is on Google Play.
            </li>
            <li>
              <Term>Staff accounts (website only)</Term>: Crime Stoppers administrators and police
              officers who sign in to this website have an account: their email address and password
              are handled by Google Firebase Authentication, and their name and email address are kept
              in our database. Their browser stores their
              sign-in so they stay signed in. Members of the public do not have accounts.
            </li>
            <li>
              <Term>Wanted and missing persons</Term>: we publish information about wanted and
              missing persons in the app in the public interest, based on information from the police
              and families. This can include a name, age, gender, aliases, a photo, a description, a
              last known address and, for wanted persons, the offence. On this website the listing
              pages are shown only to staff, but the website also supplies the listings to the app, so
              they are public.
            </li>
            <li>
              <Term>Website visits</Term>: this website uses Google Analytics, through Google
              Firebase, to count visits. It sets cookies in your browser and sends Google the pages
              you view, your browser and device type, and an approximate location that Google works
              out from your IP address. The mobile app does not use Google Analytics, but pages from
              this website that the app opens, such as this policy, do. We do not use advertising
              cookies. Our hosting provider&apos;s servers also record technical details of each
              request, such as the IP address and browser or app type, in logs kept for a limited
              period for security and troubleshooting.
            </li>
          </List>
          <p>
            We no longer take membership pledges online. Pledge records collected through earlier
            versions of the website and app have been deleted.
          </p>
        </Section>

        <Section title="How we use it">
          <List>
            <li>To receive, review and act on tips, including passing them to the police.</li>
            <li>To link follow-up messages to the right tip using its PIN.</li>
            <li>
              To send safety alerts and news by push notification, to all phones or, using stored
              locations, to phones in a particular area.
            </li>
            <li>
              To let staff sign in, control what each person can see, and record which administrator
              forwarded or archived a tip.
            </li>
            <li>To understand how the website is used.</li>
            <li>To run, secure and fix the app and website.</li>
          </List>
          <p>We do not sell information, and we do not use it for advertising.</p>
        </Section>

        <Section title="Who can see it">
          <List>
            <li>
              <Term>Crime Stoppers Bahamas administrators</Term>, approved by the organisation, can
              read all tips and manage device records, wanted and missing listings, and staff
              accounts.
            </li>
            <li>
              <Term>The Royal Bahamas Police Force</Term>: administrators forward tips to the police
              through a secure police portal on this website. Every officer with a police portal
              account can see all tips forwarded to the police, and no others: the tip, its PIN, any
              follow-up messages an administrator has chosen to share, and any note from the
              administrator. The police may use tips in their investigations.
            </li>
            <li>
              <Term>Your phone</Term>: the app looks up its own device record using its push token,
              so anyone who has that token can read the record. Normally only your phone, our
              notification and hosting providers, and our administrators have it.
            </li>
            <li>
              <Term>Service providers</Term> that run the app and website for us, which receive
              information only to provide their service to us:
              <SubList>
                <li>
                  Google Firebase stores the database and files, in Singapore, and handles staff
                  sign-ins, in the United States.
                </li>
                <li>Google Analytics measures visits to this website.</li>
                <li>
                  Vercel hosts this website and the service the app talks to, in the United States.
                </li>
                <li>
                  Expo, in the United States, delivers push notifications to phones through Apple
                  and Google&apos;s notification services.
                </li>
                <li>
                  Google Maps turns a device&apos;s stored coordinates into an approximate address when
                  an administrator asks for one.
                </li>
                <li>Google (Gmail) handles email sent to our email address.</li>
              </SubList>
            </li>
            <li>
              <Term>Anyone</Term> can see the wanted and missing persons listed in the app.
            </li>
          </List>
          <p>
            We may also disclose information when the law requires it. Because our providers are
            based abroad, your information may be stored and processed outside The Bahamas,
            including in Singapore and the United States.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            We do not delete information automatically, except that our hosting and analytics
            providers delete their own logs and data after the periods they set. In particular:
          </p>
          <List>
            <li>
              <Term>Tips</Term>, including archived tips, are kept until an administrator deletes
              them. An archived tip is kept as a record, together with the reason it was archived,
              and a new message quoting its PIN reopens it. A tip&apos;s police copy is removed when an
              administrator withdraws, archives or deletes the tip.
            </li>
            <li>
              <Term>Device records</Term>, including any stored location, are kept until an
              administrator deletes them. Turning off notifications or deleting the app stops alerts
              but does not delete the record; ask us and we will delete it. If the app is still
              installed with notifications allowed, it registers the device again the next time it
              opens.
            </li>
            <li>
              <Term>Wanted and missing persons</Term> stay listed until an administrator archives or
              deletes them. An archived listing is removed from the app and kept, with the reason,
              where only administrators can see it. Its photo stays in our file storage, where anyone
              who has its web address can still open it, until the listing is deleted.
            </li>
            <li>
              <Term>Staff accounts</Term> are kept until we delete them. Removing someone&apos;s
              access to the police portal does not by itself delete their account, name or email
              address.
            </li>
            <li>
              <Term>Hosting logs and Google Analytics data</Term> are kept for the periods set by
              those services.
            </li>
          </List>
        </Section>

        <Section title="How we protect it">
          <p>
            Information travels over encrypted connections, and our providers encrypt the data they
            store. Access to tips and device records is controlled: only approved administrators can
            read tips, and police officers can read only the tips forwarded to the police. No system is completely secure,
            so we cannot guarantee absolute security.
          </p>
        </Section>

        <Section title="Your choices and rights">
          <List>
            <li>
              You can turn notifications, and location access for older Android versions of the app,
              on or off at any time in your phone&apos;s settings. You can block or delete this
              website&apos;s cookies in your browser.
            </li>
            <li>
              To have your device record deleted, email us your phone&apos;s make, model and name as
              shown in its settings.
            </li>
            <li>
              To ask about a tip, or ask us to delete it, without revealing who you are, send a
              message in the app that contains the tip&apos;s PIN. We may keep information that is
              needed for a police investigation or that the law requires us to keep.
            </li>
            <li>
              Under the data protection law of The Bahamas, you can ask us whether we hold personal
              information about you, for a copy of it, and to correct or delete it. Send your request
              in writing to the address or email below, and we will reply within 40 days. We may ask
              for details that confirm who you are and help us find the information. We may refuse to
              show you information kept to prevent or investigate crime if that would harm an
              investigation. If we refuse a request, we will tell you why in writing, and you can
              complain to the Data Protection Commissioner of The Bahamas.
            </li>
          </List>
        </Section>

        <Section title="Children">
          <p>
            We do not knowingly collect personal information from children. Because tips are
            anonymous, we do not know the age of the person who sends one.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            When our practices change, we will update this page and the date at the top. Newer
            versions of the app link to this page from the About Us screen.
          </p>
        </Section>

        <Section title="Contact us">
          <p>
            Crime Stoppers Bahamas, P.O. Box N 665, Nassau, Bahamas. Email{" "}
            <a href="mailto:crimestoppersbahamas@gmail.com" className={link}>
              crimestoppersbahamas@gmail.com
            </a>{" "}
            or use our{" "}
            <a href="/contact" className={link}>
              contact page
            </a>
            . To report a crime anonymously, do not email us: use the app or call 328-TIPS.
          </p>
        </Section>
      </div>
    </main>
  );
};

export default Page;
