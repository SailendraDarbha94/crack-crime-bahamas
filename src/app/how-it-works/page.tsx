"use client";

const Page = () => {
  return (
    <div className="min-w-screen min-h-screen">
      <main className="mx-auto max-w-3xl pt-20">
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Step 1: Report Any Crime</h2>
          <p className="mb-4">
            If you have ANY information on ANY crime, call at ANY time, 365 days
            a year. Your call will be automatically answered in USA or Canada.
            Phone lines are not police lines and are sponsored by Crime
            Stoppers. Your call cannot be traced as there is no Caller Id, or
            any similar features attached to the lines.
          </p>
          <p className="mb-4">
            In Nassau/Paradise Island: <strong>4328-TIPS (8477)</strong>
            <br />
            Family Islands: <strong>41-242-300-8477</strong>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Step 2: Remain Anonymous</h2>
          <p className="mb-4">
            The overseas operator will take the relevant information, and you
            will NEVER be asked for your name or where you are calling from. You
            remain Anonymous (no names asked). After receiving the information,
            the operator will give you a Control Number that you should keep
            confidential.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Step 3: Follow Up</h2>
          <p className="mb-4">
            Call back after 30 days and give the operator your Control Number.
            You will be told the status of your case and if you are eligible for
            a cash reward payment of up to $1000.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Step 4: Reward Collection</h2>
          <p className="mb-4">
            If you are eligible for a reward, indicate any public place in
            Nassau where you want money dropped off during daylight hours, and
            Crime Stoppers will arrange for a civilian to drop off the reward.
          </p>
        </section>
      </main>
    </div>
  );
};

export default Page;
