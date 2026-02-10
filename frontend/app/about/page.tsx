import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">درباره سامانه</h1>

          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">معرفی سامانه</h2>
              <p className="text-gray-700 leading-relaxed">
                سامانه مدیریت فرم‌های داوطلبین ارتقاء و انتصاب به سطوح مدیریتی، یک سیستم جامع برای ثبت،
                مدیریت و ارزیابی اطلاعات کارکنان داوطلب ارتقاء است. این سامانه با استفاده از جدیدترین
                تکنولوژی‌های وب طراحی و پیاده‌سازی شده است.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">ویژگی‌های سامانه</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>ثبت و مدیریت اطلاعات فردی کارکنان</li>
                <li>ثبت وضعیت اداری (مأموریت، اضافه‌کاری، تأخیر و غیبت)</li>
                <li>ارزیابی توانمندی‌های عملکردی</li>
                <li>جستجوی پیشرفته در فرم‌ها</li>
                <li>امکان چاپ فرم‌ها با قالب استاندارد</li>
                <li>رابط کاربری فارسی با پشتیبانی کامل از راست‌چین</li>
                <li>طراحی ریسپانسیو برای استفاده در موبایل و دسکتاپ</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">تکنولوژی‌های استفاده شده</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-bold text-blue-900 mb-2">بک‌اند (Backend)</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• ASP.NET Core 8.0</li>
                    <li>• Entity Framework Core</li>
                    <li>• Clean Architecture</li>
                    <li>• Domain-Driven Design</li>
                    <li>• AutoMapper & FluentValidation</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-2">فرانت‌اند (Frontend)</h3>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Next.js 14 (App Router)</li>
                    <li>• TypeScript</li>
                    <li>• Tailwind CSS</li>
                    <li>• React Hook Form</li>
                    <li>• Axios & Zod</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">راهنمای استفاده</h2>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-800 mb-2">1. ثبت فرم جدید</h3>
                  <p className="text-gray-700 text-sm">
                    از صفحه اصلی روی &quot;ثبت فرم جدید&quot; کلیک کنید و اطلاعات کارمند را وارد کنید.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-800 mb-2">2. مشاهده فرم‌ها</h3>
                  <p className="text-gray-700 text-sm">
                    لیست کامل فرم‌های ثبت شده را مشاهده کنید و روی &quot;مشاهده&quot; کلیک کنید تا جزئیات را ببینید.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-800 mb-2">3. جستجو</h3>
                  <p className="text-gray-700 text-sm">
                    با استفاده از نام، نام خانوادگی یا شماره پرسنلی، فرم مورد نظر را جستجو کنید.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-800 mb-2">4. چاپ فرم</h3>
                  <p className="text-gray-700 text-sm">
                    روی دکمه &quot;چاپ&quot; کلیک کنید تا فرم با قالب استاندارد A4 برای چاپ آماده شود.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">اطلاعات تماس</h2>
              <div className="bg-primary-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>سازمان:</strong> سازمان امور مالیاتی کشور
                </p>
                <p className="text-gray-700 mt-2">
                  <strong>نسخه:</strong> 1.0.0
                </p>
                <p className="text-gray-700 mt-2">
                  <strong>تاریخ انتشار:</strong> بهمن ۱۴۰۴
                </p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t text-center">
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-bold"
            >
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
