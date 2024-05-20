const Page = () => {
  return (
    <div className="w-full min-h-screen p-4 md:p-14 lg:p-24 font-nunito">
      <div className="mt-10">
        <h1 className="text-xs p-1 font-extralight">Posted on 19th May 2024</h1>
        <h1 className="text-5xl font-bold">Terms of Service</h1>
      </div>
      <div className="my-8">
        <h1 className="text-3xl font-semibold">Introduction</h1>
        <p className="tracking-wide mt-2 text-lg font-thin">
          Welcome to CrackCrimeBahamas! These terms of service govern your use
          of our platform, which helps citizens in the Bahamas provide tips to
          the police to reduce crime. By using our services, you agree to these
          terms.
        </p>
      </div>
      <div className="my-8">
        <h1 className="text-3xl font-semibold">Our Mission</h1>
        <p className="tracking-wide mt-2 text-lg font-thin">
          Our mission is to make the Bahamas safer by enabling active citizen
          participation in crime prevention through secure tip-sharing with
          local police.
        </p>
      </div>
      <div className="my-8">
        <h1 className="text-3xl font-semibold">User Accounts</h1>
        <p className="tracking-wide mt-2 text-lg">
          <ul className="list-disc list-inside font-thin">
            <li>
              <span className="font-semibold">Registration</span>: To use our
              services, you must create an account, providing accurate
              information.
            </li>
            <li>
              <span className="font-semibold">Security</span>: You are
              responsible for maintaining the confidentiality of your account
              credentials.
            </li>
            <li>
              <span className="font-semibold">Eligibility</span>: You must be at
              least 16 years old to use our services.
            </li>
          </ul>
        </p>
      </div>
      <div className="my-8">
        <h1 className="text-3xl font-semibold">Submitting Tips</h1>
        <p className="tracking-wide mt-2 text-lg">
          <ul className="list-disc list-inside font-thin">
            <li>
              <span className="font-semibold">Content Ownership</span>: You
              retain ownership of the tips you submit.
            </li>
            <li>
              <span className="font-semibold">License to Use</span>: By
              submitting tips, you grant us a worldwide, non-exclusive,
              royalty-free license to use, reproduce, and share your tips with
              local police.
            </li>
            <li>
              <span className="font-semibold">Content Standards</span>: TTips
              must not be illegal, harmful, or violate any intellectual property
              rights.
            </li>
          </ul>
        </p>
      </div>
      <div className="my-8">
        <h1 className="text-3xl font-semibold">Your Rights</h1>
        <p className="tracking-wide mt-2 text-lg">
          <ul className="list-disc list-inside font-thin">
            <li>
              <span className="font-semibold">Encryption</span>: All tips are
              encrypted to protect your privacy.
            </li>
            <li>
              <span className="font-semibold">Privacy Policy</span>: Please
              refer to our{" "}
              <a href="/legal/privacy" className="text-blue-500 underline">
                Privacy Policy
              </a>{" "}
              for details on how we collect, use, and protect your information.
            </li>
          </ul>
        </p>
      </div>
      <div className="my-8">
        <h1 className="text-3xl font-semibold">Prohibited Uses</h1>
        <p className="tracking-wide mt-2 text-lg">
          <ul className="list-disc list-inside font-thin">
            <li>Use our services for any unlawful purpose.</li>
            <li>Submit false or misleading information.</li>
            <li>Attempt to gain unauthorized access to our systems.</li>
          </ul>
        </p>
      </div>
      <div className="my-8">
        <h1 className="text-3xl font-semibold">Termination</h1>
        <p className="tracking-wide mt-2 text-lg font-thin">
          We may suspend or terminate your access to our services if you violate
          these terms or engage in activities that harm the community or our
          platform.
        </p>
      </div>
      <div className="my-8">
        <h1 className="text-3xl font-semibold">Changes to Terms</h1>
        <p className="tracking-wide mt-2 text-lg font-thin">
          We may update these terms from time to time. We will notify you of any
          significant changes via email or through our platform.
        </p>
      </div>
      <div className="my-8">
        <h1 className="text-3xl font-semibold">Limitation of Liability</h1>
        <p className="tracking-wide mt-2 text-lg font-thin">
          CrackCrimeBahamas is not liable for any indirect, incidental, or
          consequential damages arising from your use of our services.
        </p>
      </div>
      <div className="my-8">
        <h1 className="text-3xl font-semibold">Contact Us</h1>
        <p className="tracking-wide mt-2 text-lg font-thin">
          For any questions about this Privacy Policy, please{" "}
          <a href="#" className="text-blue-500 underline">
            Contact us
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default Page;
