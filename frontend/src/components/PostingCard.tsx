"use client";
const PostingCard = async (params: any) => {
  return (
    <div className="m-2 p-2 bg-blue-500 rounded-md min-w-full">
      <h2 className="text-center">Header</h2>
      <p>Kha lenge gaali</p>
      <div className="flex justify-around bg-red-200 text-black rounded-md">
        <div>seh lenge thoda</div>
        <div>blade build</div>
      </div>
    </div>
  );
};

export default PostingCard;
