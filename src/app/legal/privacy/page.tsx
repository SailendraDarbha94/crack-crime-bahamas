const Page = () => {
  return (
    <div className="w-full min-h-screen p-4 md:p-14 lg:p-24 font-nunito">
      <div className="mt-10">
        <p className="text-xs p-1 font-extralight text-amber-900/70">Posted on 19th May 2024</p>
        <h1 className="text-4xl md:text-5xl font-bold text-amber-950 drop-shadow-[0_2px_10px_rgba(255,255,255,0.5)]">Privacy Policy</h1>
      </div>
      <div className="my-8">
        <h2 className="text-3xl font-semibold text-amber-900 mb-1">Introduction</h2>
        <p className="tracking-wide mt-2 text-lg font-thin">
          CrackCrimeBahamas (&apos;we,&apos; &apos;us,&apos; &apos;our&apos;) is
          committed to protecting your privacy. This Privacy Policy explains how
          we collect, use, and share information about you when you use our
          services.
        </p>
      </div>
      <div className="my-8">
        <h2 className="text-3xl font-semibold text-amber-900 mb-1">Information We collect</h2>
        <div className="tracking-wide mt-2 text-lg">
          <ul className="list-disc list-inside font-thin">
            <li>
              <span className="font-semibold">Personal Information</span>: Name,
              email address, and any information you provide when submitting
              tips.
            </li>
            <li>
              <span className="font-semibold">Usage Data</span>: IP address,
              browser type, device information
            </li>
            <li>
              <span className="font-semibold">Cookies</span>: We use cookies to
              enhance your experience
            </li>
          </ul>
        </div>
      </div>
      <div className="my-8">
        <h2 className="text-3xl font-semibold text-amber-900 mb-1">How We Use Your Information</h2>
        <div className="tracking-wide mt-2 text-lg">
          <ul className="list-disc list-inside font-thin">
            <li>
              <span className="font-semibold">Providing Services</span>: To
              process and respond to your tips.
            </li>
            <li>
              <span className="font-semibold">Improving Services</span>: To
              analyze usage and improve our platform.
            </li>
            <li>
              <span className="font-semibold">Communication</span>: To contact
              you regarding your submissions or for promotional purposes.
            </li>
          </ul>
        </div>
      </div>
      <div className="my-8">
        <h2 className="text-3xl font-semibold text-amber-900 mb-1">Data Security</h2>
        <p className="tracking-wide mt-2 text-lg font-thin">
          We implement security measures to protect your information such as
          encryption of your data. However, no system is completely secure, and
          we cannot guarantee the absolute security of your data.
        </p>
      </div>
      <div className="my-8">
        <h2 className="text-3xl font-semibold text-amber-900 mb-1">Your Rights</h2>
        <div className="tracking-wide mt-2 text-lg">
          <ul className="list-disc list-inside font-thin">
            <li>
              <span className="font-semibold">Access</span>: You can request a
              copy of your data.
            </li>
            <li>
              <span className="font-semibold">Correction</span>: You can request
              corrections to your data.
            </li>
            <li>
              <span className="font-semibold">Deletion</span>: You can request
              the deletion of your data.
            </li>
          </ul>
        </div>
      </div>
      <div className="my-8">
        <h2 className="text-3xl font-semibold text-amber-900 mb-1">Changes to this policy</h2>
        <p className="tracking-wide mt-2 text-lg font-thin">
          We may update this policy. We will notify you of any changes by
          posting the new policy on our website.
        </p>
      </div>
      <div className="my-8">
        <h2 className="text-3xl font-semibold text-amber-900 mb-1">Contact Us</h2>
        <p className="tracking-wide mt-2 text-lg font-thin">
          For any questions about this Privacy Policy, please{" "}
          <a href="/contact" className="text-amber-800 hover:text-amber-950 underline">
            Contact us
          </a>
        </p>
      </div>
    </div>
  );
};

export default Page;
