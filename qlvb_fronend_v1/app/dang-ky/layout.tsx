import type React from "react";

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-teal-100/70 flex flex-col items-center gap-6 py-6 px-4 sm:px-8">
      <div className="w-full max-w-4xl">
        <div className="w-full text-center">
          <div className="inline-block rounded-md border border-amber-300 bg-amber-100 px-6 py-3 shadow-sm">
            <h1 className="text-lg font-semibold tracking-wide text-gray-800">
              HỆ THỐNG QUẢN LÝ NỘI BỘ LỮ ĐOÀN 279
            </h1>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl rounded-md border border-gray-300 bg-white shadow">
        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
          {/* Left column: logo + support box */}
          <div className="space-y-6">
            <div className="flex items-center justify-center rounded-md border border-blue-300 bg-blue-100 px-6 py-8 text-center text-gray-800">
              <div>
                <div className="font-semibold">LÔ GÔ</div>
                <div className="mt-1">LĐ 279</div>
              </div>
            </div>

            <div className="rounded-md border border-rose-300 bg-rose-100 p-4 text-sm leading-6 text-gray-700">
              <div className="font-medium">Hỗ trợ kỹ thuật</div>
              <div>Tổ khoa học - Phòng hậu cần - kỹ thuật</div>
              <div className="mt-1">Mobile: 0969752776</div>
            </div>
          </div>

          {/* Middle banner and right form */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center justify-center">
              <div className="w-full rounded-xl border border-purple-300 bg-purple-100 px-6 py-4 text-center text-gray-800">
                <div className="font-semibold">LỮ ĐOÀN CÔNG BINH</div>
                <div className="">HỖN HỢP 279</div>
              </div>
            </div>

            <div className="flex w-full justify-center">
              <div className="w-full max-w-md">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
