"use client";

const Page = () => {
  return (
    <div className="m-2 p-4">
      <style jsx>{`
        .label {
          text-align: right;
          width: 29%;
        }
        .inp {
          width: 69%;
          border-radius: 2px;
          color: black;
        }
        .holder {
          display: flex;
          justify-content: space-between;
          margin: 2px;
          padding: 2px;
        }
      `}</style>
      <h2 className="text-3xl text-center">Admin Panel</h2>
      <div className="flex flex-col max-w-md bg-yellow-700 rounded-lg p-2 m-2 mx-auto">
        <p className="text-center text-xl m-2 underline text-black">
          Create Job Posting
        </p>
        <div className="holder">
          <label className="label" htmlFor="title">
            Title
          </label>
          <input type="text" className="inp" id="title" name="title" />
        </div>
        <div className="holder">
          <label className="label" htmlFor="location">
            Location
          </label>
          <input type="text" className="inp" id="location" name="location" />
        </div>
        <div className="holder">
          <label className="label" htmlFor="type">
            Type
          </label>
          <input type="text" className="inp" id="type" name="type" />
        </div>
        <div className="holder">
          <label className="label" htmlFor="salary">
            Salary
          </label>
          <input type="text" className="inp" id="salary" name="salary" />
        </div>
        <div className="holder">
          <label className="label" htmlFor="qualification">
            Qualification
          </label>
          <input
            type="text"
            className="inp"
            id="qualification"
            name="qualification"
          />
        </div>
        <div className="holder">
          <label className="label" htmlFor="timings">
            Timings
          </label>
          <input type="text" className="inp" id="timings" name="timings" />
        </div>
        <button className="bg-yellow-300 text-black rounded-lg shadow-xl p-2 mt-4 hover:bg-black hover:text-white w-40 mx-auto">
        Create
      </button>
      </div>
    </div>
  );
};

export default Page;
