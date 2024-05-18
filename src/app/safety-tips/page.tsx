"use client";

const Page = () => {
  return (
    <div className="min-w-screen min-h-screen">
      <main className="mx-auto max-w-3xl pt-20">
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2 dark:text-amber-400">
            Stay Aware of Your Surroundings
          </h2>
          <p className="mb-4">
            One of the most effective ways to prevent crime is to stay alert and
            aware of your surroundings. Avoid walking alone in poorly lit areas,
            especially at night, and always be mindful of who is around you.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Secure Your Home</h2>
          <p className="mb-4">
            Make sure your home is secure by installing sturdy locks on all
            doors and windows. Consider installing a security system with
            cameras and alarms to deter potential intruders.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Community Involvement</h2>
          <p className="mb-4">
            Get involved in your community by joining or starting a neighborhood
            watch program. By working together with your neighbors, you can keep
            an eye out for suspicious activity and help prevent crime in your
            area.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Educate Yourself</h2>
          <p className="mb-4">
            Take the time to educate yourself about common scams and crime
            trends in your area. Knowing what to look out for can help you avoid
            becoming a victim of crime.
          </p>
        </section>
      </main>
    </div>
  );
};

export default Page;
